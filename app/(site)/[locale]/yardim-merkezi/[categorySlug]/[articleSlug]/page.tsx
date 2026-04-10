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
    <div className="min-h-screen bg-zinc-50/80">
      <JsonLd data={buildBreadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={articleLd} />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
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

        <article>
          <header className="border-b border-zinc-200 pb-8">
            <p className="text-sm font-semibold uppercase tracking-wide">
              <Link
                href={categoryPath}
                className="rounded-sm hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2"
                style={{ fontFamily: 'var(--font-family), sans-serif', color: 'var(--primary)' }}
              >
                {article.category?.title ?? ui.breadcrumbCategoryFallback}
              </Link>
            </p>
            <h1
              className="mt-2 text-balance text-3xl font-bold tracking-tight text-[#1e3a5f] sm:text-4xl"
              style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
            >
              {article.title}
            </h1>
            {article.shortDescription ? (
              <p
                className="mt-4 text-lg leading-relaxed"
                style={{ fontFamily: 'var(--font-family), sans-serif', color: 'var(--secondary, #131719)' }}
              >
                {article.shortDescription}
              </p>
            ) : null}
          </header>

          {body.length > 0 ? (
            <div className="prose-help max-w-none pt-8">
              <PortableText value={body} components={helpArticlePortableComponents} />
            </div>
          ) : (
            <p
              className="pt-8"
              style={{ fontFamily: 'var(--font-family), sans-serif', color: 'var(--muted, #81848b)' }}
            >
              {ui.articleBodyEmpty}
            </p>
          )}
        </article>

        {related.length > 0 ? (
          <section className="mt-14 border-t border-zinc-200 pt-10" aria-labelledby="related-help">
            <h2
              id="related-help"
              className="text-lg font-black uppercase tracking-wide text-[#1e3a5f] sm:text-xl"
              style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
            >
              {ui.relatedArticlesHeading}
            </h2>
            <ul className="mt-4 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
              {related.map((r) =>
                r.slug && r.categorySlug ? (
                  <li key={r._id}>
                    <Link
                      href={withLocalePath(locale, `/yardim-merkezi/${r.categorySlug}/${r.slug}`)}
                      className="block rounded-xl px-4 py-3 text-zinc-900 transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1e3a8a]"
                      style={{ fontFamily: 'var(--font-family), sans-serif' }}
                    >
                      <span className="font-medium hover:text-[#1e3a8a]">{r.title}</span>
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          </section>
        ) : null}

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
