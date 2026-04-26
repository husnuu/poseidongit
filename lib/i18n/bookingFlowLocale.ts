import type { SiteLocale } from './config'
import { DEFAULT_LOCALE, isSiteLocale } from './config'

export function normalizeBookingFlowLocale(raw: unknown): SiteLocale {
  if (typeof raw !== 'string') return DEFAULT_LOCALE
  const k = raw.trim().toLowerCase()
  return isSiteLocale(k) ? k : DEFAULT_LOCALE
}

export function numberLocaleForBooking(loc: SiteLocale): string {
  if (loc === 'en') return 'en-US'
  if (loc === 'de') return 'de-DE'
  return 'tr-TR'
}

const PDF = {
  tr: {
    ebiletBadge: 'E-BİLET ÇEŞME POSEIDON',
    durationPrefix: 'Süre:',
    cesme: 'ÇEŞME',
    tourDate: 'Tur tarihi',
    estDeparture: (dep: string, board: string) => `Tahmini kalkış ${dep} · Gemiye biniş en geç ${board}`,
    boardingTimeOnly: (t: string) => `Biniş saati: ${t}`,
    estArrival: (t: string) => `Tahmini varış: ${t}`,
    passenger: 'Yolcu',
    classLabel: 'Sınıf',
    locaPrefix: 'Loca',
    refNumber: 'Rezervasyon numarası',
    boardingVerify: 'Biniş doğrulama',
    qrCode: 'QR kodu',
    qrHint: 'Binişte bu QR kodu gösteriniz.',
    total: 'Toplam tutar',
    paid: 'Ödenen tutar',
    meeting: 'Toplanma noktası',
    adult: (n: number) => `${n} Yetişkin`,
    child: (n: number) => `${n} Çocuk`,
    infant: (n: number) => `${n} Bebek`,
  },
  en: {
    ebiletBadge: 'E-TICKET ÇEŞME POSEIDON',
    durationPrefix: 'Duration:',
    cesme: 'ÇEŞME',
    tourDate: 'Tour date',
    estDeparture: (dep: string, board: string) => `Estimated departure ${dep} · Board by ${board} at the latest`,
    boardingTimeOnly: (t: string) => `Boarding time: ${t}`,
    estArrival: (t: string) => `Estimated return: ${t}`,
    passenger: 'Guest',
    classLabel: 'Class',
    locaPrefix: 'Box',
    refNumber: 'Booking reference',
    boardingVerify: 'Boarding check',
    qrCode: 'QR code',
    qrHint: 'Please show this QR code when boarding.',
    total: 'Total',
    paid: 'Amount paid',
    meeting: 'Meeting point',
    adult: (n: number) => `${n} Adult${n === 1 ? '' : 's'}`,
    child: (n: number) => `${n} Child${n === 1 ? '' : 'ren'}`,
    infant: (n: number) => `${n} Infant${n === 1 ? '' : 's'}`,
  },
  de: {
    ebiletBadge: 'E-TICKET ÇEŞME POSEIDON',
    durationPrefix: 'Dauer:',
    cesme: 'ÇEŞME',
    tourDate: 'Tourdatum',
    estDeparture: (dep: string, board: string) => `Voraussichtliche Abfahrt ${dep} · Bitte spätestens ${board} an Bord`,
    boardingTimeOnly: (t: string) => `Boarding-Zeit: ${t}`,
    estArrival: (t: string) => `Voraussichtliche Rückkehr: ${t}`,
    passenger: 'Gast',
    classLabel: 'Klasse',
    locaPrefix: 'Loge',
    refNumber: 'Buchungsnummer',
    boardingVerify: 'Boarding-Check',
    qrCode: 'QR-Code',
    qrHint: 'Bitte zeigen Sie diesen QR-Code beim Einsteigen.',
    total: 'Gesamtbetrag',
    paid: 'Bezahlt',
    meeting: 'Treffpunkt',
    adult: (n: number) => (n === 1 ? '1 Erwachsener' : `${n} Erwachsene`),
    child: (n: number) => `${n} Kind${n === 1 ? '' : 'er'}`,
    infant: (n: number) => `${n} Baby${n === 1 ? '' : 's'}`,
  },
} as const

export type VoucherPdfUiStrings = (typeof PDF)[keyof typeof PDF]

export function voucherPdfUiStrings(loc: SiteLocale): VoucherPdfUiStrings {
  return (PDF[loc as keyof typeof PDF] ?? PDF.tr) as VoucherPdfUiStrings
}

