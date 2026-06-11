import type { PortableTextBlock } from '@portabletext/react'

export type SanityYachtCardRow = {
  _id: string
  name?: string | null
  slug?: string | null
  shortDescription?: string | null
  locationTitle?: string | null
  locationSlug?: string | null
  marina?: string | null
  priceFrom?: number | null
  overnightTotalPrice?: number | null
  overnightNightPricing?: { price?: number | null }[] | null
  currency?: string | null
  dailyRentalEnabled?: boolean | null
  overnightRentalEnabled?: boolean | null
  yachtType?: string | null
  badges?: string[] | null
  included?: string[] | null
  sailingLicenceRequired?: string | null
  isFeatured?: boolean | null
  isActive?: boolean | null
  specifications?: YachtSpecifications | null
  mainImage?: YachtGalleryImage | null
}

export interface YachtGalleryImage {
  asset?: { _ref?: string; _type?: string }
  alt?: string | null
  url?: string
  metadata?: {
    lqip?: string
    dimensions?: { width: number; height: number }
  }
}

export interface YachtInquiryCard {
  title?: string
  ctaText?: string
  trustBadges?: string[]
  noteTitle?: string
  noteSubtitle?: string
  urgencyLine1?: string
  urgencyLine2?: string
  responseTimeLabel?: string
  popularityLabel?: string
}

export interface YachtSpecifications {
  buildYear?: number
  capacity?: number
  cabins?: number
  wc?: string
  length?: string
  crew?: string
  engine?: string
}

export interface YachtTechnicalRow {
  label?: string
  value?: string
}

export interface YachtSeo {
  title?: string
  description?: string
  ogImage?: YachtGalleryImage
}

/** Sanity’dan gelen ham yat belgesi (fetch sonrası) */
export interface YachtRentalDocument {
  _id?: string
  name: string
  slug: string
  shortDescription?: string
  fullDescription?: PortableTextBlock[] | null
  marina?: string
  departurePoint?: string
  yachtType?: string
  priceFrom?: number
  currency?: string
  mainImage?: YachtGalleryImage
  gallery?: YachtGalleryImage[]
  amenities?: string[]
  included?: string[]
  notIncluded?: string[]
  specifications?: YachtSpecifications | null
  technicalSpecs?: YachtTechnicalRow[]
  badges?: string[]
  showHeroPopular?: boolean
  showHeroTopRated?: boolean
  valueProposition?: string[]
  trustRating?: number
  trustReviewsLabel?: string
  trustYearsExperience?: number
  trustFleetLine?: string
  /** YYYY-MM-DD — her iki modda da, moda özel liste yoksa kullanılır */
  blockedDates?: string[]
  /** Günlük takvim; doluysa günlük modda sadece bu günler engelli sayılır */
  blockedDatesDaily?: string[]
  /** Konaklamalı takvim; doluysa bu modda sadece bu günler engelli */
  blockedDatesOvernight?: string[]
  /** Sanity: false değilse günlük kiralama sunulur (varsayılan: açık) */
  dailyRentalEnabled?: boolean
  /** Sanity: true ise konaklamalı / tarih aralığı sunulur */
  overnightRentalEnabled?: boolean
  /** Konaklamalı toplam referans (takvim yoksa); GROQ: coalesce(overnightTotalPrice, overnightPriceFrom) */
  overnightTotalPrice?: number
  /** Günlük mod — güne özel fiyat satırları */
  dailyDatePricing?: { date?: string | null; price?: number | null }[]
  /** Konaklamalı — gece başına satırlar */
  overnightNightPricing?: { date?: string | null; price?: number | null }[]
  inquiryCard?: YachtInquiryCard
  routeSuggestions?: string[]
  relatedTours?: { title?: string; slug?: string | null }[]
  relatedYachts?: (SanityYachtCardRow | null)[] | null
  termsAndNotes?: string
  cancellationPaymentPolicies?: PortableTextBlock[] | null
  cancellationCheckPriceLabel?: string | null
  cancellationCheckPriceUrl?: string | null
  sailingLicenceRequired?: string | null
  petsPolicy?: string | null
  paymentMethodsAccepted?: string[]
  marinaInformation?: PortableTextBlock[] | null
  faqs?: { question?: string; answer?: PortableTextBlock[] }[]
  isFeatured?: boolean
  isActive?: boolean
  seo?: YachtSeo | null
  locationTitle?: string | null
  locationSlug?: string | null
}

export interface YachtLocationDocument {
  _id?: string
  title?: string
  slug?: string | null
  intro?: string
}

export const YACHT_TYPE_LABELS: Record<string, string> = {
  gulet: 'Gulet',
  motoryacht: 'Motoryat',
  sailing: 'Yelkenli',
  catamaran: 'Katamaran',
  other: 'Yat',
}

export function yachtTypeLabel(type?: string | null): string {
  if (!type) return 'Yat'
  return YACHT_TYPE_LABELS[type] ?? type
}
