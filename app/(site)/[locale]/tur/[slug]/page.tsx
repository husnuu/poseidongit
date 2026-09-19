import { cache } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { PortableTextBlock } from '@portabletext/react'
import type { Metadata } from 'next'
import { client, urlFor } from '@/lib/sanity'
import { tourGalleryHeroImageUrl } from '@/lib/sanityImage'
import { tourByLocaleSlugQuery, tourSlugRowsForLocalesQuery, siteFooterQuery } from '@/lib/queries'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { mergeTourForLocale, tourFieldHasManualTranslation } from '@/lib/i18n/mergeTourForLocale'
import {
  translateText,
  translatePortableTextBlocks,
  translateTextArray,
  translateFields,
  translateArrayFields,
} from '@/lib/i18n/runtimeTranslate'
import { withLocalePath } from '@/lib/i18n/paths'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import { type TourGalleryImage } from '@/components/TourGalleryHero'
import PhotoGrid from '@/components/PhotoGrid'
import { TourHeader } from '@/components/TourHeader'
import FAQAccordion from '@/components/FAQAccordion'
import IncludedNotIncluded from '@/components/IncludedNotIncluded'
import ItineraryTimeline, {
  type ItineraryTimelineItem,
} from '@/components/ItineraryTimeline'
import HighlightsDetailsRow from '@/components/HighlightsDetailsRow'
import TourDescription from '@/components/TourDescription'
import HostBlock from '@/components/HostBlock'
import TourBookingSidebar from '@/components/booking/TourBookingSidebar'
import type { TourForBooking } from '@/lib/sanity/bookingTypes'
import ReviewsSection from '@/components/ReviewsSection'
import WhereSection, { type WhereSectionData } from '@/components/tour/WhereSection'
import TourReelsRail from '@/components/tour/TourReelsRail'
import PoseidonSecure from '@/components/tour/PoseidonSecure'
import JsonLd from '@/components/seo/JsonLd'
import {
  buildBreadcrumbSchema,
  buildFAQSchema,
  buildTourSchema,
  absoluteUrl,
} from '@/lib/seo'

interface TourVideo {
  enabled: boolean
  type?: 'youtube' | 'vimeo' | 'upload'
  youtubeUrl?: string
  vimeoUrl?: string
  fileUrl?: string
  caption?: string
  poster?: {
    asset?: { _ref?: string; _type?: string }
    url?: string
    metadata?: { lqip?: string; dimensions?: { width: number; height: number } }
  }
}

interface GalleryImage {
  asset?: { _ref?: string; _type?: string }
  url?: string
  metadata?: {
    lqip?: string
    dimensions?: { width: number; height: number }
  }
}

interface QuickFacts {
  durationText?: string
  availabilityText?: string
  meetingLocation?: string
  language?: string
  groupType?: string
  maxCapacity?: number
}

interface Highlight {
  icon?: string
  title: string
  description?: string
}

interface TourDetail {
  label: string
  value: string
  icon?: string
}

interface ItineraryItem {
  time?: string
  title: string
  description?: string
  tag?: string
  image?: GalleryImage
}

interface FAQ {
  question: string
  answer: string
}

interface Host {
  name: string
  title?: string
  photo?: GalleryImage
  note?: string
}

interface WhyYouWillLove {
  title?: string
  text?: string
}

interface PriceByAge {
  ageKey: string
  ageLabel: string
  minAge?: number
  maxAge?: number
  price: number
}

interface TicketClassImage {
  asset?: { _ref?: string; _type?: string }
  url?: string
  alt?: string
  caption?: string
  metadata?: { lqip?: string; dimensions?: { width: number; height: number } }
}

interface TicketClass {
  key: string
  label: string
  description?: string
  badge?: string
  bullets?: string[]
  classImage?: TicketClassImage
  classImages?: TicketClassImage[]
  pricesByAge?: PriceByAge[]
}

interface SeasonRule {
  name: string
  start: string
  end: string
  multiplier?: number | null
  classAdjustments?: Array<{
    classKey: string
    adultAdjustment?: number | null
    childAdjustment?: number | null
    infantAdjustment?: number | null
  }> | null
}

interface Deposit {
  enabled: boolean
  type?: 'percentage' | 'fixed'
  value?: number
}

interface Extra {
  title: string
  description?: string
  price: number
  priceType?: 'perPerson' | 'total'
  icon?: string
}

interface BookingCard {
  fromText?: string
  ctaText?: string
  urgencyText?: string
  trustBadges?: string[]
}