export function formatParticipantCountsLine(
  counts: { adult: number; child: number; infant: number },
  loc: SiteLocale
): string {
  const s = voucherPdfUiStrings(loc)
  const p: string[] = []
  if (counts.adult > 0) p.push(s.adult(counts.adult))
  if (counts.child > 0) p.push(s.child(counts.child))
  if (counts.infant > 0) p.push(s.infant(counts.infant))
  return p.length ? p.join(', ') : '—'
}

export const VOUCHER_POLICIES: Record<
  SiteLocale,
  { cancellationPolicy: string; voucherNotice: string; languageLabel: string }
> = {
  tr: {
    cancellationPolicy:
      'Tura 24 saat kala ücretsiz iptal. Sonrasında ödenen tutar iade edilmez.',
    voucherNotice: 'Biniş sırasında bu bileti gösteriniz.',
    languageLabel: 'Türkçe',
  },
  en: {
    cancellationPolicy:
      'Free cancellation up to 24 hours before the tour. After that, no refund of amounts paid.',
    voucherNotice: 'Please show this ticket when boarding.',
    languageLabel: 'English',
  },
  de: {
    cancellationPolicy:
      'Kostenlose Stornierung bis 24 Stunden vor der Tour. Danach keine Rückerstattung.',
    voucherNotice: 'Bitte zeigen Sie dieses Ticket beim Einsteigen.',
    languageLabel: 'Deutsch',
  },
}

/** Premium müşteri e-postası (ödeme onayı) — tablo etiketleri ve metinler */
export function bookingEmailPremiumStrings(loc: SiteLocale) {
  const L = loc === 'en' ? EN : loc === 'de' ? DE : TR
  return L
}

const TR = {
  successTitlePaid: 'Rezervasyonunuz onaylandı!',
  successTitlePending: 'Rezervasyonunuz alındı!',
  successSubPaid: 'Ödemeniz başarıyla alındı. Bu e-postayı bilet olarak saklayabilirsiniz.',
  successSubPending: 'Ödemenizi tamamladığınızda biletiniz e-posta ile gönderilecektir.',
  subheader: 'Çeşme Tekne Turu Rezervasyonu',
  reservationNo: 'Rezervasyon No',
  detailsTitle: 'Rezervasyon Detayları',
  tour: 'Tur',
  date: 'Tarih',
  depTime: 'Kalkış saati',
  pickup: 'Toplanma noktası',
  guests: 'Misafirler',
  classLabel: 'Sınıf',
  paidRow: 'Ödenen Tutar',
  mealPref: 'Yemek tercihi',
  mealDist: 'Yemek dağılımı',
  otherTravelers: 'Diğer yolcular',
  mealInline: 'Yemek',
  totalRow: 'Toplam Tutar',
  manageCta: 'Rezervasyonumu Yönet',
  viewTicketCta: 'Biletimi Görüntüle',
  importantTitle: 'Önemli Bilgiler',
  bullet30: 'Lütfen kalkış saatinden 30 dakika önce teknede olun.',
  bulletTicket: 'Biniş sırasında web sitedeki bilet sayfanızı veya e-posta ekindeki PDF biletinizi göstermeniz yeterlidir.',
  bulletContact: 'Sorularınız için bizimle iletişime geçebilirsiniz.',
  contactTitle: 'İletişim',
  footerLinks: 'Gizlilik Politikası · İptal-İade · Güvenlik',
  footerAuto: 'Bu e-posta otomatik olarak gönderilmiştir.',
  subjectReceived: 'Rezervasyonunuz alındı',
  subjectPaid: 'Rezervasyonunuz onaylandı',
  locaPrefix: 'Loca',
  heroAlt: 'Tekne turu',
}

const EN = {
  successTitlePaid: 'Your booking is confirmed!',
  successTitlePending: 'Your booking has been received!',
  successSubPaid: 'Your payment was successful. You can keep this email as your ticket.',
  successSubPending: 'Once you complete payment, your ticket will be sent by email.',
  subheader: 'Çeşme boat tour booking',
  reservationNo: 'Booking ref.',
  detailsTitle: 'Booking details',
  tour: 'Tour',
  date: 'Date',
  depTime: 'Departure time',
  pickup: 'Meeting point',
  guests: 'Guests',
  classLabel: 'Class',
  paidRow: 'Amount paid',
  mealPref: 'Meal preference',
  mealDist: 'Meal breakdown',
  otherTravelers: 'Other guests',
  mealInline: 'Meal',
  totalRow: 'Total',
  manageCta: 'Manage my booking',
  viewTicketCta: 'View my ticket',
  importantTitle: 'Important',
  bullet30: 'Please be at the boat at least 30 minutes before departure.',
  bulletTicket: 'At boarding, show your ticket page on the website or the PDF attached to this email.',
  bulletContact: 'Contact us if you have any questions.',
  contactTitle: 'Contact',
  footerLinks: 'Privacy · Cancellation',
  footerAuto: 'This email was sent automatically.',
  subjectReceived: 'Your booking was received',
  subjectPaid: 'Your booking is confirmed',
  locaPrefix: 'Box',
  heroAlt: 'Boat tour',
}

