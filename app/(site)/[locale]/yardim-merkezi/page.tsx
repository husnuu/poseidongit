import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { client } from '@/lib/sanity'
import { siteSettingsWhatsappQuery } from '@/lib/queries'
import { buildWhatsAppHref } from '@/lib/buildWhatsAppHref'
import { fetchHelpCategoriesWithArticles, fetchHelpCenterPage } from '@/lib/sanity/fetchers/helpCenter'
import HelpCenterHome from '@/components/help-center/HelpCenterHome'
import { getSiteName, buildItemListSchema } from '@/lib/seo'
import { buildPageMetadata } from '@/lib/seo/buildPageMetadata'
import JsonLd from '@/components/seo/JsonLd'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { getHelpCenterUiStrings } from '@/lib/i18n/strings/helpCenter'
import StandardPageLd from '@/components/seo/StandardPageLd'

export const revalidate = 300

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: loc } = await params
  if (!isSiteLocale(loc)) return { title: getHelpCenterUiStrings('tr').metaHelpTitleFallback }
  const locale = loc as SiteLocale
  const ui = getHelpCenterUiStrings(locale)
  const page = await fetchHelpCenterPage(locale)
  const titleBase = page?.seoTitle?.trim() || page?.title?.trim() || ui.metaHelpTitleFallback
  const description =
    page?.seoDescription?.trim() ||
    page?.shortDescription?.trim() ||
    ui.metaHelpDescriptionFallback
  const site = getSiteName()
  const title = site && !titleBase.includes('|') ? `${titleBase} | ${site}` : titleBase
  return buildPageMetadata({
    locale,
    path: '/yardim-merkezi',
    title,
    description: description.slice(0, 160),
  })
}

export default async function YardimMerkeziPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale
  const contactHref = withLocalePath(locale, '/iletisim')

  const [page, categories, whatsRow] = await Promise.all([
    fetchHelpCenterPage(locale),
    fetchHelpCategoriesWithArticles(locale),
    client.fetch<{ whatsapp?: string | null } | null>(siteSettingsWhatsappQuery),
  ])
  const whatsappHref = buildWhatsAppHref(whatsRow?.whatsapp ?? null)

  const itemListSchema = buildItemListSchema(
    categories
      .filter((c): c is typeof c & { slug: string; title: string } => Boolean(c.slug && c.title))
      .map((c) => ({
        name: c.title,
        url: withLocalePath(locale, `/yardim-merkezi/kategori/${c.slug}`),
      }))
  )

  return (
    <>
      <JsonLd data={itemListSchema} />
      <StandardPageLd type="CollectionPage" locale={locale} path="/yardim-merkezi" name={getHelpCenterUiStrings(locale).breadcrumbHelp} />
      <HelpCenterHome
        page={page}
        categories={categories}
        whatsappHref={whatsappHref}
        locale={locale}
        contactHref={contactHref}
      />
    </>
  )
}
