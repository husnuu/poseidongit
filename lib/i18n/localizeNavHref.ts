import type { SiteLocale } from './config'
import { withLocalePath } from './paths'
import { getBaseUrl } from '@/lib/seo'

function siteHostnameMatches(hostname: string): boolean {
  const base = getBaseUrl()
  if (!base) return false
  try {
    const site = new URL(base)
    const norm = (h: string) => h.replace(/^www\./i, '').toLowerCase()
    return norm(hostname) === norm(site.hostname)
  } catch {
    return false
  }
}

/**
 * Header/footer menü: göreli path, /tr/…, tam site URL’si → geçerli dil önekli path.
 * Harici domain, mailto, tel aynen kalır.
 */
export function localizeNavHref(locale: SiteLocale, href: string | null | undefined): string {
  if (typeof href !== 'string' || !href.trim()) return '#'
  const t = href.trim()
  if (t === '#') return '#'
  if (t.startsWith('mailto:') || t.startsWith('tel:')) return t
  if (t.startsWith('http://') || t.startsWith('https://')) {
    try {
      const u = new URL(t)
      if (siteHostnameMatches(u.hostname)) {
        return withLocalePath(locale, u.pathname + u.search + u.hash)
      }
      return t
    } catch {
      return t
    }
  }
  return withLocalePath(locale, t)
}
