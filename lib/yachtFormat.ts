export function formatYachtStickyPriceLine(price?: number, currency = 'TRY'): string {
  if (price == null) return 'Fiyat bilgisi için müsaitlik sorun'
  const n = price.toLocaleString('tr-TR')
  const c = (currency || 'TRY').toUpperCase()
  if (c === 'TRY' || c === 'TRL') return `Günlük ${n} ₺'den başlayan fiyatlarla`
  return `Günlük ${n} ${currency}'den başlayan fiyatlarla`
}

export function formatYachtMobilePrice(price?: number, currency = 'TRY'): string {
  if (price == null) return 'Teklif alın'
  const n = price.toLocaleString('tr-TR')
  const c = (currency || 'TRY').toUpperCase()
  if (c === 'TRY' || c === 'TRL') return `${n} ₺ / gün`
  return `${n} ${currency} / gün`
}
