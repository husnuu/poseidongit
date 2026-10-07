import type { Metadata } from 'next'
import { absoluteUrl, getSiteName } from '@/lib/seo'
import { alternateLanguageAbsoluteUrls } from './alternateLanguages'
import type { SiteLocale } from '@/lib/i18n/config'

/** Next.js `openGraph.locale` biçimi (BCP-47 değil, alt çizgili). */
const OG_LOCALE: Record<SiteLocale, string> = {
  tr: 'tr_TR',
  en: 'en_US',
  de: 'de_DE',
  ru: 'ru_RU',
}

export interface PageMetadataInput {
  locale: SiteLocale
  /** Canonical iç yol, locale öneki OLMADAN — örn. '/', '/turlar', '/tur/cesme-tekne-turu'. */
  path: string
  title: string
  description?: string
  /** Mutlak görsel URL'si (1200×630 önerilir). Yoksa OG/Twitter görseli atlanır. */
  image?: string
  imageAlt?: string
  /** Arama motorlarından gizlemek için (örn. teşekkür/ödeme sayfaları). */
  noIndex?: boolean
  type?: 'website' | 'article'
  keywords?: string[]
}

/**
 * Her sayfanın `generateMetadata`'sında tek satırla çağrılacak ortak SEO
 * paketi: canonical URL, 3 dil için hreflang alternates (+ x-default),
 * OpenGraph ve Twitter Card. Ana sayfadaki elle yazılmış (ve doğrulanmış)
 * desenin genelleştirilmiş hali — her sayfa aynı teknik SEO temelini paylaşsın
 * diye. Sayfaya özgü alanlar (örn. Sanity'den gelen özel OG metni) dönen
 * objeye spread ile eklenip üzerine yazılabilir.
 */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const { locale, path, title, description, image, imageAlt, noIndex, type = 'website', keywords } = input
  const languages = alternateLanguageAbsoluteUrls(path)
  const hreflang = locale === 'tr' ? 'tr' : locale === 'en' ? 'en' : locale === 'de' ? 'de' : 'ru'
  const canonical = languages[hreflang] ?? absoluteUrl(path)
  const siteName = getSiteName()

  return {
    title,
    ...(description ? { description } : {}),
    ...(keywords?.length ? { keywords } : {}),
    alternates: {
      canonical,
      languages,
    },
    ...(noIndex ? { robots: { index: false, follow: true as const } } : {}),
    openGraph: {
      type,
      locale: OG_LOCALE[locale],
      ...(siteName ? { siteName } : {}),
      title,
      ...(description ? { description } : {}),
      url: canonical,
      ...(image
        ? { images: [{ url: image, width: 1200, height: 630, alt: imageAlt?.trim() || title }] }
        : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      ...(description ? { description } : {}),
      ...(image ? { images: [image] } : {}),
    },
  }
}
