/**
 * Site ve e-posta linkleri için tek kaynak. Hepsi getBaseUrl (NEXT_PUBLIC_SITE_URL veya resmi domain) kullanır; VERCEL_URL asla kullanılmaz.
 */

import { getBaseUrl } from '@/lib/seo'

/** E-postadaki buton/linkler için base URL (site ile aynı). */
export function getEmailBaseUrl(): string {
  return getBaseUrl()
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

/** Rezervasyonumu Yönet linki (e-posta). */
export function manageBookingUrl(bookingId: string): string {
  return `${getEmailBaseUrl()}/rezervasyon/yonet?bookingId=${encodeURIComponent(bookingId)}`
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

/** Müşteri CTA: token varsa doğrudan bilet sayfası, yoksa Rezervasyonumu Yönet. */
export function customerTicketViewUrl(bookingId: string, accessToken?: string): string {
  if (accessToken?.trim()) return ticketPageUrl(bookingId, accessToken)
  return manageBookingUrl(bookingId)
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
