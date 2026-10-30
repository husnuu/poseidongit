import type { Metadata } from 'next'
import { absoluteUrl, getSiteName } from '@/lib/seo'
import { alternateLanguageAbsoluteUrls } from './alternateLanguages'
import { ogImageUrl, withBrandSuffix } from './brand'
import type { SiteLocale } from '@/lib/i18n/config'

/** Next.js `openGraph.locale` biçimi (BCP-47 değil, alt çizgili). */
export const OG_LOCALE: Record<SiteLocale, string> = {
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
  /** Mutlak görsel URL'si (1200×630 önerilir). Yoksa markalı otomatik görsel üretilir. */
  image?: string
  imageAlt?: string
  /** Otomatik paylaşım görselinde başlığın üstündeki bölüm etiketi (örn. "Blog"). */
  ogKicker?: string
  /** Arama motorlarından gizlemek için (örn. teşekkür/ödeme sayfaları). */
  noIndex?: boolean
  type?: 'website' | 'article'
  keywords?: string[]
  /** Kısa başlıklara dil bazlı marka soneki eklensin mi (varsayılan: evet). */
  brandSuffix?: boolean
}

/**
 * Her sayfanın `generateMetadata`'sında tek satırla çağrılacak ortak SEO
 * paketi: canonical URL, 4 dil için hreflang alternates (+ x-default),
 * OpenGraph ve Twitter Card. Ana sayfadaki elle yazılmış (ve doğrulanmış)
 * desenin genelleştirilmiş hali — her sayfa aynı teknik SEO temelini paylaşsın
 * diye. Sayfaya özgü alanlar (örn. Sanity'den gelen özel OG metni) dönen
 * objeye spread ile eklenip üzerine yazılabilir.
 */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const {
    locale,
    path,
    description,
    image,
    imageAlt,
    ogKicker,
    noIndex,
    type = 'website',
    keywords,
    brandSuffix = true,
  } = input
  const title = brandSuffix ? withBrandSuffix(input.title, locale) : input.title.trim()
  const languages = alternateLanguageAbsoluteUrls(path)
  const canonical = languages[locale] ?? absoluteUrl(path)
  const siteName = getSiteName()
  const ogImage = image || ogImageUrl({ title: input.title, locale, kicker: ogKicker })

  return {
    // absolute: kök layout'taki "%s | site adı" şablonu markayı ikinci kez eklemesin.
    title: { absolute: title },
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
      images: [{ url: ogImage, width: 1200, height: 630, alt: imageAlt?.trim() || input.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      ...(description ? { description } : {}),
      images: [ogImage],
    },
  }
}
