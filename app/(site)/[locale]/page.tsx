import { client, safeSanityImageUrl, urlFor } from '@/lib/sanity'
import { tourCoverImageUrl } from '@/lib/sanityImage'
import {
  covesListQuery,
  faqPageQuery,
  homePageHeroImageUrlsQuery,
  homePageHeroQuery,
  homeReviewsQuery,
  siteFooterInstagramQuery,
  siteSettingsTravelAgencyImagesQuery,
} from '@/lib/queries'
import HomeReviewsSection, { type HomeReviewsSectionData, type HomeReviewItem } from '@/components/home/HomeReviewsSection'
import HomeFaqSection, { type HomeFaqItem } from '@/components/home/HomeFaqSection'
import HeroBanner from '@/components/home/HeroBanner'
import FeatureBar from '@/components/home/FeatureBar'
import PopularToursSection from '@/components/home/PopularToursSection'
import PopularYachtsSection from '@/components/home/PopularYachtsSection'
import HomeClassesSection, { type HomeClassesSectionData } from '@/components/home/HomeClassesSection'
import type { TourClassItem } from '@/components/tour/TourClassShowcase'
import type { HomePopularYachtCardData } from '@/components/home/HomePopularYachtCard'
import AboutTeaserSplit from '@/components/home/AboutTeaserSplit'
import type { HeroData } from '@/components/home/HeroBanner'
import type { FeatureBarItem } from '@/components/home/FeatureBar'
import type { PopularToursSectionData } from '@/components/home/PopularToursSection'
import type { PopularYachtsSectionData } from '@/components/home/PopularYachtsSection'
import BlogSection from '@/components/home/BlogSection'
import RouteSection from '@/components/home/RouteSection'
import PoseidonSecure from '@/components/tour/PoseidonSecure'
import Image from 'next/image'
import InstagramSection from '@/components/home/InstagramSection'
import type { AboutTeaserData } from '@/components/home/AboutTeaserSplit'
import type { BlogSectionData } from '@/components/home/BlogSection'
import type { InstagramSectionData } from '@/components/home/InstagramSection'
import type { RouteSectionLocation } from '@/components/home/RouteSection'
import type { TourListItem } from '@/components/tours/TourCard'
import JsonLd from '@/components/seo/JsonLd'
import ScrollReveal from '@/components/ui/ScrollReveal'
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  getBaseUrl,
  getSiteName,
} from '@/lib/seo'
import { alternateLanguageAbsoluteUrls } from '@/lib/seo/alternateLanguages'
import {
  buildTravelAgencyStructuredData,
  type TravelAgencyStructuredDataImageOverrides,
} from '@/lib/seo/travelAgencyStructuredData'
import { travelAgencyImageOverridesFromSanity } from '@/lib/seo/travelAgencySanityImages'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { mergeTourForLocale, tourFieldHasManualTranslation } from '@/lib/i18n/mergeTourForLocale'
import { mergeBlogForLocale } from '@/lib/i18n/mergeBlogForLocale'
import { mergeCoveForLocale } from '@/lib/i18n/mergeCoveForLocale'
import { mergeHomePageLocale, mergeHomePageSeoForLocale, homeFieldHasManualTranslation } from '@/lib/i18n/mergeHomePageLocale'
import { getBlogPageUiStrings } from '@/lib/i18n/strings/blogPage'
import {
  translateText,
  translateTextArray,
  translatePortableTextBlocks,
} from '@/lib/i18n/runtimeTranslate'

export const dynamic = 'force-dynamic'

const siteName = getSiteName()
const DEFAULT_HOME_TITLE: Record<SiteLocale, string> = {
  tr: siteName ? `Tekne Turu | Adalar ve Koylar – ${siteName}` : 'Tekne Turu | Adalar ve Koylar',
  en: siteName ? `Boat Tour | Islands and Bays – ${siteName}` : 'Boat Tour | Islands and Bays',
  de: siteName ? `Bootstour | Inseln und Buchten – ${siteName}` : 'Bootstour | Inseln und Buchten',
  ru: siteName ? `Морская прогулка | Острова и бухты – ${siteName}` : 'Морская прогулка | Острова и бухты',
}
const DEFAULT_HOME_DESCRIPTION: Record<SiteLocale, string> = {
  tr: 'Tekne turu rezervasyonu. Adalar ve koylar turu, BBQ turları, günlük turlar. Online rezervasyon.',
  en: 'Boat tour booking. Islands and bays tour, BBQ tours, daily tours. Book online.',
  de: 'Bootstour-Buchung. Insel- und Buchtentour, BBQ-Touren, Tagestouren. Online buchen.',
  ru: 'Бронирование морской прогулки. Тур по островам и бухтам, BBQ-туры, однодневные туры. Онлайн-бронирование.',
}

const OG_LOCALE: Record<SiteLocale, string> = {
  tr: 'tr_TR',
  en: 'en_US',
  de: 'de_DE',
  ru: 'ru_RU',
}

function parseMetaKeywords(raw?: string | null): string[] | undefined {
  if (!raw?.trim()) return undefined
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean)
  return parts.length ? parts : undefined
}

type HomePageSeoPayload = {
  metaTitle?: string | null
  metaDescription?: string | null
  metaKeywords?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  ogImage?: { asset?: unknown; alt?: string | null } | null
}

