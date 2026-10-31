import { cache } from 'react'
import type { PortableTextBlock } from '@portabletext/react'
import { client, urlFor } from '@/lib/sanity'
import { tourGalleryHeroImageUrl } from '@/lib/sanityImage'
import { tourByLocaleSlugQuery } from '@/lib/queries'
import { applySinglePriceMode } from '@/lib/sanity/singlePrice'
import { mergeTourForLocale, tourFieldHasManualTranslation } from '@/lib/i18n/mergeTourForLocale'
import {
  translateText,
  translatePortableTextBlocks,
  translateTextArray,
  translateFields,
  translateArrayFields,
} from '@/lib/i18n/runtimeTranslate'
import type { SiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import { type TourGalleryImage } from '@/components/TourGalleryHero'
import type { ItineraryTimelineItem } from '@/components/ItineraryTimeline'
import type { WhereSectionData } from '@/components/tour/WhereSection'

/** Tur detay sayfası ve rezervasyon sayfasının ortak veri katmanı — ikisi de aynı
 * zengin tur içeriğini (galeri, açıklama, SSS, yorumlar vb.) gösterdiği için tek
 * yerden fetch edilir; sadece sayfa düzeni/CTA'sı farklıdır. */

export interface TourVideo {
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

/** "Tekneniz" bölümü — tura bağlı tekne dokümanından gelir (boat.ts). */
export interface TourBoatImage {
  url?: string | null
  alt?: string | null
  metadata?: { lqip?: string }
}

export interface TourBoat {
  name?: string | null
  coverImage?: TourBoatImage | null
  gallery?: TourBoatImage[] | null
  amenities?: string[] | null
  specs?: {
    buildYear?: number | null
    capacity?: number | null
    cabins?: number | null
    wc?: number | null
    length?: string | null
    crew?: number | null
  } | null
}

export interface GalleryImage {
  asset?: { _ref?: string; _type?: string }
  url?: string
  metadata?: {
    lqip?: string
    dimensions?: { width: number; height: number }
  }
}

export interface QuickFacts {
  durationText?: string
  availabilityText?: string
  meetingLocation?: string
  startTime?: string
  returnTime?: string
  language?: string
  groupType?: string
  maxCapacity?: number
}

export interface Highlight {
  icon?: string
  title: string
  description?: string
}

export interface TourDetail {
  label: string
  value: string
  icon?: string
}

export interface ItineraryItem {
  time?: string
  title: string
  description?: string
  tag?: string
  image?: GalleryImage
}

export interface FAQ {
  question: string
  answer: string
}

export interface Host {
  name: string
  title?: string
  photo?: GalleryImage
  note?: string
}

export interface WhyYouWillLove {
  title?: string
  text?: string
}

export interface PriceByAge {
  ageKey: string
  ageLabel: string
  minAge?: number
  maxAge?: number
  price: number
}

export interface TicketClassImage {
  asset?: { _ref?: string; _type?: string }
  url?: string
  alt?: string
  caption?: string
  metadata?: { lqip?: string; dimensions?: { width: number; height: number } }
}

export interface TicketClass {
  key: string
  label: string
  description?: string
  badge?: string
  bullets?: string[]
  classImage?: TicketClassImage
  classImages?: TicketClassImage[]
  pricesByAge?: PriceByAge[]
}

export interface SeasonRule {
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

export interface Deposit {
  enabled: boolean
  type?: 'percentage' | 'fixed'
  value?: number
}

export interface Extra {
  title: string
  description?: string
  price: number
  priceType?: 'perPerson' | 'total'
  icon?: string
}

export interface BookingCard {
  fromText?: string
  ctaText?: string
  urgencyText?: string
  trustBadges?: string[]
}

export interface ReviewItem {
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

export interface ReviewsSectionData {
  enabled?: boolean
  reviewCount?: number
  ratingValue?: number
  ratingDots?: number
  sourceLabel?: string
  moreLinkText?: string
  moreLinkUrl?: string
  items?: ReviewItem[]
}

export interface FoodMenuItemRaw {
  title?: string
  excerpt?: string
  priceLabel?: string
  metaLine1?: string
  metaLine2?: string
  image?: { asset?: { _ref?: string; _type?: string }; alt?: string | null }
  detail?: PortableTextBlock[] | null
}

export interface TourFoodMenuData {
  enabled?: boolean
  sectionTitle?: string | null
  intro?: string | null
  items?: FoodMenuItemRaw[] | null
}

export interface TourReelsItem {
  caption?: string
  videoUrl?: string
  poster?: GalleryImage
}

export interface TourReelsSectionData {
  enabled?: boolean
  sectionTitle?: string | null
  items?: TourReelsItem[] | null
}

export interface TourSeo {
  metaTitle?: string | null
  metaDescription?: string | null
  keywords?: string | null
  noIndex?: boolean | null
  ogImage?: (GalleryImage & { alt?: string | null }) | null
}

export interface Tour {
  _id?: string
  title: string
  slug: string
  /** hreflang alternates için — her dilin kendi slug'u (bkz. lib/queries.ts). */
  localeSlugs?: { tr?: string | null; en?: string | null; de?: string | null; ru?: string | null }
  /** Sanity'de "popüler" işaretli mi — kart rozetini ve "talepler yoğun"
      uyarısını sürer. */
  isPopular?: boolean | null
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
  boat?: TourBoat | null
  whyYouWillLove?: WhyYouWillLove
  ticketClasses?: TicketClass[]
  /** Tek fiyat: sınıf seçimi yok; ticketClasses yalnızca ilk sınıfı içerir. */
  singlePrice?: boolean | null
  seasonRules?: SeasonRule[]
  deposit?: Deposit
  extras?: Extra[]
  bookingCard?: BookingCard
  reviewsSection?: ReviewsSectionData
  whereSection?: WhereSectionData | null
  pickupPoints?: { name?: string; address?: string; description?: string; isDefault?: boolean }[]
  foodMenu?: TourFoodMenuData | null
  reelsSection?: TourReelsSectionData | null
  _updatedAt?: string
  translations?: unknown
}

export const getTour = cache(async function getTour(
  slug: string,
  locale: SiteLocale
): Promise<Tour | null> {
  const raw = await client.fetch<(Tour & { translations?: unknown }) | null>(tourByLocaleSlugQuery, {
    slug,
    locale,
  })
  if (!raw) return null
  const rawRecord = raw as unknown as Record<string, unknown>
  // Tek fiyat turlarında yalnızca ilk bilet sınıfı kalır (fiyat/kapasite gösterimleri buna göre).
  const merged = applySinglePriceMode(mergeTourForLocale(rawRecord, locale) as unknown as Tour)

  // Editör manuel çeviri girmemişse (translations.en/de boşsa), anlık makine
  // çevirisiyle Türkçe içeriği doldur — Sanity'e hiçbir şey yazılmaz.
  if (locale !== 'tr') {
    const has = (field: string) => tourFieldHasManualTranslation(rawRecord, locale, field)
    const rawTranslationsPatch = rawRecord.translations as Record<string, unknown> | undefined
    const rawLocalePatch = (
      locale === 'en' ? rawTranslationsPatch?.en : locale === 'de' ? rawTranslationsPatch?.de : rawTranslationsPatch?.ru
    ) as Record<string, unknown> | undefined
    const rawSeoPatch = rawLocalePatch?.seo as { metaTitle?: string; metaDescription?: string } | undefined
    const hasManualSeoTitle = !!rawSeoPatch?.metaTitle?.trim()
    const hasManualSeoDescription = !!rawSeoPatch?.metaDescription?.trim()

    const [
      title,
      seoMetaTitle,
      seoMetaDescription,
      quickFacts,
      description,
      faqs,
      shortDescription,
      highlights,
      tourDetails,
      itinerary,
      included,
      notIncluded,
      boatAmenities,
      host,
      whyYouWillLove,
      ticketClasses,
      extras,
      bookingCard,
      pickupPoints,
      foodMenu,
      reelsSection,
      reviewsSection,
      whereSection,
    ] = await Promise.all([
      has('title') ? merged.title : translateText(merged.title, locale),
      hasManualSeoTitle ? merged.seo?.metaTitle : translateText(merged.seo?.metaTitle, locale),
      hasManualSeoDescription ? merged.seo?.metaDescription : translateText(merged.seo?.metaDescription, locale),
      has('quickFacts')
        ? merged.quickFacts
        : (async () => {
            const qf = merged.quickFacts
            if (!qf) return qf
            const [durationText, availabilityText, meetingLocation, language, groupType] = await Promise.all([
              translateText(qf.durationText, locale),
              translateText(qf.availabilityText, locale),
              translateText(qf.meetingLocation, locale),
              translateText(qf.language, locale),
              translateText(qf.groupType, locale),
            ])
            return {
              ...qf,
              durationText: durationText || qf.durationText,
              availabilityText: availabilityText || qf.availabilityText,
              meetingLocation: meetingLocation || qf.meetingLocation,
              language: language || qf.language,
              groupType: groupType || qf.groupType,
            }
          })(),
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
      /* Tekne ayrı bir doküman olduğu için tur çeviri overlay'inde yer almıyor;
         yalnızca olanak maddeleri çevriliyor (tekne adı ve sayısal özellikler
         zaten dilden bağımsız). */
      translateTextArray(merged.boat?.amenities ?? undefined, locale),
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
              badge: tc.badge ? await translateText(tc.badge, locale) : tc.badge,
              bullets: tc.bullets ? await translateTextArray(tc.bullets, locale) : tc.bullets,
              pricesByAge: tc.pricesByAge
                ? await Promise.all(
                    tc.pricesByAge.map(async (pa) => ({
                      ...pa,
                      ageLabel: (await translateText(pa.ageLabel, locale)) || pa.ageLabel,
                    }))
                  )
                : tc.pricesByAge,
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
      has('whereSection')
        ? merged.whereSection
        : translateFields(merged.whereSection, ['heading', 'meetingPointLabel', 'openInMapsLabel'], locale),
    ])

    return {
      ...merged,
      title: title || merged.title,
      seo: merged.seo
        ? {
            ...merged.seo,
            metaTitle: seoMetaTitle || merged.seo.metaTitle,
            metaDescription: seoMetaDescription || merged.seo.metaDescription,
          }
        : merged.seo,
      quickFacts: quickFacts ?? merged.quickFacts,
      description,
      faqs: faqs ?? undefined,
      shortDescription,
      highlights: highlights ?? undefined,
      tourDetails: tourDetails ?? undefined,
      itinerary: itinerary ?? undefined,
      included: included ?? undefined,
      notIncluded: notIncluded ?? undefined,
      host: host ?? undefined,
      boat: merged.boat
        ? { ...merged.boat, amenities: boatAmenities ?? merged.boat.amenities }
        : merged.boat,
      whyYouWillLove: whyYouWillLove ?? undefined,
      ticketClasses: ticketClasses ?? undefined,
      extras: extras ?? undefined,
      bookingCard: (bookingCard ?? undefined) as Tour['bookingCard'],
      pickupPoints: pickupPoints ?? undefined,
      foodMenu: foodMenu ?? undefined,
      reelsSection: reelsSection ?? undefined,
      reviewsSection: (reviewsSection ?? undefined) as Tour['reviewsSection'],
      whereSection: whereSection ?? undefined,
    }
  }

  return merged
})

export function buildGalleryHeroImages(tour: Tour, tourUi: ReturnType<typeof getTourPageUi>): TourGalleryImage[] {
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

export function buildItineraryTimelineItems(tour: Tour): ItineraryTimelineItem[] {
  if (!tour.itinerary?.length) return []
  return tour.itinerary
    .filter((item) => item.image?.asset && item.title)
    .map((item) => ({
      title: item.title,
      description: item.description ?? null,
      time: item.time ?? null,
      tag: item.tag ?? null,
      imageUrl: item.image?.asset
        ? urlFor(item.image.asset).width(500).height(630).auto('format').url()
        : null,
      imageBlurDataURL: item.image?.metadata?.lqip ?? null,
    }))
}

export function getVideoEmbedUrl(video: TourVideo): string | null {
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
