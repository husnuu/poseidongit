import type { Metadata } from 'next'
import { client, urlFor } from '@/lib/sanity'
import { yachtRentalsAllQuery } from '@/lib/yachtQueries'
import YachtCard, { type YachtListItem } from '@/components/yacht/YachtCard'
import listStyles from '../turlar/page.module.css'
import { getBaseUrl, getSiteName } from '@/lib/seo'

export const revalidate = 3600

const siteName = getSiteName()

export const metadata: Metadata = {
  title: siteName ? `Yat kiralama | ${siteName}` : 'Yat kiralama | Özel charter',
  description:
    'Özel yat ve gulet kiralama. Günlük charter, kaptanlı seçenekler. Müsaitlik talebi ile teklif alın.',
  alternates: { canonical: `${getBaseUrl()}/yat-kiralama` },
  openGraph: {
    title: siteName ? `Yat kiralama | ${siteName}` : 'Yat kiralama',
    description: 'Özel yat kiralama ve charter. Müsaitlik sorun.',
    url: `${getBaseUrl()}/yat-kiralama`,
  },
}

type YachtListRaw = Omit<
  YachtListItem,
  'coverImageUrl' | 'coverImageAlt'
> & {
  mainImage?: { asset?: { _ref: string }; alt?: string | null } | null
}

export default async function YatKiralamaPage() {
  let yachts: YachtListItem[] = []
  try {
    const raw = await client.fetch<YachtListRaw[]>(yachtRentalsAllQuery, {}, { useCdn: true })
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
      currency: y.currency,
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
      <section className="w-full py-14 md:py-20" aria-labelledby="yachts-heading">
        <div className="mx-auto max-w-[1200px] px-4">
          <header className="mb-12">
            <h1 id="yachts-heading" className={listStyles.heading}>
              <span className={listStyles.headingLine1}>ÖZEL</span>
              <span className={listStyles.headingLine2}>YAT KİRALAMA</span>
            </h1>
            <p
              className="mt-6 text-lg text-black/70 max-w-2xl leading-relaxed"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              Tarih seçin, müsaitlik sorun — ekibimiz size özel teklif ve uygunluk için geri dönüş yapar.
              Online ödeme yoktur.
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {yachts.map((y) => (
              <YachtCard key={y._id} yacht={y} />
            ))}
          </div>

          {yachts.length === 0 && (
            <p className="text-center text-black/60 py-12" style={{ fontFamily: 'var(--font-family)' }}>
              Yakında yat ilanları eklenecek. Sanity Studio’dan yat kiralama içeriği ekleyebilirsiniz.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
