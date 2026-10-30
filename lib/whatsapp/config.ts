import type { SiteLocale } from '@/lib/i18n/config'

/**
 * WhatsApp Cloud API (Meta) ayarları — hepsi ortam değişkeninden okunur.
 *
 * Zorunlu (gönderim için):
 *   WHATSAPP_ACCESS_TOKEN      — Meta "System User" kalıcı erişim anahtarı
 *   WHATSAPP_PHONE_NUMBER_ID   — WhatsApp Business numarasının "Phone number ID"si
 *
 * İsteğe bağlı:
 *   WHATSAPP_API_VERSION       — Graph API sürümü (varsayılan v21.0)
 *   WHATSAPP_TEMPLATE_LANGUAGES— Meta'da onaylı şablon dilleri, virgülle (varsayılan "tr,en")
 *   WHATSAPP_TEMPLATE_*        — Şablon adları (varsayılanlar aşağıda)
 *   WHATSAPP_DISABLED=1        — Anahtarlar tanımlı olsa bile gönderimi kapatır
 *   WHATSAPP_WEBHOOK_VERIFY_TOKEN / WHATSAPP_APP_SECRET — teslim/okundu bildirimi webhook'u
 *
 * Anahtarlar tanımlı değilse sistem hiçbir şey göndermez; yalnızca loglar.
 */

export type WhatsAppTemplateKind = 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'disruption'

const DEFAULT_TEMPLATE_NAMES: Record<WhatsAppTemplateKind, string> = {
  confirmation: 'poseidon_rezervasyon_onayi',
  reminder_24h: 'poseidon_hatirlatma_24s',
  reminder_2h: 'poseidon_hatirlatma_2s',
  disruption: 'poseidon_sefer_duyurusu',
}

const TEMPLATE_ENV: Record<WhatsAppTemplateKind, string> = {
  confirmation: 'WHATSAPP_TEMPLATE_CONFIRMATION',
  reminder_24h: 'WHATSAPP_TEMPLATE_REMINDER_24H',
  reminder_2h: 'WHATSAPP_TEMPLATE_REMINDER_2H',
  disruption: 'WHATSAPP_TEMPLATE_DISRUPTION',
}

export function whatsappTemplateName(kind: WhatsAppTemplateKind): string {
  return process.env[TEMPLATE_ENV[kind]]?.trim() || DEFAULT_TEMPLATE_NAMES[kind]
}

export function whatsappApiVersion(): string {
  return process.env.WHATSAPP_API_VERSION?.trim() || 'v21.0'
}

export function whatsappCredentials(): { token: string; phoneNumberId: string } | null {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim()
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  if (!token || !phoneNumberId) return null
  return { token, phoneNumberId }
}

/** Gönderim açık mı: anahtarlar tanımlı ve WHATSAPP_DISABLED değil. */
export function isWhatsAppEnabled(): boolean {
  if (process.env.WHATSAPP_DISABLED === '1' || process.env.WHATSAPP_DISABLED === 'true') return false
  return whatsappCredentials() != null
}

/** Meta'da şablonu onaylı diller (WHATSAPP_TEMPLATE_LANGUAGES). */
function approvedLanguages(): string[] {
  const raw = process.env.WHATSAPP_TEMPLATE_LANGUAGES?.trim() || 'tr,en'
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Rezervasyon dilinden şablon dili: onaylı diller arasında varsa o dil,
 * yoksa İngilizce, o da yoksa listedeki ilk dil.
 */
export function whatsappTemplateLanguage(locale: SiteLocale | string | null | undefined): string {
  const langs = approvedLanguages()
  const want = (locale ?? 'tr').toString().toLowerCase().slice(0, 2)
  const exact = langs.find((l) => l.toLowerCase().slice(0, 2) === want)
  if (exact) return exact
  const en = langs.find((l) => l.toLowerCase().startsWith('en'))
  return en ?? langs[0] ?? 'tr'
}
