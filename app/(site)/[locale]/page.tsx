import { client, safeSanityImageUrl, urlFor } from '@/lib/sanity'
import {
  homePageHeroImageUrlsQuery,
  homePageHeroQuery,
  siteFooterContactQuery,
  siteSettingsTravelAgencyImagesQuery,
} from '@/lib/queries'
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
import HelpContactBanner from '@/components/home/HelpContactBanner'
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
import { mergeTourForLocale } from '@/lib/i18n/mergeTourForLocale'
import { mergeBlogForLocale } from '@/lib/i18n/mergeBlogForLocale'
import { mergeHomePageLocale, mergeHomePageSeoForLocale } from '@/lib/i18n/mergeHomePageLocale'
import { getBlogPageUiStrings } from '@/lib/i18n/strings/blogPage'
import { pickLocalizedString } from '@/lib/i18n/localizedLabels'

export const dynamic = 'force-dynamic'

const siteName = getSiteName()
const defaultHomeTitle = siteName
  ? `Tekne Turu | Adalar ve Koylar – ${siteName}`
  : 'Tekne Turu | Adalar ve Koylar'
const defaultHomeDescription =
  'Tekne turu rezervasyonu. Adalar ve koylar turu, BBQ turları, günlük turlar. Online rezervasyon.'

