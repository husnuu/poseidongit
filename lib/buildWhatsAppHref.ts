/** Sanity / CMS’den gelen metni wa.me için sadece rakamlara indirger. */
export function buildWhatsAppHref(raw: string | null | undefined): string | null {
  const s = raw?.trim()
  if (!s) return null
  const digits = s.replace(/\D/g, '')
  if (digits.length < 10) return null
  return `https://wa.me/${digits}`
}
