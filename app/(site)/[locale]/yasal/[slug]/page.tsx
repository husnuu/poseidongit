import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { unstable_noStore as noStore } from 'next/cache'
import { client } from '@/lib/sanity'
import { legalPageBySlugQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import {
  legalPageComponents,
  TITLE_FONT,
  BODY_FONT,
  TEXT_COLOR,
} from '@/components/legal/legalPortableComponents'
import { getSiteName, absoluteUrl } from '@/lib/seo'
import { alternateLanguageAbsoluteUrls } from '@/lib/seo/alternateLanguages'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { mergeLegalPageForLocale } from '@/lib/i18n/mergeLegalPageForLocale'
import { dateLocaleForSiteLocale, getLegalPageUiStrings } from '@/lib/i18n/strings/legalPage'

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
  const siteName = getSiteName()
  const title = merged.seoTitle?.trim() || (siteName ? `${merged.title} | ${siteName}` : merged.title)
  const description =
    (merged.seoDescription ?? merged.title).replace(/\s+/g, ' ').slice(0, 160) || title
  const path = withLocalePath(locale, `/yasal/${slug}`)
  const url = absoluteUrl(path)
  return {
    title,
    description,
    alternates: { canonical: url, languages: alternateLanguageAbsoluteUrls(`/yasal/${slug}`) },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      ...(siteName ? { siteName } : {}),
    },
    twitter: { card: 'summary', title, description },
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
            <PortableText value={contentBlocks} components={legalPageComponents} />
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