const homePageMetaQuery = `*[_type == "homePage"][0]{
  seo{
    metaTitle,
    metaDescription,
    metaKeywords,
    ogTitle,
    ogDescription,
    ogImage{
      asset,
      alt
    }
  },
  pageTranslations,
  "heroOgFallback": hero.heroImage{
    asset,
    alt
  }
}`

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: loc } = await params
  const locale = isSiteLocale(loc) ? (loc as SiteLocale) : 'tr'
  const homePath = withLocalePath(locale, '/')
  const canonicalBase = homePath === '/' ? getBaseUrl() : `${getBaseUrl()}${homePath}`
  const ogPipe = (b: ReturnType<typeof urlFor>) => b.width(1200).height(630).fit('crop')

  try {
    const row = await client.fetch<{
      seo?: HomePageSeoPayload | null
      pageTranslations?: { en?: Record<string, unknown>; de?: Record<string, unknown>; ru?: Record<string, unknown> }
      heroOgFallback?: { asset?: unknown; alt?: string | null } | null
    } | null>(homePageMetaQuery, {}, { useCdn: false })

    const seo = mergeHomePageSeoForLocale(
      row?.seo as Record<string, unknown> | undefined,
      row?.pageTranslations,
      locale
    ) as HomePageSeoPayload | null | undefined

    // Editör pageTranslations.en/.de.seo'ya elle çeviri girmemişse anlık çeviriyle doldur.
    const patchSeo = (
      locale === 'en'
        ? row?.pageTranslations?.en?.seo
        : locale === 'de'
          ? row?.pageTranslations?.de?.seo
          : row?.pageTranslations?.ru?.seo
    ) as { metaTitle?: string; metaDescription?: string } | undefined
    const hasManualMetaTitle = !!patchSeo?.metaTitle?.trim()
    const hasManualMetaDescription = !!patchSeo?.metaDescription?.trim()
    const [translatedMetaTitle, translatedMetaDescription] =
      locale === 'tr'
        ? [seo?.metaTitle, seo?.metaDescription]
        : await Promise.all([
            !hasManualMetaTitle && seo?.metaTitle?.trim()
              ? translateText(seo.metaTitle, locale)
              : seo?.metaTitle,
            !hasManualMetaDescription && seo?.metaDescription?.trim()
              ? translateText(seo.metaDescription, locale)
              : seo?.metaDescription,
          ])

    const rawMetaTitle = translatedMetaTitle?.trim() || DEFAULT_HOME_TITLE[locale]
    const pageTitle =
      rawMetaTitle.includes('|') ? rawMetaTitle : siteName ? `${rawMetaTitle} | ${siteName}` : rawMetaTitle

    const rawDescription = translatedMetaDescription?.trim() || DEFAULT_HOME_DESCRIPTION[locale]
    const description = rawDescription.slice(0, 165)

    const ogTitle = (seo?.ogTitle?.trim() || pageTitle).slice(0, 90)
    const ogDescription = (seo?.ogDescription?.trim() || rawDescription).slice(0, 200)

    const ogFromSeo = safeSanityImageUrl(seo?.ogImage ?? undefined, ogPipe)
    const ogFromHero = safeSanityImageUrl(row?.heroOgFallback ?? undefined, ogPipe)
    const ogImageUrl = ogFromSeo ?? ogFromHero

    const homeLabel = locale === 'en' ? 'Home' : locale === 'de' ? 'Startseite' : 'Ana sayfa'
    const ogImageAlt =
      seo?.ogImage?.alt?.trim() ||
      row?.heroOgFallback?.alt?.trim() ||
      (siteName ? `${siteName} — ${homeLabel.toLowerCase()}` : homeLabel)

    const keywords = parseMetaKeywords(seo?.metaKeywords)

    return {
      title: pageTitle,
      description,
      ...(keywords?.length ? { keywords } : {}),
      alternates: {
        canonical: canonicalBase,
        languages: alternateLanguageAbsoluteUrls('/'),
      },
      openGraph: {
        type: 'website',
        locale: OG_LOCALE[locale],
        ...(siteName ? { siteName } : {}),
        title: ogTitle,
        description: ogDescription,
        url: canonicalBase,
        ...(ogImageUrl
          ? {
              images: [
                {
                  url: ogImageUrl,
                  width: 1200,
                  height: 630,
                  alt: ogImageAlt,
                },
              ],
            }
          : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitle,
        description: ogDescription,
        ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
      },
    }
  } catch {
    return {
      title: DEFAULT_HOME_TITLE[locale],
      description: DEFAULT_HOME_DESCRIPTION[locale],
      alternates: {
        canonical: canonicalBase,
        languages: alternateLanguageAbsoluteUrls('/'),
      },
      openGraph: {
        type: 'website',
        locale: OG_LOCALE[locale],
        ...(siteName ? { siteName } : {}),
        title: DEFAULT_HOME_TITLE[locale],
        description: DEFAULT_HOME_DESCRIPTION[locale],
        url: canonicalBase,
      },
      twitter: {
        card: 'summary_large_image',
        title: DEFAULT_HOME_TITLE[locale],
        description: DEFAULT_HOME_DESCRIPTION[locale],
      },
    }
  }
}

type PopularYachtsSectionRaw = {
  enabled?: boolean | null
  title?: string | null
  subtitle?: string | null
  ctaButton?: { label?: string | null; href?: string | null } | null
  items?: Array<{
    _id: string
    name?: string | null
    slug?: string | null
    isActive?: boolean | null
    yachtType?: string | null
    isFeatured?: boolean | null
    badges?: string[] | null
    included?: string[] | null
    sailingLicenceRequired?: string | null
    priceFrom?: number | null
    overnightTotalPrice?: number | null
    overnightNightPricing?: { price?: number | null }[] | null
    currency?: string | null
    dailyRentalEnabled?: boolean | null
    overnightRentalEnabled?: boolean | null
    marina?: string | null
    locationTitle?: string | null
    locationSlug?: string | null
    specifications?: {
      length?: string | null
      cabins?: number | null
      capacity?: number | null
      buildYear?: number | null
    } | null
    mainImage?: { asset?: { _ref: string }; alt?: string | null } | null
  }> | null
}