const OG_LOCALE: Record<SiteLocale, string> = {
  tr: 'tr_TR',
  en: 'en_US',
  de: 'de_DE',
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

type SiteFooterContactPayload = {
  contact?: {
    email?: string | null
    phone?: string | null
    chatValue?: string | null
    openingValue?: string | null
    openingValueEn?: string | null
    openingValueDe?: string | null
  } | null
} | null

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
      pageTranslations?: { en?: Record<string, unknown>; de?: Record<string, unknown> }
      heroOgFallback?: { asset?: unknown; alt?: string | null } | null
    } | null>(homePageMetaQuery, {}, { useCdn: false })

    const seo = mergeHomePageSeoForLocale(
      row?.seo as Record<string, unknown> | undefined,
      row?.pageTranslations,
      locale
    ) as HomePageSeoPayload | null | undefined

    const rawMetaTitle = seo?.metaTitle?.trim() ?? defaultHomeTitle
    const pageTitle =
      rawMetaTitle.includes('|') ? rawMetaTitle : siteName ? `${rawMetaTitle} | ${siteName}` : rawMetaTitle

    const rawDescription = seo?.metaDescription?.trim() ?? defaultHomeDescription
    const description = rawDescription.slice(0, 165)

    const ogTitle = (seo?.ogTitle?.trim() || pageTitle).slice(0, 90)
    const ogDescription = (seo?.ogDescription?.trim() || rawDescription).slice(0, 200)

    const ogFromSeo = safeSanityImageUrl(seo?.ogImage ?? undefined, ogPipe)
    const ogFromHero = safeSanityImageUrl(row?.heroOgFallback ?? undefined, ogPipe)
    const ogImageUrl = ogFromSeo ?? ogFromHero

    const ogImageAlt =
      seo?.ogImage?.alt?.trim() ||
      row?.heroOgFallback?.alt?.trim() ||
      (siteName ? `${siteName} — ana sayfa` : 'Ana sayfa')

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
      title: defaultHomeTitle,
      description: defaultHomeDescription,
      alternates: {
        canonical: canonicalBase,
        languages: alternateLanguageAbsoluteUrls('/'),
      },
      openGraph: {
        type: 'website',
        locale: OG_LOCALE[locale],
        ...(siteName ? { siteName } : {}),
        title: siteName ? `Tekne Turu | ${siteName}` : 'Tekne Turu',
        description: 'Tekne turu ve koy turları. Rezervasyon.',
        url: canonicalBase,
      },
      twitter: {
        card: 'summary_large_image',
        title: siteName ? `Tekne Turu | ${siteName}` : 'Tekne Turu',
        description: 'Tekne turu ve koy turları. Rezervasyon.',
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

function localizeHero(hero: HeroData | null, locale: SiteLocale): HeroData | null {
  if (!hero) return null
  const mapHeroCta = (c: HeroData['primaryCta']): HeroData['primaryCta'] => {
    if (!c) return c
    const next = localizeCta(c, locale) ?? c
    return {
      label: next.label ?? undefined,
      href: next.href ?? undefined,
    }
  }
  return {
    ...hero,
    primaryCta: mapHeroCta(hero.primaryCta),
    secondaryCta: mapHeroCta(hero.secondaryCta),
  }
}

function localizeAboutTeaser(d: AboutTeaserData | null, locale: SiteLocale): AboutTeaserData | null {
  if (!d) return null
  return {
    ...d,
    primaryCta: localizeCta(d.primaryCta, locale) ?? d.primaryCta,
    secondaryCta: localizeCta(d.secondaryCta, locale) ?? d.secondaryCta,
  }
}

function mapPopularYachtsSection(
  raw: PopularYachtsSectionRaw | null,
  locale: SiteLocale,
): PopularYachtsSectionData | null {
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
  const items: HomePopularYachtCardData[] = list.map((y) => {
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
    return {
    _id: y._id,
    name: (y.name ?? '').trim(),
    slug: y.slug ?? null,
    locationTitle: y.locationTitle ?? null,
    locationSlug: y.locationSlug ?? null,
    coverImageUrl: y.mainImage?.asset ? urlFor(y.mainImage.asset).width(900).height(720).url() : null,
    coverImageAlt: y.mainImage?.alt ?? null,
    yachtType: y.yachtType ?? null,
    badges: y.badges ?? null,
    included: y.included ?? null,
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
  return {
    enabled: true,
    title: raw.title,
    subtitle: raw.subtitle,
    ctaButton: localizeCta(raw.ctaButton, locale) ?? raw.ctaButton ?? null,
    items,
  }
}

function mapPopularToursToCardItems(
  raw: PopularToursSectionRaw | null,
  locale: SiteLocale
): PopularToursSectionData | null {
  if (!raw || !raw.items?.length) return raw as PopularToursSectionData | null
  const items: TourListItem[] = raw.items.map((t) => {
    const merged = mergeTourForLocale(t as unknown as Record<string, unknown>, locale) as unknown as (typeof raw.items)[number] & {
      quickFacts?: { durationText?: string | null; meetingLocation?: string | null }
    }
    const qf = merged.quickFacts
    const durationLabel = qf?.durationText?.trim() || merged.durationLabel
    const departureLabel = qf?.meetingLocation?.trim() || merged.departureLabel
    return {
      _id: merged._id,
      title: merged.title,
      slug: merged.slug,
      shortDescription: merged.shortDescription,
      durationLabel,
      departureLabel,
      priceFrom: merged.priceFrom,
      rating: merged.rating,
      reviewCount: merged.reviewCount,
      reviewsUrl: merged.reviewsUrl ?? null,
      isPopular: merged.isPopular ?? false,
      coverImageUrl: merged.mainImage?.asset ? urlFor(merged.mainImage.asset).width(800).height(600).url() : null,
      coverImageAlt: merged.mainImage?.alt ?? null,
    }
  })
  return { ...raw, items }
}

function mapBlogSection(raw: BlogSectionRaw | null, locale: SiteLocale): BlogSectionData | null {
  if (!raw || !raw.posts?.length) return raw as BlogSectionData | null
  const posts = raw.posts.map((p) => {
    const merged = mergeBlogForLocale(p as unknown as Record<string, unknown>, locale) as unknown as (typeof raw.posts)[number]
    return {
      _id: merged._id,
      title: merged.title,
      slug: merged.slug,
      excerpt: merged.excerpt,
      publishDate: merged.publishDate,
      coverImageUrl: merged.coverImage?.asset ? urlFor(merged.coverImage.asset).width(800).height(600).url() : null,
      coverImageAlt: merged.coverImage?.alt ?? null,
    }
  })
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

function mapRouteSection(raw: RouteSectionRaw | null): {
  heading: string
  description: string
  ctaButton: RouteSectionRaw['ctaButton']
  locations: RouteSectionLocation[]
} | null {
  if (!raw || !raw.enabled || !raw.heading) return null
  const locations: RouteSectionLocation[] = (raw.locations ?? []).slice(0, 4).map((loc) => ({
    name: loc.name ?? '',
    location: loc.location ?? '',
    imageUrl: loc.image?.asset ? urlFor(loc.image.asset).width(600).height(800).url() : null,
    alt: loc.image?.alt ?? null,
  }))
  return {
    heading: raw.heading,
    description: raw.description ?? '',
    ctaButton: raw.ctaButton ?? null,
    locations,
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
  let routeSection: ReturnType<typeof mapRouteSection> = null
  let instagramSection: InstagramSectionData | null = null
  let loyaltyBanner: { imageUrl?: string | null; imageAlt?: string | null; href?: string | null } | null = null
  let footerContact: SiteFooterContactPayload = null
  let travelAgencyImageOverrides: TravelAgencyStructuredDataImageOverrides = {}
  try {
    const [raw, settingsRow, heroRow, footerRow] = await Promise.all([
      client.fetch<HomePageHeroResult>(homePageHeroQuery, {}, { useCdn: false }),
      client.fetch(siteSettingsTravelAgencyImagesQuery, {}, { useCdn: false }),
      client.fetch(homePageHeroImageUrlsQuery, {}, { useCdn: false }),
      client.fetch<SiteFooterContactPayload>(siteFooterContactQuery, {}, { useCdn: false }),
    ])
    footerContact = footerRow
    travelAgencyImageOverrides = travelAgencyImageOverridesFromSanity({
      settings: settingsRow,
      hero: heroRow,
    })
    data = mergeHomePageLocale(raw as unknown as Record<string, unknown>, locale) as HomePageHeroResult
    hero = localizeHero(data?.hero ?? null, locale)
    featureBar = data?.featureBar ?? null
    popularToursSection = mapPopularToursToCardItems(data?.popularToursSection ?? null, locale)
    classesSection = resolveHomeClassesSection(data?.classesSection ?? null, data?.classesAutoFromTour ?? null)
    popularYachtsSection = mapPopularYachtsSection(data?.popularYachtsSection ?? null, locale)
    aboutTeaser = localizeAboutTeaser(data?.aboutTeaser ?? null, locale)
    const blogMapped = mapBlogSection(data?.blogSection ?? null, locale)
    blogSection = blogMapped
      ? {
          ...blogMapped,
          ctaButton: localizeCta(blogMapped.ctaButton, locale) ?? blogMapped.ctaButton,
        }
      : null
    const routeMapped = mapRouteSection(data?.routeSection ?? null)
    routeSection = routeMapped
      ? {
          ...routeMapped,
          ctaButton: localizeCta(routeMapped.ctaButton, locale) ?? routeMapped.ctaButton,
        }
      : null
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
    footerContact = null
  }

  const footerFields = footerContact?.contact
  const helpBannerOpening =
    footerFields &&
    pickLocalizedString(
      footerFields.openingValue,
      footerFields.openingValueEn,
      footerFields.openingValueDe,
      locale,
      '',
    ).trim()

  const organizationSchema = buildOrganizationSchema()
  const websiteSchema = buildWebSiteSchema({
    description:
      data?.seo?.metaDescription?.trim() ||
      'Çeşme tekne turu ve koy turları. Adalar ve koylar tekne turu rezervasyonu.',
  })
  let travelAgencySchema: Record<string, unknown>
  try {
    travelAgencySchema = buildTravelAgencyStructuredData(travelAgencyImageOverrides)
  } catch {
    travelAgencySchema = {
      '@context': 'https://schema.org',
      '@type': 'TravelAgency',
      name: getSiteName() || 'Çeşme tekne turu',
      url: getBaseUrl(),
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={organizationSchema} />
      <JsonLd data={websiteSchema} />
      <JsonLd data={travelAgencySchema} />
      <HeroBanner hero={hero} locale={locale} />
      {featureBar && featureBar.length > 0 && <FeatureBar items={featureBar} />}
      <PopularToursSection data={popularToursSection} locale={locale} />
      <HomeClassesSection data={classesSection} locale={locale} />
      <PoseidonSecure locale={locale} />
      {routeSection && (
        <RouteSection
          heading={routeSection.heading}
          description={routeSection.description}
          ctaButton={routeSection.ctaButton}
          locations={routeSection.locations}
        />
      )}
      <AboutTeaserSplit data={aboutTeaser} />

      {loyaltyBanner && (
        <div className="mx-auto mb-3 mt-8 max-w-2xl px-4 lg:hidden">
          {loyaltyBanner.href ? (
            <a href={loyaltyBanner.href} className="block w-full overflow-hidden rounded-xl">
              <Image
                src={loyaltyBanner.imageUrl!}
                alt={loyaltyBanner.imageAlt || 'Sadakat Programı'}
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
                alt={loyaltyBanner.imageAlt || 'Sadakat Programı'}
                width={1280}
                height={400}
                className="h-auto w-full"
                sizes="(max-width: 672px) 100vw, 672px"
              />
            </div>
          )}
        </div>
      )}

      <PopularYachtsSection data={popularYachtsSection} locale={locale} />
      <HelpContactBanner
        locale={locale}
        email={footerFields?.email}
        phone={footerFields?.phone}
        chatValue={footerFields?.chatValue}
        openingHoursLine={helpBannerOpening || undefined}
      />
      <BlogSection data={blogSection} locale={locale} noImageLabel={blogUi.noCoverImage} />
      <InstagramSection data={instagramSection} />
    </div>
  )
}
