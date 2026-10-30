import JsonLd from '@/components/seo/JsonLd'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { buildStandardPageLd, type WebPageType } from '@/lib/seo/pageSchemas'

/**
 * Sayfa tipi (WebPage/CollectionPage/…) + BreadcrumbList JSON-LD.
 * `path` kanonik iç yol (locale öneki olmadan, örn. '/turlar').
 */
export default function StandardPageLd({
  type,
  locale,
  path,
  name,
  description,
  crumbs,
}: {
  type: WebPageType
  locale: SiteLocale
  path: string
  name: string
  description?: string
  crumbs?: Array<{ name: string; path: string }>
}) {
  const data = buildStandardPageLd({
    type,
    locale,
    url: withLocalePath(locale, path),
    homeUrl: withLocalePath(locale, '/'),
    name,
    description,
    crumbs: crumbs?.map((c) => ({ name: c.name, url: withLocalePath(locale, c.path) })),
  })
  return (
    <>
      {data.map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
    </>
  )
}
