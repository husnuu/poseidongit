/** WhatsApp chat URL from CMS phone/chat fields (digits only for wa.me). */
export function buildWhatsAppLink(
  chatValue?: string | null,
  phoneFallback?: string | null,
): string | null {
  const raw = chatValue?.trim() || phoneFallback?.trim() || ''
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}`
}
