import { client } from '@/lib/sanity'
import { tourCoverImageUrl } from '@/lib/sanityImage'
import { ferryRoutesListQuery } from '@/lib/queries'
import { mergeFerryRouteLocale, ferryRouteFieldHasManualTranslation } from '@/lib/i18n/mergeFerryRouteLocale'
import { translateText } from '@/lib/i18n/runtimeTranslate'
import type { SiteLocale } from '@/lib/i18n/config'
import type { FerryRouteListItem } from '@/components/ferry/FerryRouteCard'
import { cheapestVessel, vesselAgeTiers, type FerryAgeTier } from '@/components/ferry/ferryTypes'
import { getTuryolRoute, TURYOL_ROUTES } from './turyolRoutes'
import { ISLAND_PHOTOS } from './islandGuides'

type FerryRouteRaw = {
  _id: string
  title?: string | null
  cardDescription?: string | null
  slug?: string | null
  mainImage?: { asset?: { _ref?: string } | null; alt?: string | null } | null
  durationLabel?: string | null
  routeLabel?: string | null
  departurePort?: string | null
  arrivalPort?: string | null
  currency?: string | null
  ageTiers?: FerryAgeTier[] | null
  translations?: unknown
}

/**
 * Feribot hattı kartları (/feribot listesi ve anasayfadaki "Yunan Adaları Feribot"):
 * Sanity'deki yayındaki hatlar + Sanity'de belgesi olmayan, kodda tanımlı hatlar.
 * Tekne fiyatı tanımlı hatlarda fiyat teknelerden (€) gelir.
 */
export async function getFerryRouteList(locale: SiteLocale): Promise<FerryRouteListItem[]> {
  let routes: FerryRouteListItem[] = []
  try {
    const raw = await client.fetch<FerryRouteRaw[]>(ferryRoutesListQuery, {}, { useCdn: false })
    const list = Array.isArray(raw) ? raw : []
    routes = await Promise.all(
      list.map(async (item) => {
        const rawItem = item as unknown as Record<string, unknown>
        const merged = mergeFerryRouteLocale(rawItem, locale) as unknown as FerryRouteRaw
        const [title, cardDescription, durationLabel, routeLabel] = await Promise.all([
          ferryRouteFieldHasManualTranslation(rawItem, locale, 'title')
            ? merged.title
            : translateText(merged.title, locale),
          ferryRouteFieldHasManualTranslation(rawItem, locale, 'cardDescription')
            ? merged.cardDescription
            : translateText(merged.cardDescription, locale),
          ferryRouteFieldHasManualTranslation(rawItem, locale, 'durationLabel')
            ? merged.durationLabel
            : translateText(merged.durationLabel, locale),
          ferryRouteFieldHasManualTranslation(rawItem, locale, 'routeLabel')
            ? merged.routeLabel
            : translateText(merged.routeLabel, locale),
        ])
        return {
          _id: merged._id,
          title: (title || merged.title) ?? null,
          slug: merged.slug ?? null,
          cardDescription: (cardDescription || merged.cardDescription) ?? null,
          coverImageUrl: tourCoverImageUrl(merged.mainImage?.asset ?? null),
          coverImageAlt: merged.mainImage?.alt ?? null,
          durationLabel: (durationLabel || merged.durationLabel) ?? null,
          routeLabel: (routeLabel || merged.routeLabel) ?? null,
          departurePort: merged.departurePort ?? null,
          arrivalPort: merged.arrivalPort ?? null,
          currency: merged.currency ?? null,
          ageTiers: merged.ageTiers ?? null,
        } satisfies FerryRouteListItem
      })
    )
  } catch {
    routes = []
  }

  const sanitySlugs = new Set(routes.map((r) => r.slug))
  routes = routes.map((route) => {
    const turyol = getTuryolRoute(route.slug)
    const vessel = cheapestVessel(turyol?.vessels ?? [])
    return vessel ? { ...route, currency: '€', ageTiers: vesselAgeTiers(vessel, locale), island: turyol!.island } : route
  })
  for (const turyol of [...TURYOL_ROUTES].sort((a, b) => a.order - b.order)) {
    const vessel = cheapestVessel(turyol.vessels)
    if (!turyol.page || !vessel || sanitySlugs.has(turyol.slug)) continue
    const t = turyol.page.texts[locale] ?? turyol.page.texts.tr
    const cover = ISLAND_PHOTOS[turyol.page.images[0]]
    routes.push({
      _id: `ferry-${turyol.slug}`,
      title: t.title,
      slug: turyol.slug,
      cardDescription: t.cardDescription,
      coverImageUrl: cover?.src ?? null,
      coverImageAlt: cover?.caption[locale] ?? null,
      durationLabel: t.durationLabel,
      routeLabel: t.routeLabel,
      departurePort: t.departurePort,
      arrivalPort: t.arrivalPort,
      currency: '€',
      ageTiers: vesselAgeTiers(vessel, locale),
      island: turyol.island,
    })
  }
  return routes
}
