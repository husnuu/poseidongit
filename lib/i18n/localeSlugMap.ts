import type { SiteLocale } from './config'
import data from './generated/localeSlugs.json'

/**
 * Detay sayfalarının (tur, koy, blog, feribot) dile göre otomatik URL slug'ları.
 *
 * Kaynak: `lib/i18n/generated/localeSlugs.json` — `scripts/generate-locale-slugs.mjs`
 * her build öncesi (npm prebuild) Sanity'deki yeni belgeler için o dildeki başlıktan
 * slug üretip ekler. Var olan girdiler ASLA değiştirilmez (yayındaki adresler
 * kırılmasın). Sanity'de elle çeviri slug'ı girilmiş belgeler burada yer almaz;
 * onlar eskisi gibi Sanity slug'ını kullanır. Elle slug sonradan girilirse eski
 * otomatik adres `retired` altına taşınır ve yönlendirilmeye devam eder.
 *
 * Sayfalar (App Router) her dilde Türkçe slug ile çalışır: middleware gelen
 * otomatik slug'ı Türkçeye çevirir, `withLocalePath` giden linklerde tersini yapar.
 */

/** Otomatik slug alan kanonik ilk segmentler. */
export const LOCALIZED_DETAIL_SEGMENTS = ['tur', 'koylar', 'blog', 'feribot'] as const
export type LocalizedDetailSegment = (typeof LOCALIZED_DETAIL_SEGMENTS)[number]
type ForeignLocale = Exclude<SiteLocale, 'tr'>

type PerDocLocaleSlugs = Partial<Record<LocalizedDetailSegment, Record<string, Partial<Record<ForeignLocale, string>>>>>

type LocaleSlugData = {
  auto: PerDocLocaleSlugs
  retired: Partial<Record<LocalizedDetailSegment, Partial<Record<ForeignLocale, Record<string, string>>>>>
  /** Sanity'de elle girilmiş çeviri slug'ları — yalnızca Türkçe adresten 301 için. */
  manual?: PerDocLocaleSlugs
}

const MAP = data as LocaleSlugData

function isDetailSegment(seg: string): seg is LocalizedDetailSegment {
  return (LOCALIZED_DETAIL_SEGMENTS as readonly string[]).includes(seg)
}

/** Ters arama tablosu: segment → dil → otomatik slug → Türkçe slug. */
const REVERSE: Partial<Record<LocalizedDetailSegment, Partial<Record<ForeignLocale, Map<string, string>>>>> = {}
for (const seg of LOCALIZED_DETAIL_SEGMENTS) {
  const bySlug = MAP.auto[seg] ?? {}
  for (const [trSlug, perLocale] of Object.entries(bySlug)) {
    for (const [loc, localized] of Object.entries(perLocale) as [ForeignLocale, string][]) {
      if (!localized) continue
      const segMap = (REVERSE[seg] ??= {})
      const locMap = (segMap[loc] ??= new Map())
      locMap.set(localized, trSlug)
    }
  }
}

/**
 * Giden link: Türkçe slug → o dildeki slug (Sanity'de elle girilmiş varsa o,
 * yoksa otomatik; ikisi de yoksa aynen). Bazı bileşenler Sanity'den ham Türkçe
 * slug'la link ürettiği için elle girilmiş slug'lar da burada çözülür.
 */
export function localizeDetailSlug(locale: SiteLocale, segment: string, trSlug: string): string {
  if (locale === 'tr' || !isDetailSegment(segment)) return trSlug
  return MAP.manual?.[segment]?.[trSlug]?.[locale] ?? MAP.auto[segment]?.[trSlug]?.[locale] ?? trSlug
}

/** Gelen istek: o dildeki otomatik slug → Türkçe slug (eşleşme yoksa aynen). */
export function canonicalDetailSlug(locale: SiteLocale, segment: string, publicSlug: string): string {
  if (locale === 'tr' || !isDetailSegment(segment)) return publicSlug
  return REVERSE[segment]?.[locale]?.get(publicSlug) ?? publicSlug
}

/**
 * Yabancı dilde Türkçe slug'la, emekli bir otomatik slug'la veya elle slug'ı
 * olan bir belgenin Türkçe slug'ıyla gelinmişse, kanonik iç path'e konacak
 * slug'ı döndürür (`withLocalePath` bunu doğru kamuya açık slug'a çevirir);
 * aksi halde null.
 * Örn. en /tour/guenbatimi-turu → "guenbatimi-turu" (→ /en/tour/sunset-tour),
 *      en /tour/cesme-tekne-turu → "cesme-boat-tour" (Sanity'de elle girilmiş)
 */
export function detailSlugNeedingRedirect(locale: SiteLocale, segment: string, publicSlug: string): string | null {
  if (locale === 'tr' || !isDetailSegment(segment)) return null
  const active = MAP.auto[segment]?.[publicSlug]?.[locale]
  if (active && active !== publicSlug) return publicSlug
  const manual = MAP.manual?.[segment]?.[publicSlug]?.[locale]
  if (manual && manual !== publicSlug) return manual
  const retiredTr = MAP.retired[segment]?.[locale]?.[publicSlug]
  if (retiredTr) return MAP.manual?.[segment]?.[retiredTr]?.[locale] ?? retiredTr
  return null
}