const DE = {
  successTitlePaid: 'Ihre Buchung ist bestätigt!',
  successTitlePending: 'Ihre Buchung ist eingegangen!',
  successSubPaid: 'Ihre Zahlung war erfolgreich. Sie können diese E-Mail als Ticket aufbewahren.',
  successSubPending: 'Nach Zahlungseingang erhalten Sie Ihr Ticket per E-Mail.',
  subheader: 'Bootstour-Buchung Çeşme',
  reservationNo: 'Buchungsnr.',
  detailsTitle: 'Buchungsdetails',
  tour: 'Tour',
  date: 'Datum',
  depTime: 'Abfahrtszeit',
  pickup: 'Treffpunkt',
  guests: 'Gäste',
  classLabel: 'Klasse',
  paidRow: 'Bezahlter Betrag',
  mealPref: 'Mahlzeitenpräferenz',
  mealDist: 'Mahlzeitenverteilung',
  otherTravelers: 'Weitere Gäste',
  mealInline: 'Mahlzeit',
  totalRow: 'Gesamtbetrag',
  manageCta: 'Buchung verwalten',
  viewTicketCta: 'Ticket anzeigen',
  importantTitle: 'Wichtige Hinweise',
  bullet30: 'Bitte seien Sie mindestens 30 Minuten vor Abfahrt am Boot.',
  bulletTicket: 'Beim Einsteigen zeigen Sie die Ticketseite im Web oder das PDF in dieser E-Mail.',
  bulletContact: 'Bei Fragen kontaktieren Sie uns gerne.',
  contactTitle: 'Kontakt',
  footerLinks: 'Datenschutz · Stornierung',
  footerAuto: 'Diese E-Mail wurde automatisch versendet.',
  subjectReceived: 'Ihre Buchung ist eingegangen',
  subjectPaid: 'Ihre Buchung ist bestätigt',
  locaPrefix: 'Loge',
  heroAlt: 'Bootstour',
}

export type BoardingPassUiCopy = {
  ariaTicket: string
  accessDeniedTitle: string
  accessDeniedBody: string
  homeCta: string
}

export function boardingPassTicketActions(loc: SiteLocale): {
  printSave: string
  manageBooking: string
  backHome: string
  qrAlt: string
  qrLoadFail: string
} {
  if (loc === 'en')
    return {
      printSave: 'Print or save as PDF',
      manageBooking: 'Manage booking',
      backHome: 'Back to home',
      qrAlt: 'Boarding QR code',
      qrLoadFail: 'QR code could not be loaded.',
    }
  if (loc === 'de')
    return {
      printSave: 'Drucken oder als PDF speichern',
      manageBooking: 'Buchung verwalten',
      backHome: 'Zur Startseite',
      qrAlt: 'Boarding-QR-Code',
      qrLoadFail: 'QR-Code konnte nicht geladen werden.',
    }
  return {
    printSave: 'Yazdır veya PDF kaydet',
    manageBooking: 'Rezervasyonu Yönet',
    backHome: 'Ana sayfaya dön',
    qrAlt: 'Biniş QR kodu',
    qrLoadFail: 'QR kodu yüklenemedi.',
  }
}

export function boardingPassPageCopy(loc: SiteLocale): BoardingPassUiCopy {
  if (loc === 'en') {
    return {
      ariaTicket: 'E-ticket',
      accessDeniedTitle: 'Access denied',
      accessDeniedBody:
        'To open your ticket, use the link in your email or on the Manage booking page.',
      homeCta: 'Back to home',
    }
  }
  if (loc === 'de') {
    return {
      ariaTicket: 'E-Ticket',
      accessDeniedTitle: 'Zugriff verweigert',
      accessDeniedBody:
        'Öffnen Sie Ihr Ticket über den Link in Ihrer E-Mail oder auf der Seite „Buchung verwalten“.',
      homeCta: 'Zur Startseite',
    }
  }
  return {
    ariaTicket: 'Elektronik bilet',
    accessDeniedTitle: 'Erişim reddedildi',
    accessDeniedBody:
      'Bilet sayfasına erişmek için e-postanızdaki veya rezervasyon yönetim sayfasındaki geçerli linki kullanın.',
    homeCta: 'Ana sayfaya dön',
  }
}
