import { client, urlFor } from '@/lib/sanity'
import { aboutPageMetaQuery, aboutPageQuery } from '@/lib/queries'
import { Anchor, ArrowRight, BadgeCheck, CloudSun, RotateCcw, Sailboat } from 'lucide-react'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import Image from 'next/image'
import Link from 'next/link'
import { withLocalePath } from '@/lib/i18n/paths'
import { getSiteName } from '@/lib/seo'
import { buildPageMetadata } from '@/lib/seo/buildPageMetadata'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import {
  aboutBoatFieldHasManualTranslation,
  aboutFieldHasManualTranslation,
  mergeAboutPageLocale,
  mergeAboutPageSeoForLocale,
} from '@/lib/i18n/mergeAboutPageLocale'
import { getAboutPageUiStrings, ABOUT_TIMELINE_HEADING } from '@/lib/i18n/strings/aboutPage'
import { translatePortableTextBlocks, translateText } from '@/lib/i18n/runtimeTranslate'
import ScrollReveal from '@/components/ui/ScrollReveal'
import FleetTimeline from '@/components/about/FleetTimeline'
import CountUpStat from '@/components/about/CountUpStat'
import ExpandableBlock from '@/components/about/ExpandableBlock'

/** Hero altındaki kompakt istatistik şeridi için — tur/koy sayısı ayrı,
    hafif "count()" sorguları (tüm belgeleri çekmeden) — hepsi gerçek. */
const tourCountQuery = `count(*[_type == "tour" && defined(slug.current)])`
const coveCountQuery = `count(*[_type == "cove"])`

export const dynamic = 'force-dynamic'

type BoatItem = {
  year?: string | null
  name?: string | null
  description?: string | null
  order?: number | null
  isActive?: boolean | null
  image?: { asset?: { _ref: string }; alt?: string | null } | null
}

type AboutPageData = {
  slug?: string | null
  seo?: { metaTitle?: string | null; metaDescription?: string | null } | null
  pageTranslations?: { en?: Record<string, unknown>; de?: Record<string, unknown>; ru?: Record<string, unknown> }
  titleTop?: string | null
  titleBottom?: string | null
  heroLogo?: { asset?: { _ref: string }; alt?: string | null } | null
  intro?: PortableTextBlock[] | null
  sectionTitle?: string | null
  sectionSubtitle?: string | null
  sectionBody?: PortableTextBlock[] | null
  timelineTitle?: string | null
  timelineDescription?: string | null
  boats?: BoatItem[] | null
}

const headingBase = {
  fontFamily: 'var(--font-family-title, var(--font-family))',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  color: 'var(--secondary, #131719)',
}

