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
    <div className="min-h-screen bg-gradient-to-b from-zinc-100/90 via-white to-zinc-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <Breadcrumb
          className="mb-8"
          items={[
            { label: ui.breadcrumbHome, href: withLocalePath(locale, '/') },
            { label: ui.breadcrumbHelp, href: helpHome },
            { label: cat.title ?? ui.categoryFallbackTitle },
          ]}
        />

        <header className="rounded-2xl border border-zinc-100/90 bg-white/85 px-5 py-7 shadow-[0_4px_28px_-8px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-7 sm:py-8">
          <h1
            className="text-balance text-[1.65rem] font-bold tracking-tight text-[#1e3a5f] sm:text-3xl md:text-[2rem]"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
          >
            {cat.title}
          </h1>
          {cat.shortDescription ? (
            <p
              className="mt-4 text-[15px] leading-relaxed text-zinc-700 sm:text-lg"
              style={{ fontFamily: 'var(--font-family), sans-serif' }}
            >
              {cat.shortDescription}
            </p>
          ) : null}
          <p className="mt-5">
            <Link
              href={helpHome}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1e3a8a] underline-offset-[5px] transition-colors hover:text-[#172554] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2"
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
          <ul className="mt-10 divide-y divide-zinc-100/90 overflow-hidden rounded-2xl border border-zinc-100/90 bg-white px-1 py-1 shadow-[0_4px_24px_-10px_rgba(15,23,42,0.07)] sm:px-2">
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
          className="mt-16 sm:mt-20"
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
