import { DEFAULT_LOCALE, SITE_LOCALES, type SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { getBaseUrl } from '@/lib/seo'

/**
 * hreflang → mutlak URL (Next.js `metadata.alternates.languages`).
 * `path` kanonik iç rota (örn. `/`, `/turlar`, `/tur/foo`).
 *
 * `localePaths` (opsiyonel): tur/yardım makalesi gibi, dile göre FARKLI
 * slug kullanan içerikler için — her locale'in kendi kanonik path'i
 * (örn. `{ en: '/tur/sunset-cruise' }`). Verilmezse `withLocalePath` yalnızca
 * ilk segmenti çevirir (ör. tur→tour), slug'u TR haliyle bırakır; bu da
 * EN/DE slug'ı TR'den farklı sayfalarda 404 veren bir alternate üretirdi.
 */
export function alternateLanguageAbsoluteUrls(
  path: string,
  localePaths?: Partial<Record<SiteLocale, string>>,
  /** Yalnızca gerçekten çevrilmiş diller — çevrilmemiş (Türkçe kopya) sürümler
   * hreflang'e girmesin. Verilmezse tüm diller listelenir. */
  onlyLocales?: readonly SiteLocale[]
): Record<string, string> {
  const base = getBaseUrl().replace(/\/$/, '')
  const out: Record<string, string> = {}
  for (const loc of SITE_LOCALES) {
    if (onlyLocales && !onlyLocales.includes(loc)) continue
    const p = localePaths?.[loc] ?? withLocalePath(loc, path)
    const abs = p === '/' ? base : `${base}${p}`
    const hreflang = loc === 'tr' ? 'tr' : loc === 'en' ? 'en' : loc === 'de' ? 'de' : 'ru'
    out[hreflang] = abs
  }
  const defaultLocale = DEFAULT_LOCALE as SiteLocale
  const defaultPath = localePaths?.[defaultLocale] ?? withLocalePath(defaultLocale, path)
  out['x-default'] = defaultPath === '/' ? base : `${base}${defaultPath}`
  return out
}
