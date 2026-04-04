import { cache } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { PortableTextBlock } from '@portabletext/react'
import type { Metadata } from 'next'
import { client, urlFor } from '@/lib/sanity'
import { tourBySlugQuery, tourSlugsQuery } from '@/lib/queries'
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
import TourFoodMenu from '@/components/tour/TourFoodMenu'
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

interface TicketClass {
  key: string
  label: string
  description?: string
  badge?: string
  pricesByAge?: PriceByAge[]
}

interface SeasonRule {
  name: string
  start: string
  end: string
  multiplier: number
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

interface Tour {
  _id?: string
  title: string
  slug: string
  shortDescription?: string
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
  _updatedAt?: string
}

const getTour = cache(async function getTour(slug: string): Promise<Tour | null> {
  const tour = await client.fetch<Tour | null>(tourBySlugQuery, { slug })
  return tour
})

export const revalidate = 3600 // ISR: tur sayfaları en fazla 1 saat sonra güncellenir

/** Yayımlanmış turların slug'ları — 404 önlemek için sayfaların build/ISR'da bilinmesi gerekir */
export async function generateStaticParams() {
  if (process.env.NODE_ENV === 'development') {
    // Dev'de static-path worker kaynaklı chunk bozulmalarını önlemek için kapalı.
    return []
  }
  const list = await client.fetch<{ slug: string | null }[]>(tourSlugsQuery)
  return (list ?? []).map((t) => ({ slug: t.slug })).filter((p): p is { slug: string } => Boolean(p.slug))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const tour = await getTour(slug)
  if (!tour) return { title: 'Tur bulunamadı' }
  const title = `${tour.title} | Çeşme Tekne Turu`
  const description =
    (tour.shortDescription ?? tour.title).replace(/\s+/g, ' ').slice(0, 160) ||
    `Çeşme tekne turu: ${tour.title}. Rezervasyon yapın.`
  const url = absoluteUrl(`/tour/${slug}`)
  const image =
    tour.mainImage?.asset != null
      ? urlFor(tour.mainImage.asset).width(1200).height(630).url()
      : undefined
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: image ? [{ url: image, width: 1200, height: 630, alt: tour.title }] : undefined,
    },
  }
}

function buildGalleryHeroImages(tour: Tour): TourGalleryImage[] {
  const main = tour.mainImage?.asset ? [tour.mainImage] : []
  const gallery = tour.gallery ?? []
  const all = [...main, ...gallery].filter(
    (img): img is GalleryImage => Boolean(img?.asset)
  )
  return all.map((img, i) => ({
    src: urlFor(img.asset!).width(1200).url(),
    blurDataURL: img.metadata?.lqip ?? null,
    alt: `${tour.title} - Görsel ${i + 1}`,
  }))
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
        ? urlFor(item.image.asset).width(500).height(500).url()
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
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tour = await getTour(slug)

  if (!tour) {
    notFound()
  }

  const videoEmbedUrl = tour.tourVideo ? getVideoEmbedUrl(tour.tourVideo) : null
  const galleryHeroImages = buildGalleryHeroImages(tour)
  const itineraryTimelineItems = buildItineraryTimelineItems(tour)

  const tourUrl = absoluteUrl(`/tour/${slug}`)
  const tourImage =
    tour.mainImage?.asset != null
      ? urlFor(tour.mainImage.asset).width(1200).height(630).url()
      : undefined
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Ana Sayfa', url: '/' },
    { name: 'Turlar', url: '/turlar' },
    { name: tour.title, url: `/tour/${slug}` },
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
    description: tour.shortDescription ?? undefined,
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
          />
        </div>
      )}
      <div className="container mx-auto px-4 py-16 max-w-[1360px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <main className="flex-1 min-w-0">
            <span id="reviews" className="block scroll-mt-24" aria-hidden />
            <TourHeader
          title={tour.title}
          ratingLabel={tour.ratingLabel}
          ratingDots={5}
          reviewCount={tour.reviewCount}
          reviewsUrl={tour.reviewsUrl}
          durationText={tour.quickFacts?.durationText}
          meetingLocation={tour.quickFacts?.meetingLocation}
        />

        <HighlightsDetailsRow
          highlights={tour.highlights}
          tourDetails={tour.tourDetails}
          quickFacts={tour.quickFacts}
        />

        <ItineraryTimeline items={itineraryTimelineItems} />

        <TourDescription description={tour.description} />

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
                  Tarayıcınız video etiketini desteklemiyor.
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

        <IncludedNotIncluded
          included={tour.included}
          notIncluded={tour.notIncluded}
        />

        {tour.foodMenu?.enabled &&
        tour.foodMenu.items &&
        tour.foodMenu.items.filter((i) => i?.title?.trim()).length > 0 ? (
          <TourFoodMenu
            sectionTitle={tour.foodMenu.sectionTitle?.trim() || 'Yemek menüsü'}
            intro={tour.foodMenu.intro?.trim() || null}
            items={tour.foodMenu.items
              .filter((i) => i?.title?.trim())
              .map((i) => ({
                title: i.title!.trim(),
                excerpt: i.excerpt?.trim() || null,
                priceLabel: i.priceLabel?.trim() || null,
                metaLine1: i.metaLine1?.trim() || null,
                metaLine2: i.metaLine2?.trim() || null,
                imageUrl: i.image?.asset
                  ? urlFor(i.image.asset).width(960).height(720).url()
                  : null,
                imageAlt: i.image?.alt?.trim() || i.title!.trim(),
                detail: i.detail?.length ? i.detail : null,
              }))}
          />
        ) : null}

        {/* Extras */}
        {tour.extras && tour.extras.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: '#1e3a5f' }}>
              Ekstra Hizmetler
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tour.extras.map((extra, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {extra.icon && (
                        <span className="text-2xl mb-2 block">
                          {extra.icon}
                        </span>
                      )}
                      <h3 className="text-lg font-semibold mb-2 text-black dark:text-zinc-50">
                        {extra.title}
                      </h3>
                      {extra.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                          {extra.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-black dark:text-zinc-50">
                        {extra.price} ₺
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        {extra.priceType === 'perPerson'
                          ? 'Kişi başı'
                          : 'Toplam'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <HostBlock host={tour.host} whyYouWillLove={tour.whyYouWillLove} />

        <div className="mb-14">
          <FAQAccordion faqs={tour.faqs} />
        </div>

        <div className="mt-14 mb-14">
          <WhereSection data={tour.whereSection} />
        </div>

        <div className="mt-14">
          <ReviewsSection
            reviewsUrl={tour.reviewsUrl}
            reviewsSection={tour.reviewsSection}
          />
        </div>

          </main>
          <TourBookingSidebar
            tour={tour as TourForBooking}
            ticketClasses={tour.ticketClasses}
            bookingCard={tour.bookingCard}
          />
        </div>
      </div>
    </div>
  )
}
