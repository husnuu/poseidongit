import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getFerryPageUiStrings } from '@/lib/i18n/strings/ferryPage'
import FerryRouteFilter from '@/components/ferry/FerryRouteFilter'
import { getFerryRouteList } from '@/lib/ferry/listFerryRoutes'
import { buildPageMetadata } from '@/lib/seo/buildPageMetadata'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import styles from './page.module.css'
import { LISTING_HEADINGS } from '@/lib/i18n/strings/listingHeadings'
import StandardPageLd from '@/components/seo/StandardPageLd'
import JsonLd from '@/components/seo/JsonLd'
import { buildItemListSchema } from '@/lib/seo'
import { withLocalePath } from '@/lib/i18n/paths'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: loc } = await params
  const locale = isSiteLocale(loc) ? (loc as SiteLocale) : 'tr'
  const ui = getFerryPageUiStrings(locale)
  return buildPageMetadata({
    locale,
    path: '/feribot',
    title: ui.listMetaTitle,
    description: ui.listMetaDescription,
  })
}

export default async function FeribotListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale
  const ui = getFerryPageUiStrings(locale)

  const routes = await getFerryRouteList(locale)

  return (
    <div className="min-h-screen bg-white">
      <StandardPageLd type="CollectionPage" locale={locale} path="/feribot" name={ui.listMetaTitle} description={ui.listMetaDescription} />
      <JsonLd
        data={buildItemListSchema(
          routes
            .filter((r) => r.slug)
            .map((r) => ({ name: r.title ?? '', url: withLocalePath(locale, `/feribot/${r.slug}`) }))
        )}
      />
      <section className="w-full py-14 md:py-20" aria-labelledby="ferry-routes-heading">
        <div className="mx-auto max-w-[1200px] px-4">
          <header className="mb-12">
            <h1 id="ferry-routes-heading" className={styles.heading}>
              <span className={styles.headingLine1}>{ui.listHeadingTop}</span>
              {' '}
              <span className={styles.headingLine2}>{ui.listHeadingBottom}</span>
            </h1>
            <p className={styles.subtitle}>{ui.listSubtitle}</p>
          </header>

          <h2 className="sr-only">{LISTING_HEADINGS.ferries[locale]}</h2>
          {routes.length > 0 && <FerryRouteFilter routes={routes} locale={locale} />}

          {routes.length === 0 && (
            <p className="text-center text-black/60 py-12">{ui.listEmptyMessage}</p>
          )}
        </div>
      </section>
    </div>
  )
}