interface ReviewItem {
  name: string
  title: string
  description: string
  rating?: number
  avatar?: {
    asset?: { _ref?: string; _type?: string }
    url?: string
    metadata?: { lqip?: string; dimensions?: { width: number; height: number } }
  }
}

interface ReviewsSection {
  enabled?: boolean
  reviewCount?: number
  ratingValue?: number
  ratingDots?: number
  sourceLabel?: string
  moreLinkText?: string
  moreLinkUrl?: string
  items?: ReviewItem[]
}

interface FoodMenuItemRaw {
  title?: string
  excerpt?: string
  priceLabel?: string
  metaLine1?: string
  metaLine2?: string
  image?: { asset?: { _ref?: string; _type?: string }; alt?: string | null }
  detail?: PortableTextBlock[] | null
}

interface TourFoodMenuData {
  enabled?: boolean
  sectionTitle?: string | null
  intro?: string | null
  items?: FoodMenuItemRaw[] | null
}

interface TourReelsItem {
  caption?: string
  videoUrl?: string
  poster?: GalleryImage
}

interface TourReelsSectionData {
  enabled?: boolean
  sectionTitle?: string | null
  items?: TourReelsItem[] | null
}

interface TourSeo {
  metaTitle?: string | null
  metaDescription?: string | null
  keywords?: string | null
  noIndex?: boolean | null
  ogImage?: (GalleryImage & { alt?: string | null }) | null
}

interface Tour {
  _id?: string
  title: string
  slug: string
  shortDescription?: string
  seo?: TourSeo | null
  description?: PortableTextBlock[] | null
  mainImage?: GalleryImage
  gallery?: GalleryImage[]
  tourVideo?: TourVideo
  rating?: number
  reviewCount?: number
  ratingLabel?: string
  reviewsUrl?: string
  quickFacts?: QuickFacts
  highlights?: Highlight[]
  tourDetails?: TourDetail[]
  itinerary?: ItineraryItem[]
  included?: string[]
  notIncluded?: string[]
  faqs?: FAQ[]
  host?: Host
  whyYouWillLove?: WhyYouWillLove
  ticketClasses?: TicketClass[]
  seasonRules?: SeasonRule[]
  deposit?: Deposit
  extras?: Extra[]
  bookingCard?: BookingCard
  reviewsSection?: ReviewsSection
  whereSection?: WhereSectionData | null
  pickupPoints?: { name?: string; address?: string; description?: string; isDefault?: boolean }[]
  foodMenu?: TourFoodMenuData | null
  reelsSection?: TourReelsSectionData | null
  _updatedAt?: string
  translations?: unknown
}

