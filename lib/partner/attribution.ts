/**
 * Partner atfı (tarayıcı): misafir /p/[slug] sayfasına geldiğinde partner saklanır,
 * rezervasyonda sunucuya gönderilir. Son gelinen partner geçerlidir.
 */
const STORAGE_KEY = 'poseidon_partner_ref'

/** Misafir QR'ı okuttuktan sonra bu süre içinde yaptığı rezervasyon partnere yazılır. */
export const PARTNER_ATTRIBUTION_DAYS = 7

export type PartnerRef = { slug: string; channel: string }

export function savePartnerRef(ref: PartnerRef): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...ref, at: Date.now() }))
  } catch {
    /* localStorage kapalı olabilir — rezervasyon yine çalışır, yalnızca atıf yazılmaz */
  }
}

export function readPartnerRef(): PartnerRef | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { slug?: unknown; channel?: unknown; at?: unknown }
    if (typeof parsed.slug !== 'string' || typeof parsed.at !== 'number') return null
    if (Date.now() - parsed.at > PARTNER_ATTRIBUTION_DAYS * 24 * 60 * 60 * 1000) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return { slug: parsed.slug, channel: typeof parsed.channel === 'string' ? parsed.channel : 'link' }
  } catch {
    return null
  }
}
