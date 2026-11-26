import { notFound } from 'next/navigation'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import { Clock, Ship, Check, Minus } from 'lucide-react'
import { client } from '@/lib/sanity'
import { ferryRouteQuery, siteSettingsWhatsappQuery } from '@/lib/queries'
import { tourGalleryHeroImageUrl } from '@/lib/sanityImage'
import PhotoGrid from '@/components/PhotoGrid'
import type { PhotoGridImage } from '@/components/PhotoGrid'
import FAQAccordion from '@/components/FAQAccordion'
import FerryBookingSidebar from '@/components/ferry/FerryBookingSidebar'
import { buildWhatsAppHref } from '@/lib/buildWhatsAppHref'
import { buildPageMetadata } from '@/lib/seo/buildPageMetadata'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { getFerryPageUiStrings } from '@/lib/i18n/strings/ferryPage'
import { mergeFerryRouteLocale } from '@/lib/i18n/mergeFerryRouteLocale'
import StandardPageLd from '@/components/seo/StandardPageLd'
import FerryVesselFares from '@/components/ferry/FerryVesselFares'
import FerryIslandGuide from '@/components/ferry/FerryIslandGuide'
import { cheapestVessel, vesselAgeTiers } from '@/components/ferry/ferryTypes'
import { getTuryolRoute, TURYOL_FARES_PERIOD, TURYOL_ROUTES, type TuryolRoute } from '@/lib/ferry/turyolRoutes'
import { getIslandGuide, ISLAND_PHOTOS, type IslandPhotoKey } from '@/lib/ferry/islandGuides'

type SanityImageish = {
  asset?: { _ref?: string }
  url?: string
  metadata?: { lqip?: string; dimensions?: { width: number; height: number } }
  alt?: string | null
}

type FerryRouteData = {
  _id: string
  title: string
  slug: string
  isActive?: boolean | null
  seo?: { metaTitle?: string | null; metaDescription?: string | null } | null
  mainImage?: SanityImageish | null
  gallery?: SanityImageish[] | null
  durationLabel?: string | null
  routeLabel?: string | null
  departurePort?: string | null
  arrivalPort?: string | null
  currency?: string | null
  ageTiers?: Array<{
    key: string
    label: string
    minAge?: number | null
    maxAge?: number | null
    roundTripPrice: number
    oneWayDeparturePrice: number
    oneWayReturnPrice: number
  }> | null
  cashNote?: string | null
  extraFees?: Array<{ label?: string | null; amount?: string | null }> | null
  bookingBullets?: string[] | null
  ctaButtonLabel?: string | null
  whatsappMessage?: string | null
  aboutTitle?: string | null
  aboutBody?: PortableTextBlock[] | null
  video?: {
    enabled?: boolean | null
    type?: 'youtube' | 'vimeo' | null
    youtubeUrl?: string | null
    vimeoUrl?: string | null
    caption?: string | null
  } | null
  knowBeforeYouGoTitle?: string | null
  knowBeforeYouGo?: Array<{ title?: string | null; body?: string | null }> | null
  included?: string[] | null
  notIncluded?: string[] | null
  faqs?: Array<{ question: string; answer: string }> | null
  translations?: unknown
  /** Sanity belgesi olmayan Turyol hatlarında galerideki ada fotoğrafları (kaynak satırı için). */
  catalogImages?: IslandPhotoKey[] | null
}

function getVideoEmbedUrl(video: FerryRouteData['video']): string | null {
  if (!video?.enabled || !video.type) return null
  if (video.type === 'youtube' && video.youtubeUrl) {
    const id = video.youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]
    return id ? `https://www.youtube.com/embed/${id}` : null
  }
  if (video.type === 'vimeo' && video.vimeoUrl) {
    const id = video.vimeoUrl.match(/(?:vimeo\.com\/)(\d+)/)?.[1]
    return id ? `https://player.vimeo.com/video/${id}` : null
  }
  return null
}

