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
  rowWhatsapp: string
  rowFriends: string
  rowInspired: string
  ariaEmailSend: string
  ariaOpenMaps: string
  ariaCall: string
  ariaWhatsapp: string
  ariaYoutube: string
  ariaInstagram: string
  mapIframeTitle: string
  defaultPopularToursTitle: string
  /** Sanity'de instagramLabel boşsa gösterilecek varsayılan metin. */
  instagramFallbackLabel: string
  /** Sanity'de youtubeLabel boşsa gösterilecek varsayılan metin. */
  youtubeFallbackLabel: string
  formTitle: string
  formLead: string
  officeTitle: string
  directionsCta: string
  socialTitle: string
  quickTitle: string
}

const TR: ContactPageUiStrings = {
  defaultTitle: 'İletişim',
  defaultMetaDescription:
    'Çeşme tekne turu rezervasyonu, özel tur ve grup talepleriniz için bize telefon, WhatsApp veya e-posta ile ulaşın; sorularınızı hızla yanıtlıyoruz.',
  formSectionAria: 'İletişim formu',
  labelFullName: 'Adınız *',
  labelGroupSize: 'Kaç Kişi *',
  labelEmail: 'E-posta Adresiniz *',
  labelPhone: 'Telefon Numarası',
  labelMessage: 'Mesajınız *',
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
  rowHours: 'SAATLER',
  rowAddress: 'ADRES',
  rowPhone: 'BİZİ ARAYIN',
  rowWhatsapp: "WHATSAPP'TAN YAZIN",
  rowFriends: 'YOUTUBE',
  rowInspired: 'INSTAGRAM',
  ariaEmailSend: 'E-posta gönder',
  ariaOpenMaps: 'Adresi Google Haritalar’da aç',
  ariaCall: 'Ara',
  ariaWhatsapp: "WhatsApp'tan yaz",
  ariaYoutube: 'YouTube kanalımız',
  ariaInstagram: 'Instagram’da takip et',
  mapIframeTitle: 'Harita',
  defaultPopularToursTitle: 'VEYA POPÜLER TURLARIMIZI BURADA BULABİLİRSİNİZ!',
  instagramFallbackLabel: "Instagram'da bizi takip edin",
  youtubeFallbackLabel: "Bizi YouTube'da bulun",
  formTitle: "Bize mesaj gönderin",
  formLead: "Tur, rezervasyon veya özel istekleriniz için formu doldurun.",
  officeTitle: "Ofisimiz",
  directionsCta: "Yol tarifi al",
  socialTitle: "Bizi takip edin",
  quickTitle: "Hızlı iletişim",
}

const EN: ContactPageUiStrings = {
  defaultTitle: 'Contact',
  defaultMetaDescription:
    'Contact us by phone, WhatsApp or email for Çeşme boat tour bookings, private tours and group requests — we reply to your questions quickly.',
  formSectionAria: 'Contact form',
  labelFullName: 'Your Name *',
  labelGroupSize: 'Group Size *',
  labelEmail: 'Your Email Address *',
  labelPhone: 'Phone Number',
  labelMessage: 'Your Message *',
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
  rowEmail: 'EMAIL',
  rowHours: 'HOURS',
  rowAddress: 'ADDRESS',
  rowPhone: 'CALL US',
  rowWhatsapp: 'MESSAGE US ON WHATSAPP',
  rowFriends: 'YOUTUBE',
  rowInspired: 'INSTAGRAM',
  ariaEmailSend: 'Send email',
  ariaOpenMaps: 'Open address in Google Maps',
  ariaCall: 'Call',
  ariaWhatsapp: 'Message us on WhatsApp',
  ariaYoutube: 'Our YouTube channel',
  ariaInstagram: 'Follow on Instagram',
  mapIframeTitle: 'Map',
  defaultPopularToursTitle: 'OR YOU CAN FIND OUR MOST POPULAR TOURS HERE!',
  instagramFallbackLabel: 'Follow us on Instagram',
  youtubeFallbackLabel: 'Find us on Youtube',
  formTitle: "Send us a message",
  formLead: "Fill in the form for tours, bookings or special requests.",
  officeTitle: "Our office",
  directionsCta: "Get directions",
  socialTitle: "Follow us",
  quickTitle: "Quick contact",
}

