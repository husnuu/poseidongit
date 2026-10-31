import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import {
  ArrowDownToLine,
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Clock,
  ExternalLink,
  Fish,
  Footprints,
  Glasses,
  MapPin,
  Plus,
  Shell,
  Sun,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import { client, urlFor } from '@/lib/sanity'
import { coveBySlugQuery, covesPageQuery, otherCovesQuery, toursListQuery } from '@/lib/queries'
import { tourCoverImageUrl } from '@/lib/sanityImage'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import {
  coveFieldHasManualTranslation,
  coveSlugForLocale,
  mergeCoveForLocale,
} from '@/lib/i18n/mergeCoveForLocale'
import { mergeCovesPageLocale } from '@/lib/i18n/mergeCovesPageLocale'
import { mergeTourForLocale, tourFieldHasManualTranslation } from '@/lib/i18n/mergeTourForLocale'
import { getCovesPageUiStrings } from '@/lib/i18n/strings/covesPage'
import { translatePortableTextBlocks, translateText, translateTextArray } from '@/lib/i18n/runtimeTranslate'
import { buildPageMetadata } from '@/lib/seo/buildPageMetadata'
import { alternateLanguageAbsoluteUrls } from '@/lib/seo/alternateLanguages'
import { absoluteUrl, buildBreadcrumbSchema, buildFAQSchema, getSiteName } from '@/lib/seo'
import JsonLd from '@/components/seo/JsonLd'
import ScrollReveal from '@/components/ui/ScrollReveal'
import TourCard from '@/components/tours/TourCard'
import type { TourListItem } from '@/components/tours/TourCard'
import CoveGallery from '@/components/coves/CoveGallery'
import CovesGrid from '@/components/coves/CovesGrid'

const opts = { useCdn: false as const }

type SanityImage = { asset?: { _ref?: string }; alt?: string | null } | null

type CoveFaq = { question?: string | null; answer?: string | null }

type CoveDetail = {
  _id: string
  _updatedAt?: string
  title?: string | null
  slug?: string | null
  description?: string | null
  image?: SanityImage
  locationTag?: string | null
  content?: PortableTextBlock[] | null
  gallery?: SanityImage[] | null
  highlights?: string[] | null
  activities?: string[] | null
  travelTime?: string | null
  bestTime?: string | null
  location?: { lat?: number; lng?: number } | null
  faqs?: CoveFaq[] | null
  relatedTourIds?: string[] | null
  seo?: { metaTitle?: string | null; metaDescription?: string | null; ogImage?: SanityImage } | null
  translations?: unknown
}

type OtherCove = {
  _id: string
  title?: string | null
  slug?: string | null
  description?: string | null
  image?: SanityImage
  locationTag?: string | null
  translations?: unknown
}

type TourListRaw = {
  _id: string
  title: string | null
  slug: string | null
  shortDescription?: string | null
  mainImage?: { asset?: { _ref?: string }; alt?: string | null } | null
  departureLabel?: string | null
  durationLabel?: string | null
  rating?: number | null
  reviewCount?: number | null
  reviewsUrl?: string | null
  priceFrom?: number | null
  isPopular?: boolean | null
  cardDiscount?: TourListItem['cardDiscount']
  quickFacts?: { durationText?: string | null; meetingLocation?: string | null }
}

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  swim: Waves,
  snorkel: Glasses,
  dive: Shell,
  photo: Camera,
  sunbathe: Sun,
  fish: Fish,
  cliffjump: ArrowDownToLine,
  hike: Footprints,
}

const NUMBER_LOCALE: Record<SiteLocale, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', ru: 'ru-RU' }

/** Sanity'de tamamı büyük harfle girilmiş başlıkları ("EŞEK ADASI") arama
    sonuçları için kelime başı büyük hale getirir ("Eşek Adası"). */
