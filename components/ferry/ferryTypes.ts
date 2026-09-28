export type FerryAgeTier = {
  key: string
  label: string
  minAge?: number | null
  maxAge?: number | null
  roundTripPrice: number
  oneWayDeparturePrice: number
  oneWayReturnPrice: number
}

export type FerryTripType = 'oneway' | 'sameday' | 'diffday'
export type FerryDirection = 'departure' | 'return'

/** Tüm yaş gruplarının, tüm sefer tiplerindeki en düşük fiyatı. */
export function cheapestFare(tiers: FerryAgeTier[]): number | null {
  if (!tiers.length) return null
  let min = Infinity
  for (const t of tiers) {
    min = Math.min(min, t.roundTripPrice, t.oneWayDeparturePrice, t.oneWayReturnPrice)
  }
  return Number.isFinite(min) ? min : null
}

function isAdultTier(t: FerryAgeTier): boolean {
  const key = (t.key || '').toLowerCase()
  const label = (t.label || '').toLowerCase()
  return (
    key === 'adult' ||
    label.includes('yetişkin') ||
    label.includes('adult') ||
    label.includes('erwachsen')
  )
}

/** "X ₺'dan başlayan" göstergesi — bebek/çocuk indirimli fiyatı yanıltıcı olmasın diye
    her zaman yetişkin fiyatına göre; spesifik olarak yetişkin GİDİŞ-DÖNÜŞ fiyatı. */
export function adultFromFare(tiers: FerryAgeTier[]): number | null {
  if (!tiers.length) return null
  const adult =
    tiers.find(isAdultTier) ??
    tiers.reduce<FerryAgeTier | null>(
      (max, t) => (max == null || (t.minAge ?? 0) > (max.minAge ?? 0) ? t : max),
      null,
    )
  if (!adult) return cheapestFare(tiers)
  return adult.roundTripPrice
}

export function fareForTier(
  tier: FerryAgeTier,
  tripType: FerryTripType,
  direction: FerryDirection,
): number {
  if (tripType === 'oneway') {
    return direction === 'departure' ? tier.oneWayDeparturePrice : tier.oneWayReturnPrice
  }
  return tier.roundTripPrice
}
