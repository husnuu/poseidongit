import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { unstable_noStore as noStore } from 'next/cache'
import { client } from '@/lib/sanity'
import { legalPageBySlugQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import {
  legalPageComponentsForContent,
  TITLE_FONT,
  BODY_FONT,
  TEXT_COLOR,
} from '@/components/legal/legalPortableComponents'
import { absoluteUrl, portableTextToPlainText } from '@/lib/seo'
import { ogImageUrl, withBrandSuffix } from '@/lib/seo/brand'
import { OG_LOCALE } from '@/lib/seo/buildPageMetadata'
import { alternateLanguageAbsoluteUrls } from '@/lib/seo/alternateLanguages'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale, SITE_LOCALES } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { mergeLegalPageForLocale } from '@/lib/i18n/mergeLegalPageForLocale'
import { dateLocaleForSiteLocale, getLegalPageUiStrings } from '@/lib/i18n/strings/legalPage'
import StandardPageLd from '@/components/seo/StandardPageLd'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface LegalPage {
  _id: string
  title: string
  slug: string
  seoTitle?: string | null
  seoDescription?: string | null
  content?: PortableTextBlock[] | null
  updatedAt?: string | null
  translations?: unknown
}

function formatDate(dateString: string | null | undefined, locale: SiteLocale): string {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString(dateLocaleForSiteLocale(locale), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

type LegalTranslation = { title?: string | null; slug?: { current?: string | null } | string | null }

/** Elle çevirisi girilmiş diller ve her dilin kendi slug'u. Yasal metinler
 * makine çevirisiyle gösterilmez; çevirisi olmayan dilde Türkçe metin
 * görünür, bu yüzden o sürüm kanonik olarak Türkçe sayfayı işaret eder. */
function legalLocaleInfo(page: LegalPage): { translated: SiteLocale[]; paths: Partial<Record<SiteLocale, string>> } {
  const tr = (page.translations ?? {}) as Partial<Record<SiteLocale, LegalTranslation | undefined>>
  const translated: SiteLocale[] = ['tr']
  const paths: Partial<Record<SiteLocale, string>> = { tr: withLocalePath('tr', `/yasal/${page.slug}`) }
  for (const loc of SITE_LOCALES) {
    if (loc === 'tr') continue
    const t = tr[loc]
    if (!t?.title?.trim()) continue
    const raw = typeof t.slug === 'string' ? t.slug : t.slug?.current
    translated.push(loc)
    paths[loc] = withLocalePath(loc, `/yasal/${raw?.trim() || page.slug}`)
  }
  return { translated, paths }
}

function normalizeSlug(slug: string): string {
  return decodeURIComponent(slug).trim().toLowerCase().replace(/\s+/g, '-')
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { slug, locale: loc } = await params
  if (!isSiteLocale(loc)) return { title: getLegalPageUiStrings('tr').metaNotFoundTitle }
  const locale = loc as SiteLocale
  const ui = getLegalPageUiStrings(locale)
  const slugNorm = normalizeSlug(slug)
  const page = await client.fetch<LegalPage | null>(legalPageBySlugQuery, { slug: slugNorm }, { useCdn: false })
  if (!page) return { title: ui.metaNotFoundTitle }
  const merged = mergeLegalPageForLocale(page as unknown as Record<string, unknown>, locale) as unknown as LegalPage
  const { translated, paths } = legalLocaleInfo(page)
  const title = withBrandSuffix(merged.seoTitle?.trim() || merged.title, locale)
  const bodyText = portableTextToPlainText(merged.content).replace(/\s+/g, ' ').trim()
  const descSource = merged.seoDescription?.trim() || bodyText || merged.title
  const description = descSource.length > 160 ? `${descSource.slice(0, 157).replace(/\s+\S*$/, '')}…` : descSource
  const url = absoluteUrl(withLocalePath(locale, `/yasal/${slug}`))
  // Çevirisi yoksa bu sürüm Türkçe sayfanın kopyası: kanonik Türkçe sayfa.
  const canonical = translated.includes(locale) ? url : absoluteUrl(paths.tr!)
  const image = ogImageUrl({ title: merged.title, locale })
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: alternateLanguageAbsoluteUrls(`/yasal/${page.slug}`, paths, translated),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      locale: OG_LOCALE[locale],
      images: [{ url: image, width: 1200, height: 630, alt: merged.title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function YasalSayfaPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  noStore()
  const { slug, locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale
  const ui = getLegalPageUiStrings(locale)
  const slugNorm = normalizeSlug(slug)

  let page: LegalPage | null = null
  try {
    const raw = await client.fetch<LegalPage | null>(
      legalPageBySlugQuery,
      { slug: slugNorm },
      { useCdn: false },
    )
    page = raw
      ? (mergeLegalPageForLocale(raw as unknown as Record<string, unknown>, locale) as unknown as LegalPage)
      : null
  } catch (err) {
    console.error('[yasal] Fetch error:', err)
    notFound()
  }

  if (!page) notFound()

  const contentBlocks =
    Array.isArray(page.content) && page.content.length > 0 ? page.content : null

  return (
    <main className="min-h-screen bg-zinc-50">
      <StandardPageLd type="WebPage" locale={locale} path={`/yasal/${slug}`} name={page.title} />
      <article className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        <header className="mb-10 text-center">
          <h1
            className="m-0 text-[29px] uppercase leading-[1.15] sm:text-[31px] md:text-[35px] lg:text-[39px] pageHeroTitleStroke"
            style={{ fontFamily: TITLE_FONT, fontWeight: 800, color: 'var(--primary, #2168b8)' }}
          >
            {page.title}
          </h1>
          {page.updatedAt && (
            <p
              className="mt-3 text-sm"
              style={{ fontFamily: BODY_FONT, color: 'var(--muted, #81848b)' }}
            >
              {ui.lastUpdatedPrefix} {formatDate(page.updatedAt, locale)}
            </p>
          )}
        </header>

        {contentBlocks ? (
          <div className="[&_.pt-list]:mb-4">
            <PortableText value={contentBlocks} components={legalPageComponentsForContent(contentBlocks as { style?: string }[])} />
          </div>
        ) : (
          <p className="text-[17px] italic" style={{ fontFamily: BODY_FONT, color: TEXT_COLOR }}>
            {ui.contentEmpty}
          </p>
        )}
      </article>
    </main>
  )
}
