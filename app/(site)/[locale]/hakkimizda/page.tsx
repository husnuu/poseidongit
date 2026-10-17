import { client, urlFor } from '@/lib/sanity'
import { aboutPageMetaQuery, aboutPageQuery } from '@/lib/queries'
import { BadgeCheck, CloudSun, RotateCcw, Sailboat } from 'lucide-react'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import Image from 'next/image'
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

  // Fotoğraflı hero arka planı: filodaki ilk teknenin gerçek fotoğrafı (uydurma görsel yok) —
  // yoksa eski düz zeminli hero'ya geri düşer.
  const heroPhotoAsset = boats[0]?.image?.asset ?? null
  const heroPhotoUrl = heroPhotoAsset ? urlFor(heroPhotoAsset).width(1920).height(1000).quality(85).url() : null
  const heroPhotoAlt = boats[0]?.imageAlt || heroLogoAlt

  // İstatistik şeridi: hepsi gerçek, zaten çekilmiş veriden — uydurma yok.
  // Kuruluş yılı, filodaki en eski teknenin yılından ("North Star, 1988" gibi)
  // hesaplanıyor; filo sayısı aktif teknelerin sayısı.
  const boatYears = boats
    .map((b) => parseInt(b.year ?? '', 10))
    .filter((y): y is number => Number.isFinite(y) && y > 1900)
  const foundingYear = boatYears.length > 0 ? Math.min(...boatYears) : null
  const fleetCount = boats.length
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
      {/* Hero, diğer liste/içerik sayfalarıyla (Koylar, Blog, Yardım Merkezi,
          İletişim) aynı: beyaz zemin, ortalı, büyük harfli mavi başlık + kısa
          spot. Önceki tam genişlikte koyu mavi gradyan bant ve eğik "polaroid"
          fotoğraf sitenin geri kalanında hiçbir yerde yoktu. Filonun ilk
          teknesinin fotoğrafı zaten aşağıdaki zaman çizgisinde duruyor. */}
      <section className="w-full px-4 pb-6 pt-14 text-center sm:pt-16 md:pt-20">
        <div className="mx-auto max-w-3xl">
          {hasHeroLogo && heroLogoUrl ? (
            <>
              <h1 className="sr-only">{ui.metaTitleFallback}</h1>
              <div className="relative mx-auto mb-4 h-[56px] w-[min(90vw,300px)] sm:h-[72px] sm:w-[min(80vw,380px)]">
                <Image
                  src={heroLogoUrl}
                  alt={heroLogoAlt}
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 768px) 90vw, 380px"
                  priority
                />
              </div>
            </>
          ) : (
            <h1 className="pageSectionHeading">
              {toHeadingUpper(data.titleTop?.trim() || ui.metaTitleFallback)}
            </h1>
          )}
          {data.titleBottom?.trim() && <p className="pageSectionLead">{data.titleBottom}</p>}
        </div>
      </section>

      {statStripItems.length > 0 && (
        <div className="mx-auto max-w-[1200px] border-y border-[#eef0f1] px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {statStripItems.map((item, i) => {
              // divide-x + satır-bazlı border-t kombinasyonu çok satırlı
              // grid'de tutarsız çizgiler üretiyordu — her hücreye kendi
              // komşusuna göre elle, açıkça çizgi veriliyor.
              const hasRightNeighborMobile = i % 2 === 0 && i + 1 < statStripItems.length
              const hasRightNeighborDesktop = i < statStripItems.length - 1
              const isBottomRowMobile = i >= 2
              return (
                <div
                  key={i}
                  className={[
                    'group flex flex-col items-center gap-1 border-[#eef0f1] px-2 py-6 text-center transition-colors duration-300 hover:bg-[#f7f9fb]',
                    hasRightNeighborMobile ? 'border-r' : '',
                    hasRightNeighborDesktop ? 'sm:border-r' : 'sm:border-r-0',
                    isBottomRowMobile ? 'border-t sm:border-t-0' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <CountUpStat
                    value={item.value}
                    decimals={0}
                    suffix={item.suffix}
                    numberLocale={numberLocale}
                    useGrouping={item.useGrouping}
                    className="text-[30px] font-bold leading-none tabular-nums transition-transform duration-300 group-hover:scale-110 sm:text-[38px]"
                    style={{ fontFamily: 'var(--font-family-title, var(--font-family))', color: 'var(--secondary, #131719)' }}
                  />
                  <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--muted, #81848b)' }}>
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {data.intro && data.intro.length > 0 && (
        <ScrollReveal>
          {/* Hikaye bloğu: ana başlık yerine koyu ara başlık (zaman çizgisiyle
              aynı seviye) ve çıplak metin yerine sayfadaki diğer kartlarla aynı
              reçeteye sahip bir kart. Kap genişliği de diğer bölümlerle aynı. */}
          <section className="w-full py-12 md:py-16">
            <div className="mx-auto max-w-[1200px] px-4">
              <h2 className="tourSectionHeading text-center">{toHeadingUpper(ui.introEyebrow)}</h2>
              <div className="mx-auto max-w-3xl rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_2px_rgba(19,23,25,0.06),0_6px_20px_-4px_rgba(19,23,25,0.14)] sm:p-8">
                <ExpandableBlock clampClassName="line-clamp-5" moreLabel={ui.readMore} lessLabel={ui.readLess}>
                  <PortableText value={data.intro} components={defaultBlockComponents} />
                </ExpandableBlock>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {trustGridItems.length > 0 && (
        <ScrollReveal>
          <section className="w-full py-12 md:py-16">
            <div className="mx-auto max-w-[1200px] px-4">
              {/* Başlık istenmedi; kartlar kendi başlarına zaten anlaşılıyor. */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {trustGridItems.map(({ Icon, title, body }, i) => (
                  <ScrollReveal key={i} delayMs={i * 90}>
                    <div className="h-full rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_2px_rgba(19,23,25,0.06),0_6px_20px_-4px_rgba(19,23,25,0.14)] transition-all duration-300 hover:-translate-y-1 hover:border-[#cbd5e1] hover:shadow-[0_2px_4px_rgba(19,23,25,0.06),0_18px_36px_-10px_rgba(19,23,25,0.22)] sm:p-7">
                      <span className="grid h-12 w-12 place-items-center rounded-xl transition-transform duration-300 hover:rotate-[-6deg]" style={{ background: 'rgba(33, 104, 184, 0.1)' }}>
                        <Icon className="h-6 w-6" style={{ color: 'var(--primary, #2168b8)' }} strokeWidth={1.75} aria-hidden />
                      </span>
                      <h3
                        className="mt-4 text-[17px] font-extrabold"
                        style={{ fontFamily: 'var(--font-family-title, var(--font-family))', color: 'var(--secondary, #131719)' }}
                      >
                        {title}
                      </h3>
                      <p className="mt-1.5 text-[15px] leading-relaxed" style={{ color: 'var(--text-color, #58595b)' }}>
                        {body}
                      </p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
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

      {(data.timelineTitle || data.timelineDescription || boats.length > 0) && (
        // Rengi zaten zaman çizgisi (mavi noktalı hat + büyüyen yıl rozetleri)
        // taşıyor — ayrıca büyük bir renkli bant eklemek "modern" durmuyordu.
        <section className="w-full py-14 md:py-20">
          <div className="mx-auto max-w-[1200px] px-4">
            <ScrollReveal>
            <header className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="tourSectionHeading">{ABOUT_TIMELINE_HEADING[locale]}</h2>
              {data.timelineDescription && <p className="pageSectionLead">{data.timelineDescription}</p>}
            </header>
            </ScrollReveal>

            <FleetTimeline boats={boats} noImageLabel={ui.noImage} />
          </div>
        </section>
      )}

    </div>
  )
}