type PopularToursSectionRaw = {
  enabled?: boolean | null
  title?: string | null
  subtitle?: string | null
  items?: Array<{
    _id: string
    title: string | null
    slug: string | null
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
  }> | null
}

type BlogSectionRaw = {
  enabled?: boolean | null
  heading?: string | null
  subtitle?: string | null
  posts?: Array<{
    _id: string
    title: string | null
    slug: string | null
    excerpt?: string | null
    publishDate?: string | null
    coverImage?: { asset?: { _ref: string }; alt?: string | null } | null
    translations?: unknown
  }> | null
  ctaButton?: { label?: string | null; href?: string | null } | null
}

type RouteSectionRaw = {
  enabled?: boolean | null
  heading?: string | null
  description?: string | null
  ctaButton?: { label?: string | null; href?: string | null } | null
  locations?: Array<{
    name?: string | null
    location?: string | null
    image?: { asset?: { _ref: string }; alt?: string | null } | null
  }> | null
}

/** /koylar sayfasındaki gerçek koy dokümanları — anasayfanın "Rotamız" bölümündeki
 * el ile eklenen lokasyon adına (isim eşleşmesiyle) gerçek açıklama metnini
 * bağlamak için kullanılır (uydurma açıklama yazılmaz; eşleşme yoksa boş kalır). */
type CoveListRow = {
  _id: string
  title?: string | null
  slug?: string | null
  description?: string | null
  translations?: unknown
}

type HomePageHeroResult = {
  seo?: { metaTitle?: string | null; metaDescription?: string | null } | null
  hero: HeroData | null
  featureBar?: FeatureBarItem[] | null
  popularToursSection?: PopularToursSectionRaw | null
  classesSection?: HomeClassesSectionData | null
  classesAutoFromTour?: { ticketClasses?: Array<Record<string, unknown>> | null } | null
  popularYachtsSection?: PopularYachtsSectionRaw | null
  aboutTeaser?: AboutTeaserData | null
  blogSection?: BlogSectionRaw | null
  routeSection?: RouteSectionRaw | null
  instagramSection?: InstagramSectionData | null
  pageTranslations?: unknown
} | null

function localizeCta(
  c: { label?: string | null; href?: string | null } | null | undefined,
  locale: SiteLocale,
): { label?: string | null; href?: string | null } | null | undefined {
  if (!c) return c
  const h = c.href?.trim()
  if (!h || h.startsWith('http://') || h.startsWith('https://') || h.startsWith('mailto:') || h.startsWith('tel:')) {
    return c
  }
  return { ...c, href: withLocalePath(locale, h) }
}

async function localizeHero(
  hero: HeroData | null,
  locale: SiteLocale,
  rawHomeData: Record<string, unknown> | null | undefined
): Promise<HeroData | null> {
  if (!hero) return null
  const mapHeroCta = async (
    c: HeroData['primaryCta'],
    field: 'primaryCta' | 'secondaryCta'
  ): Promise<HeroData['primaryCta']> => {
    if (!c) return c
    const next = localizeCta(c, locale) ?? c
    const label = homeFieldHasManualTranslation(rawHomeData, locale, 'hero', field)
      ? next.label
      : await translateText(next.label, locale)
    return {
      label: label || next.label || undefined,
      href: next.href ?? undefined,
    }
  }
  if (locale === 'tr') {
    const [primaryCta, secondaryCta] = await Promise.all([
      mapHeroCta(hero.primaryCta, 'primaryCta'),
      mapHeroCta(hero.secondaryCta, 'secondaryCta'),
    ])
    return { ...hero, primaryCta, secondaryCta }
  }
  const [eyebrow, topBadgeText, heading, subheading, primaryCta, secondaryCta] = await Promise.all([
    homeFieldHasManualTranslation(rawHomeData, locale, 'hero', 'eyebrow')
      ? hero.eyebrow
      : translateText(hero.eyebrow, locale),
    homeFieldHasManualTranslation(rawHomeData, locale, 'hero', 'topBadgeText')
      ? hero.topBadgeText
      : translateText(hero.topBadgeText, locale),
    homeFieldHasManualTranslation(rawHomeData, locale, 'hero', 'heading')
      ? hero.heading
      : translateText(hero.heading, locale),
    homeFieldHasManualTranslation(rawHomeData, locale, 'hero', 'subheading')
      ? hero.subheading
      : translateText(hero.subheading, locale),
    mapHeroCta(hero.primaryCta, 'primaryCta'),
    mapHeroCta(hero.secondaryCta, 'secondaryCta'),
  ])
  return {
    ...hero,
    eyebrow: eyebrow || hero.eyebrow,
    topBadgeText: topBadgeText || hero.topBadgeText,
    heading: heading || hero.heading,
    subheading: subheading || hero.subheading,
    primaryCta,
    secondaryCta,
  }
}

async function localizeAboutTeaser(
  d: AboutTeaserData | null,
  locale: SiteLocale,
  rawHomeData: Record<string, unknown> | null | undefined
): Promise<AboutTeaserData | null> {
  if (!d) return null
  const heading = homeFieldHasManualTranslation(rawHomeData, locale, 'aboutTeaser', 'heading')
    ? d.heading
    : await translateText(d.heading, locale)
  const body = homeFieldHasManualTranslation(rawHomeData, locale, 'aboutTeaser', 'body')
    ? d.body
    : await translatePortableTextBlocks(d.body, locale)
  const mapCta = async (
    c: AboutTeaserData['primaryCta'],
    field: 'primaryCta' | 'secondaryCta'
  ): Promise<AboutTeaserData['primaryCta']> => {
    const next = localizeCta(c, locale) ?? c
    if (!next) return next
    const label = homeFieldHasManualTranslation(rawHomeData, locale, 'aboutTeaser', field)
      ? next.label
      : await translateText(next.label, locale)
    return { ...next, label: label || next.label }
  }
  const [primaryCta, secondaryCta] = await Promise.all([
    mapCta(d.primaryCta, 'primaryCta'),
    mapCta(d.secondaryCta, 'secondaryCta'),
  ])
  return {
    ...d,
    heading,
    body,
    primaryCta,
    secondaryCta,
  }
}

