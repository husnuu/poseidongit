import type { SiteLocale } from '../config'
import { mergeDeep } from '../mergeDeep'

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export type ContactPageUiStrings = {
  defaultTitle: string
  defaultMetaDescription: string
  formSectionAria: string
  labelFullName: string
  labelGroupSize: string
  labelEmail: string
  labelPhone: string
  labelMessage: string
  sending: string
  defaultSubmitLabel: string
  defaultSuccessMessage: string
  turnstileError: string
  submitErrorGeneric: string
  submitErrorNetwork: string
  valNameMin: string
  valGroupMin: string
  valEmail: string
  valMessageMin: string
  sidebarAria: string
  rowEmail: string
  rowHours: string
  rowAddress: string
  rowPhone: string
  rowFriends: string
  rowInspired: string
  ariaEmailSend: string
  ariaOpenMaps: string
  ariaCall: string
  ariaYoutube: string
  ariaInstagram: string
  mapDirections: string
  mapWhatsapp: string
  mapActionsAria: string
  mapIframeTitle: string
  defaultPopularToursTitle: string
}

const TR: ContactPageUiStrings = {
  defaultTitle: 'İletişim',
  defaultMetaDescription: 'Bizimle iletişime geçin.',
  formSectionAria: 'İletişim formu',
  labelFullName: 'Ad soyad *',
  labelGroupSize: 'Grup büyüklüğü *',
  labelEmail: 'E-posta *',
  labelPhone: 'Telefon',
  labelMessage: 'Mesaj *',
  sending: 'Gönderiliyor...',
  defaultSubmitLabel: 'Gönder',
  defaultSuccessMessage: 'Mesajınız alındı. En kısa sürede dönüş yapacağız.',
  turnstileError: 'Lütfen doğrulama kutusunu işaretleyin.',
  submitErrorGeneric: 'Gönderim başarısız. Lütfen tekrar deneyin.',
  submitErrorNetwork: 'Bağlantı hatası. Lütfen tekrar deneyin.',
  valNameMin: 'Ad soyad en az 2 karakter olmalıdır',
  valGroupMin: 'Grup büyüklüğü en az 1 olmalıdır',
  valEmail: 'Geçerli bir e-posta girin',
  valMessageMin: 'Mesaj en az 10 karakter olmalıdır',
  sidebarAria: 'İletişim bilgileri',
  rowEmail: 'E-POSTA',
  rowHours: 'ÇALIŞMA SAATLERİ',
  rowAddress: 'OFİS ADRESİ',
  rowPhone: 'TELEFON',
  rowFriends: 'BİZİMLE İLETİŞİMDE KALIN',
  rowInspired: 'İLHAN ALIN',
  ariaEmailSend: 'E-posta gönder',
  ariaOpenMaps: 'Adresi Google Haritalar’da aç',
  ariaCall: 'Ara',
  ariaYoutube: 'YouTube kanalımız',
  ariaInstagram: 'Instagram’da takip et',
  mapDirections: 'Yol tarifi al',
  mapWhatsapp: 'Konumu WhatsApp’ta paylaş',
  mapActionsAria: 'Konum işlemleri',
  mapIframeTitle: 'Harita',
  defaultPopularToursTitle: 'EN POPÜLER TURLARIMIZA BURADAN ULAŞABİLİRSİNİZ!',
}

