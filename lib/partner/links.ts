/** Mini sayfa adresleri. `k` parametresi rezervasyonun geldiği kanalı (QR / bağlantı) ayırır. */
export function partnerPagePath(slug: string): string {
  return `/p/${slug}`
}

export function partnerShareUrl(baseUrl: string, slug: string, channel: 'qr' | 'link'): string {
  return `${baseUrl.replace(/\/$/, '')}${partnerPagePath(slug)}?k=${channel}`
}

export function partnerQrImagePath(slug: string, opts?: { download?: boolean }): string {
  return `/api/partner/qr/${slug}${opts?.download ? '?download=1' : ''}`
}
