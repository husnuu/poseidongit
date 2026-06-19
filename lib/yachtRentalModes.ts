import type { YachtRentalDocument } from '@/lib/yachtTypes'

export type YachtRentalMode = 'daily' | 'overnight'

/** Eski belgeler: alan yoksa günlük açık kabul edilir. */
export function isDailyRentalEnabled(y: YachtRentalDocument): boolean {
  return y.dailyRentalEnabled !== false
}

export function isOvernightRentalEnabled(y: YachtRentalDocument): boolean {
  return y.overnightRentalEnabled === true
}

export function effectiveYachtRentalModes(y: YachtRentalDocument): YachtRentalMode[] {
  const modes: YachtRentalMode[] = []
  if (isDailyRentalEnabled(y)) modes.push('daily')
  if (isOvernightRentalEnabled(y)) modes.push('overnight')
  return modes
}

/** Moda göre engelli günler; mod listesi boşsa ortak `blockedDates` kullanılır. */
export function blockedDatesForMode(
  y: YachtRentalDocument,
  mode: YachtRentalMode
): string[] | undefined {
  const legacy = y.blockedDates
  if (mode === 'daily') {
    const specific = y.blockedDatesDaily
    if (specific && specific.length > 0) return specific
    return legacy
  }
  const specific = y.blockedDatesOvernight
  if (specific && specific.length > 0) return specific
  return legacy
}

/** Liste / vitrin: konaklamalı gecelik referans veya en düşük gece fiyatı. */
export function effectiveOvernightAdvertisedPrice(y: YachtRentalDocument): number | undefined {
  const t = y.overnightTotalPrice
  if (t != null && !Number.isNaN(t) && t > 0) return t
  const prices = (y.overnightNightPricing ?? [])
    .map((r) => r.price)
    .filter((n): n is number => typeof n === 'number' && !Number.isNaN(n) && n > 0)
  if (prices.length) return Math.min(...prices)
  return undefined
}

export function priceFromForMode(y: YachtRentalDocument, mode: YachtRentalMode): number | undefined {
  if (mode === 'overnight') return effectiveOvernightAdvertisedPrice(y)
  return y.priceFrom
}

export interface OvernightRange {
  checkIn: string
  checkOut: string
}

/** checkOut: ayrılış günü (o gece konaklama yok). Gece sayısı = gün farkı. */
export function overnightNights(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + 'T12:00:00').getTime()
  const b = new Date(checkOut + 'T12:00:00').getTime()
  return Math.round((b - a) / 86400000)
}

export function isValidOvernightRange(range: OvernightRange | null): boolean {
  if (!range?.checkIn || !range?.checkOut) return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(range.checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(range.checkOut)) {
    return false
  }
  return overnightNights(range.checkIn, range.checkOut) >= 1
}

export function formatDateTrShort(iso: string): string {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function formatOvernightSummaryTr(range: OvernightRange): string {
  const n = overnightNights(range.checkIn, range.checkOut)
  const a = formatDateTrShort(range.checkIn)
  const b = formatDateTrShort(range.checkOut)
  return `${a} – ${b} (${n} gece)`
}
