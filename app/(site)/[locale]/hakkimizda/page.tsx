import { client, urlFor } from '@/lib/sanity'
import { aboutPageMetaQuery, aboutPageQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import Image from 'next/image'
import { getBaseUrl, getSiteName } from '@/lib/seo'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { mergeAboutPageLocale, mergeAboutPageSeoForLocale } from '@/lib/i18n/mergeAboutPageLocale'
import { getAboutPageUiStrings } from '@/lib/i18n/strings/aboutPage'

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
  intro?: PortableTextBlock[] | null
  sectionTitle?: string | null
  sectionSubtitle?: string | null
  sectionBody?: PortableTextBlock[] | null
  timelineTitle?: string | null
  timelineDescription?: string | null
  boats?: BoatItem[] | null
}

const defaultBlockComponents = {
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-base md:text-lg text-black/85 leading-relaxed mb-4 last:mb-0">
        {children}
      </p>
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
  const aboutPath = withLocalePath(locale, '/hakkimizda')
  const canonicalBase = aboutPath === '/' ? getBaseUrl() : `${getBaseUrl()}${aboutPath}`

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
    const titleBase = merged.metaTitle?.trim() || ui.metaTitleFallback
    const description =
      merged.metaDescription?.trim()?.slice(0, 160) || ui.metaDescriptionFallback
    const title =
      titleBase.includes('|') || !siteName ? titleBase : `${titleBase} | ${siteName}`
    return {
      title,
      description,
      alternates: { canonical: canonicalBase },
    }
  } catch {
    const title = siteName ? `${ui.metaTitleFallback} | ${siteName}` : ui.metaTitleFallback
    return {
      title,
      description: ui.metaDescriptionFallback,
    }
  }
}

export default async function HakkimizdaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale
  const ui = getAboutPageUiStrings(locale)

  let raw: AboutPageData | null = null
  try {
    const fetched = await client.fetch<AboutPageData | null>(aboutPageQuery, {}, { useCdn: false })
    raw = mergeAboutPageLocale(fetched as unknown as Record<string, unknown>, locale) as AboutPageData | null
  } catch {
    raw = null
  }

  const data = raw

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

  const wordsTop = (data.titleTop || '').toUpperCase().trim().split(/\s+/)
  const firstTwoTop = wordsTop.slice(0, 2).join(' ')
  const restTop = wordsTop.slice(2).join(' ')
  const timelineWords = (data.timelineTitle || '').toUpperCase().trim().split(/\s+/).filter(Boolean)
  const timelineMid = Math.ceil(timelineWords.length / 2)
  const timelineBlue = timelineWords.slice(0, timelineMid).join(' ')
  const timelineBlack = timelineWords.slice(timelineMid).join(' ')

  return (
    <div className="min-h-screen bg-white">
      <section className="w-full py-14 md:py-20">
        <div className="mx-auto max-w-[1200px] px-4">
          <h1
            className="text-[40px] md:text-[48px] font-black uppercase leading-[1.1] mb-6"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900 }}
          >
            {firstTwoTop && <span style={{ color: '#1e3a8a' }}>{firstTwoTop}</span>}
            {restTop && <span style={{ color: '#000' }}>{' ' + restTop}</span>}
          </h1>
          {data.titleBottom && (
            <p
              className="text-xl md:text-2xl font-bold uppercase"
              style={{ color: 'var(--primary)' }}
            >
              {data.titleBottom}
            </p>
          )}
        </div>
      </section>

      {data.intro && data.intro.length > 0 && (
        <section className="w-full py-8 border-t border-black/10">
          <div className="mx-auto max-w-[1200px] px-4">
            <div className="max-w-3xl">
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
                className="text-[32px] md:text-[40px] font-black uppercase mb-2"
                style={{ color: 'var(--secondary)', fontFamily: 'var(--font-family-title)' }}
              >
                {data.sectionTitle}
              </h2>
            )}
            {data.sectionSubtitle && (
              <p className="text-lg text-black/70 font-semibold mb-6">{data.sectionSubtitle}</p>
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
        <section className="w-full py-12 md:py-20">
          <div className="mx-auto max-w-[1400px] px-4">
            {data.timelineTitle && (
              <h2
                className="text-[26px] md:text-[32px] font-black uppercase mb-3 leading-[1.15]"
                style={{ fontFamily: 'var(--font-family-title)' }}
              >
                {timelineBlue && <span style={{ color: '#1e3a8a' }}>{timelineBlue}</span>}
                {timelineBlack && <span style={{ color: '#000' }}>{' ' + timelineBlack}</span>}
              </h2>
            )}
            {data.timelineDescription && (
              <p className="text-base md:text-lg text-black/80 leading-relaxed mb-12 max-w-2xl">
                {data.timelineDescription}
              </p>
            )}

            {boats.length > 0 && (
              <div className="mt-10 flex flex-col gap-0">
                {boats.map((boat, index) => {
                  const reverse = index % 2 === 1
                  return (
                    <article
                      key={`${boat.year}-${boat.name}-${index}`}
                      className="grid grid-cols-1 md:grid-cols-2 gap-0 w-full overflow-hidden"
                    >
                      <div
                        className={`w-full h-[260px] md:h-[340px] lg:h-[380px] bg-neutral-200 overflow-hidden ${
                          reverse ? 'md:order-2' : 'md:order-1'
                        }`}
                      >
                        {boat.imageUrl ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={boat.imageUrl}
                              alt={boat.imageAlt || ''}
                              fill
                              className="w-full h-full object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-neutral-300 flex items-center justify-center text-neutral-500 text-sm">
                            {ui.noImage}
                          </div>
                        )}
                      </div>

                      <div
                        className={`bg-[#f3f4f6] flex flex-col items-center justify-center text-center px-8 py-10 min-h-[200px] md:min-h-[260px] ${
                          reverse ? 'md:order-1' : 'md:order-2'
                        }`}
                      >
                        <h3
                          className="text-base md:text-lg tracking-[0.2em] uppercase font-black"
                          style={{
                            fontFamily: 'var(--font-family-title, var(--font-family))',
                            fontWeight: 900,
                            color: '#1e3a8a',
                          }}
                        >
                          {boat.name}
                        </h3>
                        {boat.year && (
                          <p
                            className="mt-1 text-xs md:text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500"
                            style={{ fontFamily: 'var(--font-family)' }}
                          >
                            {boat.year}
                          </p>
                        )}
                        <div className="mt-3 h-px w-16 bg-[#1e3a8a]/30" aria-hidden />
                        {boat.description?.trim() && (
                          <p
                            className="mt-4 text-sm md:text-base text-zinc-700 leading-relaxed max-w-md"
                            style={{ fontFamily: 'var(--font-family)' }}
                          >
                            {boat.description}
                          </p>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
