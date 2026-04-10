import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { unstable_noStore as noStore } from 'next/cache'
import { client } from '@/lib/sanity'
import { legalPageBySlugQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock, PortableTextComponents } from '@portabletext/react'
import { getSiteName, absoluteUrl } from '@/lib/seo'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { mergeLegalPageForLocale } from '@/lib/i18n/mergeLegalPageForLocale'
import { dateLocaleForSiteLocale, getLegalPageUiStrings } from '@/lib/i18n/strings/legalPage'

/* Sanity editöründeki boyutların birebir karşılığı: Başlık 1/2/3 büyük, Normal gövde. */
const legalPageComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1 className="mb-4 mt-10 text-[1.875rem] font-bold leading-tight text-zinc-900 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 mt-8 text-[1.5rem] font-bold leading-tight text-zinc-900">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-6 text-[1.25rem] font-bold leading-snug text-zinc-900">
        {children}
      </h3>
    ),
    normal: ({ children }) => (
      <p className="mb-4 text-base leading-relaxed text-zinc-700">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mb-4 border-l-4 border-zinc-300 pl-4 italic text-zinc-600">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="mb-4 ml-5 list-disc space-y-1 text-zinc-700">{children}</ul>,
    number: ({ children }) => <ol className="mb-4 ml-5 list-decimal space-y-1 text-zinc-700">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className="text-base leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="text-base leading-relaxed">{children}</li>,
  },
  marks: {
    link: ({ children, value }) => (
      <a href={value?.href} className="text-sky-600 underline hover:no-underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  },
}

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
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
    },
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

  const homeHref = withLocalePath(locale, '/')

  return (
    <main className="min-h-screen bg-zinc-50">
      <article className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        <div className="mb-6">
          <Link
            href={homeHref}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition"
          >
            {ui.backToHome}
          </Link>
        </div>

        <header className="mb-10">
          <h1 className="text-3xl font-bold text-zinc-900 md:text-4xl lg:text-[2.25rem] leading-tight">
            {page.title}
          </h1>
          {page.updatedAt && (
            <p className="mt-3 text-base text-zinc-500">
              {ui.lastUpdatedPrefix} {formatDate(page.updatedAt, locale)}
            </p>
          )}
        </header>

        {contentBlocks ? (
          <div className="[&_.pt-list]:mb-4">
            <PortableText value={contentBlocks} components={legalPageComponents} />
          </div>
        ) : (
          <p className="text-lg text-zinc-500 italic">{ui.contentEmpty}</p>
        )}

        <div className="mt-12 border-t border-zinc-200 pt-6">
          <Link
            href={homeHref}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition"
          >
            {ui.backToHome}
          </Link>
        </div>
      </article>
    </main>
  )
}
