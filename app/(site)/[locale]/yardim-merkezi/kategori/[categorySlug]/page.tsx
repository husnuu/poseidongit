import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Breadcrumb from '@/components/common/Breadcrumb'
import HelpArticleItem from '@/components/help-center/HelpArticleItem'
import HelpSupportCTA from '@/components/help-center/HelpSupportCTA'
import { client } from '@/lib/sanity'
import { siteSettingsWhatsappQuery } from '@/lib/queries'
import { buildWhatsAppHref } from '@/lib/buildWhatsAppHref'
import { fetchHelpCategoryPage } from '@/lib/sanity/fetchers/helpCenter'
import { getSiteName, absoluteUrl } from '@/lib/seo'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { getHelpCenterUiStrings } from '@/lib/i18n/strings/helpCenter'

export const revalidate = 300

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; categorySlug: string }>
}): Promise<Metadata> {
  const { categorySlug, locale: loc } = await params
  if (!isSiteLocale(loc)) return { title: getHelpCenterUiStrings('tr').metaCategoryNotFoundTitle }
  const locale = loc as SiteLocale
  const ui = getHelpCenterUiStrings(locale)
  const cat = await fetchHelpCategoryPage(categorySlug, locale)
  if (!cat) return { title: ui.metaCategoryNotFoundTitle }
  const site = getSiteName()
  const titleBase = cat.title?.trim() ?? ui.categoryFallbackTitle
  const title =
    site && !titleBase.includes('|')
      ? `${titleBase} | ${ui.metaCategoryTitleSuffix} | ${site}`
      : `${titleBase} | ${ui.metaCategoryTitleSuffix}`
  const description =
    cat.shortDescription?.trim() || ui.metaCategoryDescriptionFallback(cat.title ?? ui.categoryFallbackTitle)
  const path = withLocalePath(locale, `/yardim-merkezi/kategori/${categorySlug}`)
  return {
    title,
    description: description.slice(0, 160),
    alternates: { canonical: absoluteUrl(path) },
  }
}

export default async function HelpCategoryListingPage({
  params,
}: {
  params: Promise<{ locale: string; categorySlug: string }>
}) {
  const { categorySlug, locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale
  const ui = getHelpCenterUiStrings(locale)
  const contactHref = withLocalePath(locale, '/iletisim')

  const [cat, whatsRow] = await Promise.all([
    fetchHelpCategoryPage(categorySlug, locale),
    client.fetch<{ whatsapp?: string | null } | null>(siteSettingsWhatsappQuery),
  ])
  if (!cat) notFound()

  const whatsappHref = buildWhatsAppHref(whatsRow?.whatsapp ?? null)
  const articles = cat.articles ?? []
  const helpHome = withLocalePath(locale, '/yardim-merkezi')

  return (
    <div className="min-h-screen bg-zinc-50/80">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Breadcrumb
          className="mb-8"
          items={[
            { label: ui.breadcrumbHome, href: withLocalePath(locale, '/') },
            { label: ui.breadcrumbHelp, href: helpHome },
            { label: cat.title ?? ui.categoryFallbackTitle },
          ]}
        />

        <header className="border-b border-zinc-200 pb-8">
          <h1
            className="text-balance text-3xl font-bold tracking-tight text-[#1e3a5f] sm:text-4xl"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
          >
            {cat.title}
          </h1>
          {cat.shortDescription ? (
            <p
              className="mt-4 text-lg"
              style={{ fontFamily: 'var(--font-family), sans-serif', color: 'var(--secondary, #131719)' }}
            >
              {cat.shortDescription}
            </p>
          ) : null}
          <p className="mt-4">
            <Link
              href={helpHome}
              className="text-sm font-semibold text-[#1e3a8a] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2"
              style={{ fontFamily: 'var(--font-family), sans-serif' }}
            >
              {ui.allHelpTopicsLink}
            </Link>
          </p>
        </header>

        {articles.length === 0 ? (
          <p
            className="py-12 text-center"
            style={{ fontFamily: 'var(--font-family), sans-serif', color: 'var(--muted, #81848b)' }}
          >
            {ui.noArticlesInCategory}
          </p>
        ) : (
          <ul className="mt-8 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white px-2 py-1 sm:px-3">
            {articles.map((a) =>
              a.slug ? (
                <HelpArticleItem
                  key={a._id}
                  href={withLocalePath(locale, `/yardim-merkezi/${categorySlug}/${a.slug}`)}
                  title={a.title ?? ui.articleFallbackTitle}
                  shortDescription={a.shortDescription}
                />
              ) : null
            )}
          </ul>
        )}

        <HelpSupportCTA
          whatsappHref={whatsappHref}
          className="mt-14"
          heading={ui.supportHeading}
          description={ui.supportBody}
          whatsappCta={ui.supportWhatsappCta}
          whatsappUnavailable={ui.supportWhatsappMissing}
          contactLabel={ui.supportContactCta}
          contactHref={contactHref}
        />
      </div>
    </div>
  )
}
