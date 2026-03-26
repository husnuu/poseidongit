import type { YachtRentalDocument } from '@/lib/yachtTypes'
import { overnightNights } from '@/lib/yachtRentalModes'

export type YachtDatePriceRow = { date?: string | null; price?: number | null }

export function normalizeIsoDate(s?: string | null): string | null {
  if (!s || typeof s !== 'string') return null
  return s.slice(0, 10)
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function rowPriceMap(rows?: YachtDatePriceRow[] | null): Map<string, number> {
  const m = new Map<string, number>()
  if (!rows?.length) return m
  for (const r of rows) {
    const d = normalizeIsoDate(r.date)
    if (d && typeof r.price === 'number' && !Number.isNaN(r.price) && r.price > 0) {
      m.set(d, r.price)
    }
  }
  return m
}

/** Seçilen gün için günlük kiralama birim fiyatı (takvim satırı yoksa priceFrom). */
export function yachtDailyUnitPrice(y: YachtRentalDocument, dateIso: string): number | undefined {
  const map = rowPriceMap(y.dailyDatePricing)
  const p = map.get(dateIso)
  if (p != null) return p
  const fb = y.priceFrom
  if (fb != null && !Number.isNaN(fb) && fb > 0) return fb
  return undefined
}

/**
 * Konaklama toplamı: yalnızca konaklamalı gece takvimi veya “Konaklamalı — toplam fiyat (referans)”.
 * Günlük kiralama başlangıç fiyatı burada kullanılmaz. Takvimde en az bir satır varsa her gece için satır gerekir.
 */
export function yachtOvernightStayTotal(
  y: YachtRentalDocument,
  checkIn: string,
  checkOut: string
): number | undefined {
  const n = overnightNights(checkIn, checkOut)
  if (n < 1) return undefined

  const nightMap = rowPriceMap(y.overnightNightPricing)
  const totalRef = y.overnightTotalPrice

  if (nightMap.size === 0) {
    if (totalRef != null && !Number.isNaN(totalRef) && totalRef > 0) return totalRef
    return undefined
  }

  let sum = 0
  for (let i = 0; i < n; i++) {
    const d = addDaysIso(checkIn, i)
    const p = nightMap.get(d)
    if (p == null) return undefined
    sum += p
  }
  return sum
}

/** Konaklamalı takvim hücresi: yalnızca gece takvimindeki satır fiyatı (günlük kiralama fiyatı kullanılmaz). */
export function yachtOvernightCellDisplayPrice(
  y: YachtRentalDocument,
  nightStartIso: string
): number | undefined {
  return rowPriceMap(y.overnightNightPricing).get(nightStartIso)
}
