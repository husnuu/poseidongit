import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { client } from '@/lib/sanity'
import { tourCoverImageUrl } from '@/lib/sanityImage'
import { ferryRoutesListQuery } from '@/lib/queries'
import { mergeFerryRouteLocale, ferryRouteFieldHasManualTranslation } from '@/lib/i18n/mergeFerryRouteLocale'
import { translateText } from '@/lib/i18n/runtimeTranslate'
import { getFerryPageUiStrings } from '@/lib/i18n/strings/ferryPage'
import FerryRouteCard from '@/components/ferry/FerryRouteCard'
import type { FerryRouteListItem } from '@/components/ferry/FerryRouteCard'
import type { FerryAgeTier } from '@/components/ferry/ferryTypes'
import { buildPageMetadata } from '@/lib/seo/buildPageMetadata'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

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

  return (
    <div className="min-h-screen bg-white">
      <section className="w-full py-14 md:py-20" aria-labelledby="ferry-routes-heading">
        <div className="mx-auto max-w-[1200px] px-4">
          <header className="mb-12">
            <h1 id="ferry-routes-heading" className={styles.heading}>
              <span className={styles.headingLine1}>{ui.listHeadingTop}</span>
              <span className={styles.headingLine2}>{ui.listHeadingBottom}</span>
            </h1>
            <p className={styles.subtitle}>{ui.listSubtitle}</p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {routes.map((route) => (
              <FerryRouteCard key={route._id} route={route} locale={locale} />
            ))}
          </div>

          {routes.length === 0 && (
            <p className="text-center text-black/60 py-12">{ui.listEmptyMessage}</p>
          )}
        </div>
      </section>
    </div>
  )
}
