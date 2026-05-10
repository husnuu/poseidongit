import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import Breadcrumb from '@/components/common/Breadcrumb'
import { helpArticlePortableComponents } from '@/components/help-center/helpPortableText'
import HelpSupportCTA from '@/components/help-center/HelpSupportCTA'
import JsonLd from '@/components/seo/JsonLd'
import { client } from '@/lib/sanity'
import { siteSettingsWhatsappQuery } from '@/lib/queries'
import { buildWhatsAppHref } from '@/lib/buildWhatsAppHref'
import {
  fetchHelpArticleDetail,
  fetchHelpArticleStaticParams,
} from '@/lib/sanity/fetchers/helpCenter'
import type { HelpArticleDetail } from '@/lib/sanity/types/helpCenter'
import { absoluteUrl, buildBreadcrumbSchema, getSiteName } from '@/lib/seo'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { getHelpCenterUiStrings } from '@/lib/i18n/strings/helpCenter'

export const revalidate = 300

export async function generateStaticParams() {
  if (process.env.NODE_ENV === 'development') {
    return []
  }
  return fetchHelpArticleStaticParams()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; categorySlug: string; articleSlug: string }>
}): Promise<Metadata> {
  const { categorySlug, articleSlug, locale: loc } = await params
  if (!isSiteLocale(loc)) return { title: getHelpCenterUiStrings('tr').metaArticleNotFoundTitle }
  const locale = loc as SiteLocale
  const ui = getHelpCenterUiStrings(locale)
  const article = await fetchHelpArticleDetail(categorySlug, articleSlug, locale)
  if (!article) return { title: ui.metaArticleNotFoundTitle }
  const site = getSiteName()
  const titleBase =
    article.seoTitle?.trim() || article.title?.trim() || ui.articleFallbackTitle
  const title = site && !titleBase.includes('|') ? `${titleBase} | ${site}` : titleBase
  const description =
    article.seoDescription?.trim() ||
    article.shortDescription?.trim() ||
    article.title?.trim() ||
    ''
  const path = withLocalePath(locale, `/yardim-merkezi/${categorySlug}/${articleSlug}`)
  const url = absoluteUrl(path)
  return {
    title,
    description: description.slice(0, 160),
    alternates: { canonical: url },
    openGraph: {
      title,
      description: description.slice(0, 160),
      url,
      type: 'article',
    },
  }
}

