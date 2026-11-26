import type { SiteLocale } from '../config'

export type FerryPageUiStrings = {
  defaultTitle: string
  defaultMetaDescription: string
  notFoundTitle: string
  notFoundDesc: string
  backHome: string
  galleryImageAlt: (title: string, index: number) => string
  bookingCardTitle: string
  defaultPriceUnitLabel: string
  defaultCtaLabel: string
  defaultAboutTitle: string
  defaultKnowBeforeYouGoTitle: string
  includedTitle: string
  notIncludedTitle: string
  faqTitle: string
  numberLocale: string
  listHeadingTop: string
  listHeadingBottom: string
  listSubtitle: string
  listMetaTitle: string
  listMetaDescription: string
  listEmptyMessage: string
  viewRouteButton: string
  perPersonLabel: string
  cardNoImage: string
  faresTitle: string
  faresOneWay: string
  faresRoundTrip: string
  faresSameDay: string
  faresNote: (from: string, to: string) => string
  faresVehicleNote: string
  islandMustSee: string
  islandBeaches: string
  islandPractical: string
  photoCredits: string
}

const TR: FerryPageUiStrings = {
  defaultTitle: 'Feribot Bileti',
  defaultMetaDescription:
    'Feribot sefer saatlerini, bilet fiyatlarını ve yolculuk öncesi bilmeniz gerekenleri inceleyin; feribot biletinizi online olarak güvenle satın alın.',
  notFoundTitle: 'Sayfa bulunamadı',
  notFoundDesc: 'Aradığınız feribot hattı mevcut değil veya kaldırılmış olabilir.',
  backHome: 'Ana sayfaya dön',
  galleryImageAlt: (title, index) => (index === 0 ? title : `${title} — fotoğraf ${index + 1}`),
  bookingCardTitle: 'Biletini Al',
  defaultPriceUnitLabel: 'Kişi Başı',
  defaultCtaLabel: 'Bilet Al',
  defaultAboutTitle: 'Yolculuk Hakkında',
  defaultKnowBeforeYouGoTitle: 'Bilmeniz Gerekenler',
  includedTitle: 'Fiyata Dahil Olanlar',
  notIncludedTitle: 'Fiyata Dahil Olmayanlar',
  faqTitle: 'Sıkça Sorulan Sorular',
  numberLocale: 'tr-TR',
  listHeadingTop: 'FERİBOT',
  listHeadingBottom: 'BİLETLERİ',
  listSubtitle: 'Türkiye - Yunanistan arası feribot biletlerinizi kolayca alabilirsiniz.',
  listMetaTitle: 'Feribot Biletleri',
  listMetaDescription:
    'Çeşme, Ayvalık, Aliağa ve Bodrum’dan Sakız, Midilli ve Kos’a feribot hatlarını ve Euro fiyatlarını inceleyin; feribot biletinizi online olarak dakikalar içinde güvenle satın alın.',
  listEmptyMessage: 'Henüz feribot hattı eklenmemiş.',
  viewRouteButton: 'Seferi Görüntüle',
  perPersonLabel: 'Kişi Başı',
  cardNoImage: 'Görsel yok',
  faresTitle: 'Tekneler ve Fiyatlar',
  faresOneWay: 'Tek Yön',
  faresRoundTrip: 'Gidiş-Dönüş',
  faresSameDay: 'Aynı Gün Dönüş',
  faresNote: (from, to) => `Fiyatlar kişi başı ve Euro (€) cinsindendir; ${from} – ${to} seferlerine göredir, sezona göre değişebilir.`,
  faresVehicleNote: 'Araç fiyatları araç başınadır.',
  islandMustSee: 'Görmeden Dönmeyin',
  islandBeaches: 'Plajlar',
  islandPractical: 'Pratik Bilgiler',
  photoCredits: 'Fotoğraflar',
}

const EN: FerryPageUiStrings = {
  defaultTitle: 'Ferry Ticket',
  defaultMetaDescription:
    'Check ferry schedules, ticket prices and what to know before you travel, then buy your ferry ticket securely online in a few minutes.',
  notFoundTitle: 'Page not found',
  notFoundDesc: 'The ferry route you are looking for may not exist or has been removed.',
  backHome: 'Back to homepage',
  galleryImageAlt: (title, index) => (index === 0 ? title : `${title} — photo ${index + 1}`),
  bookingCardTitle: 'Get Your Ticket',
  defaultPriceUnitLabel: 'Per Person',
  defaultCtaLabel: 'Get Ticket',
  defaultAboutTitle: 'About This Trip',
  defaultKnowBeforeYouGoTitle: 'Good to Know',
  includedTitle: "What's Included",
  notIncludedTitle: "What's Not Included",
  faqTitle: 'Frequently Asked Questions',
  numberLocale: 'en-US',
  listHeadingTop: 'FERRY',
  listHeadingBottom: 'TICKETS',
  listSubtitle: 'Easily get your ferry tickets between Turkey and Greece.',
  listMetaTitle: 'Ferry Tickets',
  listMetaDescription:
    'Browse ferry routes from Çeşme, Ayvalık, Aliağa and Bodrum to Chios, Lesvos and Kos with fares in euros, and buy your ferry ticket securely online in just a few minutes.',
  listEmptyMessage: 'No ferry routes have been added yet.',
  viewRouteButton: 'View Route',
  perPersonLabel: 'Per Person',
  cardNoImage: 'No image',
  faresTitle: 'Vessels & Fares',
  faresOneWay: 'One Way',
  faresRoundTrip: 'Return',
  faresSameDay: 'Same-Day Return',
  faresNote: (from, to) => `Fares are per person in euros (€), based on sailings from ${from} to ${to}, and may change with the season.`,
  faresVehicleNote: 'Vehicle fares are per vehicle.',
  islandMustSee: 'Don’t Miss',
  islandBeaches: 'Beaches',
  islandPractical: 'Practical Tips',
  photoCredits: 'Photos',
}

