/**
 * Site ve e-posta linkleri için tek kaynak. Hepsi aynı base URL'i kullanır (NEXT_PUBLIC_SITE_URL / VERCEL_URL, yoksa cesmetekneturu.net).
 */

const OFFICIAL_DOMAIN = 'https://cesmetekneturu.net'

function getEnvBase(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  return url.replace(/\/$/, '')
}

/** E-postadaki buton/linkler için base URL (site ile aynı). */
export function getEmailBaseUrl(): string {
  const base = getEnvBase()
  return base || OFFICIAL_DOMAIN
}

/** Sitede (SSR/client) kullanılan base URL. */
export function getSiteBaseUrl(): string {
  const base = getEnvBase()
  return base || OFFICIAL_DOMAIN
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
