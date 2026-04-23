import { supabase } from '@/lib/supabase'
import { normalizeDateOnly, type SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { runBookingPaidEmailSideEffects } from '@/lib/services/bookingPaidEmailSideEffects'

const MAX_CALLBACK_JSON_CHARS = 28_000

function compactCallbackPayloadForStorage(record: Record<string, string>): Record<string, unknown> {
  const base: Record<string, unknown> = { ...record }
  let s = JSON.stringify(base)
  if (s.length <= MAX_CALLBACK_JSON_CHARS) return base
  const shrunk: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(record)) {
    const str = typeof v === 'string' ? v : String(v)
    shrunk[k] = str.length > 400 ? `${str.slice(0, 180)}…[${str.length}]` : str
  }
  s = JSON.stringify(shrunk)
  if (s.length <= MAX_CALLBACK_JSON_CHARS) return shrunk
  return {
    _truncated: true,
    keys: Object.keys(record),
    preview: s.slice(0, 12_000),
  }
}

export type BookingStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'overbooked'

/** Nestpay formu ve doğrulama için: ödeme öncesi zaten oluşturulmuş web rezervasyonu. */
export type PendingBookingPaymentSnapshot = {
  id: string
  email: string
  name: string
  date: string
  guestCount: number
  totalPrice: number
}

type BookingStatusResult = {
  id: string
  status: BookingStatus
}

function paxFromRow(row: {
  adult_count?: number | null
  child_count?: number | null
  infant_count?: number | null
}): number {
  const adult = Math.max(0, Number(row.adult_count ?? 0) || 0)
  const child = Math.max(0, Number(row.child_count ?? 0) || 0)
  const infant = Math.max(0, Number(row.infant_count ?? 0) || 0)
  return adult + child + infant
}

/**
 * Ödeme adımı en sonda: müşteri bilgileriyle POST /api/bookings zaten `pending` kaydı oluşturur.
 * Bu fonksiyon o kaydı yükler; ödeme tutarı ve kişi sayısı DB ile uyumlu olmalıdır.
 */
