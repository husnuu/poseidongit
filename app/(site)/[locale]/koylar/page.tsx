import { client, urlFor } from '@/lib/sanity'
import { covesPageQuery, covesListQuery } from '@/lib/queries'
import CovesHero from '@/components/coves/CovesHero'
import CoveRow from '@/components/coves/CoveRow'
import { getBaseUrl, getSiteName } from '@/lib/seo'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { mergeCoveForLocale } from '@/lib/i18n/mergeCoveForLocale'
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
  const path = withLocalePath(locale, '/koylar')
  const canonical = path === '/' ? getBaseUrl() : `${getBaseUrl()}${path}`

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
    return {
      title,
      description,
      alternates: { canonical },
    }
  } catch {
    const title = siteName ? `${ui.metaTitleFallback} | ${siteName}` : ui.metaTitleFallback
    return {
      title,
      description: ui.metaDescriptionFallback,
      alternates: { canonical },
    }
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
  const items = sortCoves(source).map((c) =>
    mergeCoveForLocale(c as unknown as Record<string, unknown>, locale) as unknown as CoveItem,
  )

  const emptyMsg = pageData?.emptyListMessage?.trim() || ui.emptyList

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:py-16">
        <CovesHero title={title} description={description} />

        <div className="mt-10">
          {items.map((cove, index) => (
            <CoveRow
              key={cove._id}
              reverse={index % 2 === 1}
              title={cove.title ?? ui.defaultCoveTitle}
              description={cove.description}
              imageUrl={
                cove.image?.asset
                  ? urlFor(cove.image.asset).width(1200).height(800).url()
                  : null
              }
              alt={cove.image?.alt}
              slug={cove.slug}
              noImageLabel={ui.noImage}
              detailHint={ui.detailHint}
            />
          ))}
        </div>

        {items.length === 0 && (
          <p className="mt-10 text-center text-zinc-500" style={{ fontFamily: 'var(--font-family)' }}>
            {emptyMsg}
          </p>
        )}
      </div>
    </div>
  )
}
