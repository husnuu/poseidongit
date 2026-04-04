import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { client, urlFor } from '@/lib/sanity'
import {
  yachtRentalBySlugQuery,
  yachtLocationBySlugQuery,
  yachtRentalsByLocationQuery,
  yachtRentalSlugsQuery,
  yachtLocationSlugsQuery,
} from '@/lib/yachtQueries'
import type { YachtRentalDocument } from '@/lib/yachtTypes'
import YachtDetailView from '@/components/yacht/YachtDetailView'
import type { YachtListItem } from '@/components/yacht/YachtCard'
import YachtRentalListSection from '@/components/yacht/YachtRentalListSection'
import { buildYachtDetailMetadata } from '@/lib/yachtMetadata'
import listStyles from '../../turlar/page.module.css'
import { getBaseUrl, getSiteName } from '@/lib/seo'

export const revalidate = 3600

const getYachtBySlug = cache(async (slug: string) => {
  return client.fetch<YachtRentalDocument | null>(yachtRentalBySlugQuery, { slug }, { useCdn: true })
})

const getLocationBySlug = cache(async (slug: string) => {
  return client.fetch<{ title?: string; slug?: string; intro?: string } | null>(
    yachtLocationBySlugQuery,
    { slug },
    { useCdn: true }
  )
})

type YachtListRaw = Omit<YachtListItem, 'coverImageUrl' | 'coverImageAlt'> & {
  mainImage?: { asset?: { _ref: string }; alt?: string | null } | null
}

const getYachtsByLocation = cache(async (locationSlug: string) => {
  return client.fetch<YachtListRaw[]>(yachtRentalsByLocationQuery, { locationSlug }, { useCdn: true })
})

export async function generateStaticParams() {
  if (process.env.NODE_ENV === 'development') {
    // Dev'de static-path worker kaynaklı chunk bozulmalarını önlemek için kapalı.
    return []
  }
  try {
    const [yachts, locs] = await Promise.all([
      client.fetch<{ slug: string | null; locationSlug?: string | null }[]>(yachtRentalSlugsQuery),
      client.fetch<{ slug: string | null }[]>(yachtLocationSlugsQuery),
    ])
    const segments = new Set<string>()
    for (const y of yachts ?? []) {
      if (y.slug) segments.add(y.slug)
    }
    for (const l of locs ?? []) {
      if (l.slug) segments.add(l.slug)
    }
    return [...segments].map((segment) => ({ segment }))
  } catch {
    return []
  }
}

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
    return buildYachtDetailMetadata(yacht, path)
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
  params: Promise<{ segment: string }>
}) {
  const { segment } = await params

  const yacht = await getYachtBySlug(segment)
  if (yacht) {
    const path =
      yacht.locationSlug && yacht.slug
        ? `/yat-kiralama/${yacht.locationSlug}/${yacht.slug}`
        : `/yat-kiralama/${segment}`
    return <YachtDetailView yacht={yacht} path={path} />
  }

  const location = await getLocationBySlug(segment)
  if (location?.slug) {
    let yachts: YachtListItem[] = []
    try {
      const raw = await getYachtsByLocation(segment)
      const list = Array.isArray(raw) ? raw : []
      yachts = list.map((y) => ({
        _id: y._id,
        name: y.name,
        slug: y.slug,
        shortDescription: y.shortDescription,
        locationTitle: y.locationTitle,
        locationSlug: y.locationSlug,
        marina: y.marina,
        priceFrom: y.priceFrom,
        overnightTotalPrice: y.overnightTotalPrice ?? undefined,
        overnightNightPricing: y.overnightNightPricing ?? undefined,
        currency: y.currency,
        dailyRentalEnabled: y.dailyRentalEnabled,
        overnightRentalEnabled: y.overnightRentalEnabled,
        yachtType: y.yachtType,
        isFeatured: y.isFeatured,
        specifications: y.specifications ?? undefined,
        coverImageUrl: y.mainImage?.asset
          ? urlFor(y.mainImage.asset).width(800).height(600).url()
          : null,
        coverImageAlt: y.mainImage?.alt ?? null,
      }))
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
            />
          </div>
        </section>
      </div>
    )
  }

  notFound()
}
