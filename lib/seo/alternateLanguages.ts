import { DEFAULT_LOCALE, SITE_LOCALES, type SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { getBaseUrl } from '@/lib/seo'

/**
 * hreflang → mutlak URL (Next.js `metadata.alternates.languages`).
 * `path` kanonik iç rota (örn. `/`, `/turlar`, `/tur/foo`).
 */
export function alternateLanguageAbsoluteUrls(path: string): Record<string, string> {
  const base = getBaseUrl().replace(/\/$/, '')
  const out: Record<string, string> = {}
  for (const loc of SITE_LOCALES) {
    const p = withLocalePath(loc, path)
    const abs = p === '/' ? base : `${base}${p}`
    const hreflang = loc === 'tr' ? 'tr' : loc === 'en' ? 'en' : 'de'
    out[hreflang] = abs
  }
  const defaultPath = withLocalePath(DEFAULT_LOCALE as SiteLocale, path)
  out['x-default'] = defaultPath === '/' ? base : `${base}${defaultPath}`
  return out
}
