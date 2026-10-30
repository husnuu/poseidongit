/**
 * Rezervasyondaki telefonu WhatsApp Cloud API'nin beklediği biçime çevirir:
 * yalnızca rakam, ülke koduyla, "+" olmadan (örn. "905334173656").
 * Türkiye'ye özgü yaygın yazımlar da düzeltilir ("0533…", "533…").
 * Geçersizse null.
 */
export function normalizeWhatsAppPhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  let digits = String(raw).replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('00')) digits = digits.slice(2)
  // 0 5xx xxx xx xx (11 hane) → 90 5xx…
  if (digits.length === 11 && digits.startsWith('05')) digits = `9${digits}`
  // 5xx xxx xx xx (10 hane) → 90 5xx…
  else if (digits.length === 10 && digits.startsWith('5')) digits = `90${digits}`
  // "+90 0533…" gibi hatalı yazım → 90533…
  else if (digits.startsWith('900') && digits.length === 13) digits = `90${digits.slice(3)}`
  if (digits.length < 10 || digits.length > 15) return null
  return digits
}

/** Loglarda/arayüzde numarayı kısmen gizler: 90533***3656 */
export function maskPhone(digits: string | null | undefined): string {
  if (!digits) return '—'
  if (digits.length <= 7) return digits
  return `${digits.slice(0, 5)}***${digits.slice(-4)}`
}
