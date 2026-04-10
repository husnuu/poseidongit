import { notFound } from 'next/navigation'
import { client, urlFor } from '@/lib/sanity'
import { toursListQuery, toursPageQuery } from '@/lib/queries'
import TourCard from '@/components/tours/TourCard'
import type { TourListItem } from '@/components/tours/TourCard'
import styles from './page.module.css'

import type { Metadata } from 'next'
import { getBaseUrl, getSiteName } from '@/lib/seo'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { mergeTourForLocale } from '@/lib/i18n/mergeTourForLocale'

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

export default async function TurlarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale

  let tours: TourListItem[] = []
  let pageData: ToursPageData | null = null

  try {
    const [toursData, page] = await Promise.all([
      client.fetch<TourListRaw[]>(toursListQuery, {}, { useCdn: false }),
      client.fetch<ToursPageData | null>(toursPageQuery, {}, { useCdn: false }),
    ])
    pageData = page ?? null
    const raw = Array.isArray(toursData) ? toursData : []
    tours = raw.map((t) => {
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
        coverImageUrl: merged.mainImage?.asset
          ? urlFor(merged.mainImage.asset).width(800).height(600).url()
          : null,
        coverImageAlt: merged.mainImage?.alt ?? null,
      }
    })
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
