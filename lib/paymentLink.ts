import { supabase } from '@/lib/supabase'

export interface PaymentLinkSummary {
  bookingId: string
  status: string
  tourTitle: string
  date: string
  time: string | null
  currency: string
  totalPrice: number
  /** NestPay'in tahsil edeceği tutar — /api/payment/start ile birebir aynı hesap (kapora varsa kapora, yoksa tam tutar). */
  amountDue: number
  customerFirstName: string
  accessToken: string | null
}

/** Ödeme linki sayfası için minimal, sadece gerekli alanları çeken sorgu. */
export async function getPaymentLinkSummary(bookingId: string): Promise<PaymentLinkSummary | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, status, tour_title, date, time, currency, total_price, paid_now, customer_first_name, access_token'
    )
    .eq('id', bookingId)
    .maybeSingle()
  if (error || !data) return null

  const totalPrice = Number(data.total_price ?? 0)
  const paidNowRaw = data.paid_now
  const paidNow =
    paidNowRaw != null && Number.isFinite(Number(paidNowRaw)) && Number(paidNowRaw) > 0
      ? Number(paidNowRaw)
      : null
  const amountDue = paidNow != null ? Math.min(totalPrice, paidNow) : totalPrice

  return {
    bookingId: data.id,
    status: String(data.status ?? '').trim().toLowerCase(),
    tourTitle: String(data.tour_title ?? '—'),
    date: String(data.date ?? ''),
    time: typeof data.time === 'string' && data.time.trim() ? data.time.trim() : null,
    currency: String(data.currency ?? 'TRY'),
    totalPrice,
    amountDue,
    customerFirstName: String(data.customer_first_name ?? '').trim(),
    accessToken: typeof data.access_token === 'string' ? data.access_token : null,
  }
}
