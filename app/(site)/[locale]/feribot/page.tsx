import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { client } from '@/lib/sanity'
import { tourCoverImageUrl } from '@/lib/sanityImage'
import { ferryRoutesListQuery } from '@/lib/queries'
import { mergeFerryRouteLocale, ferryRouteFieldHasManualTranslation } from '@/lib/i18n/mergeFerryRouteLocale'
import { translateText } from '@/lib/i18n/runtimeTranslate'
import { getFerryPageUiStrings } from '@/lib/i18n/strings/ferryPage'
import FerryRouteFilter from '@/components/ferry/FerryRouteFilter'
import type { FerryRouteListItem } from '@/components/ferry/FerryRouteCard'
import { cheapestVessel, vesselAgeTiers, type FerryAgeTier } from '@/components/ferry/ferryTypes'
import { getTuryolRoute, TURYOL_ROUTES } from '@/lib/ferry/turyolRoutes'
import { ISLAND_PHOTOS } from '@/lib/ferry/islandGuides'
import { buildPageMetadata } from '@/lib/seo/buildPageMetadata'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import styles from './page.module.css'
import { LISTING_HEADINGS } from '@/lib/i18n/strings/listingHeadings'
import StandardPageLd from '@/components/seo/StandardPageLd'
import JsonLd from '@/components/seo/JsonLd'
import { buildItemListSchema } from '@/lib/seo'
import { withLocalePath } from '@/lib/i18n/paths'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: loc } = await params
  const locale = isSiteLocale(loc) ? (loc as SiteLocale) : 'tr'
  const ui = getFerryPageUiStrings(locale)
  return buildPageMetadata({
    locale,
    path: '/feribot',
    title: ui.listMetaTitle,
    description: ui.listMetaDescription,
  })
}

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

export default async function FeribotListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale
  const ui = getFerryPageUiStrings(locale)

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

  // Turyol hatları: fiyat teknelerden (€); Sanity'de belgesi olmayanlar kodtaki metinlerle eklenir.
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

  return (
    <div className="min-h-screen bg-white">
      <StandardPageLd type="CollectionPage" locale={locale} path="/feribot" name={ui.listMetaTitle} description={ui.listMetaDescription} />
      <JsonLd
        data={buildItemListSchema(
          routes
            .filter((r) => r.slug)
            .map((r) => ({ name: r.title ?? '', url: withLocalePath(locale, `/feribot/${r.slug}`) }))
        )}
      />
      <section className="w-full py-14 md:py-20" aria-labelledby="ferry-routes-heading">
        <div className="mx-auto max-w-[1200px] px-4">
          <header className="mb-12">
            <h1 id="ferry-routes-heading" className={styles.heading}>
              <span className={styles.headingLine1}>{ui.listHeadingTop}</span>
              {' '}
              <span className={styles.headingLine2}>{ui.listHeadingBottom}</span>
            </h1>
            <p className={styles.subtitle}>{ui.listSubtitle}</p>
          </header>

          <h2 className="sr-only">{LISTING_HEADINGS.ferries[locale]}</h2>
          {routes.length > 0 && <FerryRouteFilter routes={routes} locale={locale} />}

          {routes.length === 0 && (
            <p className="text-center text-black/60 py-12">{ui.listEmptyMessage}</p>
          )}
        </div>
      </section>
    </div>
  )
}
