import type { SiteLocale } from './config'
import { DEFAULT_LOCALE, LOCALE_PATH_PREFIX } from './config'

/**
 * Browser path without /en or /de (always starts with /).
 * `/en/tour/foo` → `/tour/foo`, `/` → `/`
 */
export function stripLocalePathPrefix(pathname: string): string {
  if (!pathname || pathname === '/') return '/'
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const rest = pathname.slice(3) || '/'
    return rest.startsWith('/') ? rest : `/${rest}`
  }
  if (pathname === '/de' || pathname.startsWith('/de/')) {
    const rest = pathname.slice(3) || '/'
    return rest.startsWith('/') ? rest : `/${rest}`
  }
  if (pathname === '/tr' || pathname.startsWith('/tr/')) {
    const rest = pathname.slice(3) || '/'
    return rest.startsWith('/') ? rest : `/${rest}`
  }
  return pathname.startsWith('/') ? pathname : `/${pathname}`
}

/**
 * Prefix internal paths for links (Sanity hrefs are usually Turkish paths like /turlar).
 * Önce /tr, /en, /de önekini şerit eder; böylece aktif dile göre doğru URL üretilir.
 */
export function withLocalePath(locale: SiteLocale, path: string): string {
  const p = path.trim()
  if (!p || p === '#') return p || '#'
  if (
    p.startsWith('http://') ||
    p.startsWith('https://') ||
    p.startsWith('mailto:') ||
    p.startsWith('tel:')
  ) {
    return p
  }
  const normalized = p.startsWith('/') ? p : `/${p}`
  const stripped = stripLocalePathPrefix(normalized)
  if (locale === DEFAULT_LOCALE) {
    return stripped === '/' ? '/' : stripped
  }
  const prefix = LOCALE_PATH_PREFIX[locale]
  if (stripped === '/') return prefix || '/'
  return `${prefix}${stripped}`
}

export function parseLocaleFromPathname(pathname: string): {
  locale: SiteLocale
  pathWithoutLocale: string
} {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'en') {
    const rest = parts.slice(1)
    return { locale: 'en', pathWithoutLocale: rest.length ? `/${rest.join('/')}` : '/' }
  }
  if (parts[0] === 'de') {
    const rest = parts.slice(1)
    return { locale: 'de', pathWithoutLocale: rest.length ? `/${rest.join('/')}` : '/' }
  }
  /** İç rewrite veya doğrudan /tr/... adres çubuğunda */
  if (parts[0] === 'tr') {
    const rest = parts.slice(1)
    return { locale: 'tr', pathWithoutLocale: rest.length ? `/${rest.join('/')}` : '/' }
  }
  return { locale: 'tr', pathWithoutLocale: pathname === '' ? '/' : pathname.startsWith('/') ? pathname : `/${pathname}` }
}
