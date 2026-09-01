import { sanitizeSingleLineText } from '@/lib/inputSanitize'
import type { ExtraForBooking, PricingSummary, TourForBooking } from '@/lib/sanity/bookingTypes'

export type ExtraKind = 'standard' | 'hotelTransfer'

export type SelectedExtraInput = {
  key: string
  hotelName?: string
  transferFromHotel?: boolean
}

/** Rezervasyonda saklanan / admin ve e-postada gösterilen ekstra satırı. */
export type StoredSelectedExtra = {
  key: string
  title: string
  description?: string
  price: number
  priceType: 'perPerson' | 'total'
  extraKind: ExtraKind
  quantity: number
  lineTotal: number
  hotelName?: string
  transferFromHotel?: boolean
  transferFromHotelLabel?: string
}

export function extraIdentity(extra: ExtraForBooking, index: number): string {
  const k = typeof extra.key === 'string' ? extra.key.trim() : ''
  if (k) return k
  const k2 = typeof extra._key === 'string' ? extra._key.trim() : ''
  if (k2) return k2
  return `extra-${index}`
}

export function extrasOfferedInBooking(tour: TourForBooking | null | undefined): ExtraForBooking[] {
  const list = tour?.extras
  if (!Array.isArray(list)) return []
  return list.filter((e) => e && e.offerInBooking !== false && Number.isFinite(Number(e.price)))
}

export function payingPaxForExtras(counts: { adult: number; child: number; infant?: number; baby?: number }): number {
  return Math.max(0, (Number(counts.adult) || 0) + (Number(counts.child) || 0))
}

export function extraLineTotal(
  extra: Pick<ExtraForBooking, 'price' | 'priceType'>,
  payingPax: number
): number {
  const price = Math.max(0, Math.round(Number(extra.price) || 0))
  if ((extra.priceType ?? 'perPerson') === 'total') return price
  return price * Math.max(0, payingPax)
}

export function isHotelTransferExtra(extra: ExtraForBooking | StoredSelectedExtra): boolean {
  return extra.extraKind === 'hotelTransfer'
}

export function applyExtrasToPricing(
  base: PricingSummary,
  extrasTotal: number,
  tour: TourForBooking
): PricingSummary {
  const extras = Math.max(0, Math.round(extrasTotal))
  const ticketsTotal = base.ticketsTotal ?? base.total - (base.extrasTotal ?? 0)
  const total = ticketsTotal + extras
  if (tour.cashPaymentEnabled) {
    return {
      ...base,
      ticketsTotal,
      extrasTotal: extras,
      total,
      depositPercent: 0,
      depositAmount: 0,
      remainingAmount: total,
      cashPaymentEnabled: true,
    }
  }
  const deposit = tour.deposit
  let depositPercent = 0
  let depositAmount = 0
  if (deposit?.enabled && deposit.value != null) {
    if (deposit.type === 'percentage') {
      depositPercent = deposit.value
      depositAmount = Math.round((total * deposit.value) / 100)
    } else {
      depositAmount = deposit.value
      depositPercent = total > 0 ? Math.round((deposit.value / total) * 100) : 0
    }
  } else {
    depositPercent = 20
    depositAmount = Math.round(total * 0.2)
  }
  const paid = Math.max(0, Math.min(total, depositAmount))
  return {
    ...base,
    ticketsTotal,
    extrasTotal: extras,
    total,
    depositPercent,
    depositAmount: paid,
    remainingAmount: total - paid,
    cashPaymentEnabled: false,
  }
}

export function parseSelectedExtrasFromBody(raw: unknown): SelectedExtraInput[] | null {
  if (raw == null) return []
  if (!Array.isArray(raw)) return null
  if (raw.length > 20) return null
  const seen = new Set<string>()
  const out: SelectedExtraInput[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null
    const rec = item as Record<string, unknown>
    const key = typeof rec.key === 'string' ? rec.key.trim() : ''
    if (!key || key.length > 120) return null
    if (seen.has(key)) return null
    seen.add(key)
    const hotelName =
      typeof rec.hotelName === 'string' ? sanitizeSingleLineText(rec.hotelName, 160) : undefined
    const transferFromHotel =
      rec.transferFromHotel === true || rec.transferFromHotel === 'true'
        ? true
        : rec.transferFromHotel === false || rec.transferFromHotel === 'false'
          ? false
          : undefined
    out.push({
      key,
      ...(hotelName ? { hotelName } : {}),
      ...(transferFromHotel != null ? { transferFromHotel } : {}),
    })
  }
  return out
}

export type ResolveExtrasResult =
  | { ok: true; stored: StoredSelectedExtra[]; extrasTotal: number }
  | { ok: false; error: string }

