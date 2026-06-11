export type YachtStickyPriceDisplay = {
  label?: string
  value: string
}

export function formatYachtSelectedDayStickyPrice(price: number): YachtStickyPriceDisplay {
  return {
    label: 'Seçilen gün',
    value: `${price.toLocaleString('tr-TR')} ₺`,
  }
}

export function formatYachtOvernightTotalStickyPrice(total: number): YachtStickyPriceDisplay {
  return {
    label: 'Konaklamalı toplam',
    value: `${total.toLocaleString('tr-TR')} ₺`,
  }
}

export function splitYachtOvernightStickyLine(line: string): YachtStickyPriceDisplay {
  const prefix = 'Konaklamalı toplam '
  if (line.startsWith(prefix)) {
    return { label: 'Konaklamalı toplam', value: line.slice(prefix.length) }
  }
  return { value: line }
}

export function formatYachtStickyPriceLine(price?: number, currency = 'TRY'): string {
  if (price == null) return 'Fiyat bilgisi için müsaitlik sorun'
  return formatYachtMobilePrice(price, currency)
}

export function formatYachtOvernightStickyPriceLine(price?: number, currency = 'TRY'): string {
  if (price == null) return 'Fiyat bilgisi için müsaitlik sorun'
  const n = price.toLocaleString('tr-TR')
  const c = (currency || 'TRY').toUpperCase()
  if (c === 'TRY' || c === 'TRL') return `Konaklamalı toplam ${n} ₺`
  return `Konaklamalı toplam ${n} ${currency}`
}

export function formatYachtStickyPriceLines(p: {
  dailyEnabled: boolean
  overnightEnabled: boolean
  dailyPrice?: number
  overnightPrice?: number
  currency?: string
}): string {
  const cur = p.currency ?? 'TRY'
  const parts: string[] = []
  if (p.dailyEnabled) {
    parts.push(
      p.dailyPrice != null
        ? formatYachtStickyPriceLine(p.dailyPrice, cur)
        : 'Günlük: fiyat için müsaitlik sorun'
    )
  }
  if (p.overnightEnabled) {
    parts.push(
      p.overnightPrice != null
        ? formatYachtOvernightStickyPriceLine(p.overnightPrice, cur)
        : 'Konaklamalı: fiyat için müsaitlik sorun'
    )
  }
  if (parts.length === 0) return 'Fiyat bilgisi için müsaitlik sorun'
  return parts.join(' · ')
}

export function formatYachtMobilePrice(price?: number, currency = 'TRY'): string {
  if (price == null) return 'Teklif alın'
  const n = price.toLocaleString('tr-TR')
  const c = (currency || 'TRY').toUpperCase()
  if (c === 'TRY' || c === 'TRL') return `${n} ₺ / gün`
  return `${n} ${currency} / gün`
}

export function formatYachtMobilePriceOvernight(price?: number, currency = 'TRY'): string {
  if (price == null) return 'Teklif alın'
  const n = price.toLocaleString('tr-TR')
  const c = (currency || 'TRY').toUpperCase()
  if (c === 'TRY' || c === 'TRL') return `Toplam ${n} ₺`
  return `Toplam ${n} ${currency}`
}

/** Liste kartı: toplam veya gece takvimi varsa en düşük gece. */
export function formatYachtMobileOvernightTotal(
  total?: number,
  nightPricing?: { price?: number | null }[] | null,
  currency = 'TRY'
): string {
  if (total != null && !Number.isNaN(total) && total > 0) {
    return formatYachtMobilePriceOvernight(total, currency)
  }
  const prices = (nightPricing ?? [])
    .map((r) => r.price)
    .filter((p): p is number => typeof p === 'number' && !Number.isNaN(p) && p > 0)
  if (prices.length) {
    const m = Math.min(...prices)
    const n = m.toLocaleString('tr-TR')
    const c = (currency || 'TRY').toUpperCase()
    if (c === 'TRY' || c === 'TRL') return `En az ${n} ₺ / gece`
    return `En az ${n} ${currency} / gece`
  }
  return 'Teklif alın'
}

export function formatStickyLineForRentalMode(
  mode: 'daily' | 'overnight',
  dailyPrice?: number,
  overnightPrice?: number,
  currency = 'TRY'
): string {
  if (mode === 'overnight') {
    return formatYachtOvernightStickyPriceLine(overnightPrice, currency)
  }
  return formatYachtStickyPriceLine(dailyPrice, currency)
}