async function mapPopularYachtsSection(
  raw: PopularYachtsSectionRaw | null,
  locale: SiteLocale,
): Promise<PopularYachtsSectionData | null> {
  if (!raw || raw.enabled === false) return null
  type YachtRef = NonNullable<PopularYachtsSectionRaw['items']>[number]
  const list = (raw.items ?? []).filter(
    (y): y is YachtRef =>
      y != null &&
      y.isActive !== false &&
      Boolean(y.slug) &&
      Boolean(y._id) &&
      Boolean(y.name?.trim())
  )
  if (!list.length) return null
  const items: HomePopularYachtCardData[] = await Promise.all(
    list.map(async (y) => {
      const spec = y.specifications
      const specifications =
        spec == null
          ? undefined
          : {
              length: spec.length ?? undefined,
              cabins: spec.cabins ?? undefined,
              capacity: spec.capacity ?? undefined,
              buildYear: spec.buildYear ?? undefined,
            }
      const [badges, locationTitle, included] = await Promise.all([
        translateTextArray(y.badges, locale),
        translateText(y.locationTitle, locale),
        translateTextArray(y.included, locale),
      ])
      return {
        _id: y._id,
        name: (y.name ?? '').trim(),
        slug: y.slug ?? null,
        locationTitle: locationTitle || y.locationTitle || null,
        locationSlug: y.locationSlug ?? null,
        coverImageUrl: y.mainImage?.asset ? urlFor(y.mainImage.asset).width(900).height(720).url() : null,
        coverImageAlt: y.mainImage?.alt ?? null,
        // yachtType teknik bir enum anahtarı (gulet/motoryacht/sailing/…) — ikon seçiminde
        // kullanılıyor, ekranda gösterilmiyor; çevrilirse değer bozulup ikon eşleşmesi kırılır.
        yachtType: y.yachtType ?? null,
        badges: badges.length ? badges : null,
        included: included.length ? included : (y.included ?? null),
        specifications,
        sailingLicenceRequired: y.sailingLicenceRequired ?? null,
        isFeatured: y.isFeatured ?? null,
        priceFrom: y.priceFrom ?? null,
        overnightTotalPrice: y.overnightTotalPrice ?? null,
        overnightNightPricing: y.overnightNightPricing ?? null,
        currency: y.currency ?? null,
        dailyRentalEnabled: y.dailyRentalEnabled ?? null,
        overnightRentalEnabled: y.overnightRentalEnabled ?? null,
      }
    })
  )
  const ctaNext = localizeCta(raw.ctaButton, locale) ?? raw.ctaButton ?? null
  const ctaButton = ctaNext
    ? { ...ctaNext, label: (await translateText(ctaNext.label, locale)) || ctaNext.label }
    : ctaNext
  return {
    enabled: true,
    title: raw.title,
    subtitle: raw.subtitle,
    ctaButton,
    items,
  }
}

async function mapPopularToursToCardItems(
  raw: PopularToursSectionRaw | null,
  locale: SiteLocale
): Promise<PopularToursSectionData | null> {
  if (!raw || !raw.items?.length) return raw as PopularToursSectionData | null
  const items: TourListItem[] = await Promise.all(
    raw.items.map(async (t) => {
      const rawItem = t as unknown as Record<string, unknown>
      const merged = mergeTourForLocale(rawItem, locale) as unknown as (typeof raw.items)[number] & {
        quickFacts?: { durationText?: string | null; meetingLocation?: string | null }
      }
      const qf = merged.quickFacts
      const durationLabelRaw = qf?.durationText?.trim() || merged.durationLabel
      const departureLabelRaw = qf?.meetingLocation?.trim() || merged.departureLabel
      const [shortDescription, title, durationLabel, departureLabel] = await Promise.all([
        tourFieldHasManualTranslation(rawItem, locale, 'shortDescription')
          ? merged.shortDescription
          : translateText(merged.shortDescription, locale),
        tourFieldHasManualTranslation(rawItem, locale, 'title')
          ? merged.title
          : translateText(merged.title, locale),
        translateText(durationLabelRaw, locale),
        translateText(departureLabelRaw, locale),
      ])
      return {
        _id: merged._id,
        title: title || merged.title,
        slug: merged.slug,
        shortDescription,
        durationLabel: durationLabel || durationLabelRaw,
        departureLabel: departureLabel || departureLabelRaw,
        priceFrom: merged.priceFrom,
        rating: merged.rating,
        reviewCount: merged.reviewCount,
        reviewsUrl: merged.reviewsUrl ?? null,
        isPopular: merged.isPopular ?? false,
        cardDiscount: merged.cardDiscount ?? null,
        coverImageUrl: tourCoverImageUrl(merged.mainImage?.asset ?? null),
        coverImageAlt: merged.mainImage?.alt ?? null,
      }
    })
  )
  return { ...raw, items }
}

