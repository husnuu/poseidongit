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

/** Rezervasyonumu Yönet linki (e-posta). */
export function manageBookingUrl(bookingId: string): string {
  return `${getEmailBaseUrl()}/rezervasyon/yonet?bookingId=${encodeURIComponent(bookingId)}`
}

/** Biletimi Görüntüle sayfası linki (e-posta). */
export function ticketPageUrl(bookingId: string): string {
  return `${getEmailBaseUrl()}/bilet/${encodeURIComponent(bookingId)}`
}

/** PDF Bilet İndir (API) linki (e-posta). */
export function voucherPdfUrl(bookingId: string, download = false): string {
  const base = getEmailBaseUrl()
  const q = download ? '&download=1' : ''
  return `${base}/api/voucher?bookingId=${encodeURIComponent(bookingId)}${q}`
}