function toTitleCase(value: string, numberLocale: string): string {
  const t = value.trim()
  if (t !== t.toLocaleUpperCase(numberLocale)) return t
  return t
    .toLocaleLowerCase(numberLocale)
    .replace(/(^|[\s(\-/])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase(numberLocale))
}

async function fetchCove(slug: string): Promise<CoveDetail | null> {
  try {
    return await client.fetch<CoveDetail | null>(coveBySlugQuery, { slug }, opts)
  } catch {
    return null
  }
}

/** Her dil için koyun kanonik iç yolu — hreflang alternates için. */
function coveLocalePaths(raw: Record<string, unknown>): Partial<Record<SiteLocale, string>> {
  const out: Partial<Record<SiteLocale, string>> = {}
  for (const loc of ['tr', 'en', 'de', 'ru'] as SiteLocale[]) {
    const s = coveSlugForLocale(raw, loc)
    if (s) out[loc] = withLocalePath(loc, `/koylar/${s}`)
  }
  return out
}

/** Elle çeviri yoksa metni anlık çevirir (diğer sayfalarla aynı kural). */
async function localizeCove(raw: CoveDetail, locale: SiteLocale): Promise<CoveDetail> {
  const rawRec = raw as unknown as Record<string, unknown>
  const merged = mergeCoveForLocale(rawRec, locale) as unknown as CoveDetail
  if (locale === 'tr') return merged
  const manual = (f: string) => coveFieldHasManualTranslation(rawRec, locale, f)
  const [title, description, locationTag, travelTime, bestTime, highlights, content, faqs] = await Promise.all([
    manual('title') ? merged.title : translateText(merged.title, locale),
    manual('description') ? merged.description : translateText(merged.description, locale),
    manual('locationTag') ? merged.locationTag : translateText(merged.locationTag, locale),
    manual('travelTime') ? merged.travelTime : translateText(merged.travelTime, locale),
    manual('bestTime') ? merged.bestTime : translateText(merged.bestTime, locale),
    manual('highlights') ? merged.highlights : translateTextArray(merged.highlights, locale),
    manual('content')
      ? merged.content
      : merged.content?.length
        ? translatePortableTextBlocks(merged.content as never, locale)
        : merged.content,
    manual('faqs')
      ? merged.faqs
      : Promise.all(
          (merged.faqs ?? []).map(async (f) => ({
            question: await translateText(f.question, locale),
            answer: await translateText(f.answer, locale),
          })),
        ),
  ])
  return {
    ...merged,
    title: title || merged.title,
    description: description || merged.description,
    locationTag: locationTag || merged.locationTag,
    travelTime: travelTime || merged.travelTime,
    bestTime: bestTime || merged.bestTime,
    highlights: (highlights as string[] | null | undefined) ?? merged.highlights,
    content: (content as PortableTextBlock[] | null | undefined) ?? merged.content,
    faqs: faqs as CoveFaq[],
  }
}

/** Koy sayfaları build'de her dil için önceden üretilir (o dilin slug'ıyla; otomatik slug'lar middleware'de Türkçeye çevrilir). */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale: SiteLocale = isSiteLocale(params.locale) ? params.locale : 'tr'
  const rows = await client
    .fetch<Record<string, unknown>[]>(`*[_type == "cove" && defined(slug.current)]{ slug, translations }`)
    .catch(() => [] as Record<string, unknown>[])
  return rows.map((r) => coveSlugForLocale(r, locale)).filter((s): s is string => Boolean(s)).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale: loc, slug: rawSlug } = await params
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'tr'
  const ui = getCovesPageUiStrings(locale)
  const slug = decodeURIComponent(rawSlug)
  const raw = await fetchCove(slug)
  if (!raw) return { title: ui.notFoundTitle, robots: { index: false, follow: true } }

  const rawRec = raw as unknown as Record<string, unknown>
  const merged = mergeCoveForLocale(rawRec, locale) as unknown as CoveDetail
  const siteName = getSiteName()
  const manualSeo = coveFieldHasManualTranslation(rawRec, locale, 'seo')

  const baseTitle = merged.title?.trim() || ui.defaultCoveTitle
  const customMeta = merged.seo?.metaTitle?.trim()
  const titleText = customMeta || baseTitle
  const translated = locale === 'tr' || manualSeo || coveFieldHasManualTranslation(rawRec, locale, 'title')
    ? titleText
    : await translateText(titleText, locale)
  // Özel meta başlık yoksa: "Eşek Adası – Çeşme Koyları"
  const localizedTitle = customMeta ? translated : ui.metaTitlePattern(toTitleCase(translated, NUMBER_LOCALE[locale]))
  const pageTitle = localizedTitle.includes('|') || !siteName ? localizedTitle : `${localizedTitle} | ${siteName}`

  const descText = merged.seo?.metaDescription?.trim() || merged.description?.trim() || ''
  const localizedDesc = locale === 'tr' || manualSeo || coveFieldHasManualTranslation(rawRec, locale, 'description')
    ? descText
    : await translateText(descText, locale)
  const description = localizedDesc.replace(/\s+/g, ' ').slice(0, 160) || ui.metaDescriptionFallback

  const ogAsset = raw.seo?.ogImage?.asset ?? raw.image?.asset
  const image = ogAsset ? urlFor(ogAsset).width(1200).height(630).url() : undefined
  const localeSlug = coveSlugForLocale(rawRec, locale) ?? slug

  const base = buildPageMetadata({
    locale,
    path: `/koylar/${localeSlug}`,
    title: pageTitle,
    description,
    image,
    imageAlt: raw.image?.alt ?? baseTitle,
    type: 'article',
  })
  const localePaths = coveLocalePaths(rawRec)
  const languages = alternateLanguageAbsoluteUrls(`/koylar/${localeSlug}`, localePaths)
  const canonical = absoluteUrl(localePaths[locale] ?? withLocalePath(locale, `/koylar/${localeSlug}`))
  return {
    ...base,
    alternates: { canonical, languages },
    openGraph: { ...base.openGraph, url: canonical },
  }
}

