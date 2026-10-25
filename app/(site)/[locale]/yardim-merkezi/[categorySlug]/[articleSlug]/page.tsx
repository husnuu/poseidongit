import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
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
import { absoluteUrl, buildBreadcrumbSchema, buildFAQSchema, getSiteName, portableTextToPlainText } from '@/lib/seo'
import { alternateLanguageAbsoluteUrls } from '@/lib/seo/alternateLanguages'
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
  const ogLocale = locale === 'tr' ? 'tr_TR' : locale === 'de' ? 'de_DE' : locale === 'ru' ? 'ru_RU' : 'en_US'
  return {
    title,
    description: description.slice(0, 160),
    alternates: {
      canonical: url,
      languages: alternateLanguageAbsoluteUrls(`/yardim-merkezi/${categorySlug}/${articleSlug}`),
    },
    openGraph: {
      title,
      description: description.slice(0, 160),
      url,
      type: 'article',
      locale: ogLocale,
      ...(site ? { siteName: site } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description: description.slice(0, 160),
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

  // Yardım merkezi makaleleri aslında soru-cevap formatında (başlık = soru,
  // gövde = cevap) — sayfada tam olarak görünen bu içerikten FAQPage şeması
  // üretiyoruz (Google FAQ zengin sonucu için). Kategori listeleme
  // sayfasına EKLEMEDİK: orada yalnızca kısaltılmış özet görünüyor, tam
  // cevap değil — structured data görünen içerikle eşleşmeli.
  const answerText = portableTextToPlainText(body)
  const faqSchema =
    article.title && answerText ? buildFAQSchema([{ question: article.title, answer: answerText }]) : null

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={buildBreadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={articleLd} />
      {faqSchema && <JsonLd data={faqSchema} />}

      <div className="mx-auto max-w-[820px] px-4 pb-16 pt-8 sm:pt-10 md:pb-24">
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
          <header className="border-b border-[#e8edf3] pb-8">
            <Link
              href={categoryPath}
              className="inline-flex items-center rounded-full border border-[#d3dce6] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[var(--secondary,#131719)] transition-colors hover:border-[#8a9db3]"
            >
              {article.category?.title ?? ui.breadcrumbCategoryFallback}
            </Link>
            <h1
              className="mb-0 mt-4 text-balance text-[28px] font-black leading-[1.15] tracking-[-0.01em] text-[var(--secondary,#131719)] sm:text-[36px] md:text-[40px]"
              style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
            >
              {article.title}
            </h1>
            {article.shortDescription ? (
              <p className="mb-0 mt-4 text-[16px] leading-relaxed text-[var(--text-color,#58595b)] sm:text-[18px]">
                {article.shortDescription}
              </p>
            ) : null}
          </header>

          {body.length > 0 ? (
            <div className="prose-help max-w-none pt-8">
              <PortableText value={body} components={helpArticlePortableComponents} />
            </div>
          ) : (
            <p className="pt-8 text-[var(--muted,#81848b)]">{ui.articleBodyEmpty}</p>
          )}
        </article>

        {related.length > 0 ? (
          <section className="mt-14" aria-labelledby="related-help">
            <h2 id="related-help" className="tourSectionHeading">
              {ui.relatedArticlesHeading.toLocaleUpperCase(locale === 'tr' ? 'tr-TR' : locale)}
            </h2>
            <ul className="m-0 list-none border-t border-[#e8edf3] p-0">
              {related.map((r) =>
                r.slug && r.categorySlug ? (
                  <li key={r._id} className="border-b border-[#e8edf3]">
                    <Link
                      href={withLocalePath(locale, `/yardim-merkezi/${r.categorySlug}/${r.slug}`)}
                      className="group flex items-center justify-between gap-4 py-4 text-[15.5px] font-bold text-[var(--secondary,#131719)] transition-colors hover:text-[var(--primary,#2168b8)]"
                    >
                      <span>{r.title}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" strokeWidth={2.4} aria-hidden />
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          </section>
        ) : null}

        <HelpSupportCTA
          whatsappHref={whatsappHref}
          className="mt-14 sm:mt-16"
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