async function mapBlogSection(raw: BlogSectionRaw | null, locale: SiteLocale): Promise<BlogSectionData | null> {
  if (!raw || !raw.posts?.length) return raw as BlogSectionData | null
  const posts = await Promise.all(
    raw.posts.map(async (p) => {
      const rawPost = p as unknown as Record<string, unknown>
      const merged = mergeBlogForLocale(rawPost, locale) as unknown as (typeof raw.posts)[number]
      const title = tourFieldHasManualTranslation(rawPost, locale, 'title')
        ? merged.title
        : await translateText(merged.title, locale)
      const excerpt = tourFieldHasManualTranslation(rawPost, locale, 'excerpt')
        ? merged.excerpt
        : await translateText(merged.excerpt, locale)
      return {
        _id: merged._id,
        title,
        slug: merged.slug,
        excerpt,
        publishDate: merged.publishDate,
        coverImageUrl: merged.coverImage?.asset ? urlFor(merged.coverImage.asset).width(800).height(600).url() : null,
        coverImageAlt: merged.coverImage?.alt ?? null,
      }
    })
  )
  return { ...raw, posts }
}

/** Bilet sınıfları bölümü: manuel girilmemişse otomatik turdan üretir. */
function resolveHomeClassesSection(
  manual: HomeClassesSectionData | null | undefined,
  auto: { ticketClasses?: Array<Record<string, unknown>> | null } | null | undefined,
): HomeClassesSectionData | null {
  const manualEnabled = manual?.enabled !== false
  if (!manualEnabled) return null

  const orderKey = (k: string | null | undefined): number => {
    const v = (k || '').trim().toLowerCase()
    if (v === 'eco' || v.startsWith('eco')) return 0
    if (v === 'premium' || v.startsWith('prem')) return 1
    if (v === 'first' || v.startsWith('first')) return 2
    return 9
  }

  const defaultLabelFor = (k: string | null | undefined): string => {
    const v = (k || '').trim().toLowerCase()
    if (v === 'eco') return 'Eco'
    if (v === 'premium') return 'Premium'
    if (v === 'first') return 'First'
    return k || ''
  }

  const manualItems = (manual?.items ?? []).filter((i) => i && i.key)
  if (manualItems.length > 0) {
    const items = [...manualItems]
      .sort((a, b) => orderKey(a.key) - orderKey(b.key))
      .map((i) => ({ ...i, label: (i.label ?? '').trim() || defaultLabelFor(i.key) }))
    return { ...manual, enabled: true, items }
  }

  const autoItems = Array.isArray(auto?.ticketClasses) ? auto!.ticketClasses! : []
  if (autoItems.length === 0) return null
  const items = autoItems
    .map((row) => {
      const r = row as Record<string, unknown>
      const key = typeof r.key === 'string' ? r.key.trim() : ''
      if (!key) return null
      const label =
        (typeof r.label === 'string' ? r.label.trim() : '') || defaultLabelFor(key)
      const description = typeof r.description === 'string' ? r.description : null
      const bullets = Array.isArray(r.bullets)
        ? (r.bullets.filter((b) => typeof b === 'string') as string[])
        : null
      const classImage = r.classImage ?? null
      const classImages = Array.isArray(r.classImages) ? r.classImages : null
      return { key, label, description, bullets, classImage, classImages } as TourClassItem
    })
    .filter((i): i is TourClassItem => !!i)
    .filter((i) => orderKey(i.key) < 9)
    .sort((a, b) => orderKey(a.key) - orderKey(b.key))
  if (items.length === 0) return null
  return {
    enabled: true,
    heading: manual?.heading ?? null,
    subtitle: manual?.subtitle ?? null,
    items,
  }
}

async function mapRouteSection(
  raw: RouteSectionRaw | null,
  locale: SiteLocale,
  rawHomeData: Record<string, unknown> | null | undefined,
  coveRows: CoveListRow[] = []
): Promise<{
  heading: string
  description: string
  ctaButton: RouteSectionRaw['ctaButton']
  locations: RouteSectionLocation[]
} | null> {
  if (!raw || !raw.enabled || !raw.heading) return null
  // Parantez içi ek açıklamaları yok sayarak eşleştir (örn. "Mavi Koy" ile
  // Sanity'deki "Mavi Koy (Akvaryum)" aynı yer — parantez sadece açıklayıcı ek).
  const normalize = (s: string | null | undefined) =>
    (s ?? '')
      .trim()
      .toLocaleLowerCase('tr')
      .replace(/\s*\([^)]*\)\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  const locations: RouteSectionLocation[] = await Promise.all(
    (raw.locations ?? []).slice(0, 4).map(async (loc) => {
      const [name, location] = await Promise.all([
        translateText(loc.name, locale),
        translateText(loc.location, locale),
      ])
      // İsim eşleşmesiyle /koylar'daki gerçek koy dokümanını bul — açıklama
      // metni SADECE gerçekten Sanity'de yazılmışsa gösterilir, uydurulmaz.
      const matchedCoveRaw = coveRows.find((c) => normalize(c.title) === normalize(loc.name))
      let description: string | null = null
      if (matchedCoveRaw) {
        const merged = mergeCoveForLocale(
          matchedCoveRaw as unknown as Record<string, unknown>,
          locale
        ) as unknown as CoveListRow
        const rawDescription = matchedCoveRaw.description?.trim() || null
        const mergedDescription = merged.description?.trim() || null
        description =
          locale === 'tr' || mergedDescription !== rawDescription
            ? mergedDescription
            : rawDescription
              ? await translateText(rawDescription, locale)
              : null
      }
      return {
        name: name || loc.name || '',
        location: location || loc.location || '',
        imageUrl: loc.image?.asset ? urlFor(loc.image.asset).width(960).height(720).url() : null,
        alt: loc.image?.alt ?? null,
        description,
      }
    })
  )
  const heading = homeFieldHasManualTranslation(rawHomeData, locale, 'routeSection', 'heading')
    ? raw.heading
    : await translateText(raw.heading, locale)
  const description = homeFieldHasManualTranslation(rawHomeData, locale, 'routeSection', 'description')
    ? (raw.description ?? '')
    : await translateText(raw.description, locale)
  return {
    heading,
    description,
    ctaButton: raw.ctaButton ?? null,
    locations,
  }
}

