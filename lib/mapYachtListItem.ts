import type { YachtListItem } from '@/components/yacht/YachtCard'
import type { HomePopularYachtCardData } from '@/components/home/HomePopularYachtCard'
import { safeSanityImageUrl } from '@/lib/sanity'
import type { SanityYachtCardRow } from '@/lib/yachtTypes'

export type { SanityYachtCardRow }

export function mapSanityYachtToHomeCard(
  row: SanityYachtCardRow | null | undefined
): HomePopularYachtCardData | null {
  if (!row?.slug || row.isActive === false) return null
  return {
    _id: row._id,
    name: row.name ?? row.slug,
    slug: row.slug,
    locationTitle: row.locationTitle,
    locationSlug: row.locationSlug,
    coverImageUrl: safeSanityImageUrl(row.mainImage?.asset ?? undefined, (b) =>
      b.width(900).height(720)
    ),
    coverImageAlt: row.mainImage?.alt ?? null,
    yachtType: row.yachtType,
    badges: row.badges ?? null,
    included: row.included ?? null,
    specifications: row.specifications ?? undefined,
    sailingLicenceRequired: row.sailingLicenceRequired ?? null,
    isFeatured: row.isFeatured,
    priceFrom: row.priceFrom,
    overnightTotalPrice: row.overnightTotalPrice ?? undefined,
    overnightNightPricing: row.overnightNightPricing ?? undefined,
    currency: row.currency,
    dailyRentalEnabled: row.dailyRentalEnabled,
    overnightRentalEnabled: row.overnightRentalEnabled,
  }
}

export function mapSanityYachtRowsToHomeCards(
  rows: (SanityYachtCardRow | null | undefined)[]
): HomePopularYachtCardData[] {
  return rows
    .map((row) => mapSanityYachtToHomeCard(row))
    .filter((item): item is HomePopularYachtCardData => item != null)
}

export function mapSanityYachtToListItem(
  row: SanityYachtCardRow | null | undefined
): YachtListItem | null {
  if (!row?.slug || row.isActive === false) return null
  return {
    _id: row._id,
    name: row.name ?? row.slug,
    slug: row.slug,
    shortDescription: row.shortDescription,
    locationTitle: row.locationTitle,
    locationSlug: row.locationSlug,
    marina: row.marina,
    priceFrom: row.priceFrom,
    overnightTotalPrice: row.overnightTotalPrice ?? undefined,
    overnightNightPricing: row.overnightNightPricing ?? undefined,
    currency: row.currency,
    dailyRentalEnabled: row.dailyRentalEnabled,
    overnightRentalEnabled: row.overnightRentalEnabled,
    yachtType: row.yachtType,
    isFeatured: row.isFeatured,
    specifications: row.specifications ?? undefined,
    coverImageUrl: safeSanityImageUrl(row.mainImage?.asset ?? undefined, (b) =>
      b.width(800).height(600)
    ),
    coverImageAlt: row.mainImage?.alt ?? null,
  }
}
