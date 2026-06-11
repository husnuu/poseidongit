import type { YachtListCardItem } from '@/lib/yachtListPrice'
import { effectiveYachtListAdvertisedPrice } from '@/lib/yachtListPrice'

export type YachtSortMode =
  | 'default'
  | 'price_asc'
  | 'price_desc'
  | 'capacity_asc'
  | 'capacity_desc'
  | 'cabins_asc'
  | 'cabins_desc'

function num(n: number | null | undefined): number | null {
  if (typeof n !== 'number' || Number.isNaN(n)) return null
  return n
}

/** İstemci tarafı sıralama; `default` sunucudan gelen sırayı korur. */
export function sortYachtList(list: YachtListCardItem[], mode: YachtSortMode): YachtListCardItem[] {
  if (mode === 'default') return list

  const copy = [...list]

  switch (mode) {
    case 'price_asc':
      return copy.sort(
        (a, b) =>
          (num(effectiveYachtListAdvertisedPrice(a)) ?? Number.POSITIVE_INFINITY) -
          (num(effectiveYachtListAdvertisedPrice(b)) ?? Number.POSITIVE_INFINITY)
      )
    case 'price_desc':
      return copy.sort(
        (a, b) =>
          (num(effectiveYachtListAdvertisedPrice(b)) ?? Number.NEGATIVE_INFINITY) -
          (num(effectiveYachtListAdvertisedPrice(a)) ?? Number.NEGATIVE_INFINITY)
      )
    case 'capacity_asc':
      return copy.sort(
        (a, b) =>
          (num(a.specifications?.capacity) ?? Number.POSITIVE_INFINITY) -
          (num(b.specifications?.capacity) ?? Number.POSITIVE_INFINITY)
      )
    case 'capacity_desc':
      return copy.sort(
        (a, b) =>
          (num(b.specifications?.capacity) ?? Number.NEGATIVE_INFINITY) -
          (num(a.specifications?.capacity) ?? Number.NEGATIVE_INFINITY)
      )
    case 'cabins_asc':
      return copy.sort(
        (a, b) =>
          (num(a.specifications?.cabins) ?? Number.POSITIVE_INFINITY) -
          (num(b.specifications?.cabins) ?? Number.POSITIVE_INFINITY)
      )
    case 'cabins_desc':
      return copy.sort(
        (a, b) =>
          (num(b.specifications?.cabins) ?? Number.NEGATIVE_INFINITY) -
          (num(a.specifications?.cabins) ?? Number.NEGATIVE_INFINITY)
      )
    default:
      return copy
  }
}

export const YACHT_SORT_OPTIONS: { value: YachtSortMode; label: string }[] = [
  { value: 'default', label: 'Önerilen (öne çıkan + isim)' },
  { value: 'price_asc', label: 'Fiyat: düşükten yükseğe' },
  { value: 'price_desc', label: 'Fiyat: yüksekten düşüğe' },
  { value: 'capacity_asc', label: 'Kişi kapasitesi: az → çok' },
  { value: 'capacity_desc', label: 'Kişi kapasitesi: çok → az' },
  { value: 'cabins_asc', label: 'Kabin: az → çok' },
  { value: 'cabins_desc', label: 'Kabin: çok → az' },
]
