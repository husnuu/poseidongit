import type { SiteLocale } from './config'
import { DEFAULT_LOCALE, LOCALE_PATH_PREFIX } from './config'
import { canonicalRouteToPublicPath } from './routeAliases'

/** Eski veya hatalı kanonik path’leri dosya yapısına uyarlar */
function normalizeLegacyCanonicalStripped(path: string): string {
  if (path === '/iletisim') return '/contact'
  if (path.startsWith('/iletisim/')) return `/contact${path.slice('/iletisim'.length)}`
  return path
}

/** Path ile ?query ve #hash'i ayırır; yalnızca path segmentleri yerelleştirilir. */
function splitPathQueryAndHash(full: string): { pathname: string; rest: string } {
  let pathname = full
  let rest = ''
  const q = pathname.indexOf('?')
  const h = pathname.indexOf('#')
  if (q >= 0 && (h < 0 || q < h)) {
    rest = pathname.slice(q)
    pathname = pathname.slice(0, q)
  } else if (h >= 0) {
    rest = pathname.slice(h)
    pathname = pathname.slice(0, h)
  }
  return { pathname, rest }
}

/**
 * Browser path without /en or /de (always starts with /).
 * `/en/tour/foo` → `/tour/foo` (kanonik iç rota `/tur/foo`), `/` → `/`
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
  const { pathname, rest } = splitPathQueryAndHash(normalized)
  const stripped = normalizeLegacyCanonicalStripped(stripLocalePathPrefix(pathname))
  const publicPath = canonicalRouteToPublicPath(locale, stripped)
  let out: string
  if (locale === DEFAULT_LOCALE) {
    out = publicPath === '/' ? '/' : publicPath
  } else {
    const prefix = LOCALE_PATH_PREFIX[locale]
    out = publicPath === '/' ? prefix || '/' : `${prefix}${publicPath}`
  }
  return `${out}${rest}`
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