export function resolveSelectedExtrasAgainstTour(
  tour: TourForBooking | null | undefined,
  selected: SelectedExtraInput[],
  counts: { adult: number; child: number; infant: number }
): ResolveExtrasResult {
  if (!selected.length) return { ok: true, stored: [], extrasTotal: 0 }
  const catalog = extrasOfferedInBooking(tour)
  const byKey = new Map<string, ExtraForBooking>()
  catalog.forEach((extra, i) => {
    byKey.set(extraIdentity(extra, i), extra)
  })
  const payingPax = payingPaxForExtras(counts)
  const stored: StoredSelectedExtra[] = []
  let extrasTotal = 0
  for (const sel of selected) {
    const extra = byKey.get(sel.key)
    if (!extra) {
      return { ok: false, error: 'Seçilen ekstra hizmet bu turda geçerli değil.' }
    }
    const hotel = isHotelTransferExtra(extra)
    const requireHotel = extra.requireHotelName !== false
    const requireTransfer = extra.requireTransferFromHotel !== false
    let hotelName: string | undefined
    if (hotel) {
      hotelName = sel.hotelName?.trim()
      if (requireHotel && !hotelName) {
        return { ok: false, error: 'Otel transferi için otel adı gereklidir.' }
      }
      if (requireTransfer && sel.transferFromHotel !== true) {
        return { ok: false, error: 'Otelden transfer seçeneğini işaretleyin.' }
      }
    }
    const quantity = (extra.priceType ?? 'perPerson') === 'total' ? 1 : payingPax
    const lineTotal = extraLineTotal(extra, payingPax)
    extrasTotal += lineTotal
    stored.push({
      key: extraIdentity(extra, catalog.indexOf(extra)),
      title: extra.title?.trim() || sel.key,
      ...(extra.description?.trim() ? { description: extra.description.trim() } : {}),
      price: Math.max(0, Math.round(Number(extra.price) || 0)),
      priceType: extra.priceType === 'total' ? 'total' : 'perPerson',
      extraKind: hotel ? 'hotelTransfer' : 'standard',
      quantity,
      lineTotal,
      ...(hotelName ? { hotelName } : {}),
      ...(hotel && sel.transferFromHotel === true ? { transferFromHotel: true } : {}),
      ...(hotel && extra.transferFromHotelLabel?.trim()
        ? { transferFromHotelLabel: extra.transferFromHotelLabel.trim() }
        : {}),
    })
  }
  return { ok: true, stored, extrasTotal }
}

export function normalizeSelectedExtrasFromStorage(raw: unknown): StoredSelectedExtra[] {
  if (!Array.isArray(raw)) return []
  const out: StoredSelectedExtra[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    const key = typeof rec.key === 'string' ? rec.key.trim() : ''
    const title = typeof rec.title === 'string' ? rec.title.trim() : ''
    if (!key && !title) continue
    const priceType = rec.priceType === 'total' ? 'total' : 'perPerson'
    const extraKind: ExtraKind = rec.extraKind === 'hotelTransfer' ? 'hotelTransfer' : 'standard'
    const lineTotal = Math.max(0, Math.round(Number(rec.lineTotal ?? rec.price ?? 0) || 0))
    const hotelName = typeof rec.hotelName === 'string' ? rec.hotelName.trim() : ''
    out.push({
      key: key || title,
      title: title || key,
      ...(typeof rec.description === 'string' && rec.description.trim()
        ? { description: rec.description.trim() }
        : {}),
      price: Math.max(0, Math.round(Number(rec.price) || 0)),
      priceType,
      extraKind,
      quantity: Math.max(1, Math.round(Number(rec.quantity) || 1)),
      lineTotal,
      ...(hotelName ? { hotelName } : {}),
      ...(rec.transferFromHotel === true ? { transferFromHotel: true } : {}),
      ...(typeof rec.transferFromHotelLabel === 'string' && rec.transferFromHotelLabel.trim()
        ? { transferFromHotelLabel: rec.transferFromHotelLabel.trim() }
        : {}),
    })
  }
  return out
}

export function extrasTotalFromStored(items: StoredSelectedExtra[]): number {
  return items.reduce((s, x) => s + Math.max(0, Math.round(x.lineTotal || 0)), 0)
}

export function formatStoredExtraLine(item: StoredSelectedExtra): string {
  const bits = [item.title]
  if (item.hotelName) bits.push(`Otel: ${item.hotelName}`)
  if (item.transferFromHotel) {
    bits.push(item.transferFromHotelLabel?.trim() || 'Otelden transfer')
  }
  return bits.join(' · ')
}
