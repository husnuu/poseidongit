import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Breadcrumb from '@/components/common/Breadcrumb'
import { HelpIcon } from '@/components/help-center/helpIcons'
import HelpArticleItem from '@/components/help-center/HelpArticleItem'
import HelpSupportCTA from '@/components/help-center/HelpSupportCTA'
import { client } from '@/lib/sanity'
import { siteSettingsWhatsappQuery } from '@/lib/queries'
import { buildWhatsAppHref } from '@/lib/buildWhatsAppHref'
import { fetchHelpCategoryPage } from '@/lib/sanity/fetchers/helpCenter'
import { getSiteName, buildItemListSchema } from '@/lib/seo'
import { buildPageMetadata } from '@/lib/seo/buildPageMetadata'
import JsonLd from '@/components/seo/JsonLd'
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
  return buildPageMetadata({
    locale,
    path: `/yardim-merkezi/kategori/${categorySlug}`,
    title,
    description: description.slice(0, 160),
  })
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

  // FAQPage değil ItemList: bu sayfada yalnızca kısaltılmış özetler
  // görünüyor, tam cevaplar değil — FAQPage burada görünen içerikle
  // eşleşmezdi. Makale listesi için ItemList doğru şema.
  const itemListSchema = buildItemListSchema(
    articles
      .filter((a): a is typeof a & { slug: string; title: string } => Boolean(a.slug && a.title))
      .map((a) => ({
        name: a.title,
        url: withLocalePath(locale, `/yardim-merkezi/${categorySlug}/${a.slug}`),
      }))
  )

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={itemListSchema} />
      <div className="mx-auto max-w-[820px] px-4 pb-16 pt-8 sm:pt-10 md:pb-24">
        <Breadcrumb
          className="mb-8"
          items={[
            { label: ui.breadcrumbHome, href: withLocalePath(locale, '/') },
            { label: ui.breadcrumbHelp, href: helpHome },
            { label: cat.title ?? ui.categoryFallbackTitle },
          ]}
        />

        <header className="pb-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d3dce6] text-[var(--secondary,#131719)]">
            <HelpIcon name={cat.iconName} className="h-6 w-6" strokeWidth={1.9} />
          </span>
          <h1
            className="mb-0 mt-5 text-balance text-[28px] font-black leading-[1.15] tracking-[-0.01em] text-[var(--secondary,#131719)] sm:text-[36px] md:text-[40px]"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
          >
            {cat.title}
          </h1>
          {cat.shortDescription ? (
            <p className="mb-0 mt-4 text-[16px] leading-relaxed text-[var(--text-color,#58595b)] sm:text-[18px]">
              {cat.shortDescription}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-[12px] font-bold uppercase tracking-wide text-[var(--muted,#81848b)]">
              {ui.questionCount(articles.length)}
            </span>
            <Link
              href={helpHome}
              className="text-[13px] font-extrabold uppercase tracking-wide text-[var(--primary,#2168b8)] hover:underline"
            >
              {ui.allHelpTopicsLink}
            </Link>
          </div>
        </header>

        {articles.length === 0 ? (
          <p className="py-12 text-center text-[var(--muted,#81848b)]">{ui.noArticlesInCategory}</p>
        ) : (
          <ul className="m-0 list-none border-t border-[#e8edf3] p-0">
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
