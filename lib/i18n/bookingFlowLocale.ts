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
    remaining: 'Kalan tutar (nakit)',
    meeting: 'Toplanma noktası',
    viewOnMap: 'Haritada görüntüle',
    boardingStarts: 'Biniş başlar',
    latestBoarding: 'En geç biniş',
    departure: 'Kalkış',
    mealLabel: 'Yemek',
    whatToBringTitle: 'Getirmeniz gerekenler',
    whatToBringText:
      'Yüzme kıyafetleri, güneş kremi, şapka, havlu ve yüzme molaları arasında rahat hareket edebilmeniz için hafif kıyafetler getirmenizi öneririz.',
    equipmentProvidedText: 'Can yeleği gibi güvenlik ekipmanları tarafımızdan temin edilmektedir.',
    foodDrinkTitle: 'Yiyecek & İçecek',
    foodDrinkPolicyText: 'Dışarıdan yiyecek getirmeniz serbesttir; içecek getirilmesine izin verilmemektedir.',
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
    remaining: 'Remaining (cash)',
    meeting: 'Meeting point',
    viewOnMap: 'View on map',
    boardingStarts: 'Boarding starts',
    latestBoarding: 'Latest boarding',
    departure: 'Departure',
    mealLabel: 'Meal',
    whatToBringTitle: 'What to bring',
    whatToBringText:
      'Swimwear, sunscreen, a hat, a towel, and light clothing to move comfortably between swim stops.',
    equipmentProvidedText: 'Safety equipment such as life jackets is provided on board.',
    foodDrinkTitle: 'Food & Drinks',
    foodDrinkPolicyText: "You're welcome to bring your own food; outside drinks are not permitted on board.",
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
    remaining: 'Restbetrag (bar)',
    meeting: 'Treffpunkt',
    viewOnMap: 'Auf der Karte ansehen',
    boardingStarts: 'Boarding beginnt',
    latestBoarding: 'Spätestes Boarding',
    departure: 'Abfahrt',
    mealLabel: 'Essen',
    whatToBringTitle: 'Was Sie mitbringen sollten',
    whatToBringText:
      'Badebekleidung, Sonnencreme, einen Hut, ein Handtuch und leichte Kleidung, um sich zwischen den Schwimmpausen bequem zu bewegen.',
    equipmentProvidedText: 'Sicherheitsausrüstung wie Schwimmwesten wird an Bord gestellt.',
    foodDrinkTitle: 'Essen & Getränke',
    foodDrinkPolicyText: 'Sie dürfen eigenes Essen mitbringen; das Mitbringen von Getränken ist nicht gestattet.',
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
  ru: {
    cancellationPolicy:
      'Бесплатная отмена возможна не позднее чем за 24 часа до начала тура. После этого оплаченная сумма не возвращается.',
    voucherNotice: 'Пожалуйста, предъявите этот билет при посадке.',
    languageLabel: 'Русский',
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
  remainingRow: 'Kapıda ödenecek (nakit)',
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
  bulletCashRemaining: 'Kalan tutar tur günü teknede nakit olarak ödenmesi rica olunur.',
  bulletContact: 'Sorularınız için bizimle iletişime geçebilirsiniz.',
  contactTitle: 'İletişim',
  footerLinks: 'Gizlilik Politikası · İptal-İade · Güvenlik',
  footerAuto: 'Bu e-posta otomatik olarak gönderilmiştir.',
  subjectReceived: 'Rezervasyonunuz alındı',
  subjectPaid: 'Rezervasyonunuz onaylandı',
  locaPrefix: 'Loca',
  heroAlt: 'Tekne turu',
  greeting: (name: string) => `Merhaba ${name},`,
  introText: (tourTitle: string) =>
    `Rezervasyonunuz için teşekkür ederiz! Sizi teknemizde ağırlamak için sabırsızlanıyoruz. ${tourTitle} için rezervasyonunuz onaylandı, tüm detayları aşağıda bulabilirsiniz.`,
  boardingPassTitle: 'Biniş Kartı',
  boardingPassHint: 'Biniş sırasında ekibe gösterin',
  reservationOwner: 'Rezervasyon Sahibi',
  meetingPointTitle: 'Toplanma Noktası',
  viewOnMap: 'Haritada Görüntüle',
  boardingScheduleTitle: 'Biniş & Hareket',
  boardingStarts: 'Biniş başlar',
  latestBoarding: 'En geç biniş',
  departureLabel: 'Kalkış',
  whatToBringTitle: 'Yanınıza Almanız Gerekenler',
  whatToBringText:
    'Yüzme kıyafetleri, güneş kremi, şapka, havlu ve yüzme molaları arasında rahat hareket edebilmeniz için hafif kıyafetler getirmenizi öneririz. Can yeleği gibi güvenlik ekipmanları tarafımızdan temin edilmektedir.',
  foodDrinkTitle: 'Yiyecek & İçecek',
  foodDrinkPolicyText: 'Dışarıdan yiyecek getirmeniz serbesttir; içecek getirilmesine izin verilmemektedir.',
  priceBreakdownTitle: 'Ödeme Özeti',
  manageIntro: 'Rezervasyonunuzu buradan yönetebilirsiniz:',
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
  remainingRow: 'Due at boarding (cash)',
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
  bulletCashRemaining: 'The remaining balance is kindly requested in cash on the day of the tour.',
  bulletContact: 'Contact us if you have any questions.',
  contactTitle: 'Contact',
  footerLinks: 'Privacy · Cancellation',
  footerAuto: 'This email was sent automatically.',
  subjectReceived: 'Your booking was received',
  subjectPaid: 'Your booking is confirmed',
  locaPrefix: 'Box',
  heroAlt: 'Boat tour',
  greeting: (name: string) => `Hi ${name},`,
  introText: (tourTitle: string) =>
    `Thank you for your booking! We can't wait to welcome you aboard. Your booking for ${tourTitle} is confirmed — all the details are below.`,
  boardingPassTitle: 'Boarding Pass',
  boardingPassHint: 'Show this to the crew at boarding',
  reservationOwner: 'Reservation Holder',
  meetingPointTitle: 'Meeting Point',
  viewOnMap: 'View on Map',
  boardingScheduleTitle: 'Boarding & Departure',
  boardingStarts: 'Boarding starts',
  latestBoarding: 'Latest boarding',
  departureLabel: 'Departure',
  whatToBringTitle: 'What to Bring',
  whatToBringText:
    "Swimwear, sunscreen, a hat, a towel, and light clothing to move comfortably between swim stops. Safety equipment such as life jackets is provided on board.",
  foodDrinkTitle: 'Food & Drinks',
  foodDrinkPolicyText: "You're welcome to bring your own food; outside drinks are not permitted on board.",
  priceBreakdownTitle: 'Payment Summary',
  manageIntro: 'You can manage your booking here:',
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
  remainingRow: 'Vor Ort zu zahlen (bar)',
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
  bulletCashRemaining: 'Der Restbetrag wird am Tourtag bitte bar an Bord gezahlt.',
  bulletContact: 'Bei Fragen kontaktieren Sie uns gerne.',
  contactTitle: 'Kontakt',
  footerLinks: 'Datenschutz · Stornierung',
  footerAuto: 'Diese E-Mail wurde automatisch versendet.',
  subjectReceived: 'Ihre Buchung ist eingegangen',
  subjectPaid: 'Ihre Buchung ist bestätigt',
  locaPrefix: 'Loge',
  heroAlt: 'Bootstour',
  greeting: (name: string) => `Hallo ${name},`,
  introText: (tourTitle: string) =>
    `Vielen Dank für Ihre Buchung! Wir freuen uns darauf, Sie an Bord zu begrüßen. Ihre Buchung für ${tourTitle} ist bestätigt — alle Details finden Sie unten.`,
  boardingPassTitle: 'Bordkarte',
  boardingPassHint: 'Beim Boarding der Crew zeigen',
  reservationOwner: 'Buchungsinhaber',
  meetingPointTitle: 'Treffpunkt',
  viewOnMap: 'Auf der Karte ansehen',
  boardingScheduleTitle: 'Boarding & Abfahrt',
  boardingStarts: 'Boarding beginnt',
  latestBoarding: 'Spätestes Boarding',
  departureLabel: 'Abfahrt',
  whatToBringTitle: 'Was Sie mitbringen sollten',
  whatToBringText:
    'Badebekleidung, Sonnencreme, einen Hut, ein Handtuch und leichte Kleidung, um sich zwischen den Schwimmpausen bequem zu bewegen. Sicherheitsausrüstung wie Schwimmwesten wird an Bord gestellt.',
  foodDrinkTitle: 'Essen & Getränke',
  foodDrinkPolicyText: 'Sie dürfen eigenes Essen mitbringen; das Mitbringen von Getränken ist nicht gestattet.',
  priceBreakdownTitle: 'Zahlungsübersicht',
  manageIntro: 'Sie können Ihre Buchung hier verwalten:',
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

export type PaymentLinkPageCopy = {
  accessDeniedTitle: string
  accessDeniedBody: string
  homeCta: string
  greeting: (name: string) => string
  waitingTitle: string
  payNowCta: string
  processing: string
  amountDue: string
  alreadyPaidTitle: string
  alreadyPaidBody: string
  viewTicketCta: string
  errorGeneric: string
}

export function paymentLinkPageCopy(loc: SiteLocale): PaymentLinkPageCopy {
  if (loc === 'en') {
    return {
      accessDeniedTitle: 'Access denied',
      accessDeniedBody: 'This payment link is invalid or has expired.',
      homeCta: 'Back to home',
      greeting: (name) => `Hi ${name}, your payment is pending`,
      waitingTitle: 'Complete your payment',
      payNowCta: 'Pay Now',
      processing: 'Redirecting to secure payment…',
      amountDue: 'Amount due',
      alreadyPaidTitle: 'Already paid',
      alreadyPaidBody: 'This booking has already been paid for.',
      viewTicketCta: 'View my ticket',
      errorGeneric: 'Payment could not be started. Please try again.',
    }
  }
  if (loc === 'de') {
    return {
      accessDeniedTitle: 'Zugriff verweigert',
      accessDeniedBody: 'Dieser Zahlungslink ist ungültig oder abgelaufen.',
      homeCta: 'Zur Startseite',
      greeting: (name) => `Hallo ${name}, Ihre Zahlung steht noch aus`,
      waitingTitle: 'Zahlung abschließen',
      payNowCta: 'Jetzt bezahlen',
      processing: 'Weiterleitung zur sicheren Zahlung…',
      amountDue: 'Fälliger Betrag',
      alreadyPaidTitle: 'Bereits bezahlt',
      alreadyPaidBody: 'Diese Buchung wurde bereits bezahlt.',
      viewTicketCta: 'Mein Ticket ansehen',
      errorGeneric: 'Zahlung konnte nicht gestartet werden. Bitte versuchen Sie es erneut.',
    }
  }
  return {
    accessDeniedTitle: 'Erişim reddedildi',
    accessDeniedBody: 'Bu ödeme linki geçersiz veya süresi dolmuş.',
    homeCta: 'Ana sayfaya dön',
    greeting: (name) => `Merhaba ${name}, ödemeniz bekleniyor`,
    waitingTitle: 'Ödemenizi tamamlayın',
    payNowCta: 'Şimdi Öde',
    processing: 'Güvenli ödeme sayfasına yönlendiriliyorsunuz…',
    amountDue: 'Ödenecek tutar',
    alreadyPaidTitle: 'Ödeme zaten yapılmış',
    alreadyPaidBody: 'Bu rezervasyonun ödemesi zaten tamamlanmış.',
    viewTicketCta: 'Biletimi Görüntüle',
    errorGeneric: 'Ödeme başlatılamadı. Lütfen tekrar deneyin.',
  }
}
