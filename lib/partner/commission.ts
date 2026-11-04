/**
 * Partner komisyonu — saf hesap (istemci ve sunucu ortak).
 *
 * Kural: komisyon, ödemesi alınmış ve tarihi geçmiş turun satış tutarı üzerinden
 * kazanılır; iptal/iade edilen kazanılmaz, kısmi iadede iade edilen tutar düşülür.
 * Oran rezervasyon anında kayda yazılır (partner_commission_rate). Aylık döküm
 * turun gerçekleştiği aya göre yapılır.
 */

export type CommissionState = 'earned' | 'upcoming' | 'awaiting_payment' | 'on_hold' | 'void'

export const COMMISSION_STATE_LABELS: Record<CommissionState, string> = {
  earned: 'Kazanıldı',
  upcoming: 'Tur bekleniyor',
  awaiting_payment: 'Ödeme bekleniyor',
  on_hold: 'İade incelemede',
  void: 'İptal / iade',
}

export const PARTNER_BOOKING_COLUMNS =
  'id, created_at, status, tour_title, date, class_name, total_price, currency, adult_count, child_count, infant_count, customer_first_name, customer_last_name, refund_status, refund_amount, partner_id, partner_commission_rate, partner_channel'

export type PartnerBookingRow = {
  id: string
  created_at?: string | null
  status?: string | null
  tour_title?: string | null
  date?: string | null
  class_name?: string | null
  total_price?: number | string | null
  currency?: string | null
  adult_count?: number | null
  child_count?: number | null
  infant_count?: number | null
  customer_first_name?: string | null
  customer_last_name?: string | null
  refund_status?: string | null
  refund_amount?: number | string | null
  partner_id?: string | null
  partner_commission_rate?: number | string | null
  partner_channel?: string | null
}

export type PartnerPayoutRow = {
  partner_id: string
  period: string
  amount: number | string
  created_at?: string | null
  note?: string | null
}

export type PartnerBookingView = {
  id: string
  createdAt: string | null
  tourTitle: string
  date: string
  className: string
  guests: number
  saleAmount: number
  rate: number
  commission: number
  state: CommissionState
  channel: string | null
  /** Panelde "Ayşe K." — iletişim bilgisi partnerle paylaşılmaz. */
  guestLabel: string
}

export type PartnerPeriodSummary = {
  period: string
  bookings: number
  guests: number
  sales: number
  commission: number
  paid: number
  paidAt: string | null
  due: number
}

export type PartnerSummary = {
  months: PartnerPeriodSummary[]
  totals: {
    bookings: number
    guests: number
    sales: number
    earned: number
    paid: number
    due: number
    upcoming: number
  }
}

function num(v: unknown): number {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

export function commissionState(row: PartnerBookingRow, todayIso: string): CommissionState {
  const status = String(row.status ?? '').trim().toLowerCase()
  const refund = String(row.refund_status ?? '').trim().toLowerCase()
  if (status === 'cancelled' || status === 'failed' || refund === 'refunded') return 'void'
  if (status !== 'paid' && status !== 'confirmed') return 'awaiting_payment'
  if (refund === 'requested' || refund === 'refund_pending') return 'on_hold'
  return String(row.date ?? '').slice(0, 10) < todayIso ? 'earned' : 'upcoming'
}

/** Kısmi iade düşülmüş satış tutarı. */
export function netSaleAmount(row: PartnerBookingRow): number {
  const total = num(row.total_price)
  if (String(row.refund_status ?? '').trim().toLowerCase() === 'partial_refunded') {
    return Math.max(0, total - num(row.refund_amount))
  }
  return total
}

export function commissionAmount(row: PartnerBookingRow): number {
  return roundMoney((netSaleAmount(row) * num(row.partner_commission_rate)) / 100)
}

function guestCount(row: PartnerBookingRow): number {
  return num(row.adult_count) + num(row.child_count) + num(row.infant_count)
}

function maskedGuestName(row: PartnerBookingRow): string {
  const first = String(row.customer_first_name ?? '').trim()
  const lastInitial = String(row.customer_last_name ?? '').trim().slice(0, 1)
  return [first, lastInitial && `${lastInitial.toLocaleUpperCase('tr-TR')}.`].filter(Boolean).join(' ') || '—'
}

export function toBookingView(row: PartnerBookingRow, todayIso: string): PartnerBookingView {
  return {
    id: row.id,
    createdAt: row.created_at ?? null,
    tourTitle: String(row.tour_title ?? '—'),
    date: String(row.date ?? '').slice(0, 10),
    className: String(row.class_name ?? ''),
    guests: guestCount(row),
    saleAmount: netSaleAmount(row),
    rate: num(row.partner_commission_rate),
    commission: commissionAmount(row),
    state: commissionState(row, todayIso),
    channel: row.partner_channel ?? null,
    guestLabel: maskedGuestName(row),
  }
}

/** Kazanılan komisyonları aya göre toplar; ödemeler ay bazında düşülür (en yeni ay başta). */
export function summarizePartner(
  rows: PartnerBookingRow[],
  payouts: PartnerPayoutRow[],
  todayIso: string
): PartnerSummary {
  const byPeriod = new Map<string, PartnerPeriodSummary>()
  const ensure = (period: string) => {
    let m = byPeriod.get(period)
    if (!m) {
      m = { period, bookings: 0, guests: 0, sales: 0, commission: 0, paid: 0, paidAt: null, due: 0 }
      byPeriod.set(period, m)
    }
    return m
  }

  let upcoming = 0
  for (const row of rows) {
    const state = commissionState(row, todayIso)
    if (state === 'upcoming') upcoming += commissionAmount(row)
    if (state !== 'earned') continue
    const m = ensure(String(row.date).slice(0, 7))
    m.bookings += 1
    m.guests += guestCount(row)
    m.sales += netSaleAmount(row)
    m.commission += commissionAmount(row)
  }
  for (const p of payouts) {
    const m = ensure(p.period)
    m.paid = num(p.amount)
    m.paidAt = p.created_at ?? null
  }

  const months = [...byPeriod.values()]
    .map((m) => ({
      ...m,
      sales: roundMoney(m.sales),
      commission: roundMoney(m.commission),
      due: roundMoney(m.commission - m.paid),
    }))
    .sort((a, b) => b.period.localeCompare(a.period))

  const sum = (pick: (m: PartnerPeriodSummary) => number) => roundMoney(months.reduce((acc, m) => acc + pick(m), 0))
  return {
    months,
    totals: {
      bookings: months.reduce((acc, m) => acc + m.bookings, 0),
      guests: months.reduce((acc, m) => acc + m.guests, 0),
      sales: sum((m) => m.sales),
      earned: sum((m) => m.commission),
      paid: sum((m) => m.paid),
      due: sum((m) => m.due),
      upcoming: roundMoney(upcoming),
    },
  }
}

export function formatMoney(amount: number, currency = 'TRY'): string {
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

/** "2026-07" → "Temmuz 2026" */
export function formatPeriod(period: string): string {
  const [y, m] = period.split('-').map(Number)
  if (!y || !m) return period
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}
