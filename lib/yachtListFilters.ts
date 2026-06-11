import type { YachtListCardItem } from '@/lib/yachtListPrice'
import { effectiveYachtListAdvertisedPrice } from '@/lib/yachtListPrice'

export type PriceFilterId = string
export type CapacityFilterId = 'all' | 'c1_4' | 'c5_8' | 'c9_12' | 'c13'
export type CabinFilterId = 'all' | 'k1_2' | 'k3_4' | 'k5'

export interface PriceFilterOption {
  id: PriceFilterId
  label: string
  /** priceFrom <= maxPrice; 'all' = sınırsız */
  maxPrice: number | null
}

function nPrice(y: YachtListCardItem): number | null {
  return effectiveYachtListAdvertisedPrice(y)
}

function nCap(y: YachtListCardItem): number | null {
  const c = y.specifications?.capacity
  if (typeof c !== 'number' || Number.isNaN(c)) return null
  return c
}

function nCab(y: YachtListCardItem): number | null {
  const k = y.specifications?.cabins
  if (typeof k !== 'number' || Number.isNaN(k)) return null
  return k
}

/** Veriye göre fiyat üst sınırı seçenekleri (en fazla 5 kademe + Tümü). */
export function buildPriceFilterOptions(yachts: YachtListCardItem[]): PriceFilterOption[] {
  const prices = yachts.map(nPrice).filter((p): p is number => p != null)
  if (prices.length === 0) {
    return [{ id: 'all', label: 'Tümü', maxPrice: null }]
  }
  const sorted = [...prices].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  if (min === max) {
    return [
      { id: 'all', label: 'Tümü', maxPrice: null },
      { id: 'lte_max', label: `Bu fiyat`, maxPrice: max },
    ]
  }
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))]
  const b25 = q(0.25)
  const b50 = q(0.5)
  const b75 = q(0.75)
  const uniq = [...new Set([b25, b50, b75, max])].sort((a, b) => a - b)
  const opts: PriceFilterOption[] = [{ id: 'all', label: 'Tümü', maxPrice: null }]
  uniq.forEach((threshold, i) => {
    opts.push({
      id: `lte_${i}_${threshold}`,
      label: `${threshold.toLocaleString('tr-TR')} ₺’ye kadar`,
      maxPrice: threshold,
    })
  })
  return opts
}

const CAPACITY_OPTIONS: { id: CapacityFilterId; label: string; test: (c: number) => boolean }[] = [
  { id: 'all', label: 'Tümü', test: () => true },
  { id: 'c1_4', label: '1–4 kişi', test: (c) => c >= 1 && c <= 4 },
  { id: 'c5_8', label: '5–8 kişi', test: (c) => c >= 5 && c <= 8 },
  { id: 'c9_12', label: '9–12 kişi', test: (c) => c >= 9 && c <= 12 },
  { id: 'c13', label: '13+ kişi', test: (c) => c >= 13 },
]

const CABIN_OPTIONS: { id: CabinFilterId; label: string; test: (k: number) => boolean }[] = [
  { id: 'all', label: 'Tümü', test: () => true },
  { id: 'k1_2', label: '1–2 kabin', test: (k) => k >= 1 && k <= 2 },
  { id: 'k3_4', label: '3–4 kabin', test: (k) => k >= 3 && k <= 4 },
  { id: 'k5', label: '5+ kabin', test: (k) => k >= 5 },
]

export function getCapacityOptions() {
  return CAPACITY_OPTIONS
}

export function getCabinOptions() {
  return CABIN_OPTIONS
}

export function filterYachtList(
  list: YachtListCardItem[],
  priceMax: number | null,
  capacityId: CapacityFilterId,
  cabinId: CabinFilterId
): YachtListCardItem[] {
  const capOpt = CAPACITY_OPTIONS.find((o) => o.id === capacityId) ?? CAPACITY_OPTIONS[0]
  const cabOpt = CABIN_OPTIONS.find((o) => o.id === cabinId) ?? CABIN_OPTIONS[0]

  return list.filter((y) => {
    if (priceMax != null) {
      const p = nPrice(y)
      if (p == null || p > priceMax) return false
    }
    if (capacityId !== 'all') {
      const c = nCap(y)
      if (c == null || !capOpt.test(c)) return false
    }
    if (cabinId !== 'all') {
      const k = nCab(y)
      if (k == null || !cabOpt.test(k)) return false
    }
    return true
  })
}

export function countActiveFilters(
  priceMax: number | null,
  capacityId: CapacityFilterId,
  cabinId: CabinFilterId
): number {
  let n = 0
  if (priceMax != null) n += 1
  if (capacityId !== 'all') n += 1
  if (cabinId !== 'all') n += 1
  return n
}
