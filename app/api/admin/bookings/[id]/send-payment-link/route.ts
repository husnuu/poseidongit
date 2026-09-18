import { NextResponse } from 'next/server'
import { authorizeAdminOrAgent } from '@/lib/adminAuthServer'
import { supabase } from '@/lib/supabase'
import { generateBookingAccessToken } from '@/lib/bookingAccessToken'
import { sendPaymentLinkEmail } from '@/lib/email'
import { normalizeBookingFlowLocale } from '@/lib/i18n/bookingFlowLocale'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Ödemesi tamamlanmamış (pending) veya elle oluşturulmuş bir rezervasyona ödeme linki gönderir.
 * Müşteri ödemeyi tamamladığında mevcut NestPay callback akışı rezervasyonu otomatik onaylar.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorizeAdminOrAgent(request))) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  }

  const { id: bookingId } = await params
  if (!bookingId?.trim()) {
    return NextResponse.json({ error: 'Geçersiz rezervasyon' }, { status: 400 })
  }

  const { data, error } = await supabase.from('bookings').select('*').eq('id', bookingId).single()
  if (error || !data) {
    return NextResponse.json({ error: 'Rezervasyon bulunamadı' }, { status: 404 })
  }
  const row = data as SupabaseBookingRow

  const status = String(row.status ?? '').trim().toLowerCase()
  if (status !== 'pending') {
    return NextResponse.json({ error: 'Bu rezervasyon ödeme bekliyor durumunda değil' }, { status: 409 })
  }

  const email = row.customer_email?.trim()
  if (!email) {
    return NextResponse.json({ error: 'Müşteri e-posta adresi kayıtlı değil' }, { status: 400 })
  }

  const totalPrice = Number(row.total_price ?? 0)
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
    return NextResponse.json({ error: 'Rezervasyonda geçerli bir tutar yok' }, { status: 400 })
  }

  let accessToken = typeof row.access_token === 'string' ? row.access_token.trim() : ''
  if (!accessToken) {
    accessToken = generateBookingAccessToken()
    const { error: tokenError } = await supabase
      .from('bookings')
      .update({ access_token: accessToken })
      .eq('id', bookingId)
    if (tokenError) {
      return NextResponse.json({ error: 'Erişim tokenı oluşturulamadı' }, { status: 500 })
    }
  }

  const paidNowRaw = row.paid_now
  const paidNow =
    paidNowRaw != null && Number.isFinite(Number(paidNowRaw)) && Number(paidNowRaw) > 0
      ? Number(paidNowRaw)
      : null
  const amountDue = paidNow != null ? Math.min(totalPrice, paidNow) : totalPrice

  const result = await sendPaymentLinkEmail({
    bookingId,
    accessToken,
    tourTitle: String(row.tour_title ?? '—'),
    date: String(row.date ?? ''),
    time: typeof row.time === 'string' ? row.time : null,
    amountDue,
    currency: String(row.currency ?? 'TRY'),
    customer: {
      firstName: row.customer_first_name ?? '',
      lastName: row.customer_last_name ?? '',
      email,
    },
    siteLocale: normalizeBookingFlowLocale(row.ui_locale),
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Ödeme linki gönderilemedi', url: result.url }, { status: 502 })
  }
  return NextResponse.json({ ok: true, url: result.url })
}
