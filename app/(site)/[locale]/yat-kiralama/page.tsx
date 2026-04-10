import type { Metadata } from 'next'
import { client, urlFor } from '@/lib/sanity'
import { yachtRentalsPageQuery } from '@/lib/queries'
import { yachtRentalsAllQuery } from '@/lib/yachtQueries'
import type { YachtListItem } from '@/components/yacht/YachtCard'
import YachtRentalListSection from '@/components/yacht/YachtRentalListSection'
import listStyles from '../turlar/page.module.css'
import { getBaseUrl, getSiteName } from '@/lib/seo'

export const revalidate = 3600

const siteName = getSiteName()

type YachtRentalsPageData = {
  slug?: string | null
  titleTop?: string | null
  titleBottom?: string | null
  intro?: string | null
  emptyStateMessage?: string | null
  seo?: { title?: string | null; description?: string | null } | null
}

type YachtListRaw = Omit<
  YachtListItem,
  'coverImageUrl' | 'coverImageAlt'
> & {
  mainImage?: { asset?: { _ref: string }; alt?: string | null } | null
}

const DEFAULT_INTRO =
  'Tarih seçin, müsaitlik sorun — ekibimiz size özel teklif ve uygunluk için geri dönüş yapar. Online ödeme yoktur.'

const DEFAULT_EMPTY =
  'Yakında yat ilanları eklenecek. Sanity Studio’dan yat kiralama içeriği ekleyebilirsiniz.'

export async function generateMetadata(): Promise<Metadata> {
  let page: YachtRentalsPageData | null = null
  try {
    page = await client.fetch<YachtRentalsPageData | null>(
      yachtRentalsPageQuery,
      {},
      { useCdn: true }
    )
  } catch {
    page = null
  }

  const title =
    page?.seo?.title?.trim() ||
    (siteName ? `Yat kiralama | ${siteName}` : 'Yat kiralama | Özel charter')
  const description =
    page?.seo?.description?.trim() ||
    'Özel yat ve gulet kiralama. Günlük charter, kaptanlı seçenekler. Müsaitlik talebi ile teklif alın.'

  return {
    title,
    description,
    alternates: { canonical: `${getBaseUrl()}/yat-kiralama` },
    openGraph: {
      title,
      description,
      url: `${getBaseUrl()}/yat-kiralama`,
    },
  }
}

export default async function YatKiralamaPage() {
  let yachts: YachtListItem[] = []
  let pageData: YachtRentalsPageData | null = null

  try {
    const [raw, page] = await Promise.all([
      client.fetch<YachtListRaw[]>(yachtRentalsAllQuery, {}, { useCdn: true }),
      client.fetch<YachtRentalsPageData | null>(yachtRentalsPageQuery, {}, { useCdn: true }),
    ])
    pageData = page ?? null
    const list = Array.isArray(raw) ? raw : []
    yachts = list.map((y) => ({
      _id: y._id,
      name: y.name,
      slug: y.slug,
      shortDescription: y.shortDescription,
      locationTitle: y.locationTitle,
      locationSlug: y.locationSlug,
      marina: y.marina ?? undefined,
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

  const titleTop = pageData?.titleTop?.trim() || 'ÖZEL'
  const titleBottom = pageData?.titleBottom?.trim() || 'YAT KİRALAMA'
  const intro = pageData?.intro?.trim() || DEFAULT_INTRO
  const emptyStateMessage = pageData?.emptyStateMessage?.trim() || DEFAULT_EMPTY

  return (
    <div className="min-h-screen bg-white">
      <section className="w-full py-14 md:py-20" aria-labelledby="yachts-heading">
        <div className="mx-auto max-w-[1200px] px-4">
          <header className="mb-12">
            <h1 id="yachts-heading" className={listStyles.heading}>
              {titleTop && <span className={listStyles.headingLine1}>{titleTop}</span>}
              {titleBottom && <span className={listStyles.headingLine2}>{titleBottom}</span>}
            </h1>
            <p
              className="mt-6 max-w-2xl whitespace-pre-wrap text-lg leading-relaxed text-black/70"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              {intro}
            </p>
          </header>

          <YachtRentalListSection yachts={yachts} emptyStateMessage={emptyStateMessage} />
        </div>
      </section>
    </div>
  )
}
