/**
 * Site ve e-posta linkleri için tek kaynak. Hepsi getBaseUrl (NEXT_PUBLIC_SITE_URL veya resmi domain) kullanır; VERCEL_URL asla kullanılmaz.
 */

import { getBaseUrl } from '@/lib/seo'
import type { SiteLocale } from '@/lib/i18n/config'
import { DEFAULT_LOCALE, isSiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'

/** E-postadaki buton/linkler için base URL.
 * EMAIL_BASE_URL (server-only) → NEXT_PUBLIC_SITE_URL → production domain.
 * Lokal testte NEXT_PUBLIC_SITE_URL tünel URL'si olsa bile email linkleri production'a gider.
 */
export function getEmailBaseUrl(): string {
  return (
    process.env.EMAIL_BASE_URL?.trim() ||
    'https://cesmetekneturu.net'
  ).replace(/\/$/, '')
}

/** Sitede (SSR/client) kullanılan base URL. */
export function getSiteBaseUrl(): string {
  return getBaseUrl()
}

function normalizeHostname(host: string): string {
  return host.replace(/^www\./i, '').toLowerCase()
}

/**
 * Aynı site (getBaseUrl / NEXT_PUBLIC_SITE_URL) içi linklerde Next.js `Link` için path.
 * CMS’te tam URL (https://siteniz/hakkimizda) girilmiş olsa bile aynı sekmede sayfa içi gezinme için kullanılır.
 */
export function sameSitePathFromHref(href: string | null | undefined): string | null {
  const raw = href?.trim()
  if (!raw) return null
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw || '/'

  let absolute: URL
  try {
    absolute = new URL(raw)
  } catch {
    return null
  }

  let baseParsed: URL
  try {
    baseParsed = new URL(getBaseUrl())
  } catch {
    return null
  }

  if (normalizeHostname(absolute.hostname) !== normalizeHostname(baseParsed.hostname)) {
    return null
  }

  const path = `${absolute.pathname}${absolute.search}${absolute.hash}`
  return path || '/'
}

function coerceSiteLocale(locale: string | undefined | null): SiteLocale {
  const k = typeof locale === 'string' ? locale.trim().toLowerCase() : ''
  return isSiteLocale(k) ? k : DEFAULT_LOCALE
}

/** Rezervasyonumu Yönet linki (e-posta). */
export function manageBookingUrl(bookingId: string): string {
  return `${getEmailBaseUrl()}/rezervasyon/yonet?bookingId=${encodeURIComponent(bookingId)}`
}

/** Rezervasyon yönetimi — dil önekli kamu URL’si (e-posta). */
export function manageBookingUrlForLocale(bookingId: string, locale?: string | null): string {
  const loc = coerceSiteLocale(locale ?? DEFAULT_LOCALE)
  const path = `/rezervasyon/yonet?bookingId=${encodeURIComponent(bookingId)}`
  const rel = withLocalePath(loc, path)
  return `${getEmailBaseUrl().replace(/\/$/, '')}${rel}`
}

/** Sitede bilet görüntüleme yolu (relative). E-posta için `ticketPageUrl` kullanın. */
export function ticketPagePath(bookingId: string, accessToken?: string): string {
  const id = bookingId.trim()
  if (!id) return '/bilet'
  const path = `/bilet/${encodeURIComponent(id)}`
  if (accessToken?.trim()) {
    return `${path}?token=${encodeURIComponent(accessToken.trim())}`
  }
  return path
}

/** Biletimi Görüntüle sayfası linki (e-posta). Token yoksa güvenli erişim için yönetim sayfasına gider. */
export function ticketPageUrl(bookingId: string, accessToken?: string): string {
  const base = getEmailBaseUrl().replace(/\/$/, '')
  return `${base}${ticketPagePath(bookingId, accessToken)}`
}

/** Bilet sayfası tam URL — dil önekli (/en/ticket/…). */
export function ticketPageUrlForLocale(
  bookingId: string,
  accessToken: string | undefined,
  locale?: string | null
): string {
  const loc = coerceSiteLocale(locale ?? DEFAULT_LOCALE)
  const base = getEmailBaseUrl().replace(/\/$/, '')
  const rel = withLocalePath(loc, ticketPagePath(bookingId, accessToken))
  return `${base}${rel}`
}

/** Müşteri CTA: token varsa doğrudan bilet sayfası, yoksa Rezervasyonumu Yönet. */
export function customerTicketViewUrl(
  bookingId: string,
  accessToken?: string,
  locale?: string | null
): string {
  if (accessToken?.trim()) return ticketPageUrlForLocale(bookingId, accessToken, locale)
  return manageBookingUrlForLocale(bookingId, locale)
}

/**
 * PDF üretimi / yönetim indirmesi. Token varsa /api/voucher/access (cookie + yönlendirme).
 * Müşteri arayüzünde tercihen `customerTicketViewUrl` / `ticketPagePath` kullanın.
 */
export function voucherPdfUrl(bookingId: string, download = false, accessToken?: string): string {
  const base = getEmailBaseUrl().replace(/\/$/, '')
  if (accessToken?.trim()) {
    const q = new URLSearchParams()
    q.set('bookingId', bookingId)
    q.set('token', accessToken.trim())
    if (download) q.set('download', '1')
    return `${base}/api/voucher/access?${q.toString()}`
  }
  const q = new URLSearchParams()
  q.set('bookingId', bookingId)
  if (download) q.set('download', '1')
  return `${base}/api/voucher?${q.toString()}`
}
