import { client, urlFor } from '@/lib/sanity'
import { aboutPageMetaQuery, aboutPageQuery } from '@/lib/queries'
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
import { getAboutPageUiStrings } from '@/lib/i18n/strings/aboutPage'
import { translatePortableTextBlocks, translateText } from '@/lib/i18n/runtimeTranslate'

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
  pageTranslations?: { en?: Record<string, unknown>; de?: Record<string, unknown> }
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
      pageTranslations?: { en?: Record<string, unknown>; de?: Record<string, unknown> }
    } | null>(aboutPageMetaQuery, {}, { useCdn: false })
    const merged = mergeAboutPageSeoForLocale(
      row?.seo as Record<string, unknown> | undefined,
      row?.pageTranslations,
      locale,
    )
    // Editör pageTranslations.en/.de.seo'ya elle çeviri girmemişse anlık çeviriyle doldur.
    const patchSeo = (locale === 'en' ? row?.pageTranslations?.en?.seo : row?.pageTranslations?.de?.seo) as
      | { metaTitle?: string; metaDescription?: string }
      | undefined
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

  const localeTag = locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US'
  const toHeadingUpper = (s: string) => s.trim().toLocaleUpperCase(localeTag)

  const titleTopUpper = toHeadingUpper(data.titleTop || '')
  const timelineTitleUpper = toHeadingUpper(data.timelineTitle || '')

  return (
    <div className="min-h-screen bg-white">
      {heroPhotoUrl ? (
        <section className="relative w-full overflow-hidden bg-[var(--secondary,#131719)]">
          <div className="relative h-[320px] w-full sm:h-[400px] md:h-[460px]">
            <Image
              src={heroPhotoUrl}
              alt={heroPhotoAlt}
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" aria-hidden />
            <div className="absolute inset-0 flex items-center justify-center px-4">
              <div className="text-center">
                {hasHeroLogo && heroLogoUrl ? (
                  <>
                    <h1 className="sr-only">{ui.metaTitleFallback}</h1>
                    <div className="relative mx-auto h-[64px] w-[min(90vw,420px)] sm:h-[84px] md:h-[100px] md:w-[min(80vw,520px)]">
                      <Image
                        src={heroLogoUrl}
                        alt={heroLogoAlt}
                        fill
                        className="object-contain object-center brightness-0 invert"
                        sizes="(max-width: 768px) 90vw, 520px"
                        priority
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {data.titleTop?.trim() && (
                      <h1
                        className="text-[29px] font-extrabold uppercase leading-[1.15] text-white sm:text-[36px] md:text-[44px] pageHeroTitleStroke"
                        style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
                      >
                        {titleTopUpper}
                      </h1>
                    )}
                    {data.titleBottom?.trim() && (
                      <p
                        className="mt-3 text-base font-bold uppercase tracking-wide text-white/90 sm:text-lg md:text-xl"
                        style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
                      >
                        {data.titleBottom}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="w-full pb-8 pt-12 md:pb-10 md:pt-16">
          <div className="mx-auto max-w-3xl px-4 text-center">
            {hasHeroLogo && heroLogoUrl ? (
              <>
                <h1 className="sr-only">{ui.metaTitleFallback}</h1>
                <div className="flex justify-center px-2 py-2 md:py-4">
                  <div className="relative h-[72px] w-[min(100%,420px)] sm:h-[88px] md:h-[104px] md:w-[min(100%,520px)]">
                    <Image
                      src={heroLogoUrl}
                      alt={heroLogoAlt}
                      fill
                      className="object-contain object-center"
                      sizes="(max-width: 768px) 100vw, 520px"
                      priority
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {data.titleTop?.trim() && (
                  <h1
                    className="text-[29px] font-extrabold uppercase leading-[1.15] sm:text-[33px] md:text-[37px] whitespace-nowrap pageHeroTitleStroke"
                    style={{
                      fontFamily: 'var(--font-family-title, var(--font-family))',
                      color: 'var(--primary, #2168b8)',
                    }}
                  >
                    {titleTopUpper}
                  </h1>
                )}
                {data.titleBottom?.trim() && (
                  <p
                    className="mt-4 text-lg font-bold uppercase tracking-wide sm:text-xl md:text-2xl"
                    style={{
                      fontFamily: 'var(--font-family-title, var(--font-family))',
                      color: 'var(--secondary, #131719)',
                    }}
                  >
                    {data.titleBottom}
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {data.intro && data.intro.length > 0 && (
        <section className="w-full pb-4 pt-12 md:pt-16">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <div className="mx-auto mb-6 h-1 w-12 rounded-full" style={{ background: 'var(--primary, #2168b8)' }} aria-hidden />
            <div className="text-left">
              <PortableText value={data.intro} components={defaultBlockComponents} />
            </div>
          </div>
        </section>
      )}

      {(data.sectionTitle || data.sectionBody?.length) && (
        <section className="w-full py-12 md:py-16">
          <div className="mx-auto max-w-[1200px] px-4">
            {data.sectionTitle && (
              <h2
                className="text-[28px] md:text-[34px] font-extrabold uppercase mb-2"
                style={{ color: 'var(--primary, #2168b8)', fontFamily: 'var(--font-family-title)' }}
              >
                {data.sectionTitle}
              </h2>
            )}
            {data.sectionSubtitle && (
              <p className="text-lg font-semibold mb-6" style={{ color: 'var(--text-color, #58595b)' }}>
                {data.sectionSubtitle}
              </p>
            )}
            {data.sectionBody && data.sectionBody.length > 0 && (
              <div className="max-w-3xl">
                <PortableText value={data.sectionBody} components={defaultBlockComponents} />
              </div>
            )}
          </div>
        </section>
      )}

      {(data.timelineTitle || data.timelineDescription || boats.length > 0) && (
        <section className="w-full bg-[#f8fafc] py-14 md:py-20">
          <div className="mx-auto max-w-[1300px] px-4">
            <header className="mx-auto mb-12 max-w-2xl text-center">
              {data.timelineTitle && (
                <h2
                  className="text-[24px] md:text-[30px] font-extrabold uppercase leading-[1.15]"
                  style={{ fontFamily: 'var(--font-family-title)', color: 'var(--primary, #2168b8)' }}
                >
                  {timelineTitleUpper}
                </h2>
              )}
              <div
                className="mx-auto mt-3 h-[5px] w-10 rounded-full"
                style={{ background: 'var(--primary, #2168b8)' }}
                aria-hidden
              />
              {data.timelineDescription && (
                <p
                  className="mt-4 text-base leading-relaxed md:text-lg"
                  style={{ color: 'var(--text-color, #58595b)' }}
                >
                  {data.timelineDescription}
                </p>
              )}
            </header>

            {boats.length > 0 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
                {boats.map((boat, index) => (
                  <article
                    key={`${boat.year}-${boat.name}-${index}`}
                    className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#eef1f4] bg-white shadow-[0_2px_8px_rgba(19,23,25,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_-8px_rgba(19,23,25,0.14)]"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
                      {boat.imageUrl ? (
                        <Image
                          src={boat.imageUrl}
                          alt={boat.imageAlt || ''}
                          fill
                          className="object-cover transition-transform duration-500 hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
                          {ui.noImage}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col px-5 py-5 sm:px-6">
                      <h3
                        className="text-[16px] font-extrabold uppercase tracking-wide"
                        style={{
                          fontFamily: 'var(--font-family-title, var(--font-family))',
                          color: 'var(--secondary, #131719)',
                        }}
                      >
                        {boat.name}
                      </h3>
                      {boat.year && (
                        <p
                          className="mt-0.5 text-xs font-semibold uppercase tracking-wide"
                          style={{ fontFamily: 'var(--font-family)', color: 'var(--muted, #81848b)' }}
                        >
                          {boat.year}
                        </p>
                      )}
                      {boat.description?.trim() && (
                        <p
                          className="mt-3 text-sm leading-relaxed"
                          style={{ fontFamily: 'var(--font-family)', color: 'var(--text-color, #58595b)' }}
                        >
                          {boat.description}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
