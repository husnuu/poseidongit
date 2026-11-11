/** İndirimli fiyatı en yakın 10'a yuvarlar — Türkiye'deki tur fiyatlandırmasında
    yaygın olan "yuvarlak sayı" alışkanlığıyla tutarlı (ör. 2.553 yerine 2.550). */
export function computeDiscountedPrice(price: number, percentage: number): number {
  return Math.round((price * (1 - percentage / 100)) / 10) * 10
}

/** Tur kartında gösterilen fiyat: Sanity'de kart indirimi açıksa indirimli fiyat. */
export function tourCardDisplayPrice(tour: {
  priceFrom?: number | null
  cardDiscount?: { enabled?: boolean | null; percentage?: number | null } | null
}): number | null {
  if (typeof tour.priceFrom !== 'number' || tour.priceFrom <= 0) return null
  const pct = tour.cardDiscount?.enabled && tour.cardDiscount.percentage ? tour.cardDiscount.percentage : null
  return pct != null ? computeDiscountedPrice(tour.priceFrom, pct) : tour.priceFrom
}
