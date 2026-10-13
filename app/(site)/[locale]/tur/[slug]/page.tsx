import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { client, urlFor } from '@/lib/sanity'
import { tourCoverImageUrl } from '@/lib/sanityImage'
import {
  tourSlugRowsForLocalesQuery,
  siteFooterQuery,
  otherToursForTourPageQuery,
} from '@/lib/queries'
import OtherToursSection from '@/components/OtherToursSection'
import type { TourListItem } from '@/components/tours/TourCard'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { mergeTourForLocale, tourFieldHasManualTranslation } from '@/lib/i18n/mergeTourForLocale'
import { translateText } from '@/lib/i18n/runtimeTranslate'
import { withLocalePath } from '@/lib/i18n/paths'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import PhotoGrid from '@/components/PhotoGrid'
import { TourHeader } from '@/components/TourHeader'
import FAQAccordion from '@/components/FAQAccordion'
import IncludedNotIncluded from '@/components/IncludedNotIncluded'
import ItineraryTimeline from '@/components/ItineraryTimeline'
import HighlightsDetailsRow from '@/components/HighlightsDetailsRow'
import TourDescription from '@/components/TourDescription'
import HostBlock from '@/components/HostBlock'
import TourBookingSidebar from '@/components/booking/TourBookingSidebar'
import type { TourForBooking } from '@/lib/sanity/bookingTypes'
import ReviewsSection from '@/components/ReviewsSection'
import ReviewExcerptStrip from '@/components/ReviewExcerptStrip'
import WhereSection from '@/components/tour/WhereSection'
import TourReelsRail from '@/components/tour/TourReelsRail'
import ScrollReveal from '@/components/ui/ScrollReveal'
import JsonLd from '@/components/seo/JsonLd'
import Breadcrumb from '@/components/common/Breadcrumb'
import {
  buildBreadcrumbSchema,
  buildFAQSchema,
  buildTourSchema,
  absoluteUrl,
  getSiteName,
} from '@/lib/seo'
import { alternateLanguageAbsoluteUrls } from '@/lib/seo/alternateLanguages'
import {
  getTour,
  buildGalleryHeroImages,
  buildItineraryTimelineItems,
  getVideoEmbedUrl,
} from '@/lib/sanity/getTourFull'

function parseMetaKeywords(raw: string | null | undefined): string[] | undefined {
  if (!raw?.trim()) return undefined
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean)
  return list.length ? list : undefined
}

export const revalidate = 3600 // ISR: tur sayfaları en fazla 1 saat sonra güncellenir