const defaultBlockComponents = {
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p
        className="text-[17px] mb-4 last:mb-0"
        style={{ color: 'var(--text-color, #58595b)', lineHeight: 1.62 }}
      >
        {children}
      </p>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2
        className="text-[24px] leading-[1.3] mb-4 mt-2"
        style={headingBase}
      >
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3
        className="text-[19px] leading-[1.3] mb-3 mt-6"
        style={headingBase}
      >
        {children}
      </h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
      <h4
        className="text-[17px] leading-[1.3] mb-2 mt-5"
        style={headingBase}
      >
        {children}
      </h4>
    ),
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: loc } = await params
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'tr'
  const ui = getAboutPageUiStrings(locale)
  const siteName = getSiteName()

  try {
    const row = await client.fetch<{
      seo?: { metaTitle?: string | null; metaDescription?: string | null } | null
      pageTranslations?: { en?: Record<string, unknown>; de?: Record<string, unknown>; ru?: Record<string, unknown> }
    } | null>(aboutPageMetaQuery, {}, { useCdn: false })
    const merged = mergeAboutPageSeoForLocale(
      row?.seo as Record<string, unknown> | undefined,
      row?.pageTranslations,
      locale,
    )
    // Editör pageTranslations.en/.de.seo'ya elle çeviri girmemişse anlık çeviriyle doldur.
    const patchSeo = (
      locale === 'en'
        ? row?.pageTranslations?.en?.seo
        : locale === 'de'
          ? row?.pageTranslations?.de?.seo
          : row?.pageTranslations?.ru?.seo
    ) as { metaTitle?: string; metaDescription?: string } | undefined
    const hasManualTitle = !!patchSeo?.metaTitle?.trim()
    const hasManualDescription = !!patchSeo?.metaDescription?.trim()
    const [translatedTitle, translatedDescription] =
      locale === 'tr'
        ? [merged.metaTitle, merged.metaDescription]
        : await Promise.all([
            !hasManualTitle && merged.metaTitle?.trim()
              ? translateText(merged.metaTitle, locale)
              : merged.metaTitle,
            !hasManualDescription && merged.metaDescription?.trim()
              ? translateText(merged.metaDescription, locale)
              : merged.metaDescription,
          ])
    const titleBase = translatedTitle?.trim() || ui.metaTitleFallback
    const description =
      translatedDescription?.trim()?.slice(0, 160) || ui.metaDescriptionFallback
    const title =
      titleBase.includes('|') || !siteName ? titleBase : `${titleBase} | ${siteName}`
    return buildPageMetadata({ locale, path: '/hakkimizda', title, description })
  } catch {
    const title = siteName ? `${ui.metaTitleFallback} | ${siteName}` : ui.metaTitleFallback
    return buildPageMetadata({
      locale,
      path: '/hakkimizda',
      title,
      description: ui.metaDescriptionFallback,
    })
  }
}

