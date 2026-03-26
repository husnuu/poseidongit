import type { YachtListItem } from '@/components/yacht/YachtCard'

/** Liste / filtre / sıralama: ilan edilen en düşük fiyat (açık modlara göre). */
export function effectiveYachtListAdvertisedPrice(y: YachtListItem): number | null {
  const dailyOk = y.dailyRentalEnabled !== false
  const overnightOk = y.overnightRentalEnabled === true
  const vals: number[] = []
  if (dailyOk && typeof y.priceFrom === 'number' && !Number.isNaN(y.priceFrom)) {
    vals.push(y.priceFrom)
  }
  if (overnightOk) {
    if (typeof y.overnightTotalPrice === 'number' && !Number.isNaN(y.overnightTotalPrice) && y.overnightTotalPrice > 0) {
      vals.push(y.overnightTotalPrice)
    }
    const nightPrices = (y.overnightNightPricing ?? [])
      .map((r) => r.price)
      .filter((n): n is number => typeof n === 'number' && !Number.isNaN(n) && n > 0)
    if (nightPrices.length) vals.push(Math.min(...nightPrices))
  }
  if (vals.length === 0 && dailyOk && typeof y.priceFrom === 'number' && !Number.isNaN(y.priceFrom)) {
    vals.push(y.priceFrom)
  }
  return vals.length ? Math.min(...vals) : null
}
