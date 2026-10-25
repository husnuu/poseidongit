import { client, urlFor } from '@/lib/sanity'
import { covesPageQuery, covesListQuery } from '@/lib/queries'
import CovesHero from '@/components/coves/CovesHero'
import CovesGrid from '@/components/coves/CovesGrid'
import Link from 'next/link'
import { Anchor, ArrowRight, Sailboat } from 'lucide-react'
import { withLocalePath } from '@/lib/i18n/paths'
import { buildItemListSchema, getSiteName } from '@/lib/seo'
import JsonLd from '@/components/seo/JsonLd'
import { buildPageMetadata } from '@/lib/seo/buildPageMetadata'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { coveSlugForLocale, mergeCoveForLocale } from '@/lib/i18n/mergeCoveForLocale'
import { mergeCovesPageLocale, mergeCovesPageSeoForLocale } from '@/lib/i18n/mergeCovesPageLocale'
import { getCovesPageUiStrings } from '@/lib/i18n/strings/covesPage'

export const dynamic = 'force-dynamic'

type CoveItem = {
  _id: string
  title: string | null
  slug: string | null
  description: string | null
  image?: { asset?: { _ref?: string }; alt?: string | null } | null
  order?: number | null
  locationTag?: string | null
  translations?: unknown
}

type CovesPageData = {
  title?: string | null
  description?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  emptyListMessage?: string | null
  items?: CoveItem[] | null
  pageTranslations?: { en?: Record<string, unknown>; de?: Record<string, unknown> }
}

const opts = { useCdn: false as const }

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: loc } = await params
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'tr'
  const ui = getCovesPageUiStrings(locale)
  const siteName = getSiteName()

  try {
    const data = await client.fetch<CovesPageData | null>(covesPageQuery, {}, opts)
    const merged = mergeCovesPageLocale(data as unknown as Record<string, unknown>, locale) as CovesPageData | null
    const seo = mergeCovesPageSeoForLocale(
      data?.metaTitle,
      data?.metaDescription,
      data?.pageTranslations,
      locale,
    )
    const titleBase =
      seo.metaTitle?.trim() || merged?.title?.trim() || data?.title?.trim() || ui.metaTitleFallback
    const description =
      (seo.metaDescription?.trim() ||
        merged?.description?.trim() ||
        data?.description?.trim() ||
        ui.metaDescriptionFallback)?.slice(0, 160) ?? ui.metaDescriptionFallback
    const title = titleBase.includes('|') || !siteName ? titleBase : `${titleBase} | ${siteName}`
    return buildPageMetadata({ locale, path: '/koylar', title, description })
  } catch {
    const title = siteName ? `${ui.metaTitleFallback} | ${siteName}` : ui.metaTitleFallback
    return buildPageMetadata({ locale, path: '/koylar', title, description: ui.metaDescriptionFallback })
  }
}

function sortCoves(coves: CoveItem[]): CoveItem[] {
  return [...coves].sort((a, b) => {
    const oA = a.order ?? 999
    const oB = b.order ?? 999
    if (oA !== oB) return oA - oB
    return (a.title ?? '').localeCompare(b.title ?? '')
  })
}