const getTour = cache(async function getTour(
  slug: string,
  locale: SiteLocale
): Promise<Tour | null> {
  const raw = await client.fetch<(Tour & { translations?: unknown }) | null>(tourByLocaleSlugQuery, {
    slug,
    locale,
  })
  if (!raw) return null
  const rawRecord = raw as unknown as Record<string, unknown>
  const merged = mergeTourForLocale(rawRecord, locale) as unknown as Tour

  // Editör manuel çeviri girmemişse (translations.en/de boşsa), anlık makine
  // çevirisiyle Türkçe içeriği doldur — Sanity'e hiçbir şey yazılmaz.
  if (locale !== 'tr') {
    const has = (field: string) => tourFieldHasManualTranslation(rawRecord, locale, field)

    const [
      description,
      faqs,
      shortDescription,
      highlights,
      tourDetails,
      itinerary,
      included,
      notIncluded,
      host,
      whyYouWillLove,
      ticketClasses,
      extras,
      bookingCard,
      pickupPoints,
      foodMenu,
      reelsSection,
      reviewsSection,
    ] = await Promise.all([
      has('description') ? merged.description : translatePortableTextBlocks(merged.description, locale),
      has('faqs')
        ? merged.faqs
        : translateArrayFields(merged.faqs, ['question', 'answer'], locale),
      has('shortDescription') ? merged.shortDescription : translateText(merged.shortDescription, locale),
      has('highlights')
        ? merged.highlights
        : translateArrayFields(merged.highlights, ['title', 'description'], locale),
      has('tourDetails')
        ? merged.tourDetails
        : translateArrayFields(merged.tourDetails, ['label', 'value'], locale),
      has('itinerary')
        ? merged.itinerary
        : translateArrayFields(merged.itinerary, ['title', 'description', 'tag'], locale),
      has('included') ? merged.included : translateTextArray(merged.included, locale),
      has('notIncluded') ? merged.notIncluded : translateTextArray(merged.notIncluded, locale),
      has('host') ? merged.host : translateFields(merged.host, ['title', 'note'], locale),
      has('whyYouWillLove')
        ? merged.whyYouWillLove
        : translateFields(merged.whyYouWillLove, ['title', 'text'], locale),
      has('ticketClasses')
        ? merged.ticketClasses
        : Promise.all(
            (merged.ticketClasses ?? []).map(async (tc) => ({
              ...tc,
              label: await translateText(tc.label, locale),
              description: tc.description ? await translateText(tc.description, locale) : tc.description,
              bullets: tc.bullets ? await translateTextArray(tc.bullets, locale) : tc.bullets,
            }))
          ),
      has('extras') ? merged.extras : translateArrayFields(merged.extras, ['title', 'description'], locale),
      has('bookingCard')
        ? merged.bookingCard
        : (async () => {
            const bc = await translateFields(merged.bookingCard, ['fromText', 'ctaText', 'urgencyText'], locale)
            if (!bc) return bc
            return { ...bc, trustBadges: await translateTextArray(bc.trustBadges, locale) }
          })(),
      has('pickupPoints')
        ? merged.pickupPoints
        : translateArrayFields(merged.pickupPoints, ['description'], locale),
      has('foodMenu')
        ? merged.foodMenu
        : (async () => {
            const fm = await translateFields(merged.foodMenu, ['sectionTitle', 'intro'], locale)
            if (!fm) return fm
            return { ...fm, items: await translateArrayFields(fm.items, ['title', 'excerpt'], locale) }
          })(),
      has('reelsSection')
        ? merged.reelsSection
        : (async () => {
            const rs = await translateFields(merged.reelsSection, ['sectionTitle'], locale)
            if (!rs) return rs
            return { ...rs, items: await translateArrayFields(rs.items, ['caption'], locale) }
          })(),
      has('reviewsSection')
        ? merged.reviewsSection
        : (async () => {
            const rv = merged.reviewsSection
            if (!rv) return rv
            return { ...rv, items: await translateArrayFields(rv.items, ['description'], locale) }
          })(),
    ])

    return {
      ...merged,
      description,
      faqs: faqs ?? undefined,
      shortDescription,
      highlights: highlights ?? undefined,
      tourDetails: tourDetails ?? undefined,
      itinerary: itinerary ?? undefined,
      included: included ?? undefined,
      notIncluded: notIncluded ?? undefined,
      host: host ?? undefined,
      whyYouWillLove: whyYouWillLove ?? undefined,
      ticketClasses: ticketClasses ?? undefined,
      extras: extras ?? undefined,
      bookingCard: (bookingCard ?? undefined) as Tour['bookingCard'],
      pickupPoints: pickupPoints ?? undefined,
      foodMenu: foodMenu ?? undefined,
      reelsSection: reelsSection ?? undefined,
      reviewsSection: (reviewsSection ?? undefined) as Tour['reviewsSection'],
    }
  }

  return merged
})

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
    { tSlug?: string | null; enSlug?: string | null; deSlug?: string | null }[]
  >(tourSlugRowsForLocalesQuery)
  const out: { locale: string; slug: string }[] = []
  for (const r of rows ?? []) {
    if (r.tSlug) out.push({ locale: 'tr', slug: r.tSlug })
    if (r.enSlug) out.push({ locale: 'en', slug: r.enSlug })
    if (r.deSlug) out.push({ locale: 'de', slug: r.deSlug })
  }
  return out
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { slug, locale: loc } = await params
  const tourUiMeta = getTourPageUi(isSiteLocale(loc) ? (loc as SiteLocale) : 'tr')
  if (!isSiteLocale(loc)) return { title: tourUiMeta.metaTourNotFoundTitle }
  const locale = loc as SiteLocale
  const tourUi = getTourPageUi(locale)
  const tour = await getTour(slug, locale)
  if (!tour) return { title: tourUi.metaTourNotFoundTitle }

  const metaTitleSource = tour.seo?.metaTitle?.trim() || tour.title
  const title = `${metaTitleSource}${tourUi.metaTitleSuffix}`

  const descSource =
    tour.seo?.metaDescription?.trim() ||
    tour.shortDescription?.trim() ||
    tour.title
  const description =
    descSource.replace(/\s+/g, ' ').slice(0, 160) || tourUi.metaDescriptionFallback(tour.title)

  const url = absoluteUrl(withLocalePath(locale, `/tur/${slug}`))

  const ogImageAsset = tour.seo?.ogImage?.asset ?? tour.mainImage?.asset
  const image =
    ogImageAsset != null ? urlFor(ogImageAsset).width(1200).height(630).url() : undefined
  const ogImageAlt = tour.seo?.ogImage?.alt?.trim() || tour.title

  const keywords = parseMetaKeywords(tour.seo?.keywords)

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    ...(tour.seo?.noIndex ? { robots: { index: false, follow: true as const } } : {}),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
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