export async function loadPendingBookingForPayment(bookingId: string): Promise<PendingBookingPaymentSnapshot> {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, status, customer_first_name, customer_last_name, customer_email, total_price, paid_now, date, adult_count, child_count, infant_count'
    )
    .eq('id', bookingId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load booking: ${error.message}`)
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Booking not found.')
  }

  const row = data as Record<string, unknown>
  const status = typeof row.status === 'string' ? row.status.trim().toLowerCase() : ''
  if (status !== 'pending') {
    throw new Error('This booking is not awaiting payment.')
  }

  const emailRaw = typeof row.customer_email === 'string' ? row.customer_email.trim().toLowerCase() : ''
  if (!emailRaw) {
    throw new Error('Booking has no customer email.')
  }

  const first = typeof row.customer_first_name === 'string' ? row.customer_first_name.trim() : ''
  const last = typeof row.customer_last_name === 'string' ? row.customer_last_name.trim() : ''
  const name = [first, last].filter(Boolean).join(' ').trim() || emailRaw.split('@')[0] || 'Guest'

  const dateRaw = typeof row.date === 'string' ? row.date.trim() : ''
  if (!dateRaw) {
    throw new Error('Booking has no tour date.')
  }
  const date = normalizeDateOnly(dateRaw)

  const totalPriceFull = Number(row.total_price ?? 0)
  if (!Number.isFinite(totalPriceFull) || totalPriceFull <= 0) {
    throw new Error('Booking has an invalid total price.')
  }

  const paidNowRaw = row.paid_now
  const paidNow =
    paidNowRaw != null && Number.isFinite(Number(paidNowRaw)) && Number(paidNowRaw) > 0
      ? Number(paidNowRaw)
      : null
  const chargeAmount = paidNow != null ? Math.min(totalPriceFull, paidNow) : totalPriceFull
  if (!Number.isFinite(chargeAmount) || chargeAmount <= 0) {
    throw new Error('Booking has an invalid payment amount.')
  }

  const guestCount = paxFromRow({
    adult_count: row.adult_count as number | null | undefined,
    child_count: row.child_count as number | null | undefined,
    infant_count: row.infant_count as number | null | undefined,
  })
  if (guestCount <= 0) {
    throw new Error('Booking has no guests.')
  }

  const id = typeof row.id === 'string' ? row.id : bookingId

  return {
    id,
    email: emailRaw,
    name,
    date,
    guestCount,
    totalPrice: Number(chargeAmount.toFixed(2)),
  }
}

export async function getBookingStatusById(bookingId: string): Promise<string | null> {
  const { data, error } = await supabase.from('bookings').select('status').eq('id', bookingId).maybeSingle()

  if (error) {
    throw new Error(`Failed to read booking status: ${error.message}`)
  }
  if (!data || typeof data !== 'object') return null
  const s = (data as { status?: string | null }).status
  return typeof s === 'string' ? s.trim().toLowerCase() : null
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<BookingStatusResult> {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select('id, status')
    .single()

  if (error) {
    throw new Error(`Failed to update booking status: ${error.message}`)
  }

  if (!data?.id) {
    throw new Error(`Failed to update booking status: booking ${bookingId} not found`)
  }

  return {
    id: data.id,
    status: (data.status as BookingStatus | null) ?? status,
  }
}

export async function markBookingOverbooked(bookingId: string): Promise<BookingStatusResult> {
  return updateBookingStatus(bookingId, 'overbooked')
}

export type MarkBookingPaidFromCallbackMeta = {
  authCode: string
  hostRefNum: string
  transId: string
  paidAtIso: string
  rawCallback: Record<string, string>
}

export type MarkBookingFailedOpts = {
  errMsg?: string
  rawCallback?: Record<string, string> | null
}

/**
 * NestPay callback veya manuel onay: ödendi. `meta` verilirse ödeme banka alanları ve ham callback özeti yazılır.
 */
export async function markBookingPaid(
  bookingId: string,
  meta?: MarkBookingPaidFromCallbackMeta
): Promise<BookingStatusResult> {
  const updates: Record<string, unknown> = { status: 'paid' }
  if (meta) {
    updates.payment_status = 'paid'
    updates.nestpay_auth_code = meta.authCode || null
    updates.nestpay_host_ref_num = meta.hostRefNum || null
    updates.nestpay_trans_id = meta.transId || null
    updates.paid_at = meta.paidAtIso
    updates.payment_verification_status = 'verified'
    updates.payment_callback_payload = compactCallbackPayloadForStorage(meta.rawCallback)
    updates.payment_last_error = null
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', bookingId)
    .select('id, status')
    .single()

  if (error) {
    throw new Error(`Failed to mark booking paid: ${error.message}`)
  }
  if (!data?.id) {
    throw new Error(`Failed to mark booking paid: booking ${bookingId} not found`)
  }

  if (meta) {
    const { data: row, error: fetchErr } = await supabase.from('bookings').select('*').eq('id', bookingId).single()
    if (!fetchErr && row) {
      try {
        await runBookingPaidEmailSideEffects(bookingId, row as SupabaseBookingRow)
      } catch (e) {
        console.error('[payment] Paid email side effects failed', {
          bookingId,
          message: e instanceof Error ? e.message : String(e),
        })
      }
    }
  }

  return {
    id: data.id,
    status: (data.status as BookingStatus | null) ?? 'paid',
  }
}

export async function markBookingFailed(
  bookingId: string,
  opts?: MarkBookingFailedOpts
): Promise<BookingStatusResult> {
  const updates: Record<string, unknown> = {
    status: 'failed',
    payment_status: 'failed',
    payment_last_error: opts?.errMsg?.trim() ? opts.errMsg.trim().slice(0, 4000) : null,
  }
  if (opts?.rawCallback && Object.keys(opts.rawCallback).length > 0) {
    updates.payment_callback_payload = compactCallbackPayloadForStorage(opts.rawCallback)
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', bookingId)
    .select('id, status')
    .single()

  if (error) {
    throw new Error(`Failed to mark booking failed: ${error.message}`)
  }
  if (!data?.id) {
    throw new Error(`Failed to mark booking failed: booking ${bookingId} not found`)
  }

  return {
    id: data.id,
    status: (data.status as BookingStatus | null) ?? 'failed',
  }
}

/**
 * Üçlü onay görünüyor ama NestPay HASH doğrulanamadı: ödeme **onaylanmaz**; kayıt şüpheli işaretlenir.
 */
export async function markBookingPaymentCallbackSuspicious(
  bookingId: string,
  input: { rawCallback: Record<string, string>; detail: string }
): Promise<void> {
  const payload = compactCallbackPayloadForStorage(input.rawCallback)
  const { error } = await supabase
    .from('bookings')
    .update({
      payment_verification_status: 'hash_mismatch',
      payment_callback_payload: payload,
      payment_last_error: input.detail.slice(0, 4000),
    })
    .eq('id', bookingId)

  if (error) {
    console.error('[payment] Failed to persist suspicious callback metadata', { bookingId, message: error.message })
  }
}

export async function markBookingRefunded(bookingId: string): Promise<BookingStatusResult> {
  return updateBookingStatus(bookingId, 'refunded')
}

export async function checkCapacityAvailability(_bookingId: string): Promise<boolean> {
  /**
   * TODO: Replace with real capacity check:
   * - Validate tour/date/slot occupancy
   * - Lock inventory atomically to prevent race conditions
   */
  return true
}

export async function triggerRefundForOverbookedBooking(bookingId: string): Promise<void> {
  /**
   * TODO: Replace with real Nestpay refund (or acquiring-bank refund) implementation.
   * Keep this function idempotent when integrating with real provider APIs.
   */
  console.warn('[payment] Refund triggered for overbooked booking', { bookingId })
}