export default async function KoylarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale
  const ui = getCovesPageUiStrings(locale)

  let pageRaw: CovesPageData | null = null
  let allCoves: CoveItem[] = []
  try {
    const [page, coves] = await Promise.all([
      client.fetch<CovesPageData | null>(covesPageQuery, {}, opts),
      client.fetch<CoveItem[]>(covesListQuery, {}, opts),
    ])
    pageRaw = mergeCovesPageLocale(page as unknown as Record<string, unknown>, locale) as CovesPageData | null
    allCoves = Array.isArray(coves) ? coves.filter((i): i is CoveItem => i != null) : []
  } catch {
    pageRaw = null
    allCoves = []
  }

  const pageData = pageRaw
  const title = pageData?.title?.trim() || ui.pageTitleFallback
  const description = pageData?.description?.trim() ?? null
  const pageItems = Array.isArray(pageData?.items) ? pageData.items.filter((i): i is CoveItem => i != null) : []
  const source = pageItems.length > 0 ? pageItems : allCoves
  const items = sortCoves(source).map((c) => {
    const raw = c as unknown as Record<string, unknown>
    const merged = mergeCoveForLocale(raw, locale) as unknown as CoveItem
    return { ...merged, slug: coveSlugForLocale(raw, locale) ?? null }
  })

  const emptyMsg = pageData?.emptyListMessage?.trim() || ui.emptyList
  const toursHref = withLocalePath(locale, '/turlar')
  const numberLocale =
    locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : locale === 'ru' ? 'ru-RU' : 'en-US'

  return (
    // Diğer tüm liste sayfaları (/turlar, /yat-kiralama) gibi zemin beyaz;
    // "Koylar" kimliği koca bir renk bandı yerine hero'nun arkasındaki
    // yumuşak bir ışıltıyla veriliyor. Işıltı eskiden nane yeşiliydi
    // (#d6f7ec) ve kartların mavi butonlarıyla çakışıyordu; artık marka
    // mavisinin çok açık tonu.
    <div className="relative min-h-screen overflow-hidden bg-white">
      {items.length > 0 && (
        <JsonLd
          data={buildItemListSchema(
            items
              .filter((c) => c.slug)
              .map((c) => ({
                name: c.title ?? ui.defaultCoveTitle,
                url: withLocalePath(locale, `/koylar/${c.slug}`),
                image: c.image?.asset ? urlFor(c.image.asset).width(900).height(675).url() : undefined,
              })),
          )}
        />
      )}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[1100px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-70 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, #dbeafe, rgba(219,234,254,0))' }}
        aria-hidden
      />
      <div className="mx-auto max-w-[1400px] px-4 py-14 sm:py-16 md:py-20">
        <CovesHero
          title={title}
          description={description}
          countLabel={items.length > 0 ? ui.covesListedCount(items.length) : null}
          numberLocale={numberLocale}
        />

        <CovesGrid
          items={items.filter((cove) => cove.slug).map((cove) => {
            const resolvedTitle = cove.title ?? ui.defaultCoveTitle
            return {
              id: cove._id,
              title: resolvedTitle,
              description: cove.description,
              imageUrl: cove.image?.asset
                ? urlFor(cove.image.asset).width(900).height(675).url()
                : null,
              alt: cove.image?.alt,
              locationTag: cove.locationTag,
              href: withLocalePath(locale, `/koylar/${cove.slug}`),
              ariaLabel: ui.cardAriaLabel(resolvedTitle),
            }
          })}
          noImageLabel={ui.noImage}
          detailHint={ui.exploreLabel}
        />

        {items.length === 0 && (
          <p className="mt-10 text-center text-zinc-500" style={{ fontFamily: 'var(--font-family)' }}>
            {emptyMsg}
          </p>
        )}

        {/* Kapanış çağrısı — hakkımızda sayfasındaki bantla aynı dil:
            mavi degrade, ışık lekeleri, dalgalar ve silik yelkenli. */}
        {items.length > 0 && (
          <section className="mt-16 md:mt-24">
            <div
              className="relative mx-auto max-w-[1200px] overflow-hidden rounded-3xl px-6 pb-20 pt-12 text-center sm:pb-24 sm:pt-16"
              style={{ background: 'linear-gradient(135deg, var(--primary, #2168b8) 0%, #2f8fd0 55%, var(--section-sky, #4facd8) 100%)' }}
            >
              <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" aria-hidden />
              <div className="pointer-events-none absolute -bottom-32 right-[-60px] h-80 w-80 rounded-full bg-[#9ad8f5]/30 blur-3xl" aria-hidden />
              <Sailboat className="pointer-events-none absolute -right-6 top-6 hidden h-56 w-56 -rotate-6 text-white/[0.09] md:block" strokeWidth={1.2} aria-hidden />
              <Anchor className="pointer-events-none absolute left-10 top-10 hidden h-20 w-20 rotate-12 text-white/[0.08] md:block" strokeWidth={1.4} aria-hidden />
              <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full sm:h-20" viewBox="0 0 1200 80" preserveAspectRatio="none" aria-hidden>
                <path d="M0 40 C 150 10, 300 70, 450 40 S 750 10, 900 40 S 1100 70, 1200 35 V80 H0 Z" fill="rgba(255,255,255,0.10)" />
                <path d="M0 55 C 200 30, 350 80, 600 55 S 1000 30, 1200 58 V80 H0 Z" fill="rgba(255,255,255,0.14)" />
              </svg>
              <div className="relative flex flex-col items-center gap-5">
                <h2
                  className="m-0 max-w-[20ch] text-[26px] font-black uppercase leading-tight text-white sm:max-w-none sm:text-[34px]"
                  style={{ fontFamily: 'var(--font-family-title, var(--font-family))', WebkitTextStroke: '0.5px currentColor' }}
                >
                  {ui.ctaTitle.toLocaleUpperCase(numberLocale)}
                </h2>
                <p className="m-0 max-w-[54ch] text-[15px] leading-relaxed text-white/90 sm:text-[17px]">{ui.ctaLead}</p>
                <Link
                  href={toursHref}
                  className="mt-1 inline-flex h-12 items-center gap-2 rounded-lg bg-white px-7 text-[14px] font-extrabold uppercase tracking-wide text-[var(--primary,#2168b8)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)]"
                >
                  {ui.toursCta}
                  <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