export default async function HakkimizdaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale
  const ui = getAboutPageUiStrings(locale)

  let raw: AboutPageData | null = null
  let rawFetched: Record<string, unknown> | null = null
  try {
    const fetched = await client.fetch<AboutPageData | null>(aboutPageQuery, {}, { useCdn: false })
    rawFetched = fetched as unknown as Record<string, unknown>
    raw = mergeAboutPageLocale(fetched as unknown as Record<string, unknown>, locale) as AboutPageData | null
  } catch {
    raw = null
  }

  // Hero altındaki kompakt istatistik şeridi için gerçek tur/koy sayısı.
  let tourCount = 0
  let coveCount = 0
  try {
    ;[tourCount, coveCount] = await Promise.all([
      client.fetch<number>(tourCountQuery, {}, { useCdn: false }),
      client.fetch<number>(coveCountQuery, {}, { useCdn: false }),
    ])
  } catch {
    tourCount = 0
    coveCount = 0
  }

  let data = raw

  // Editör pageTranslations.en/.de'ye elle çeviri girmemişse, anlık makine
  // çevirisiyle doldur (aksi halde Almanca/İngilizce sayfa Türkçe kalır).
  if (data && rawFetched && locale !== 'tr') {
    const rawForTranslation = rawFetched
    const [
      titleTop,
      titleBottom,
      sectionTitle,
      sectionSubtitle,
      timelineTitle,
      timelineDescription,
      intro,
      sectionBody,
      boats,
    ] = await Promise.all([
      aboutFieldHasManualTranslation(rawForTranslation, locale, 'titleTop')
        ? data.titleTop
        : translateText(data.titleTop, locale),
      aboutFieldHasManualTranslation(rawForTranslation, locale, 'titleBottom')
        ? data.titleBottom
        : translateText(data.titleBottom, locale),
      aboutFieldHasManualTranslation(rawForTranslation, locale, 'sectionTitle')
        ? data.sectionTitle
        : translateText(data.sectionTitle, locale),
      aboutFieldHasManualTranslation(rawForTranslation, locale, 'sectionSubtitle')
        ? data.sectionSubtitle
        : translateText(data.sectionSubtitle, locale),
      aboutFieldHasManualTranslation(rawForTranslation, locale, 'timelineTitle')
        ? data.timelineTitle
        : translateText(data.timelineTitle, locale),
      aboutFieldHasManualTranslation(rawForTranslation, locale, 'timelineDescription')
        ? data.timelineDescription
        : translateText(data.timelineDescription, locale),
      aboutFieldHasManualTranslation(rawForTranslation, locale, 'intro')
        ? data.intro
        : translatePortableTextBlocks(data.intro, locale),
      aboutFieldHasManualTranslation(rawForTranslation, locale, 'sectionBody')
        ? data.sectionBody
        : translatePortableTextBlocks(data.sectionBody, locale),
      Promise.all(
        (data.boats ?? []).map(async (b, i) => ({
          ...b,
          name: aboutBoatFieldHasManualTranslation(rawForTranslation, locale, i, 'name')
            ? b.name
            : await translateText(b.name, locale),
          description: aboutBoatFieldHasManualTranslation(rawForTranslation, locale, i, 'description')
            ? b.description
            : await translateText(b.description, locale),
        }))
      ),
    ])
    data = {
      ...data,
      titleTop: titleTop || data.titleTop,
      titleBottom: titleBottom || data.titleBottom,
      sectionTitle: sectionTitle || data.sectionTitle,
      sectionSubtitle: sectionSubtitle || data.sectionSubtitle,
      timelineTitle: timelineTitle || data.timelineTitle,
      timelineDescription: timelineDescription || data.timelineDescription,
      intro: intro ?? data.intro,
      sectionBody: sectionBody ?? data.sectionBody,
      boats,
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <p className="text-black/60 text-center" style={{ fontFamily: 'var(--font-family)' }}>
          {ui.loadError}
        </p>
      </div>
    )
  }

  const boats = (data.boats ?? [])
    .filter((b) => b.isActive !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((b) => ({
      ...b,
      imageUrl: b.image?.asset ? urlFor(b.image.asset).width(800).height(600).url() : null,
      imageAlt: b.image?.alt ?? b.name ?? ui.defaultBoatImageAlt,
    }))

  const hasHeroLogo = Boolean(data.heroLogo?.asset)
  const heroLogoUrl = hasHeroLogo && data.heroLogo?.asset ? urlFor(data.heroLogo.asset).width(900).quality(90).url() : null
  const heroLogoAlt = (data.heroLogo?.alt?.trim() || ui.metaTitleFallback).slice(0, 200)

  /* Hikaye bölümündeki "o zaman / bugün" çifti: filonun en eski ve en yeni
     teknesi (gerçek görseller). */
  const boatsByYear = [...boats]
    .filter((b) => b.image?.asset)
    .sort((a, b) => (parseInt(a.year ?? '0', 10) || 0) - (parseInt(b.year ?? '0', 10) || 0))
  const oldestBoat = boatsByYear[0] ?? null
  const newestBoat = boatsByYear.length > 1 ? boatsByYear[boatsByYear.length - 1] : null
  const pairOldUrl = oldestBoat?.image?.asset ? urlFor(oldestBoat.image.asset).width(900).height(1100).url() : null
  const pairNewUrl = newestBoat?.image?.asset ? urlFor(newestBoat.image.asset).width(900).height(1100).url() : null
  const toursHref = withLocalePath(locale, '/turlar')
  const contactHref = withLocalePath(locale, '/iletisim')

  // İstatistik şeridi: hepsi gerçek, zaten çekilmiş veriden — uydurma yok.
  // Kuruluş yılı, filodaki en eski teknenin yılından ("North Star, 1988" gibi)
  // hesaplanıyor; filo sayısı aktif teknelerin sayısı.
  const boatYears = boats
    .map((b) => parseInt(b.year ?? '', 10))
    .filter((y): y is number => Number.isFinite(y) && y > 1900)
  const foundingYear = boatYears.length > 0 ? Math.min(...boatYears) : null
  const fleetCount = boats.length
  // Zaman şeridinin sağ ucu: içinde bulunduğumuz yıl.
  const currentYear = new Date().getFullYear()
  const stripStart = foundingYear ?? (parseInt(oldestBoat?.year ?? '', 10) || null)
  const stripSpan = stripStart != null && currentYear > stripStart ? currentYear - stripStart : null
  // Şerit üzerindeki ara duraklar: filodaki diğer teknelerin yılları.
  const stripStops = stripStart != null && stripSpan
    ? boats
        .map((b) => ({ year: parseInt(b.year ?? '', 10), name: b.name?.trim() ?? '' }))
        .filter((b) => Number.isFinite(b.year) && b.year > stripStart && b.year < currentYear)
        .sort((a, b) => a.year - b.year)
        .map((b) => ({ ...b, pct: ((b.year - stripStart) / stripSpan) * 100 }))
    : []
  const numberLocale =
    locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : locale === 'ru' ? 'ru-RU' : 'en-US'

  /* Düz toUpperCase() Türkçe'de "Hikayemiz" -> "HIKAYEMIZ" yapıyor (noktalı İ
     kayboluyor); iletişim sayfasındaki ile aynı dile duyarlı dönüşüm. */
  const toHeadingUpper = (v: string) => v.trim().toLocaleUpperCase(numberLocale)

  // Hero altındaki kompakt istatistik şeridi — dördü de gerçek: kuruluş yılı
  // (filodaki en eski tekne), filo/tur/koy sayısı ise Sanity'den gelen gerçek
  // belge sayıları (uydurma yok).
  const statStripItems = [
    // Bir yıl (1988) — "1.988" gibi binlik ayraçla gösterilmemeli.
    foundingYear != null ? { value: foundingYear, suffix: '', label: ui.statFoundingYearLabel, useGrouping: false } : null,
    fleetCount > 0 ? { value: fleetCount, suffix: '+', label: ui.statFleetLabel, useGrouping: true } : null,
    tourCount > 0 ? { value: tourCount, suffix: '', label: ui.statTourLabel, useGrouping: true } : null,
    coveCount > 0 ? { value: coveCount, suffix: '', label: ui.statCoveLabel, useGrouping: true } : null,
  ].filter((item): item is { value: number; suffix: string; label: string; useGrouping: boolean } => item != null)

  // "Bize güvenebilirsiniz" kartları — hepsi sitede zaten var olan gerçek
  // politika/üyelik bilgileri (TÜRSAB/İMEAK, 24 saat iptal kuralı, hava
  // garantisi, gerçek filo sayısı); yeni bir metin uydurulmadı.
  const trustGridItems = [
    { Icon: BadgeCheck, title: ui.trustGridLicensedTitle, body: ui.trustGridLicensedBody },
    { Icon: RotateCcw, title: ui.trustGridCancelTitle, body: ui.trustGridCancelBody },
    { Icon: CloudSun, title: ui.trustGridWeatherTitle, body: ui.trustGridWeatherBody },
    fleetCount > 0
      ? { Icon: Sailboat, title: ui.trustGridFleetTitle, body: ui.trustGridFleetBody(`${fleetCount}+`) }
      : null,
  ].filter((item): item is { Icon: typeof BadgeCheck; title: string; body: string } => item != null)


  return (
    <div className="min-h-screen bg-white">
      {/* ── 1. Hero: diğer sayfalarla aynı ortalı mavi başlık + kısa spot;
          altında istatistik şeridi. ── */}
      <section className="w-full px-4 pb-0 pt-14 text-center sm:pt-16 md:pt-20">
        <div className="mx-auto max-w-3xl">
          {hasHeroLogo && heroLogoUrl ? (
            <>
              <h1 className="sr-only">{ui.metaTitleFallback}</h1>
              <div className="relative mx-auto mb-4 h-[56px] w-[min(90vw,300px)] sm:h-[72px] sm:w-[min(80vw,380px)]">
                <Image src={heroLogoUrl} alt={heroLogoAlt} fill className="object-contain object-center" sizes="(max-width: 768px) 90vw, 380px" priority />
              </div>
            </>
          ) : (
            <h1 className="pageSectionHeading">{toHeadingUpper(data.titleTop?.trim() || ui.metaTitleFallback)}</h1>
          )}
          {data.titleBottom?.trim() && <p className="pageSectionLead">{data.titleBottom}</p>}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={toursHref}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-[var(--primary,#2168b8)] px-6 text-[14px] font-extrabold uppercase tracking-wide text-white transition hover:brightness-110"
            >
              {ui.heroCtaTours}
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
            </Link>
            <Link
              href={contactHref}
              className="inline-flex h-12 items-center rounded-lg border-2 border-[var(--primary,#2168b8)] bg-white px-6 text-[14px] font-extrabold uppercase tracking-wide text-[var(--primary,#2168b8)] transition hover:bg-[var(--primary,#2168b8)]/[0.06]"
            >
              {ui.heroCtaContact}
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-[1200px] md:mt-12">
          {statStripItems.length > 0 && (
            <div
              className={`relative z-10 mx-auto grid max-w-[1000px] grid-cols-2 overflow-hidden rounded-2xl border border-[#d3dce6] bg-white sm:grid-cols-4 `}
            >
              {statStripItems.map((item, i) => (
                <div
                  key={i}
                  className={[
                    'flex flex-col items-center gap-1 px-2 py-5 sm:py-6',
                    i % 2 === 0 ? 'border-r border-[#e8edf3]' : '',
                    i < statStripItems.length - 1 ? 'sm:border-r sm:border-[#e8edf3]' : 'sm:border-r-0',
                    i >= 2 ? 'border-t border-[#e8edf3] sm:border-t-0' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <CountUpStat
                    value={item.value}
                    decimals={0}
                    suffix={item.suffix}
                    numberLocale={numberLocale}
                    useGrouping={item.useGrouping}
                    className="text-[30px] font-black leading-none tabular-nums sm:text-[38px]"
                    style={{ fontFamily: 'var(--font-family-title, var(--font-family))', color: 'var(--secondary, #131719)' }}
                  />
                  <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--muted, #81848b)' }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 2. Hikayemiz: solda metnin tamamı, sağda "o zaman / şimdi"
          fotoğraf çifti (filonun en eski ve en yeni teknesi). Kart yok. ── */}
      {data.intro && data.intro.length > 0 && (
        <ScrollReveal>
          <section className="w-full py-16 md:py-24">
            <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-4 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
              <div>
                <h2 className="tourSectionHeading">{toHeadingUpper(ui.introEyebrow)}</h2>
                <div className="max-w-[60ch]">
                  <PortableText value={data.intro} components={defaultBlockComponents} />
                </div>
              </div>

              {pairOldUrl && pairNewUrl && (
                <div className="[--pair-gap:12px] sm:[--pair-gap:20px]">
                  <div className="grid grid-cols-2 gap-[var(--pair-gap)]">
                    {[
                      { url: pairOldUrl, boat: oldestBoat },
                      { url: pairNewUrl, boat: newestBoat },
                    ].map(({ url, boat }, i) => (
                      <figure key={i} className="group m-0">
                        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-zinc-100">
                          <Image
                            src={url}
                            alt={boat?.imageAlt || ''}
                            fill
                            sizes="(max-width: 1024px) 50vw, 300px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" aria-hidden />
                          {boat?.name && (
                            <figcaption className="absolute inset-x-3 bottom-3 text-[13px] font-extrabold uppercase tracking-wide text-white sm:text-[14px]">
                              {boat.name.trim()}
                            </figcaption>
                          )}
                        </div>
                      </figure>
                    ))}
                  </div>

                  {/* Zaman şeridi: iki fotoğrafın ortasından inen bağlantılar,
                      aralarında filodaki diğer teknelerin yılları, sağ uçta
                      içinde bulunduğumuz yıl. */}
                  {stripStart != null && stripSpan && (
                    <div className="relative grid grid-cols-2 gap-[var(--pair-gap)]">
                      <div
                        className="absolute top-[21px] h-[3px] rounded-full bg-gradient-to-r from-[#8a9db3] via-[var(--section-sky,#4facd8)] to-[var(--primary,#2168b8)]"
                        style={{ left: 'calc((100% - var(--pair-gap)) / 4)', right: 'calc((100% - var(--pair-gap)) / 4)' }}
                        aria-hidden
                      >
                        {stripStops.map((stop) => (
                          <span
                            key={`${stop.year}-${stop.name}`}
                            title={`${stop.year}${stop.name ? ` · ${stop.name}` : ''}`}
                            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--section-sky,#4facd8)] bg-white"
                            style={{ left: `${stop.pct}%` }}
                          />
                        ))}
                        <span className="absolute left-1/2 top-[17px] -translate-x-1/2 whitespace-nowrap rounded-full border border-[#d3dce6] bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[var(--secondary,#131719)] sm:text-[12px]">
                          {ui.pairYearsLabel(stripSpan)}
                        </span>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="h-4 w-px bg-[#bfcbd8]" aria-hidden />
                        <span className="relative z-10 h-3.5 w-3.5 rounded-full bg-[#8a9db3] ring-4 ring-white" aria-hidden />
                        <span className="mt-2 text-[18px] font-black tabular-nums text-[var(--secondary,#131719)] sm:text-[20px]" style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}>
                          {stripStart}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="h-4 w-px bg-[#bfcbd8]" aria-hidden />
                        <span className="relative z-10 flex h-3.5 w-3.5 items-center justify-center" aria-hidden>
                          <span className="absolute inset-0 animate-ping rounded-full bg-[var(--primary,#2168b8)] opacity-40 motion-reduce:animate-none" />
                          <span className="relative h-3.5 w-3.5 rounded-full bg-[var(--primary,#2168b8)] ring-4 ring-white" />
                        </span>
                        <span className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-[18px] font-black tabular-nums text-[var(--primary,#2168b8)] sm:text-[20px]" style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}>
                            {currentYear}
                          </span>
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--muted,#81848b)]">
                            {ui.pairTodayLabel}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* ── 3. Güvenceler: açık gri-mavi bant üzerinde tek satır, kartsız;
          ikonlar sade (zemin kutusu yok). ── */}
      {trustGridItems.length > 0 && (
        <ScrollReveal>
          <section className="w-full bg-[#f4f7fb] py-12 md:py-14">
            <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
              {trustGridItems.map(({ Icon, title, body }, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Icon className="mt-0.5 h-7 w-7 shrink-0" style={{ color: 'var(--secondary, #131719)' }} strokeWidth={1.7} aria-hidden />
                  <div>
                    <h3
                      className="m-0 text-[16px] font-extrabold"
                      style={{ fontFamily: 'var(--font-family-title, var(--font-family))', color: 'var(--secondary, #131719)' }}
                    >
                      {title}
                    </h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: 'var(--text-color, #58595b)' }}>
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {(data.sectionTitle || data.sectionBody?.length) && (
        <ScrollReveal>
        <section className="w-full py-12 md:py-16">
          <div className="mx-auto max-w-[1200px] px-4">
            {data.sectionTitle && (
              <h2 className="pageSectionHeading text-center">{toHeadingUpper(data.sectionTitle)}</h2>
            )}
            {data.sectionSubtitle && (
              <p className="pageSectionLead mb-8 text-center">{data.sectionSubtitle}</p>
            )}
            {data.sectionBody && data.sectionBody.length > 0 && (
              <div className="mx-auto max-w-3xl">
                <ExpandableBlock clampClassName="line-clamp-6" moreLabel={ui.readMore} lessLabel={ui.readLess}>
                  <PortableText value={data.sectionBody} components={defaultBlockComponents} />
                </ExpandableBlock>
              </div>
            )}
          </div>
        </section>
        </ScrollReveal>
      )}

      {/* ── 4. Filo: kompakt zaman çizgisi (bkz. FleetTimeline). ── */}
      {(data.timelineTitle || data.timelineDescription || boats.length > 0) && (
        <section className="w-full py-16 md:py-24">
          <div className="mx-auto max-w-[1000px] px-4">
            <ScrollReveal>
              <header className="mb-10 max-w-2xl">
                <h2 className="tourSectionHeading">{ABOUT_TIMELINE_HEADING[locale]}</h2>
                {data.timelineDescription && (
                  <p className="m-0 text-[16px] leading-relaxed" style={{ color: 'var(--text-color, #58595b)' }}>
                    {data.timelineDescription}
                  </p>
                )}
              </header>
            </ScrollReveal>

            <FleetTimeline boats={boats} noImageLabel={ui.noImage} />
          </div>
        </section>
      )}

      {/* ── 5. Kapanış çağrısı: mavi degrade bant; dekoratif dalgalar,
          yumuşak ışık lekeleri ve silik yelkenli; iki buton. ── */}
      <section className="w-full px-4 pb-16 md:pb-24">
        <div
          className="relative mx-auto max-w-[1200px] overflow-hidden rounded-3xl px-6 pb-20 pt-12 text-center sm:pb-24 sm:pt-16"
          style={{ background: 'linear-gradient(135deg, var(--primary, #2168b8) 0%, #2f8fd0 55%, var(--section-sky, #4facd8) 100%)' }}
        >
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-32 right-[-60px] h-80 w-80 rounded-full bg-[#9ad8f5]/30 blur-3xl" aria-hidden />
          <Sailboat
            className="pointer-events-none absolute -right-6 top-6 hidden h-56 w-56 -rotate-6 text-white/[0.09] md:block"
            strokeWidth={1.2}
            aria-hidden
          />
          <Anchor
            className="pointer-events-none absolute left-10 top-10 hidden h-20 w-20 rotate-12 text-white/[0.08] md:block"
            strokeWidth={1.4}
            aria-hidden
          />
          <svg
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full sm:h-20"
            viewBox="0 0 1200 80"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path d="M0 40 C 150 10, 300 70, 450 40 S 750 10, 900 40 S 1100 70, 1200 35 V80 H0 Z" fill="rgba(255,255,255,0.10)" />
            <path d="M0 55 C 200 30, 350 80, 600 55 S 1000 30, 1200 58 V80 H0 Z" fill="rgba(255,255,255,0.14)" />
          </svg>

          <div className="relative flex flex-col items-center gap-5">
            {foundingYear != null && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 py-1.5 text-[12px] font-extrabold uppercase tracking-wider text-white backdrop-blur-sm">
                <Anchor className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
                {ui.ctaEyebrow(foundingYear)}
              </span>
            )}
            <h2
              className="m-0 max-w-[18ch] text-[28px] font-black uppercase leading-tight text-white sm:max-w-none sm:text-[38px]"
              style={{ fontFamily: 'var(--font-family-title, var(--font-family))', WebkitTextStroke: '0.5px currentColor' }}
            >
              {ui.ctaTitle}
            </h2>
            <p className="m-0 max-w-[52ch] text-[15px] leading-relaxed text-white/90 sm:text-[17px]">
              {ui.ctaLead}
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={toursHref}
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-7 text-[14px] font-extrabold uppercase tracking-wide text-[var(--primary,#2168b8)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)]"
              >
                {ui.ctaButton}
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              </Link>
              <Link
                href={contactHref}
                className="inline-flex h-12 items-center rounded-lg border-2 border-white/80 px-7 text-[14px] font-extrabold uppercase tracking-wide text-white transition hover:bg-white/10"
              >
                {ui.heroCtaContact}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