function buildRelatedList(article: HelpArticleDetail, categorySlug: string, articleSlug: string) {
  const raw = article.relatedArticles ?? []
  return raw.filter(
    (r) =>
      r.isPublished &&
      r.slug &&
      r.categorySlug &&
      r._id !== article._id &&
      !(r.categorySlug === categorySlug && r.slug === articleSlug)
  )
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ locale: string; categorySlug: string; articleSlug: string }>
}) {
  const { categorySlug, articleSlug, locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale
  const ui = getHelpCenterUiStrings(locale)
  const contactHref = withLocalePath(locale, '/iletisim')

  const [article, whatsRow] = await Promise.all([
    fetchHelpArticleDetail(categorySlug, articleSlug, locale),
    client.fetch<{ whatsapp?: string | null } | null>(siteSettingsWhatsappQuery),
  ])
  if (!article) notFound()

  const whatsappHref = buildWhatsAppHref(whatsRow?.whatsapp ?? null)
  const related = buildRelatedList(article, categorySlug, articleSlug)
  const body = (article.body ?? []) as PortableTextBlock[]

  const path = withLocalePath(locale, `/yardim-merkezi/${categorySlug}/${articleSlug}`)
  const url = absoluteUrl(path)
  const homeUrl = absoluteUrl(withLocalePath(locale, '/'))
  const helpHomeUrl = absoluteUrl(withLocalePath(locale, '/yardim-merkezi'))
  const categoryPath = withLocalePath(locale, `/yardim-merkezi/kategori/${categorySlug}`)
  const categoryUrl = absoluteUrl(categoryPath)

  const breadcrumbItems = [
    { name: ui.breadcrumbHome, url: homeUrl },
    { name: ui.breadcrumbHelp, url: helpHomeUrl },
    {
      name: article.category?.title ?? ui.breadcrumbCategoryFallback,
      url: categoryUrl,
    },
    { name: article.title ?? ui.breadcrumbArticleFallback, url },
  ]

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.shortDescription ?? undefined,
    url,
    dateModified: article._updatedAt ?? undefined,
    publisher: {
      '@type': 'Organization',
      name: getSiteName() || undefined,
      url: homeUrl,
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100/90 via-white to-zinc-50">
      <JsonLd data={buildBreadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={articleLd} />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <Breadcrumb
          className="mb-8"
          items={[
            { label: ui.breadcrumbHome, href: withLocalePath(locale, '/') },
            { label: ui.breadcrumbHelp, href: withLocalePath(locale, '/yardim-merkezi') },
            {
              label: article.category?.title ?? ui.breadcrumbCategoryFallback,
              href: categoryPath,
            },
            { label: article.title ?? ui.breadcrumbArticleFallback },
          ]}
        />

        <article className="overflow-hidden rounded-2xl border border-zinc-100/90 bg-white/90 shadow-[0_4px_32px_-10px_rgba(15,23,42,0.09)] backdrop-blur-sm">
          <header className="border-b border-zinc-100/90 bg-gradient-to-br from-white to-slate-50/80 px-5 pb-8 pt-7 sm:px-8 sm:pb-10 sm:pt-9">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1e3a8a]">
              <Link
                href={categoryPath}
                className="rounded-sm transition-colors hover:text-[#172554] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2"
                style={{ fontFamily: 'var(--font-family), sans-serif' }}
              >
                {article.category?.title ?? ui.breadcrumbCategoryFallback}
              </Link>
            </p>
            <h1
              className="mt-3 text-balance text-[1.65rem] font-bold tracking-tight text-[#1e3a5f] sm:text-3xl md:text-[2rem]"
              style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
            >
              {article.title}
            </h1>
            {article.shortDescription ? (
              <p
                className="mt-4 text-[15px] leading-relaxed text-zinc-700 sm:text-lg"
                style={{ fontFamily: 'var(--font-family), sans-serif' }}
              >
                {article.shortDescription}
              </p>
            ) : null}
          </header>

          {body.length > 0 ? (
            <div className="prose-help max-w-none px-5 pb-10 pt-8 sm:px-8 sm:pb-12">
              <PortableText value={body} components={helpArticlePortableComponents} />
            </div>
          ) : (
            <p
              className="px-5 pb-10 pt-8 text-zinc-500 sm:px-8"
              style={{ fontFamily: 'var(--font-family), sans-serif' }}
            >
              {ui.articleBodyEmpty}
            </p>
          )}
        </article>

        {related.length > 0 ? (
          <section className="mt-12 rounded-2xl border border-zinc-100/90 bg-white/85 px-5 py-8 shadow-[0_4px_24px_-10px_rgba(15,23,42,0.07)] sm:mt-14 sm:px-7 sm:py-9" aria-labelledby="related-help">
            <h2
              id="related-help"
              className="text-base font-black uppercase tracking-wide text-[#1e3a5f] sm:text-lg"
              style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
            >
              {ui.relatedArticlesHeading}
            </h2>
            <ul className="mt-5 divide-y divide-zinc-100/90 overflow-hidden rounded-xl border border-zinc-100/80 bg-white">
              {related.map((r) =>
                r.slug && r.categorySlug ? (
                  <li key={r._id}>
                    <Link
                      href={withLocalePath(locale, `/yardim-merkezi/${r.categorySlug}/${r.slug}`)}
                      className="block px-4 py-3.5 text-[15px] text-zinc-900 transition-colors hover:bg-slate-50/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1e3a8a] sm:px-5"
                      style={{ fontFamily: 'var(--font-family), sans-serif' }}
                    >
                      <span className="font-medium transition-colors hover:text-[#1e3a8a]">{r.title}</span>
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          </section>
        ) : null}

        <HelpSupportCTA
          whatsappHref={whatsappHref}
          className="mt-12 sm:mt-16"
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
