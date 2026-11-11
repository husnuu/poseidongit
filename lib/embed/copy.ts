import type { SiteLocale } from '@/lib/i18n/config'

export type EmbedCopy = {
  from: string
  perPerson: string
  groupPrice: string
  book: string
  details: string
  allTours: string
  empty: string
  poweredBy: string
  tourDetails: string
  cashTitle: string
  cashBody: string
  cashCta: string
  newBooking: string
  tabTours: string
  tabYachts: string
  yachtFrom: string
  perDay: string
  guests: (n: number) => string
  viewYacht: string
  yachtNote: string
  redirectTitle: string
  redirectBody: string
  redirectCta: string
  bookingSummary: string
}

export const EMBED_COPY: Record<SiteLocale, EmbedCopy> = {
  tr: {
    from: "'den başlayan",
    perPerson: 'Kişi başı',
    groupPrice: 'Grup fiyatı',
    book: 'Rezervasyon yap',
    details: 'İncele',
    allTours: 'Tüm turlar',
    empty: 'Şu anda listelenecek tur yok.',
    poweredBy: 'Rezervasyonlar Poseidon güvencesiyle',
    tourDetails: 'Tur detayları',
    cashTitle: 'Rezervasyonunuz alındı',
    cashBody: 'Ödemeyi tur günü yapacaksınız. Biletiniz e-posta adresinize gönderildi.',
    cashCta: 'Bileti görüntüle',
    newBooking: 'Yeni rezervasyon',
    tabTours: 'Tekne turları',
    tabYachts: 'Tekne kiralama',
    yachtFrom: 'Başlangıç',
    perDay: '/ gün',
    guests: (n) => `${n} kişiye kadar`,
    viewYacht: 'İncele ve teklif al',
    yachtNote: 'Tekne sayfası cesmetekneturu.net üzerinde açılır.',
    redirectTitle: 'Ödeme sayfasına yönlendiriliyorsunuz',
    redirectBody: 'Rezervasyonunuz oluşturuldu. Güvenli ödeme sayfamız açılıyor…',
    redirectCta: 'Açılmadıysa tıklayın',
    bookingSummary: 'Tur detayları',
  },
  en: {
    from: 'from',
    perPerson: 'Per person',
    groupPrice: 'Group price',
    book: 'Book now',
    details: 'View',
    allTours: 'All tours',
    empty: 'There are no tours to list right now.',
    poweredBy: 'Bookings secured by Poseidon',
    tourDetails: 'Tour details',
    cashTitle: 'Your booking is confirmed',
    cashBody: 'You will pay on the day of the tour. Your ticket has been sent to your email.',
    cashCta: 'View ticket',
    newBooking: 'New booking',
    tabTours: 'Boat tours',
    tabYachts: 'Boat rental',
    yachtFrom: 'From',
    perDay: '/ day',
    guests: (n) => `Up to ${n} guests`,
    viewYacht: 'View & get a quote',
    yachtNote: 'The boat page opens on cesmetekneturu.net.',
    redirectTitle: 'Redirecting to payment',
    redirectBody: 'Your booking has been created. Opening our secure payment page…',
    redirectCta: 'Click here if nothing happens',
    bookingSummary: 'Tour details',
  },
  de: {
    from: 'ab',
    perPerson: 'Pro Person',
    groupPrice: 'Gruppenpreis',
    book: 'Jetzt buchen',
    details: 'Ansehen',
    allTours: 'Alle Touren',
    empty: 'Derzeit sind keine Touren verfügbar.',
    poweredBy: 'Buchungen mit der Sicherheit von Poseidon',
    tourDetails: 'Tourdetails',
    cashTitle: 'Ihre Buchung ist eingegangen',
    cashBody: 'Sie zahlen am Tag der Tour. Ihr Ticket wurde an Ihre E-Mail-Adresse gesendet.',
    cashCta: 'Ticket ansehen',
    newBooking: 'Neue Buchung',
    tabTours: 'Bootstouren',
    tabYachts: 'Bootsvermietung',
    yachtFrom: 'Ab',
    perDay: '/ Tag',
    guests: (n) => `Bis zu ${n} Gäste`,
    viewYacht: 'Ansehen & Angebot anfragen',
    yachtNote: 'Die Bootsseite öffnet sich auf cesmetekneturu.net.',
    redirectTitle: 'Weiterleitung zur Zahlung',
    redirectBody: 'Ihre Buchung wurde erstellt. Unsere sichere Zahlungsseite wird geöffnet…',
    redirectCta: 'Hier klicken, falls nichts passiert',
    bookingSummary: 'Tourdetails',
  },
  ru: {
    from: 'от',
    perPerson: 'За человека',
    groupPrice: 'Цена за группу',
    book: 'Забронировать',
    details: 'Подробнее',
    allTours: 'Все туры',
    empty: 'Сейчас нет доступных туров.',
    poweredBy: 'Бронирование с гарантией Poseidon',
    tourDetails: 'Детали тура',
    cashTitle: 'Бронирование принято',
    cashBody: 'Оплата в день тура. Билет отправлен на вашу электронную почту.',
    cashCta: 'Открыть билет',
    newBooking: 'Новое бронирование',
    tabTours: 'Морские прогулки',
    tabYachts: 'Аренда лодок',
    yachtFrom: 'От',
    perDay: '/ день',
    guests: (n) => `До ${n} гостей`,
    viewYacht: 'Подробнее и запрос цены',
    yachtNote: 'Страница лодки откроется на cesmetekneturu.net.',
    redirectTitle: 'Переход к оплате',
    redirectBody: 'Бронирование создано. Открываем защищённую страницу оплаты…',
    redirectCta: 'Нажмите, если ничего не произошло',
    bookingSummary: 'Детали тура',
  },
}