function buildGalleryImages(
  data: FerryRouteData,
  ui: ReturnType<typeof getFerryPageUiStrings>,
): PhotoGridImage[] {
  const main = data.mainImage?.asset || data.mainImage?.url ? [data.mainImage] : []
  const gallery = data.gallery ?? []
  const all = [...main, ...gallery].filter((img): img is SanityImageish => Boolean(img?.asset || img?.url))
  return all
    .map((img, i) => ({
      src: (img.asset ? tourGalleryHeroImageUrl(img.asset) : null) ?? img.url ?? '',
      blurDataURL: img.metadata?.lqip ?? null,
      alt: img.alt?.trim() || ui.galleryImageAlt(data.title, i),
    }))
    .filter((row) => row.src.length > 0)
}

function textBlock(text: string, i: number): PortableTextBlock {
  return {
    _type: 'block',
    _key: `p${i}`,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `s${i}`, text, marks: [] }],
  }
}

/** Sanity'de belgesi olmayan Turyol hatları (lib/ferry/turyolRoutes.ts) için sayfa verisi. */
function ferryRouteFromCatalog(route: TuryolRoute, locale: SiteLocale): FerryRouteData | null {
  if (!route.page) return null
  const t = route.page.texts[locale] ?? route.page.texts.tr
  const [main, ...rest] = route.page.images.map((key) => ({
    url: ISLAND_PHOTOS[key].src,
    alt: ISLAND_PHOTOS[key].caption[locale],
  }))
  return {
    _id: `ferry-${route.slug}`,
    title: t.title,
    slug: route.slug,
    isActive: true,
    seo: { metaDescription: t.metaDescription },
    mainImage: main ?? null,
    gallery: rest,
    durationLabel: t.durationLabel,
    routeLabel: t.routeLabel,
    departurePort: t.departurePort,
    arrivalPort: t.arrivalPort,
    currency: '€',
    bookingBullets: t.bookingBullets,
    aboutBody: t.about.map(textBlock),
    knowBeforeYouGo: t.knowBefore,
    included: t.included,
    notIncluded: t.notIncluded,
    faqs: t.faqs,
    catalogImages: route.page.images,
  }
}

async function getFerryRoute(slug: string, locale: SiteLocale): Promise<FerryRouteData | null> {
  let raw: FerryRouteData | null = null
  try {
    raw = await client.fetch<FerryRouteData | null>(ferryRouteQuery, { slug }, { useCdn: false })
  } catch {
    raw = null
  }
  if (raw) return mergeFerryRouteLocale(raw as unknown as Record<string, unknown>, locale) as unknown as FerryRouteData
  const catalog = getTuryolRoute(slug)
  return catalog ? ferryRouteFromCatalog(catalog, locale) : null
}

/** Feribot hattı sayfaları build'de önceden üretilir (iç rota her dilde Türkçe slug). */
export async function generateStaticParams() {
  const slugs = await client
    .fetch<string[]>(`*[_type == "ferryRoute" && isActive != false && defined(slug.current)].slug.current`)
    .catch(() => [] as string[])
  const catalogSlugs = TURYOL_ROUTES.filter((r) => r.page).map((r) => r.slug)
  return Array.from(new Set([...slugs, ...catalogSlugs])).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: loc, slug } = await params
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'tr'
  const ui = getFerryPageUiStrings(locale)
  const data = await getFerryRoute(slug, locale)
  const title = data?.seo?.metaTitle?.trim() || data?.title || ui.defaultTitle
  // Sanity'deki açıklama çok kısaysa (ör. 26 karakter) dilin genel feribot metni.
  const seoDescription = data?.seo?.metaDescription?.trim() ?? ''
  const description = seoDescription.length >= 70 ? seoDescription : ui.defaultMetaDescription
  const image = data?.mainImage?.asset
    ? tourGalleryHeroImageUrl(data.mainImage.asset)
    : data?.mainImage?.url
  return buildPageMetadata({
    locale,
    path: `/feribot/${slug}`,
    title,
    description,
    image: image ?? undefined,
    imageAlt: data?.mainImage?.alt ?? data?.title ?? undefined,
  })
}