function buildGalleryHeroImages(tour: Tour, tourUi: ReturnType<typeof getTourPageUi>): TourGalleryImage[] {
  const main = tour.mainImage?.asset ? [tour.mainImage] : []
  const gallery = tour.gallery ?? []
  const all = [...main, ...gallery].filter(
    (img): img is GalleryImage => Boolean(img?.asset)
  )
  return all.map((img, i) => ({
    src: tourGalleryHeroImageUrl(img.asset) ?? '',
    blurDataURL: img.metadata?.lqip ?? null,
    alt: tourUi.galleryImageAlt(tour.title, i),
  })).filter((row) => row.src.length > 0)
}

function buildItineraryTimelineItems(tour: Tour): ItineraryTimelineItem[] {
  if (!tour.itinerary?.length) return []
  return tour.itinerary
    .filter((item) => item.image?.asset && item.title)
    .map((item) => ({
      title: item.title,
      description: item.description ?? null,
      time: item.time ?? null,
      tag: item.tag ?? null,
      imageUrl: item.image?.asset
        ? urlFor(item.image.asset).width(500).height(630).url()
        : null,
      imageBlurDataURL: item.image?.metadata?.lqip ?? null,
    }))
}

function getVideoEmbedUrl(video: TourVideo): string | null {
  if (!video.enabled || !video.type) return null
  if (video.type === 'youtube' && video.youtubeUrl) {
    const youtubeId = video.youtubeUrl.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    )?.[1]
    return youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : null
  }
  if (video.type === 'vimeo' && video.vimeoUrl) {
    const vimeoId = video.vimeoUrl.match(/(?:vimeo\.com\/)(\d+)/)?.[1]
    return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null
  }
  return null
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
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: tourUi.breadcrumbHome, url: withLocalePath(locale, '/') },
    { name: tourUi.breadcrumbTours, url: withLocalePath(locale, '/turlar') },
    { name: tour.title, url: tourPath },
  ])
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
      <div className="container mx-auto px-4 pt-12 pb-16 max-w-[1360px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <main className="flex-1 min-w-0">
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

        <HighlightsDetailsRow
          highlights={tour.highlights}
          tourDetails={tour.tourDetails}
          quickFacts={tour.quickFacts}
          tourUi={tourUi}
        />

        <ItineraryTimeline items={itineraryTimelineItems} sectionTitle={tourUi.itineraryTitle} locale={locale} />

        <PoseidonSecure locale={locale} layout="contained" />

        {reelsSlides.length > 0 ? (
          <TourReelsRail slides={reelsSlides} locale={locale} />
        ) : null}

        <TourDescription description={tour.description} locale={locale} />

        {/* Video Section */}
        {tour.tourVideo?.enabled && (
          <div className="mb-8">
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
          </div>
        )}

        <IncludedNotIncluded included={tour.included} notIncluded={tour.notIncluded} tourUi={tourUi} />

        <HostBlock host={tour.host} whyYouWillLove={tour.whyYouWillLove} tourUi={tourUi} />

        <div className="mb-14">
          <FAQAccordion faqs={tour.faqs} locale={locale} whatsappUrl={whatsappUrl} />
        </div>

        <div className="mt-14 mb-14">
          <WhereSection
            data={tour.whereSection}
            headingFallback={tourUi.whereHeadingFallback}
            locale={locale}
          />
        </div>

        <div className="mt-14">
          <ReviewsSection reviewsUrl={tour.reviewsUrl} reviewsSection={tour.reviewsSection} tourUi={tourUi} />
        </div>

          </main>
          <TourBookingSidebar
            tour={tour as TourForBooking}
            ticketClasses={tour.ticketClasses}
            bookingCard={tour.bookingCard}
            rezervasyonHref={rezervasyonHref}
            locale={locale}
          />
        </div>
      </div>
    </div>
  )
}
