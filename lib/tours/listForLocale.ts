import { client } from '@/lib/sanity'
import { tourCoverImageUrl } from '@/lib/sanityImage'
import { homePopularToursOrderQuery, toursListQuery } from '@/lib/queries'
import { isTourCategory, type TourCategory } from '@/lib/tourCategories'
import type { TourListItem } from '@/components/tours/TourCard'
import type { SiteLocale } from '@/lib/i18n/config'
import { mergeTourForLocale, tourFieldHasManualTranslation } from '@/lib/i18n/mergeTourForLocale'
import { mergeHomePageLocale } from '@/lib/i18n/mergeHomePageLocale'
import { translateText } from '@/lib/i18n/runtimeTranslate'

type TourListRaw = Omit<TourListItem, 'coverImageUrl' | 'coverImageAlt'> & {
  mainImage?: { asset?: { _ref: string }; alt?: string | null } | null
  translations?: unknown
}

function popularTourIdsFromMergedHome(home: Record<string, unknown> | null): string[] {
  if (!home) return []
  const sec = home.popularToursSection as Record<string, unknown> | undefined
  if (!sec || sec.enabled === false) return []
  const items = sec.items
  if (!Array.isArray(items)) return []
  const ids: string[] = []
  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    if (typeof o._ref === 'string') ids.push(o._ref)
    else if (typeof o._id === 'string') ids.push(o._id)
  }
  return ids
}

function sortToursLikeHomepage(tours: TourListItem[], popularOrder: string[], locale: SiteLocale): TourListItem[] {
  if (popularOrder.length === 0) {
    return [...tours].sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '', locale === 'tr' ? 'tr' : locale))
  }
  const map = new Map(tours.map((t) => [t._id, t]))
  const seen = new Set<string>()
  const ordered: TourListItem[] = []
  for (const id of popularOrder) {
    const t = map.get(id)
    if (t) {
      ordered.push(t)
      seen.add(id)
    }
  }
  const collator = locale === 'tr' ? 'tr' : locale
  const rest = tours.filter((t) => !seen.has(t._id)).sort((a, b) =>
    (a.title ?? '').localeCompare(b.title ?? '', collator),
  )
  return [...ordered, ...rest]
}

/** Tur kartları için dile çevrilmiş ve ana sayfa sırasına dizilmiş tur listesi. */
export async function loadToursForLocale(locale: SiteLocale): Promise<TourListItem[]> {
  const [toursData, homeOrderRaw] = await Promise.all([
    client.fetch<TourListRaw[]>(toursListQuery, {}, { useCdn: false }),
    client.fetch<Record<string, unknown> | null>(homePopularToursOrderQuery, {}, { useCdn: false }),
  ])
  const raw = Array.isArray(toursData) ? toursData : []
  const mapped = await Promise.all(
    raw.map(async (t) => {
      const rawItem = t as unknown as Record<string, unknown>
      const merged = mergeTourForLocale(rawItem, locale) as unknown as TourListRaw & {
        quickFacts?: { durationText?: string | null; meetingLocation?: string | null }
      }
      const qf = merged.quickFacts
      const shortDescription = tourFieldHasManualTranslation(rawItem, locale, 'shortDescription')
        ? merged.shortDescription
        : await translateText(merged.shortDescription, locale)
      const title = tourFieldHasManualTranslation(rawItem, locale, 'title')
        ? merged.title
        : await translateText(merged.title, locale)
      const departureLabelRaw = qf?.meetingLocation?.trim() || merged.departureLabel
      const durationLabelRaw = qf?.durationText?.trim() || merged.durationLabel
      const [departureLabel, durationLabel] = await Promise.all([
        translateText(departureLabelRaw, locale),
        translateText(durationLabelRaw, locale),
      ])
      return {
        _id: merged._id,
        title: title || merged.title,
        slug: merged.slug,
        shortDescription,
        rating: merged.rating,
        reviewCount: merged.reviewCount,
        reviewsUrl: merged.reviewsUrl ?? null,
        isPopular: merged.isPopular,
        cardDiscount: merged.cardDiscount ?? null,
        departureLabel: departureLabel || departureLabelRaw,
        durationLabel: durationLabel || durationLabelRaw,
        priceFrom: merged.priceFrom,
        privateTour: Boolean((merged as { privateTour?: boolean | null }).privateTour),
        category: isTourCategory((merged as { category?: unknown }).category)
          ? ((merged as { category?: unknown }).category as TourCategory)
          : 'daily',
        coverImageUrl: tourCoverImageUrl(merged.mainImage?.asset ?? null),
        coverImageAlt: merged.mainImage?.alt ?? null,
      }
    })
  )
  const homeMerged = mergeHomePageLocale(homeOrderRaw, locale)
  const popularOrder = popularTourIdsFromMergedHome(homeMerged as Record<string, unknown> | null)
  return sortToursLikeHomepage(mapped, popularOrder, locale)
}