const DE: ContactPageUiStrings = {
  defaultTitle: 'Kontakt',
  defaultMetaDescription:
    'Kontaktieren Sie uns per Telefon, WhatsApp oder E-Mail für Bootstour-Buchungen in Çeşme, private Touren und Gruppenanfragen – wir antworten schnell.',
  formSectionAria: 'Kontaktformular',
  labelFullName: 'Ihr Name *',
  labelGroupSize: 'Personenanzahl *',
  labelEmail: 'Ihre E-Mail-Adresse *',
  labelPhone: 'Telefonnummer',
  labelMessage: 'Ihre Nachricht *',
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
  rowWhatsapp: 'PER WHATSAPP SCHREIBEN',
  rowFriends: 'YOUTUBE',
  rowInspired: 'INSTAGRAM',
  ariaEmailSend: 'E-Mail senden',
  ariaOpenMaps: 'Adresse in Google Maps öffnen',
  ariaCall: 'Anrufen',
  ariaWhatsapp: 'Per WhatsApp schreiben',
  ariaYoutube: 'YouTube-Kanal',
  ariaInstagram: 'Auf Instagram folgen',
  mapIframeTitle: 'Karte',
  defaultPopularToursTitle: 'HIER FINDEN SIE UNSERE BELIEBTESTEN TOUREN!',
  instagramFallbackLabel: 'Folgen Sie uns auf Instagram',
  youtubeFallbackLabel: 'Finden Sie uns auf YouTube',
  formTitle: "Schreiben Sie uns",
  formLead: "Füllen Sie das Formular für Touren, Buchungen oder besondere Wünsche aus.",
  officeTitle: "Unser Büro",
  directionsCta: "Route planen",
  socialTitle: "Folgen Sie uns",
  quickTitle: "Schnellkontakt",
}

const RU: ContactPageUiStrings = {
  defaultTitle: 'Контакты',
  defaultMetaDescription:
    'Свяжитесь с нами по телефону, WhatsApp или e-mail для бронирования морских прогулок в Чешме, частных туров и групповых заявок — ответим быстро.',
  formSectionAria: 'Контактная форма',
  labelFullName: 'Ваше имя *',
  labelGroupSize: 'Количество человек *',
  labelEmail: 'Ваш адрес электронной почты *',
  labelPhone: 'Номер телефона',
  labelMessage: 'Ваше сообщение *',
  sending: 'Отправка...',
  defaultSubmitLabel: 'Отправить сообщение',
  defaultSuccessMessage: 'Спасибо — мы получили ваше сообщение и скоро свяжемся с вами.',
  turnstileError: 'Пожалуйста, пройдите проверку безопасности.',
  submitErrorGeneric: 'Что-то пошло не так. Пожалуйста, попробуйте снова.',
  submitErrorNetwork: 'Ошибка сети. Пожалуйста, попробуйте снова.',
  valNameMin: 'Имя должно содержать не менее 2 символов',
  valGroupMin: 'Количество человек должно быть не менее 1',
  valEmail: 'Введите действительный адрес электронной почты',
  valMessageMin: 'Сообщение должно содержать не менее 10 символов',
  sidebarAria: 'Контактная информация',
  rowEmail: 'ЭЛ. ПОЧТА',
  rowHours: 'ЧАСЫ РАБОТЫ',
  rowAddress: 'АДРЕС',
  rowPhone: 'ПОЗВОНИТЕ НАМ',
  rowWhatsapp: 'НАПИШИТЕ В WHATSAPP',
  rowFriends: 'YOUTUBE',
  rowInspired: 'INSTAGRAM',
  ariaEmailSend: 'Отправить письмо',
  ariaOpenMaps: 'Открыть адрес в Google Картах',
  ariaCall: 'Позвонить',
  ariaWhatsapp: 'Написать в WhatsApp',
  ariaYoutube: 'Наш канал на YouTube',
  ariaInstagram: 'Подписаться в Instagram',
  mapIframeTitle: 'Карта',
  defaultPopularToursTitle: 'ИЛИ ВЫБЕРИТЕ ОДИН ИЗ НАШИХ САМЫХ ПОПУЛЯРНЫХ ТУРОВ!',
  instagramFallbackLabel: 'Подписывайтесь на нас в Instagram',
  youtubeFallbackLabel: 'Найдите нас на YouTube',
  formTitle: "Напишите нам",
  formLead: "Заполните форму по вопросам туров, бронирования или особых пожеланий.",
  officeTitle: "Наш офис",
  directionsCta: "Проложить маршрут",
  socialTitle: "Мы в соцсетях",
  quickTitle: "Быстрая связь",
}

export function getContactPageUiStrings(locale: SiteLocale): ContactPageUiStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  if (locale === 'ru') return RU
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
