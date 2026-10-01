import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { unstable_noStore as noStore } from 'next/cache'
import { client } from '@/lib/sanity'
import { legalPageBySlugQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock, PortableTextComponents } from '@portabletext/react'
import { getSiteName, absoluteUrl } from '@/lib/seo'
import { alternateLanguageAbsoluteUrls } from '@/lib/seo/alternateLanguages'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { mergeLegalPageForLocale } from '@/lib/i18n/mergeLegalPageForLocale'
import { dateLocaleForSiteLocale, getLegalPageUiStrings } from '@/lib/i18n/strings/legalPage'

/* Sanity editöründeki boyutların birebir karşılığı: Başlık 1/2/3 büyük, Normal gövde.
   Font/renk/boyutlar sitedeki diğer uzun-metin sayfasıyla (blog yazısı — bkz.
   app/(site)/[locale]/blog/[slug]/BlogPost.module.css) aynı: başlıklar
   font-family-title + koyu (secondary) renk, gövde metni font-family + 17px/1.7
   satır yüksekliğiyle (text-color). */
const TITLE_FONT = 'var(--font-family-title, var(--font-family)), sans-serif'
const BODY_FONT = 'var(--font-family), sans-serif'
const SECONDARY_COLOR = 'var(--secondary, #131719)'
const TEXT_COLOR = 'var(--text-color, #58595b)'

const legalPageComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1
        className="mb-3 mt-10 text-[1.5rem] uppercase leading-tight first:mt-0"
        style={{ fontFamily: TITLE_FONT, fontWeight: 900, color: SECONDARY_COLOR }}
      >
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        className="mb-2 mt-8 text-[1.35rem] uppercase leading-tight"
        style={{ fontFamily: TITLE_FONT, fontWeight: 800, color: SECONDARY_COLOR }}
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        className="mb-2 mt-6 text-[1.15rem] uppercase leading-snug"
        style={{ fontFamily: TITLE_FONT, fontWeight: 800, color: SECONDARY_COLOR }}
      >
        {children}
      </h3>
    ),
    normal: ({ children }) => (
      <p
        className="mb-4 text-[17px] leading-[1.7]"
        style={{ fontFamily: BODY_FONT, color: TEXT_COLOR }}
      >
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className="mb-4 border-l-4 border-zinc-300 pl-4 italic text-[17px] leading-[1.7]"
        style={{ fontFamily: BODY_FONT, color: TEXT_COLOR }}
      >
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-4 ml-5 list-disc space-y-1" style={{ fontFamily: BODY_FONT, color: TEXT_COLOR }}>
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mb-4 ml-5 list-decimal space-y-1" style={{ fontFamily: BODY_FONT, color: TEXT_COLOR }}>
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="text-[17px] leading-[1.7]">{children}</li>,
    number: ({ children }) => <li className="text-[17px] leading-[1.7]">{children}</li>,
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={value?.href}
        className="underline hover:no-underline"
        style={{ color: 'var(--primary, #2168b8)' }}
        target="_blank"
        rel="noopener noreferrer"
      >
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
