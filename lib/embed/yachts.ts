import { client } from '@/lib/sanity'
import { yachtRentalsAllQuery } from '@/lib/yachtQueries'
import { mapSanityYachtRowsToHomeCards } from '@/lib/mapYachtListItem'
import type { SanityYachtCardRow } from '@/lib/yachtTypes'
import type { HomePopularYachtCardData } from '@/components/home/HomePopularYachtCard'

/** Widget'taki "Tekne kiralama" sekmesi için aktif yatlar (sitedeki yat kiralama listesiyle aynı sorgu). */
export async function loadEmbedYachts(): Promise<HomePopularYachtCardData[]> {
  try {
    const raw = await client.fetch<SanityYachtCardRow[]>(yachtRentalsAllQuery, {}, { useCdn: true })
    return mapSanityYachtRowsToHomeCards(Array.isArray(raw) ? raw : [])
  } catch (e) {
    console.error('[embed] yachts', e)
    return []
  }
}

export function yachtSitePath(y: Pick<HomePopularYachtCardData, 'slug' | 'locationSlug'>): string | null {
  if (!y.slug) return null
  return y.locationSlug ? `/yat-kiralama/${y.locationSlug}/${y.slug}` : `/yat-kiralama/${y.slug}`
}
