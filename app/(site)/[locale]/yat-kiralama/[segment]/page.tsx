import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { client } from '@/lib/sanity'
import {
  yachtRentalBySlugQuery,
  yachtLocationBySlugQuery,
  yachtRentalsByLocationQuery,
} from '@/lib/yachtQueries'
import type { YachtRentalDocument, SanityYachtCardRow } from '@/lib/yachtTypes'
import { mapSanityYachtRowsToHomeCards } from '@/lib/mapYachtListItem'
import YachtDetailView from '@/components/yacht/YachtDetailView'
import YachtRentalListSection from '@/components/yacht/YachtRentalListSection'
import { buildYachtDetailMetadata } from '@/lib/yachtMetadata'
import listStyles from '../../turlar/page.module.css'
import { getBaseUrl, getSiteName } from '@/lib/seo'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'

/** Root layout `headers()` ile uyum (prod: DYNAMIC_SERVER_USAGE). */
export const dynamic = 'force-dynamic'

const getYachtBySlug = cache(async (slug: string) => {
  try {
    return await client.fetch<YachtRentalDocument | null>(
      yachtRentalBySlugQuery,
      { slug },
      { useCdn: true }
    )
  } catch (err) {
    console.error('[yat-kiralama segment] Sanity fetch yacht', { slug, err })
    return null
  }
})

const getLocationBySlug = cache(async (slug: string) => {
  try {
    return await client.fetch<{ title?: string; slug?: string; intro?: string } | null>(
      yachtLocationBySlugQuery,
      { slug },
      { useCdn: true }
    )
  } catch (err) {
    console.error('[yat-kiralama segment] Sanity fetch location', { slug, err })
    return null
  }
})

const getYachtsByLocation = cache(async (locationSlug: string) => {
  try {
    return await client.fetch<SanityYachtCardRow[]>(
      yachtRentalsByLocationQuery,
      { locationSlug },
      { useCdn: true }
    )
  } catch (err) {
    console.error('[yat-kiralama segment] Sanity fetch yachts by location', { locationSlug, err })
    return []
  }
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ segment: string }>
}): Promise<Metadata> {
  const { segment } = await params
  const yacht = await getYachtBySlug(segment)
  if (yacht) {
    const path =
      yacht.locationSlug && yacht.slug
        ? `/yat-kiralama/${yacht.locationSlug}/${yacht.slug}`
        : `/yat-kiralama/${segment}`
    try {
      return buildYachtDetailMetadata(yacht, path)
    } catch (err) {
      console.error('[yat-kiralama segment] generateMetadata yacht', { segment, err })
      return { title: yacht.name || 'Yat kiralama' }
    }
  }
  const loc = await getLocationBySlug(segment)
  if (loc?.title) {
    const site = getSiteName()
    const title = site ? `${loc.title} yat kiralama | ${site}` : `${loc.title} | Yat kiralama`
    return {
      title,
      description: `${loc.title} bölgesinde özel yat ve charter seçenekleri.`,
      alternates: { canonical: `${getBaseUrl()}/yat-kiralama/${segment}` },
    }
  }
  return { title: 'Sayfa bulunamadı' }
}

export default async function YatKiralamaSegmentPage({
  params,
}: {
  params: Promise<{ locale: string; segment: string }>
}) {
  const { locale: loc, segment } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale

  const yacht = await getYachtBySlug(segment)
  if (yacht) {
    const path =
      yacht.locationSlug && yacht.slug
        ? `/yat-kiralama/${yacht.locationSlug}/${yacht.slug}`
        : `/yat-kiralama/${segment}`
    return <YachtDetailView locale={locale} yacht={yacht} path={path} />
  }

  const location = await getLocationBySlug(segment)
  if (location?.slug) {
    let yachts = mapSanityYachtRowsToHomeCards([])
    try {
      const raw = await getYachtsByLocation(segment)
      yachts = mapSanityYachtRowsToHomeCards(Array.isArray(raw) ? raw : [])
    } catch {
      yachts = []
    }

    return (
      <div className="min-h-screen bg-white">
        <section className="w-full py-14 md:py-20" aria-labelledby="loc-yachts-heading">
          <div className="mx-auto max-w-[1200px] px-4">
            <header className="mb-12">
              <h1 id="loc-yachts-heading" className={listStyles.heading}>
                <span className={listStyles.headingLine1}>{location.title}</span>
                <span className={listStyles.headingLine2}>YAT KİRALAMA</span>
              </h1>
              {location.intro?.trim() && (
                <p
                  className="mt-6 text-lg text-black/70 max-w-2xl leading-relaxed whitespace-pre-wrap"
                  style={{ fontFamily: 'var(--font-family)' }}
                >
                  {location.intro.trim()}
                </p>
              )}
            </header>
            <YachtRentalListSection
              yachts={yachts}
              emptyStateMessage="Bu lokasyon için henüz yat eklenmemiş."
              locale={locale}
            />
          </div>
        </section>
      </div>
    )
  }

  notFound()
}