type HomeReviewsTourRow = {
  _id: string
  title?: string | null
  slug?: string | null
  reviewsUrl?: string | null
  reviewsSection?: {
    reviewCount?: number | null
    ratingValue?: number | null
    items?: Array<{
      name?: string | null
      title?: string | null
      description?: string | null
      rating?: number | null
      avatar?: {
        asset?: { _ref?: string; _type?: string } | null
        url?: string | null
        metadata?: { lqip?: string | null } | null
      } | null
    }> | null
  } | null
}

/** Tüm turlardaki yorumları tek listede toplar (anasayfa "Misafirlerimizin Kaleminden" bölümü).
 * İlk sırada gösterilen yorumlar en popüler tur(lar)dan gelsin diye, satırlar önce
 * "En Popüler Turlarımız" sıralamasına göre (1. sıradaki tur en önde), kalanlar ise
 * kendi orijinal sırasında dizilir. */
function flattenHomeReviews(
  rows: HomeReviewsTourRow[] | null | undefined,
  popularOrder: string[] = [],
): HomeReviewsSectionData | null {
  if (!rows || rows.length === 0) return null

  const popularIndex = new Map(popularOrder.map((id, i) => [id, i]))
  const sortedRows = [...rows].sort((a, b) => {
    const ai = popularIndex.has(a._id) ? popularIndex.get(a._id)! : Infinity
    const bi = popularIndex.has(b._id) ? popularIndex.get(b._id)! : Infinity
    return ai - bi
  })

  const items: HomeReviewItem[] = []
  let ratingSum = 0
  let ratingCount = 0
  let totalCount = 0
  let googleReviewsUrl: string | null = null

  for (const row of sortedRows) {
    if (!row.slug || !row.title) continue
    if (!googleReviewsUrl && row.reviewsUrl) googleReviewsUrl = row.reviewsUrl
    if (typeof row.reviewsSection?.reviewCount === 'number') totalCount += row.reviewsSection.reviewCount
    if (typeof row.reviewsSection?.ratingValue === 'number') {
      ratingSum += row.reviewsSection.ratingValue
      ratingCount += 1
    }
    for (const it of row.reviewsSection?.items ?? []) {
      if (!it?.name || !it?.description) continue
      items.push({
        id: `${row._id}-${items.length}`,
        name: it.name,
        dateLabel: it.title ?? null,
        description: it.description,
        rating: typeof it.rating === 'number' ? it.rating : 5,
        avatarUrl: it.avatar?.url ?? null,
        avatarLqip: it.avatar?.metadata?.lqip ?? null,
        tourTitle: row.title,
        tourSlug: row.slug,
      })
    }
  }

  if (items.length === 0) return null

  return {
    enabled: true,
    items: items.slice(0, 12),
    avgRating: ratingCount > 0 ? ratingSum / ratingCount : 5,
    totalCount,
    googleReviewsUrl,
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale
  const blogUi = getBlogPageUiStrings(locale)

  let data: HomePageHeroResult | null = null
  let hero: HeroData | null = null
  let featureBar: FeatureBarItem[] | null = null
  let popularToursSection: PopularToursSectionData | null = null
  let classesSection: HomeClassesSectionData | null = null
  let popularYachtsSection: PopularYachtsSectionData | null = null
  let aboutTeaser: AboutTeaserData | null = null
  let blogSection: BlogSectionData | null = null
  let routeSection: Awaited<ReturnType<typeof mapRouteSection>> = null
  let instagramSection: InstagramSectionData | null = null
  let loyaltyBanner: { imageUrl?: string | null; imageAlt?: string | null; href?: string | null } | null = null
  let travelAgencyImageOverrides: TravelAgencyStructuredDataImageOverrides = {}
  try {
    const [raw, settingsRow, heroRow, coveRows] = await Promise.all([
      client.fetch<HomePageHeroResult>(homePageHeroQuery, {}, { useCdn: false }),
      client.fetch(siteSettingsTravelAgencyImagesQuery, {}, { useCdn: false }),
      client.fetch(homePageHeroImageUrlsQuery, {}, { useCdn: false }),
      client.fetch<CoveListRow[]>(covesListQuery, {}, { useCdn: false }).catch(() => []),
    ])
    travelAgencyImageOverrides = travelAgencyImageOverridesFromSanity({
      settings: settingsRow,
      hero: heroRow,
    })
    const rawHomeRecord = raw as unknown as Record<string, unknown>
    data = mergeHomePageLocale(rawHomeRecord, locale) as HomePageHeroResult
    hero = await localizeHero(data?.hero ?? null, locale, rawHomeRecord)
    const rawFeatureBar = data?.featureBar ?? null
    featureBar =
      rawFeatureBar && locale !== 'tr'
        ? await Promise.all(
            rawFeatureBar.map(async (item, index) => {
              const patchArr = (rawHomeRecord?.pageTranslations as Record<string, unknown> | undefined)?.[locale] as
                | Record<string, unknown>
                | undefined
              const patchItem = Array.isArray(patchArr?.featureBar)
                ? (patchArr!.featureBar as unknown[])[index]
                : undefined
              const hasManual = !!patchItem
              if (hasManual) return item
              return {
                ...item,
                title: await translateText(item.title, locale),
                description: item.description ? await translateText(item.description, locale) : item.description,
              }
            })
          )
        : rawFeatureBar
    const popularToursMapped = await mapPopularToursToCardItems(data?.popularToursSection ?? null, locale)
    popularToursSection = popularToursMapped
      ? {
          ...popularToursMapped,
          title: homeFieldHasManualTranslation(rawHomeRecord, locale, 'popularToursSection', 'title')
            ? popularToursMapped.title
            : await translateText(popularToursMapped.title, locale),
          subtitle: homeFieldHasManualTranslation(rawHomeRecord, locale, 'popularToursSection', 'subtitle')
            ? popularToursMapped.subtitle
            : await translateText(popularToursMapped.subtitle, locale),
        }
      : null
    const classesResolved = resolveHomeClassesSection(data?.classesSection ?? null, data?.classesAutoFromTour ?? null)
    if (classesResolved && locale !== 'tr') {
      const heading = homeFieldHasManualTranslation(rawHomeRecord, locale, 'classesSection', 'heading')
        ? classesResolved.heading
        : await translateText(classesResolved.heading, locale)
      const subtitle = homeFieldHasManualTranslation(rawHomeRecord, locale, 'classesSection', 'subtitle')
        ? classesResolved.subtitle
        : await translateText(classesResolved.subtitle, locale)
      const items = homeFieldHasManualTranslation(rawHomeRecord, locale, 'classesSection', 'items')
        ? classesResolved.items
        : await Promise.all(
            (classesResolved.items ?? []).map(async (item) => ({
              ...item,
              label: await translateText(item.label, locale),
              description: item.description ? await translateText(item.description, locale) : item.description,
              badge: item.badge ? await translateText(item.badge, locale) : item.badge,
              bullets: item.bullets ? await translateTextArray(item.bullets, locale) : item.bullets,
            }))
          )
      classesSection = { ...classesResolved, heading, subtitle, items }
    } else {
      classesSection = classesResolved
    }
    const popularYachtsMapped = await mapPopularYachtsSection(data?.popularYachtsSection ?? null, locale)
    popularYachtsSection = popularYachtsMapped
      ? {
          ...popularYachtsMapped,
          title: homeFieldHasManualTranslation(rawHomeRecord, locale, 'popularYachtsSection', 'title')
            ? popularYachtsMapped.title
            : await translateText(popularYachtsMapped.title, locale),
          subtitle: homeFieldHasManualTranslation(rawHomeRecord, locale, 'popularYachtsSection', 'subtitle')
            ? popularYachtsMapped.subtitle
            : await translateText(popularYachtsMapped.subtitle, locale),
        }
      : null
    aboutTeaser = await localizeAboutTeaser(data?.aboutTeaser ?? null, locale, rawHomeRecord)
    const blogMapped = await mapBlogSection(data?.blogSection ?? null, locale)
    if (blogMapped) {
      const blogCtaNext = localizeCta(blogMapped.ctaButton, locale) ?? blogMapped.ctaButton
      const blogCtaButton = blogCtaNext
        ? { ...blogCtaNext, label: (await translateText(blogCtaNext.label, locale)) || blogCtaNext.label }
        : blogCtaNext
      blogSection = {
        ...blogMapped,
        heading: homeFieldHasManualTranslation(rawHomeRecord, locale, 'blogSection', 'heading')
          ? blogMapped.heading
          : await translateText(blogMapped.heading, locale),
        subtitle: homeFieldHasManualTranslation(rawHomeRecord, locale, 'blogSection', 'subtitle')
          ? blogMapped.subtitle
          : await translateText(blogMapped.subtitle, locale),
        ctaButton: blogCtaButton,
      }
    } else {
      blogSection = null
    }
    const routeMapped = await mapRouteSection(
      data?.routeSection ?? null,
      locale,
      rawHomeRecord,
      Array.isArray(coveRows) ? coveRows : []
    )
    if (routeMapped) {
      const routeCtaNext = localizeCta(routeMapped.ctaButton, locale) ?? routeMapped.ctaButton
      const routeCtaButton = routeCtaNext
        ? { ...routeCtaNext, label: (await translateText(routeCtaNext.label, locale)) || routeCtaNext.label }
        : routeCtaNext
      routeSection = { ...routeMapped, ctaButton: routeCtaButton }
    } else {
      routeSection = null
    }
    instagramSection = data?.instagramSection ?? null
    const lb = (data as Record<string, unknown>)?.loyaltyBanner as { enabled?: boolean; imageUrl?: string; imageAlt?: string; href?: string } | null
    loyaltyBanner = lb?.enabled && lb?.imageUrl ? lb : null
  } catch {
    hero = null
    featureBar = null
    popularToursSection = null
    classesSection = null
    popularYachtsSection = null
    aboutTeaser = null
    blogSection = null
    routeSection = null
    instagramSection = null
    loyaltyBanner = null
  }

  let homeReviews: HomeReviewsSectionData | null = null
  try {
    const reviewRows = await client.fetch<HomeReviewsTourRow[]>(homeReviewsQuery, {}, { useCdn: false })
    const popularOrder = (popularToursSection?.items ?? []).map((t) => t._id).filter(Boolean)
    const flattened = flattenHomeReviews(reviewRows, popularOrder)
    if (flattened && locale !== 'tr') {
      const items = await Promise.all(
        flattened.items.map(async (it) => {
          const translated = await translateText(it.description, locale)
          const hasRealTranslation = Boolean(translated) && translated !== it.description
          return {
            ...it,
            description: translated || it.description,
            originalDescription: hasRealTranslation ? it.description : null,
          }
        })
      )
      homeReviews = { ...flattened, items }
    } else {
      homeReviews = flattened
    }
    if (homeReviews) {
      try {
        const footerSocial = await client.fetch<{ instagram?: { href?: string | null; followerCount?: string | null } | null } | null>(
          siteFooterInstagramQuery,
          {},
          { useCdn: false }
        )
        homeReviews = {
          ...homeReviews,
          instagramUrl: footerSocial?.instagram?.href ?? null,
          instagramFollowerCount: footerSocial?.instagram?.followerCount ?? null,
        }
      } catch {
        // Instagram butonu opsiyonel — sorgu başarısız olursa sessizce atlanır.
      }
    }
  } catch {
    homeReviews = null
  }

  let homeFaqItems: HomeFaqItem[] | null = null
  try {
    const faqData = await client.fetch<{ sections?: Array<{ items?: Array<{ question?: string | null; answer?: string | null }> | null }> | null } | null>(
      faqPageQuery,
      {},
      { useCdn: false },
    )
    const flattened =
      faqData?.sections?.flatMap((s) => s.items ?? []).filter((it): it is { question: string; answer: string } => !!(it?.question && it?.answer)) ?? []
    // Sanity'de henüz yeterli/tam Türkçe içerik yoksa bileşenin kendi varsayılan
    // listesi (kullanıcının verdiği güncel SSS metinleri) gösterilir.
    const picked = flattened.length >= 4 ? flattened.slice(0, 7) : null
    homeFaqItems =
      picked && locale !== 'tr'
        ? await Promise.all(
            picked.map(async (it) => ({
              question: await translateText(it.question, locale),
              answer: await translateText(it.answer, locale),
            }))
          )
        : picked
  } catch {
    homeFaqItems = null
  }

  const organizationSchema = buildOrganizationSchema()
  const websiteSchema = buildWebSiteSchema({
    description: data?.seo?.metaDescription?.trim() || DEFAULT_HOME_DESCRIPTION[locale],
  })
  let travelAgencySchema: Record<string, unknown>
  try {
    // Google'ın structured-data kuralları: şema, sayfada GERÇEKTEN görünen
    // puan/yorum sayısıyla eşleşmeli — sabit yedek yerine anasayfadaki
    // "Sizden Gelenler" bölümünün canlı toplamını kullanıyoruz.
    const liveRating =
      homeReviews && homeReviews.totalCount > 0
        ? { ratingValue: homeReviews.avgRating, reviewCount: homeReviews.totalCount }
        : null
    travelAgencySchema = buildTravelAgencyStructuredData(travelAgencyImageOverrides, liveRating)
  } catch {
    travelAgencySchema = {
      '@context': 'https://schema.org',
      '@type': 'TravelAgency',
      name: getSiteName() || (locale === 'en' ? 'Çeşme boat tour' : locale === 'de' ? 'Çeşme Bootstour' : 'Çeşme tekne turu'),
      url: getBaseUrl(),
    }
  }

  const loyaltyProgramLabel = locale === 'en' ? 'Loyalty Program' : locale === 'de' ? 'Treueprogramm' : 'Sadakat Programı'

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={organizationSchema} />
      <JsonLd data={websiteSchema} />
      <JsonLd data={travelAgencySchema} />
      <HeroBanner hero={hero} locale={locale} />
      {featureBar && featureBar.length > 0 && (
        <ScrollReveal>
          <FeatureBar items={featureBar} locale={locale} />
        </ScrollReveal>
      )}
      <span id="home-tours" className="block scroll-mt-24" aria-hidden />
      <ScrollReveal>
        <PopularToursSection data={popularToursSection} locale={locale} />
      </ScrollReveal>
      <ScrollReveal>
        <HomeClassesSection data={classesSection} locale={locale} />
      </ScrollReveal>
      {routeSection && (
        <ScrollReveal>
          <RouteSection
            heading={routeSection.heading}
            description={routeSection.description}
            ctaButton={routeSection.ctaButton}
            locations={routeSection.locations}
            locale={locale}
          />
        </ScrollReveal>
      )}
      <span id="home-reviews" className="block scroll-mt-24" aria-hidden />
      <ScrollReveal>
        <HomeReviewsSection data={homeReviews} locale={locale} />
      </ScrollReveal>
      <ScrollReveal>
        <PopularYachtsSection data={popularYachtsSection} locale={locale} />
      </ScrollReveal>

      {loyaltyBanner && (
        <div className="mx-auto mb-3 mt-8 max-w-2xl px-4 lg:hidden">
          {loyaltyBanner.href ? (
            <a href={loyaltyBanner.href} className="block w-full overflow-hidden rounded-xl">
              <Image
                src={loyaltyBanner.imageUrl!}
                alt={loyaltyBanner.imageAlt || loyaltyProgramLabel}
                width={1280}
                height={400}
                className="h-auto w-full"
                sizes="(max-width: 672px) 100vw, 672px"
              />
            </a>
          ) : (
            <div className="w-full overflow-hidden rounded-xl">
              <Image
                src={loyaltyBanner.imageUrl!}
                alt={loyaltyBanner.imageAlt || loyaltyProgramLabel}
                width={1280}
                height={400}
                className="h-auto w-full"
                sizes="(max-width: 672px) 100vw, 672px"
              />
            </div>
          )}
        </div>
      )}

      <span id="home-about" className="block scroll-mt-24" aria-hidden />
      <ScrollReveal>
        <AboutTeaserSplit data={aboutTeaser} locale={locale} />
      </ScrollReveal>
      <ScrollReveal>
        <HomeFaqSection items={homeFaqItems} locale={locale} />
      </ScrollReveal>
      <ScrollReveal>
        <PoseidonSecure locale={locale} />
      </ScrollReveal>
      <ScrollReveal>
        <BlogSection data={blogSection} locale={locale} noImageLabel={blogUi.noCoverImage} />
      </ScrollReveal>
      <ScrollReveal>
        <InstagramSection data={instagramSection} />
      </ScrollReveal>
    </div>
  )
}
