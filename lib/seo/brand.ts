import type { SiteLocale } from '@/lib/i18n/config'
import { getBaseUrl } from './index'

/**
 * Dile göre marka adı — başlık sonekleri ve paylaşım görselleri için.
 * Tur sayfalarındaki `metaTitleSuffix` ile aynı ifadeler (lib/i18n/tourPageUi.ts).
 */
export const SITE_BRAND: Record<SiteLocale, string> = {
  tr: 'Çeşme Tekne Turu',
  en: 'Çeşme Boat Tours',
  de: 'Çeşme Bootstouren',
  ru: 'Морские прогулки в Чешме',
}

/** Google'ın masaüstünde kesmeden gösterdiği yaklaşık başlık uzunluğu. */
const TITLE_MAX = 62

/**
 * "İletişim" gibi kısa başlıklara marka soneki ekler ("İletişim | Çeşme Tekne Turu").
 * Başlık zaten markayı içeriyorsa ya da sonekle çok uzayacaksa olduğu gibi döner.
 */
export function withBrandSuffix(title: string, locale: SiteLocale): string {
  const t = title.trim()
  if (!t) return SITE_BRAND[locale]
  const brand = SITE_BRAND[locale]
  const lower = t.toLocaleLowerCase()
  if (lower.includes(brand.toLocaleLowerCase()) || lower.includes('poseidon')) return t
  const withSuffix = `${t} | ${brand}`
  return withSuffix.length <= TITLE_MAX ? withSuffix : t
}

/**
 * Kendi görseli olmayan sayfa için markalı paylaşım görseli adresi (app/api/og).
 * `kicker` başlığın üstündeki küçük bölüm etiketi (örn. "Yardım Merkezi").
 */
export function ogImageUrl(input: { title: string; locale: SiteLocale; kicker?: string }): string {
  const sp = new URLSearchParams({ title: input.title.trim().slice(0, 110), locale: input.locale })
  if (input.kicker?.trim()) sp.set('kicker', input.kicker.trim().slice(0, 40))
  return `${getBaseUrl()}/api/og?${sp.toString()}`
}