/** Yayımlanmış turların slug'ları — 404 önlemek için sayfaların build/ISR'da bilinmesi gerekir */
export async function generateStaticParams() {
  if (process.env.NODE_ENV === 'development') {
    // Dev'de static-path worker kaynaklı chunk bozulmalarını önlemek için kapalı.
    return []
  }
  const rows = await client.fetch<
    { tSlug?: string | null; enSlug?: string | null; deSlug?: string | null; ruSlug?: string | null }[]
  >(tourSlugRowsForLocalesQuery)
  const out: { locale: string; slug: string }[] = []
  for (const r of rows ?? []) {
    if (r.tSlug) out.push({ locale: 'tr', slug: r.tSlug })
    if (r.enSlug) out.push({ locale: 'en', slug: r.enSlug })
    if (r.deSlug) out.push({ locale: 'de', slug: r.deSlug })
    // RU önceden atlanıyordu — Rusça tur sayfaları ilk istekte SSR ile
    // çalışıyordu ama build/ISR sırasında önceden üretilmiyordu.
    if (r.ruSlug) out.push({ locale: 'ru', slug: r.ruSlug })
  }
  return out
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { slug, locale: loc } = await params
  // notFound() BURADA çağrılıyor (sayfa gövdesindeki notFound() yerine/ona ek
  // olarak): bu segmentte loading.tsx olduğu için sayfa gövdesi Suspense
  // içinde stream ediliyor — ilk baytlar (200) zaten gönderildikten SONRA
  // gövdedeki notFound() tetiklendiğinden HTTP durumu 200'de kalıyordu
  // (gerçek olmayan bir tur slug'ı bile 200 dönüyordu — "soft 404").
  // generateMetadata, gövde render/stream edilmeden ÖNCE çözüldüğü için
  // buradaki notFound() doğru 404 durum kodunu üretiyor.
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale
  const tourUi = getTourPageUi(locale)
  const tour = await getTour(slug, locale)
  if (!tour) notFound()

  const metaTitleSource = tour.seo?.metaTitle?.trim() || tour.title
  const title = `${metaTitleSource}${tourUi.metaTitleSuffix}`

  const descSource =
    tour.seo?.metaDescription?.trim() ||
    tour.shortDescription?.trim() ||
    tour.title
  const description =
    descSource.replace(/\s+/g, ' ').slice(0, 160) || tourUi.metaDescriptionFallback(tour.title)

  const url = absoluteUrl(withLocalePath(locale, `/tur/${slug}`))

  // hreflang: her dilin kendi slug'uyla (bkz. lib/queries.ts localeSlugs
  // projeksiyonu) — aksi halde EN/DE slug'ı TR'den farklı turlarda
  // 404 veren bir alternate üretilirdi.
  const localePaths: Partial<Record<SiteLocale, string>> = {}
  const ls = tour.localeSlugs
  if (ls) {
    for (const [loc, localeSlug] of Object.entries(ls) as [SiteLocale, string | null | undefined][]) {
      if (localeSlug) localePaths[loc] = withLocalePath(loc, `/tur/${localeSlug}`)
    }
  }

  const ogImageAsset = tour.seo?.ogImage?.asset ?? tour.mainImage?.asset
  const image =
    ogImageAsset != null ? urlFor(ogImageAsset).width(1200).height(630).url() : undefined
  const ogImageAlt = tour.seo?.ogImage?.alt?.trim() || tour.title

  const keywords = parseMetaKeywords(tour.seo?.keywords)
  const siteName = getSiteName()
  const ogLocale = locale === 'tr' ? 'tr_TR' : locale === 'de' ? 'de_DE' : locale === 'ru' ? 'ru_RU' : 'en_US'

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    ...(tour.seo?.noIndex ? { robots: { index: false, follow: true as const } } : {}),
    alternates: {
      canonical: url,
      languages: alternateLanguageAbsoluteUrls(`/tur/${slug}`, localePaths),
    },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      locale: ogLocale,
      ...(siteName ? { siteName } : {}),
      images: image ? [{ url: image, width: 1200, height: 630, alt: ogImageAlt }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

type OtherTourRaw = {
  _id: string
  title?: string | null
  slug?: string | null
  shortDescription?: string | null
  durationLabel?: string | null
  departureLabel?: string | null
  priceFrom?: number | null
  rating?: number | null
  reviewCount?: number | null
  reviewsUrl?: string | null
  isPopular?: boolean | null
  cardDiscount?: { enabled?: boolean | null; percentage?: number | null } | null
  mainImage?: { asset?: { _ref: string }; alt?: string | null } | null
  translations?: unknown
}

/** Tur detay sayfasının altındaki "Diğer Turlarımız" bölümü için — ana sayfadaki
    popüler turlar bölümüyle aynı şekilde yerelleştirir (elle çeviri varsa o,
    yoksa anlık çeviri). */
async function mapOtherTours(raw: OtherTourRaw[], locale: SiteLocale): Promise<TourListItem[]> {
  return Promise.all(
    raw.map(async (t) => {
      const rawItem = t as unknown as Record<string, unknown>
      const merged = mergeTourForLocale(rawItem, locale) as unknown as OtherTourRaw
      const [title, shortDescription, durationLabel, departureLabel] = await Promise.all([
        tourFieldHasManualTranslation(rawItem, locale, 'title')
          ? merged.title
          : translateText(merged.title, locale),
        tourFieldHasManualTranslation(rawItem, locale, 'shortDescription')
          ? merged.shortDescription
          : translateText(merged.shortDescription, locale),
        translateText(merged.durationLabel, locale),
        translateText(merged.departureLabel, locale),
      ])
      return {
        _id: merged._id,
        title: title || merged.title || '',
        slug: merged.slug ?? null,
        shortDescription: shortDescription ?? null,
        durationLabel: durationLabel || merged.durationLabel || null,
        departureLabel: departureLabel || merged.departureLabel || null,
        priceFrom: merged.priceFrom ?? null,
        rating: merged.rating ?? null,
        reviewCount: merged.reviewCount ?? null,
        reviewsUrl: merged.reviewsUrl ?? null,
        isPopular: merged.isPopular ?? false,
        cardDiscount: merged.cardDiscount ?? null,
        coverImageUrl: tourCoverImageUrl(merged.mainImage?.asset ?? null),
        coverImageAlt: merged.mainImage?.alt ?? null,
      }
    })
  )
}

export default async function TourPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { slug, locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale
  const tourUi = getTourPageUi(locale)

  const tour = await getTour(slug, locale)

  if (!tour) {
    notFound()
  }

  let whatsappUrl: string | null = null
  try {
    const footer = await client.fetch<{ contact?: { chatValue?: string | null } | null } | null>(
      siteFooterQuery,
      {},
      { useCdn: false }
    )
    whatsappUrl = buildWhatsAppLink(footer?.contact?.chatValue ?? null)
  } catch {
    whatsappUrl = null
  }

  let otherTours: TourListItem[] = []
  try {
    const otherToursRaw = await client.fetch<OtherTourRaw[]>(
      otherToursForTourPageQuery,
      { excludeSlug: slug },
      { useCdn: false }
    )
    otherTours = await mapOtherTours(otherToursRaw ?? [], locale)
  } catch {
    otherTours = []
  }

  const videoEmbedUrl = tour.tourVideo ? getVideoEmbedUrl(tour.tourVideo) : null
  const galleryHeroImages = buildGalleryHeroImages(tour, tourUi)
  const itineraryTimelineItems = buildItineraryTimelineItems(tour)

  const reelsSlides =
    tour.reelsSection?.enabled && Array.isArray(tour.reelsSection.items)
      ? tour.reelsSection.items
          .filter((it) => typeof it?.videoUrl === 'string' && it.videoUrl.trim().length > 0)
          .map((it) => ({
            videoUrl: it.videoUrl!.trim(),
            posterUrl: it.poster?.asset
              ? urlFor(it.poster.asset).width(720).height(1280).quality(80).url()
              : it.poster?.url?.trim() || undefined,
          }))
      : []

  const tourPath = withLocalePath(locale, `/tur/${slug}`)
  const tourUrl = absoluteUrl(tourPath)
  const rezervasyonHref = withLocalePath(locale, `/rezervasyon/${tour.slug}`)
  const jsonLdImageAsset = tour.seo?.ogImage?.asset ?? tour.mainImage?.asset
  const tourImage =
    jsonLdImageAsset != null
      ? urlFor(jsonLdImageAsset).width(1200).height(630).url()
      : undefined
  const productSchemaDescription =
    tour.seo?.metaDescription?.trim() || tour.shortDescription?.trim() || undefined
  const breadcrumbCrumbs = [
    { name: tourUi.breadcrumbHome, url: withLocalePath(locale, '/') },
    { name: tourUi.breadcrumbTours, url: withLocalePath(locale, '/turlar') },
    { name: tour.title, url: tourPath },
  ]
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbCrumbs)
  // JSON-LD ile aynı veriden — önceden sayfada görünür bir breadcrumb yoktu,
  // yalnızca structured data vardı (Google'ın tutarlılık kuralıyla çelişiyordu).
  const breadcrumbItems = breadcrumbCrumbs.map((c) => ({ label: c.name, href: c.url }))
  const faqSchema =
    tour.faqs && tour.faqs.length > 0
      ? buildFAQSchema(tour.faqs.map((f) => ({ question: f.question, answer: f.answer })))
      : null
  const lowestPrice =
    tour.ticketClasses?.flatMap((c) => c.pricesByAge ?? [])
      .map((p) => p.price)
      .filter((n): n is number => typeof n === 'number')
      .sort((a, b) => a - b)[0] ?? undefined
  const productSchema = buildTourSchema({
    name: tour.title,
    description: productSchemaDescription,
    url: tourUrl,
    image: tourImage,
    price: lowestPrice,
    priceCurrency: 'TRY',
    ratingValue: tour.rating,
    reviewCount: tour.reviewCount,
  })

  return (
    <div className="min-h-screen bg-white dark:bg-white">
      <JsonLd data={breadcrumbSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}
      <JsonLd data={productSchema} />
      {/* Full-width tour gallery hero (edge-to-edge) */}
      {galleryHeroImages.length > 0 && (
        <div className="w-full mb-0">
          <PhotoGrid
            images={galleryHeroImages}
            tourTitle={tour.title}
            locale={locale}
            tourId={tour._id}
            tourSlug={tour.slug}
            tourDescription={tour.shortDescription}
          />
        </div>
      )}
      <div className="container mx-auto px-4 pt-6 pb-16 lg:pt-12 max-w-[1360px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <main className="flex-1 min-w-0">
            <Breadcrumb items={breadcrumbItems} className="mb-4" />
            <span id="reviews" className="block scroll-mt-24" aria-hidden />
            <TourHeader
          title={tour.title}
          ratingLabel={tour.ratingLabel}
          score={tour.rating}
          reviewCount={tour.reviewCount}
          reviewsUrl={tour.reviewsUrl}
          durationText={tour.quickFacts?.durationText}
          meetingLocation={tour.quickFacts?.meetingLocation}
          locale={locale}
        />

        <ScrollReveal>
          <HighlightsDetailsRow
            highlights={tour.highlights}
            tourDetails={tour.tourDetails}
            quickFacts={tour.quickFacts}
            tourUi={tourUi}
          />
        </ScrollReveal>

        <ScrollReveal>
          <ReviewExcerptStrip reviewsSection={tour.reviewsSection} locale={locale} />
        </ScrollReveal>

        <ScrollReveal>
          <ItineraryTimeline items={itineraryTimelineItems} sectionTitle={tourUi.itineraryTitle} locale={locale} />
        </ScrollReveal>

        {reelsSlides.length > 0 ? (
          <ScrollReveal>
            <TourReelsRail slides={reelsSlides} locale={locale} />
          </ScrollReveal>
        ) : null}

        <ScrollReveal>
          <TourDescription description={tour.description} locale={locale} />
        </ScrollReveal>

        {/* Video Section */}
        {tour.tourVideo?.enabled && (
          <ScrollReveal className="mb-8">
            {videoEmbedUrl && tour.tourVideo.type !== 'upload' ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-900">
                {tour.tourVideo.type === 'youtube' && (
                  <iframe
                    src={videoEmbedUrl}
                    title={tour.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                )}
                {tour.tourVideo.type === 'vimeo' && (
                  <iframe
                    src={videoEmbedUrl}
                    title={tour.title}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                )}
              </div>
            ) : tour.tourVideo.type === 'upload' && tour.tourVideo.fileUrl ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-900">
                <video
                  controls
                  poster={
                    tour.tourVideo.poster?.asset
                      ? urlFor(tour.tourVideo.poster.asset)
                          .width(1280)
                          .height(720)
                          .url()
                      : tour.tourVideo.poster?.url
                        ? tour.tourVideo.poster.url
                        : undefined
                  }
                  className="w-full h-full object-contain"
                >
                  <source src={tour.tourVideo.fileUrl} type="video/mp4" />
                  {tourUi.videoNotSupported}
                </video>
              </div>
            ) : null}
            {tour.tourVideo.caption && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 text-center">
                {tour.tourVideo.caption}
              </p>
            )}
          </ScrollReveal>
        )}

        <ScrollReveal>
          <IncludedNotIncluded included={tour.included} notIncluded={tour.notIncluded} tourUi={tourUi} />
        </ScrollReveal>

        <ScrollReveal>
          <HostBlock host={tour.host} whyYouWillLove={tour.whyYouWillLove} tourUi={tourUi} />
        </ScrollReveal>

        <ScrollReveal className="mb-14">
          <FAQAccordion faqs={tour.faqs} locale={locale} whatsappUrl={whatsappUrl} />
        </ScrollReveal>

        <ScrollReveal className="mt-14 mb-14">
          <WhereSection
            data={tour.whereSection}
            headingFallback={tourUi.whereHeadingFallback}
            locale={locale}
          />
        </ScrollReveal>

        <ScrollReveal className="mt-14">
          <ReviewsSection reviewsUrl={tour.reviewsUrl} reviewsSection={tour.reviewsSection} tourUi={tourUi} />
        </ScrollReveal>

          </main>
          <TourBookingSidebar
            tour={tour as TourForBooking}
            ticketClasses={tour.ticketClasses}
            bookingCard={tour.bookingCard}
            rezervasyonHref={rezervasyonHref}
            locale={locale}
          />
        </div>

        <ScrollReveal>
          <OtherToursSection items={otherTours} locale={locale} />
        </ScrollReveal>
      </div>
    </div>
  )
}