export default async function FerryRoutePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: loc, slug } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale
  const ui = getFerryPageUiStrings(locale)

  const data = await getFerryRoute(slug, locale)
  if (!data || data.isActive === false) notFound()

  const galleryImages = buildGalleryImages(data, ui)
  const videoEmbedUrl = getVideoEmbedUrl(data.video)

  let whatsappNumber: string | null = null
  try {
    const s = await client.fetch<{ whatsapp?: string | null } | null>(
      siteSettingsWhatsappQuery,
      {},
      { useCdn: false },
    )
    whatsappNumber = s?.whatsapp ?? null
  } catch {
    whatsappNumber = null
  }
  const baseWaHref = buildWhatsAppHref(whatsappNumber)
  const waMessage =
    data.whatsappMessage?.trim() ||
    (locale === 'tr'
      ? `Merhaba, ${data.title} hakkında bilgi almak istiyorum.`
      : locale === 'de'
        ? `Hallo, ich möchte Informationen zu ${data.title}.`
        : `Hi, I'd like some information about ${data.title}.`)
  const ctaHref = baseWaHref ? `${baseWaHref}?text=${encodeURIComponent(waMessage)}` : '#'

  const ctaLabel = data.ctaButtonLabel?.trim() || ui.defaultCtaLabel
  const aboutTitle = data.aboutTitle?.trim() || ui.defaultAboutTitle
  const knowBeforeYouGoTitle = data.knowBeforeYouGoTitle?.trim() || ui.defaultKnowBeforeYouGoTitle
  const hasKnowBeforeYouGo = Array.isArray(data.knowBeforeYouGo) && data.knowBeforeYouGo.length > 0
  const hasIncluded = Array.isArray(data.included) && data.included.length > 0
  const hasNotIncluded = Array.isArray(data.notIncluded) && data.notIncluded.length > 0
  // Turyol hatlarında fiyatlar teknelere göre (€) — Sanity'deki yaş grubu fiyatları yerine.
  const turyol = getTuryolRoute(slug)
  const vessels = turyol?.vessels ?? []
  const fromVessel = cheapestVessel(vessels)
  const ageTiers = fromVessel ? vesselAgeTiers(fromVessel, locale) : data.ageTiers ?? []
  const currency = fromVessel ? '€' : data.currency?.trim() || '€'
  const islandGuide = turyol ? getIslandGuide(turyol.island, locale) : null
  const islandCreditPhotos: IslandPhotoKey[] = [
    ...(data.catalogImages ?? []),
    ...(islandGuide?.mustSee.flatMap((item) => (item.photo ? [item.photo] : [])) ?? []),
  ]
  const departurePort = data.departurePort?.trim() || data.routeLabel?.split('↔')[0]?.trim() || ''
  const arrivalPort = data.arrivalPort?.trim() || data.routeLabel?.split('↔')[1]?.trim() || ''
  const importantNotes = (data.knowBeforeYouGo ?? [])
    .map((item) => item.body?.trim())
    .filter((t): t is string => !!t)

  return (
    <div className="min-h-screen bg-white">
      <StandardPageLd
        type="WebPage"
        locale={locale}
        path={`/feribot/${slug}`}
        name={data.title}
        crumbs={[{ name: ui.listMetaTitle, path: '/feribot' }]}
      />
      {galleryImages.length > 0 && (
        <div className="w-full mb-0">
          <PhotoGrid images={galleryImages} tourTitle={data.title} locale={locale} />
        </div>
      )}

      <div className="container mx-auto px-4 pt-10 pb-16 max-w-[1360px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <div className="flex-1 min-w-0">
            <header className="mb-6 border-b border-black/10 pb-5">
              <h1
                className="m-0 mb-4 text-[24px] font-black uppercase leading-[1.2] sm:text-[30px] md:text-[36px]"
                style={{
                  fontFamily: 'var(--font-family-title, var(--font-family))',
                  WebkitTextStroke: '0.5px currentColor',
                  color: 'var(--title-color, var(--primary, #2168b8))',
                }}
              >
                {data.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {data.durationLabel && (
                  <span className="inline-flex items-center gap-2 text-[15px] font-bold uppercase tracking-wide text-[#1a1a2e]">
                    <Clock className="h-[18px] w-[18px] flex-shrink-0 text-[#52525b]" strokeWidth={2} aria-hidden />
                    {data.durationLabel}
                  </span>
                )}
                {data.routeLabel && (
                  <span className="inline-flex items-center gap-2 text-[15px] font-bold uppercase tracking-wide text-[#1a1a2e]">
                    <Ship className="h-[18px] w-[18px] flex-shrink-0 text-[#52525b]" strokeWidth={2} aria-hidden />
                    {data.routeLabel}
                  </span>
                )}
              </div>
            </header>

            {vessels.length > 0 && (
              <FerryVesselFares vessels={vessels} period={TURYOL_FARES_PERIOD} locale={locale} />
            )}

            {aboutTitle && (
              <section className="mb-10">
                <h2
                  className="m-0 mb-4 text-[19px] font-extrabold uppercase leading-[1.25]"
                  style={{
                    fontFamily: 'var(--font-family-title, var(--font-family))',
                    WebkitTextStroke: '0.4px currentColor',
                    color: 'var(--secondary, #131719)',
                  }}
                >
                  {aboutTitle}
                </h2>
                {Array.isArray(data.aboutBody) && data.aboutBody.length > 0 && (
                  <div
                    className="space-y-4 text-[15.5px] leading-relaxed text-[#3f3f46]"
                    style={{ fontFamily: 'var(--font-family)' }}
                  >
                    <PortableText value={data.aboutBody} />
                  </div>
                )}
              </section>
            )}

            {islandGuide && (
              <FerryIslandGuide guide={islandGuide} creditPhotos={islandCreditPhotos} locale={locale} />
            )}

            {videoEmbedUrl && (
              <section className="mb-10">
                <div className="overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: '16 / 9' }}>
                  <iframe
                    src={videoEmbedUrl}
                    title={data.video?.caption || data.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                {data.video?.caption && (
                  <p className="mt-2 text-sm text-zinc-500">{data.video.caption}</p>
                )}
              </section>
            )}

            {hasKnowBeforeYouGo && (
              <section className="mb-10">
                <h2
                  className="m-0 mb-4 text-[19px] font-extrabold uppercase leading-[1.25]"
                  style={{
                    fontFamily: 'var(--font-family-title, var(--font-family))',
                    WebkitTextStroke: '0.4px currentColor',
                    color: 'var(--secondary, #131719)',
                  }}
                >
                  {knowBeforeYouGoTitle}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {data.knowBeforeYouGo!.map((item, i) => (
                    <div key={i} className="rounded-xl border border-zinc-200 p-4">
                      {item.title && (
                        <div className="mb-1.5 text-[15px] font-bold text-[#131719]">{item.title}</div>
                      )}
                      {item.body && (
                        <p className="m-0 text-[14.5px] leading-relaxed text-[#52525b]">{item.body}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(hasIncluded || hasNotIncluded) && (
              <section className="mb-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
                {hasIncluded && (
                  <div>
                    <h3 className="m-0 mb-3 text-[15px] font-extrabold uppercase tracking-wide text-[#131719]">
                      {ui.includedTitle}
                    </h3>
                    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                      {data.included!.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[14.5px] text-[#1e293b]">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#16a34a]" strokeWidth={2.5} aria-hidden />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {hasNotIncluded && (
                  <div>
                    <h3 className="m-0 mb-3 text-[15px] font-extrabold uppercase tracking-wide text-[#131719]">
                      {ui.notIncludedTitle}
                    </h3>
                    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                      {data.notIncluded!.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[14.5px] text-[#64748b]">
                          <Minus className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#94a3b8]" strokeWidth={2.5} aria-hidden />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {Array.isArray(data.faqs) && data.faqs.length > 0 && (
              <FAQAccordion
                faqs={data.faqs}
                locale={locale}
                title={ui.faqTitle}
                whatsappUrl={ctaHref}
              />
            )}
          </div>

          <FerryBookingSidebar
            title={ui.bookingCardTitle}
            ferryTitle={data.title}
            ageTiers={ageTiers}
            vessels={vessels}
            currency={currency}
            numberLocale={ui.numberLocale}
            departurePort={departurePort}
            arrivalPort={arrivalPort}
            cashNote={data.cashNote}
            extraFees={data.extraFees}
            bulletItems={data.bookingBullets}
            importantNotes={importantNotes}
            notesTitle={knowBeforeYouGoTitle}
            ctaLabel={ctaLabel}
            waBaseHref={baseWaHref}
            locale={locale}
          />
        </div>
      </div>
    </div>
  )
}
