/**
 * Sayfa tipine göre JSON-LD yardımcıları (WebPage ailesi, menü). Tüm
 * sayfalar aynı site (#website) ve işletme (#business) kimliğine bağlanır;
 * Google ve yapay zekâ arama motorları sayfaları tek bir işletmeye ait
 * bir bütün olarak okur.
 */
import type { SiteLocale } from '@/lib/i18n/config'
import { getBaseUrl } from './index'

export const websiteId = () => `${getBaseUrl()}/#website`
export const businessId = () => `${getBaseUrl()}/#business`

export type WebPageType = 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage'

export function buildWebPageSchema(input: {
  type: WebPageType
  url: string
  name: string
  description?: string
  locale: SiteLocale
  image?: string
  dateModified?: string
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': input.type,
    '@id': `${input.url}#webpage`,
    url: input.url,
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    inLanguage: input.locale,
    isPartOf: { '@id': websiteId() },
    about: { '@id': businessId() },
    publisher: { '@id': businessId() },
    ...(input.image ? { primaryImageOfPage: { '@type': 'ImageObject', url: input.image } } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
  }
}

/** Makine çevirisinden gelebilen HTML varlıkları (&#10; vb.) ve satır sonlarını temizler. */
function cleanText(v: string | null | undefined): string {
  return (v ?? '')
    .replace(/&#(\d+);/g, ' ')
    .replace(/&(amp|quot|apos|lt|gt|nbsp);/g, (_, e: string) => ({ amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' })[e] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** schema.org Menu — teknedeki menü ve gerçek fiyatlar (Sanity menuItem). */
export function buildMenuSchema(input: {
  url: string
  name: string
  locale: SiteLocale
  items: Array<{ name: string; description?: string | null; price: number; image?: string | null; inStock?: boolean }>
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': `${input.url}#menu`,
    url: input.url,
    name: input.name,
    inLanguage: input.locale,
    provider: { '@id': businessId() },
    hasMenuItem: input.items
      .filter((i) => i.name && Number.isFinite(i.price) && i.price > 0)
      .map((i) => ({
        '@type': 'MenuItem',
        name: cleanText(i.name),
        ...(i.description ? { description: cleanText(i.description) } : {}),
        ...(i.image ? { image: i.image } : {}),
        offers: {
          '@type': 'Offer',
          price: String(i.price),
          priceCurrency: 'TRY',
          availability: i.inStock === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        },
      })),
  }
}

const HOME_LABEL: Record<SiteLocale, string> = {
  tr: 'Ana Sayfa',
  en: 'Home',
  de: 'Startseite',
  ru: 'Главная',
}

/**
 * Standart bir alt sayfa için WebPage + BreadcrumbList (Ana Sayfa › … › Sayfa).
 * `url`/`crumbs` mutlak ya da kök-göreli olabilir; `crumbs` ara seviyeleri verir.
 */
export function buildStandardPageLd(input: {
  type: WebPageType
  locale: SiteLocale
  url: string
  homeUrl: string
  name: string
  description?: string
  image?: string
  crumbs?: Array<{ name: string; url: string }>
}): Record<string, unknown>[] {
  const abs = (u: string) => (u.startsWith('http') ? u : `${getBaseUrl()}${u.startsWith('/') ? u : `/${u}`}`)
  const url = abs(input.url)
  const items = [
    { name: HOME_LABEL[input.locale], url: abs(input.homeUrl) },
    ...(input.crumbs ?? []).map((c) => ({ name: c.name, url: abs(c.url) })),
    { name: input.name, url },
  ]
  return [
    buildWebPageSchema({
      type: input.type,
      url,
      name: input.name,
      description: input.description,
      locale: input.locale,
      image: input.image,
    }),
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
    },
  ]
}