const EN: ContactPageUiStrings = {
  defaultTitle: 'Contact',
  defaultMetaDescription: 'Get in touch with us.',
  formSectionAria: 'Contact form',
  labelFullName: 'Full name *',
  labelGroupSize: 'Group size *',
  labelEmail: 'Email *',
  labelPhone: 'Phone',
  labelMessage: 'Message *',
  sending: 'Sending...',
  defaultSubmitLabel: 'Send message',
  defaultSuccessMessage: 'Thank you — we received your message and will get back to you shortly.',
  turnstileError: 'Please complete the verification challenge.',
  submitErrorGeneric: 'Something went wrong. Please try again.',
  submitErrorNetwork: 'Network error. Please try again.',
  valNameMin: 'Name must be at least 2 characters',
  valGroupMin: 'Group size must be at least 1',
  valEmail: 'Please enter a valid email',
  valMessageMin: 'Message must be at least 10 characters',
  sidebarAria: 'Contact details',
  rowEmail: 'EMAIL US',
  rowHours: 'BUSINESS HOURS',
  rowAddress: 'OFFICE LOCATION',
  rowPhone: 'CALL US',
  rowFriends: "LET'S BE FRIENDS",
  rowInspired: 'GET INSPIRED',
  ariaEmailSend: 'Send email',
  ariaOpenMaps: 'Open address in Google Maps',
  ariaCall: 'Call',
  ariaYoutube: 'Our YouTube channel',
  ariaInstagram: 'Follow on Instagram',
  mapDirections: 'Get directions',
  mapWhatsapp: 'Share location on WhatsApp',
  mapActionsAria: 'Location actions',
  mapIframeTitle: 'Map',
  defaultPopularToursTitle: 'OR YOU CAN FIND OUR MOST POPULAR TOURS HERE!',
}

const DE: ContactPageUiStrings = {
  defaultTitle: 'Kontakt',
  defaultMetaDescription: 'Nehmen Sie Kontakt mit uns auf.',
  formSectionAria: 'Kontaktformular',
  labelFullName: 'Vor- und Nachname *',
  labelGroupSize: 'Gruppengröße *',
  labelEmail: 'E-Mail *',
  labelPhone: 'Telefon',
  labelMessage: 'Nachricht *',
  sending: 'Wird gesendet...',
  defaultSubmitLabel: 'Nachricht senden',
  defaultSuccessMessage: 'Vielen Dank — wir haben Ihre Nachricht erhalten und melden uns bald.',
  turnstileError: 'Bitte bestätigen Sie die Sicherheitsprüfung.',
  submitErrorGeneric: 'Senden fehlgeschlagen. Bitte erneut versuchen.',
  submitErrorNetwork: 'Netzwerkfehler. Bitte erneut versuchen.',
  valNameMin: 'Name muss mindestens 2 Zeichen haben',
  valGroupMin: 'Gruppengröße mindestens 1',
  valEmail: 'Bitte eine gültige E-Mail eingeben',
  valMessageMin: 'Nachricht mindestens 10 Zeichen',
  sidebarAria: 'Kontaktdaten',
  rowEmail: 'E-MAIL',
  rowHours: 'ÖFFNUNGSZEITEN',
  rowAddress: 'ADRESSE',
  rowPhone: 'ANRUFEN',
  rowFriends: 'BLEIBEN SIE IN KONTAKT',
  rowInspired: 'INSPIRATION',
  ariaEmailSend: 'E-Mail senden',
  ariaOpenMaps: 'Adresse in Google Maps öffnen',
  ariaCall: 'Anrufen',
  ariaYoutube: 'YouTube-Kanal',
  ariaInstagram: 'Auf Instagram folgen',
  mapDirections: 'Route anzeigen',
  mapWhatsapp: 'Standort per WhatsApp teilen',
  mapActionsAria: 'Kartenaktionen',
  mapIframeTitle: 'Karte',
  defaultPopularToursTitle: 'HIER FINDEN SIE UNSERE BELIEBTESTEN TOUREN!',
}

export function getContactPageUiStrings(locale: SiteLocale): ContactPageUiStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  return TR
}

/** Sanity `pageTranslations.*.ui` alanındaki dolu stringler kod varsayılanının üzerine yazar. */
export function mergeContactUiFromSanity(
  base: ContactPageUiStrings,
  ui: unknown,
): ContactPageUiStrings {
  if (!ui || !isPlainObject(ui)) return base
  const cleaned: Record<string, string> = {}
  for (const [k, v] of Object.entries(ui)) {
    if (typeof v === 'string' && v.trim()) cleaned[k] = v.trim()
  }
  if (Object.keys(cleaned).length === 0) return base
  return mergeDeep(base as unknown as Record<string, unknown>, cleaned) as unknown as ContactPageUiStrings
}