const DE: FerryPageUiStrings = {
  defaultTitle: 'Fährticket',
  defaultMetaDescription:
    'Fahrplan, Ticketpreise und Reisehinweise der Fähre ansehen und das Fährticket in wenigen Minuten sicher online kaufen.',
  notFoundTitle: 'Seite nicht gefunden',
  notFoundDesc: 'Die gesuchte Fährverbindung existiert nicht mehr oder wurde entfernt.',
  backHome: 'Zurück zur Startseite',
  galleryImageAlt: (title, index) => (index === 0 ? title : `${title} — Foto ${index + 1}`),
  bookingCardTitle: 'Ticket buchen',
  defaultPriceUnitLabel: 'Pro Person',
  defaultCtaLabel: 'Ticket kaufen',
  defaultAboutTitle: 'Über diese Reise',
  defaultKnowBeforeYouGoTitle: 'Gut zu wissen',
  includedTitle: 'Im Preis inbegriffen',
  notIncludedTitle: 'Nicht im Preis inbegriffen',
  faqTitle: 'Häufig gestellte Fragen',
  numberLocale: 'de-DE',
  listHeadingTop: 'FÄHR',
  listHeadingBottom: 'TICKETS',
  listSubtitle: 'Ganz einfach Ihre Fährtickets zwischen der Türkei und Griechenland buchen.',
  listMetaTitle: 'Fährtickets',
  listMetaDescription: 'Entdecken Sie unsere Fährverbindungen und buchen Sie Ihr Ticket in wenigen Minuten.',
  listEmptyMessage: 'Es wurden noch keine Fährverbindungen hinzugefügt.',
  viewRouteButton: 'Route ansehen',
  perPersonLabel: 'Pro Person',
  cardNoImage: 'Kein Bild',
  faresTitle: 'Schiffe & Preise',
  faresOneWay: 'Einfache Fahrt',
  faresRoundTrip: 'Hin & zurück',
  faresSameDay: 'Rückfahrt am selben Tag',
  faresNote: (from, to) => `Preise pro Person in Euro (€), gültig für Abfahrten vom ${from} bis ${to}; saisonale Änderungen möglich.`,
  faresVehicleNote: 'Fahrzeugpreise gelten pro Fahrzeug.',
  islandMustSee: 'Nicht verpassen',
  islandBeaches: 'Strände',
  islandPractical: 'Praktische Tipps',
  photoCredits: 'Fotos',
}

const RU: FerryPageUiStrings = {
  defaultTitle: 'Билет на паром',
  defaultMetaDescription:
    'Расписание парома, цены на билеты и что нужно знать перед поездкой — купите билет на паром онлайн за несколько минут.',
  notFoundTitle: 'Страница не найдена',
  notFoundDesc: 'Паромный маршрут, который вы ищете, не существует или был удалён.',
  backHome: 'Вернуться на главную',
  galleryImageAlt: (title, index) => (index === 0 ? title : `${title} — фото ${index + 1}`),
  bookingCardTitle: 'Купить билет',
  defaultPriceUnitLabel: 'За человека',
  defaultCtaLabel: 'Купить билет',
  defaultAboutTitle: 'О поездке',
  defaultKnowBeforeYouGoTitle: 'Полезно знать',
  includedTitle: 'Что включено',
  notIncludedTitle: 'Что не включено',
  faqTitle: 'Часто задаваемые вопросы',
  numberLocale: 'ru-RU',
  listHeadingTop: 'ПАРОМНЫЕ',
  listHeadingBottom: 'БИЛЕТЫ',
  listSubtitle: 'Легко оформите билеты на паром между Турцией и Грецией.',
  listMetaTitle: 'Билеты на паром',
  listMetaDescription: 'Ознакомьтесь с нашими паромными маршрутами и купите билет за несколько минут.',
  listEmptyMessage: 'Паромные маршруты пока не добавлены.',
  viewRouteButton: 'Посмотреть маршрут',
  perPersonLabel: 'За человека',
  cardNoImage: 'Нет фото',
  faresTitle: 'Суда и цены',
  faresOneWay: 'В одну сторону',
  faresRoundTrip: 'Туда и обратно',
  faresSameDay: 'Обратно в тот же день',
  faresNote: (from, to) => `Цены указаны за человека в евро (€) для рейсов с ${from} по ${to} и могут меняться в зависимости от сезона.`,
  faresVehicleNote: 'Цены для транспорта указаны за одно транспортное средство.',
  islandMustSee: 'Обязательно посмотрите',
  islandBeaches: 'Пляжи',
  islandPractical: 'Полезная информация',
  photoCredits: 'Фото',
}

export function getFerryPageUiStrings(locale: SiteLocale): FerryPageUiStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  if (locale === 'ru') return RU
  return TR
}