const blockComponents = {
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-4 text-[16px] leading-[1.75] text-[var(--text-color,#58595b)] last:mb-0 sm:text-[17px]">{children}</p>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2
        className="mb-3 mt-8 text-[21px] font-extrabold uppercase leading-snug text-[var(--secondary,#131719)] first:mt-0 sm:text-[24px]"
        style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
      >
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3
        className="mb-2 mt-6 text-[18px] font-extrabold leading-snug text-[var(--secondary,#131719)]"
        style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
      >
        {children}
      </h3>
    ),
  },
  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <ul className="mb-4 list-disc space-y-1.5 pl-5 text-[16px] leading-[1.7] text-[var(--text-color,#58595b)] marker:text-[var(--primary,#2168b8)] sm:text-[17px]">
        {children}
      </ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-[16px] leading-[1.7] text-[var(--text-color,#58595b)] marker:font-bold marker:text-[var(--primary,#2168b8)] sm:text-[17px]">
        {children}
      </ol>
    ),
  },
}

export default async function CoveDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: loc, slug: rawSlug } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale
  const ui = getCovesPageUiStrings(locale)
  const slug = decodeURIComponent(rawSlug)

  const raw = await fetchCove(slug)
  if (!raw) notFound()

  // Başka bir dilin slug'ıyla gelindiyse o dilin kanonik adresine yönlendir.
  const rawRec = raw as unknown as Record<string, unknown>
  const localeSlug = coveSlugForLocale(rawRec, locale)
  if (localeSlug && localeSlug !== slug) {
    permanentRedirect(withLocalePath(locale, `/koylar/${localeSlug}`))
  }

  const [cove, pageRaw, othersRaw, toursRaw] = await Promise.all([
    localizeCove(raw, locale),
    client.fetch<Record<string, unknown> | null>(covesPageQuery, {}, opts).catch(() => null),
    client.fetch<OtherCove[]>(otherCovesQuery, { id: raw._id }, opts).catch(() => [] as OtherCove[]),
    raw.relatedTourIds?.length
      ? client.fetch<TourListRaw[]>(toursListQuery, {}, opts).catch(() => [] as TourListRaw[])
      : Promise.resolve([] as TourListRaw[]),
  ])

  const numberLocale = NUMBER_LOCALE[locale]
  const upper = (v: string) => v.trim().toLocaleUpperCase(numberLocale)
  const title = cove.title?.trim() || ui.defaultCoveTitle
  const coves = mergeCovesPageLocale(pageRaw, locale) as { title?: string | null } | null
  const covesTitle = coves?.title?.trim() || ui.pageTitleFallback
  const covesHref = withLocalePath(locale, '/koylar')
  const toursHref = withLocalePath(locale, '/turlar')
  const contactHref = withLocalePath(locale, '/iletisim')
  const pageHref = withLocalePath(locale, `/koylar/${localeSlug ?? slug}`)

  // Görseller: kapak + galeri (aynı görsel iki kez eklenmez).
  const imageList: { asset: NonNullable<NonNullable<SanityImage>['asset']>; alt: string }[] = []
  const seen = new Set<string>()
  for (const img of [cove.image, ...(cove.gallery ?? [])]) {
    const ref = img?.asset?._ref
    if (!img?.asset || !ref || seen.has(ref)) continue
    seen.add(ref)
    imageList.push({ asset: img.asset, alt: img.alt?.trim() || title })
  }
  const galleryImages = imageList.map((img) => ({
    url: urlFor(img.asset).width(1400).height(1000).auto('format').url(),
    fullUrl: urlFor(img.asset).width(2000).fit('max').auto('format').url(),
    alt: img.alt,
  }))

  const activities = (cove.activities ?? []).filter((a) => ui.activityLabels[a])
  const highlights = (cove.highlights ?? []).map((h) => h?.trim()).filter((h): h is string => !!h)
  const faqs = (cove.faqs ?? [])
    .map((f) => ({ question: f.question?.trim() ?? '', answer: f.answer?.trim() ?? '' }))
    .filter((f) => f.question && f.answer)
  const lat = cove.location?.lat
  const lng = cove.location?.lng
  const hasGeo = typeof lat === 'number' && typeof lng === 'number'
  const facts = [
    cove.travelTime?.trim() ? { Icon: Clock, label: ui.factTravel, value: cove.travelTime.trim() } : null,
    cove.bestTime?.trim() ? { Icon: CalendarDays, label: ui.factBestTime, value: cove.bestTime.trim() } : null,
  ].filter((f): f is { Icon: LucideIcon; label: string; value: string } => f != null)

  // İlgili turlar: Sanity'deki sıraya göre, tur listesi kartıyla aynı veri.
  const tourById = new Map(toursRaw.map((t) => [t._id, t]))
  const relatedTours: TourListItem[] = await Promise.all(
    (raw.relatedTourIds ?? [])
      .map((id) => tourById.get(id))
      .filter((t): t is TourListRaw => !!t && !!t.slug)
      .map(async (t) => {
        const rawItem = t as unknown as Record<string, unknown>
        const merged = mergeTourForLocale(rawItem, locale) as unknown as TourListRaw
        const qf = merged.quickFacts
        const [tTitle, shortDescription, departureLabel, durationLabel] = await Promise.all([
          tourFieldHasManualTranslation(rawItem, locale, 'title') ? merged.title : translateText(merged.title, locale),
          tourFieldHasManualTranslation(rawItem, locale, 'shortDescription')
            ? merged.shortDescription
            : translateText(merged.shortDescription, locale),
          translateText(qf?.meetingLocation?.trim() || merged.departureLabel, locale),
          translateText(qf?.durationText?.trim() || merged.durationLabel, locale),
        ])
        return {
          _id: merged._id,
          title: tTitle || merged.title,
          slug: merged.slug,
          shortDescription,
          rating: merged.rating,
          reviewCount: merged.reviewCount,
          reviewsUrl: merged.reviewsUrl ?? null,
          isPopular: merged.isPopular,
          cardDiscount: merged.cardDiscount ?? null,
          departureLabel: departureLabel || null,
          durationLabel: durationLabel || null,
          priceFrom: merged.priceFrom,
          coverImageUrl: tourCoverImageUrl(merged.mainImage?.asset ?? null),
          coverImageAlt: merged.mainImage?.alt ?? null,
        }
      }),
  )

  const others = othersRaw
    .map((c) => {
      const r = c as unknown as Record<string, unknown>
      const m = mergeCoveForLocale(r, locale) as unknown as OtherCove
      const s = coveSlugForLocale(r, locale)
      if (!s) return null
      const t = m.title?.trim() || ui.defaultCoveTitle
      return {
        id: m._id,
        title: t,
        description: m.description ?? null,
        imageUrl: m.image?.asset ? urlFor(m.image.asset).width(900).height(675).auto('format').url() : null,
        alt: m.image?.alt,
        locationTag: m.locationTag,
        href: withLocalePath(locale, `/koylar/${s}`),
        ariaLabel: ui.cardAriaLabel(t),
      }
    })
    .filter((c): c is NonNullable<typeof c> => c != null)

  // ── Yapılandırılmış veri ──
  const breadcrumbLd = buildBreadcrumbSchema([
    { name: ui.breadcrumbHome, url: withLocalePath(locale, '/') },
    { name: covesTitle, url: covesHref },
    { name: title, url: pageHref },
  ])
  const attractionLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: title,
    url: absoluteUrl(pageHref),
    ...(cove.description?.trim() ? { description: cove.description.trim() } : {}),
    ...(galleryImages.length ? { image: galleryImages.slice(0, 6).map((g) => g.url) } : {}),
    ...(hasGeo ? { geo: { '@type': 'GeoCoordinates', latitude: lat, longitude: lng } } : {}),
    containedInPlace: { '@type': 'Place', name: 'Çeşme, İzmir, Türkiye' },
    isAccessibleForFree: true,
    publicAccess: true,
    ...(activities.length ? { touristType: activities.map((a) => ui.activityLabels[a]) } : {}),
  }
  const faqLd = faqs.length ? buildFAQSchema(faqs, { url: absoluteUrl(pageHref) }) : null

  const headingFont = { fontFamily: 'var(--font-family-title, var(--font-family))' }
  const hasContent = Boolean(cove.content?.length)
  const hasMainColumn = hasContent || highlights.length > 0 || hasGeo || faqs.length > 0

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={attractionLd} />
      {faqLd && <JsonLd data={faqLd} />}

      <article>
        {/* ── Başlık ── */}
        <header className="mx-auto max-w-[1200px] px-4 pt-6 sm:pt-8 md:pt-10">
          <nav aria-label="Breadcrumb" className="mb-5 md:mb-7">
            <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-[var(--muted,#81848b)]">
              <li>
                <Link href={withLocalePath(locale, '/')} className="transition hover:text-[var(--primary,#2168b8)]">
                  {ui.breadcrumbHome}
                </Link>
              </li>
              <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
              <li>
                <Link href={covesHref} className="transition hover:text-[var(--primary,#2168b8)]">
                  {covesTitle}
                </Link>
              </li>
              <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
              <li className="text-[var(--secondary,#131719)]" aria-current="page">{title}</li>
            </ol>
          </nav>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
            <div className="max-w-3xl">
              {cove.locationTag?.trim() && (
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#d3dce6] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[var(--secondary,#131719)]">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
                  {cove.locationTag.trim()}
                </span>
              )}
              <h1
                className="m-0 text-[32px] font-black uppercase leading-[1.05] tracking-[-0.01em] text-[var(--secondary,#131719)] sm:text-[44px] md:text-[52px]"
                style={headingFont}
              >
                {upper(title)}
              </h1>
              {cove.description?.trim() && (
                <p className="mt-4 text-[16px] leading-relaxed text-[var(--text-color,#58595b)] sm:text-[18px]">
                  {cove.description.trim()}
                </p>
              )}
            </div>
            <Link
              href={toursHref}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-[var(--primary,#2168b8)] px-6 text-[14px] font-extrabold uppercase tracking-wide text-white transition hover:brightness-110 md:self-end"
            >
              {ui.toursCta}
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
            </Link>
          </div>
        </header>

        {/* ── Görseller ── */}
        {galleryImages.length > 0 && (
          <div className="mx-auto mt-8 max-w-[1200px] px-4 md:mt-10">
            <CoveGallery
              images={galleryImages}
              showAllLabel={ui.galleryShowAll(galleryImages.length)}
              prevLabel={ui.galleryPrev}
              nextLabel={ui.galleryNext}
              closeLabel={ui.closeAria}
            />
          </div>
        )}

        {/* ── Kısa bilgiler + aktiviteler ── */}
        {(facts.length > 0 || activities.length > 0) && (
          <div className="mx-auto mt-8 max-w-[1200px] px-4 md:mt-10">
            <div className="grid gap-6 border-y border-[#e8edf3] py-6 md:grid-cols-[auto_1fr] md:items-center md:gap-10">
              {facts.length > 0 && (
                <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3 md:flex md:gap-10">
                  {facts.map(({ Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-6 w-6 shrink-0 text-[var(--secondary,#131719)]" strokeWidth={1.8} aria-hidden />
                      <div className="min-w-0">
                        <dt className="text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--muted,#81848b)]">{label}</dt>
                        <dd className="m-0 text-[15px] font-extrabold leading-snug text-[var(--secondary,#131719)]">{value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              )}
              {activities.length > 0 && (
                <div className={facts.length > 0 ? 'md:border-l md:border-[#e8edf3] md:pl-10' : ''}>
                  <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--muted,#81848b)]">
                    {ui.activitiesTitle}
                  </p>
                  <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                    {activities.map((a) => {
                      const Icon = ACTIVITY_ICONS[a] ?? Waves
                      return (
                        <li
                          key={a}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#d3dce6] px-3 py-1.5 text-[13px] font-bold text-[var(--secondary,#131719)]"
                        >
                          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                          {ui.activityLabels[a]}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── İçerik + yan kart ── */}
        <div className="mx-auto mt-12 max-w-[1200px] px-4 md:mt-16">
          <div className={`grid grid-cols-1 gap-12 ${hasMainColumn ? 'lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16' : ''}`}>
            {hasMainColumn && (
              <div className="min-w-0 space-y-14">
                {hasContent && (
                  <ScrollReveal>
                    <section>
                      <h2 className="tourSectionHeading">{upper(ui.aboutTitle(title))}</h2>
                      <div className="max-w-[68ch]">
                        <PortableText value={cove.content as PortableTextBlock[]} components={blockComponents} />
                      </div>
                    </section>
                  </ScrollReveal>
                )}

                {highlights.length > 0 && (
                  <ScrollReveal>
                    <section>
                      <h2 className="tourSectionHeading">{upper(ui.highlightsTitle)}</h2>
                      <ul className="m-0 grid list-none grid-cols-1 gap-x-8 gap-y-3 p-0 sm:grid-cols-2">
                        {highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed text-[var(--secondary,#131719)]">
                            <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#16a34a]" strokeWidth={2.6} aria-hidden />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </ScrollReveal>
                )}

                {hasGeo && (
                  <ScrollReveal>
                    <section>
                      <h2 className="tourSectionHeading">{upper(ui.mapTitle)}</h2>
                      <div className="overflow-hidden rounded-2xl border border-[#d3dce6]">
                        <iframe
                          title={`${title} — ${ui.mapTitle}`}
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.04}%2C${lat - 0.025}%2C${lng + 0.04}%2C${lat + 0.025}&layer=mapnik&marker=${lat}%2C${lng}`}
                          className="block h-[320px] w-full sm:h-[380px]"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-extrabold uppercase tracking-wide text-[var(--primary,#2168b8)] hover:underline"
                      >
                        {ui.openInMaps}
                        <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
                      </a>
                    </section>
                  </ScrollReveal>
                )}

                {faqs.length > 0 && (
                  <ScrollReveal>
                    <section>
                      <h2 className="tourSectionHeading">{upper(ui.faqTitle)}</h2>
                      <div className="border-t border-[#e8edf3]">
                        {faqs.map((f, i) => (
                          <details key={i} className="group border-b border-[#e8edf3]">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[16px] font-extrabold text-[var(--secondary,#131719)] [&::-webkit-details-marker]:hidden">
                              {f.question}
                              <Plus
                                className="h-5 w-5 shrink-0 transition-transform duration-300 group-open:rotate-45"
                                strokeWidth={2.4}
                                aria-hidden
                              />
                            </summary>
                            <p className="m-0 whitespace-pre-line pb-5 pr-8 text-[15px] leading-relaxed text-[var(--text-color,#58595b)]">
                              {f.answer}
                            </p>
                          </details>
                        ))}
                      </div>
                    </section>
                  </ScrollReveal>
                )}
              </div>
            )}

            {/* Yan kart: masaüstünde yapışkan. */}
            {/* Detay içerik yoksa yan kart yerine tam genişlikte yatay bant. */}
            <aside className={hasMainColumn ? 'lg:sticky lg:top-28 lg:self-start' : ''}>
              <div
                className={`rounded-2xl border border-[#d3dce6] bg-[#f7f8fa] p-6 ${hasMainColumn ? '' : 'md:flex md:items-center md:justify-between md:gap-10 md:px-8 md:py-7'}`}
              >
                <div>
                  <h2 className="m-0 text-[19px] font-extrabold uppercase leading-snug text-[var(--secondary,#131719)]" style={headingFont}>
                    {ui.asideTitle}
                  </h2>
                  <p className={`mt-2 text-[14px] leading-relaxed text-[var(--text-color,#58595b)] ${hasMainColumn ? 'mb-5' : 'mb-5 md:mb-0'}`}>{ui.asideBody}</p>
                </div>
                <div className={`flex gap-2.5 ${hasMainColumn ? 'flex-col' : 'flex-col sm:flex-row md:shrink-0 [&>a]:sm:px-6'}`}>
                  <Link
                    href={toursHref}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--primary,#2168b8)] text-[14px] font-extrabold uppercase tracking-wide text-white transition hover:brightness-110"
                  >
                    {ui.toursCta}
                    <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                  </Link>
                  <Link
                    href={contactHref}
                    className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-[var(--primary,#2168b8)] bg-white text-[14px] font-extrabold uppercase tracking-wide text-[var(--primary,#2168b8)] transition hover:bg-[var(--primary,#2168b8)]/[0.06]"
                  >
                    {ui.contactCta}
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {/* ── Bu koya uğrayan turlar ── */}
      {relatedTours.length > 0 && (
        <section className="mt-16 w-full bg-[#f4f7fb] py-14 md:mt-24 md:py-16">
          <div className="mx-auto max-w-[1200px] px-4">
            <h2 className="tourSectionHeading">{upper(ui.relatedToursTitle)}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedTours.map((tour) => (
                <TourCard key={tour._id} tour={tour} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Diğer koylar ── */}
      {others.length > 0 && (
        <section className={`w-full pb-16 md:pb-24 ${relatedTours.length > 0 ? 'pt-14 md:pt-16' : 'mt-16 md:mt-24'}`}>
          <div className="mx-auto max-w-[1200px] px-4">
            <div className="flex items-end justify-between gap-4">
              <h2 className="tourSectionHeading">{upper(ui.otherCovesTitle)}</h2>
              <Link
                href={covesHref}
                className="mb-4 inline-flex shrink-0 items-center gap-1.5 text-[13px] font-extrabold uppercase tracking-wide text-[var(--primary,#2168b8)] hover:underline sm:mb-5"
              >
                {ui.allCoves}
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              </Link>
            </div>
            <CovesGrid items={others} noImageLabel={ui.noImage} detailHint={ui.exploreLabel} showIndex={false} />
          </div>
        </section>
      )}
    </div>
  )
}
