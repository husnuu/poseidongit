import { notFound } from 'next/navigation'
import { client } from '@/lib/sanity'
import { tourCoverImageUrl } from '@/lib/sanityImage'
import { homePopularToursOrderQuery, toursListQuery, toursPageQuery } from '@/lib/queries'
import TourCard from '@/components/tours/TourCard'
import type { TourListItem } from '@/components/tours/TourCard'
import styles from './page.module.css'

import type { Metadata } from 'next'
import { getBaseUrl, getSiteName } from '@/lib/seo'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { mergeTourForLocale } from '@/lib/i18n/mergeTourForLocale'
import { mergeHomePageLocale } from '@/lib/i18n/mergeHomePageLocale'

export const dynamic = 'force-dynamic'

const siteName = getSiteName()

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: loc } = await params
  const locale = isSiteLocale(loc) ? (loc as SiteLocale) : 'tr'
  const canonical = `${getBaseUrl()}${withLocalePath(locale, '/turlar')}`
  return {
    title: siteName ? `Tekne Turları | ${siteName}` : 'Tekne Turları | Turlar ve Fiyatlar',
    description:
      'Tekne turu seçenekleri: adalar ve koylar turu, BBQ turları, günlük turlar. Fiyatlar ve rezervasyon.',
    alternates: { canonical },
    openGraph: {
      title: siteName ? `Tekne Turları | ${siteName}` : 'Tekne Turları',
      description: 'Tekne turları ve deneyimler. Rezervasyon.',
      url: canonical,
    },
  }
}

type TourListRaw = Omit<TourListItem, 'coverImageUrl' | 'coverImageAlt'> & {
  mainImage?: { asset?: { _ref: string }; alt?: string | null } | null
  translations?: unknown
}

type ToursPageData = {
  slug?: string | null
  titleTop?: string | null
  titleBottom?: string | null
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

export default async function TurlarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale

  let tours: TourListItem[] = []
  let pageData: ToursPageData | null = null

  try {
    const [toursData, page, homeOrderRaw] = await Promise.all([
      client.fetch<TourListRaw[]>(toursListQuery, {}, { useCdn: false }),
      client.fetch<ToursPageData | null>(toursPageQuery, {}, { useCdn: false }),
      client.fetch<Record<string, unknown> | null>(homePopularToursOrderQuery, {}, { useCdn: false }),
    ])
    pageData = page ?? null
    const raw = Array.isArray(toursData) ? toursData : []
    const mapped = raw.map((t) => {
      const merged = mergeTourForLocale(t as unknown as Record<string, unknown>, locale) as unknown as TourListRaw & {
        quickFacts?: { durationText?: string | null; meetingLocation?: string | null }
      }
      const qf = merged.quickFacts
      return {
        _id: merged._id,
        title: merged.title,
        slug: merged.slug,
        shortDescription: merged.shortDescription,
        rating: merged.rating,
        reviewCount: merged.reviewCount,
        reviewsUrl: merged.reviewsUrl ?? null,
        isPopular: merged.isPopular,
        departureLabel: qf?.meetingLocation?.trim() || merged.departureLabel,
        durationLabel: qf?.durationText?.trim() || merged.durationLabel,
        priceFrom: merged.priceFrom,
        coverImageUrl: tourCoverImageUrl(merged.mainImage?.asset ?? null),
        coverImageAlt: merged.mainImage?.alt ?? null,
      }
    })
    const homeMerged = mergeHomePageLocale(homeOrderRaw, locale)
    const popularOrder = popularTourIdsFromMergedHome(homeMerged as Record<string, unknown> | null)
    tours = sortToursLikeHomepage(mapped, popularOrder, locale)
  } catch {
    tours = []
  }

  const titleTop = pageData?.titleTop?.trim() || 'EN POPÜLER'
  const titleBottom = pageData?.titleBottom?.trim() || 'TURLAR'

  return (
    <div className="min-h-screen bg-white">
      <section className="w-full py-14 md:py-20" aria-labelledby="tours-heading">
        <div className="mx-auto max-w-[1200px] px-4">
          <header className="mb-12">
            <h1 id="tours-heading" className={styles.heading}>
              {titleTop && <span className={styles.headingLine1}>{titleTop}</span>}
              {titleBottom && <span className={styles.headingLine2}>{titleBottom}</span>}
            </h1>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {tours.map((tour) => (
              <TourCard key={tour._id} tour={tour} locale={locale} />
            ))}
          </div>

          {tours.length === 0 && (
            <p className="text-center text-black/60 py-12">Henüz tur eklenmemiş.</p>
          )}
        </div>
      </section>
    </div>
  )
}
