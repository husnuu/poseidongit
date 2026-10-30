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
    'Çeşme çıkışlı feribot hatlarını, sefer saatlerini ve fiyatları inceleyin; feribot biletinizi online olarak dakikalar içinde güvenle satın alın.',
  listEmptyMessage: 'Henüz feribot hattı eklenmemiş.',
  viewRouteButton: 'Seferi Görüntüle',
  perPersonLabel: 'Kişi Başı',
  cardNoImage: 'Görsel yok',
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
    'Browse ferry routes from Çeşme with schedules and fares, and buy your ferry ticket securely online in just a few minutes.',
  listEmptyMessage: 'No ferry routes have been added yet.',
  viewRouteButton: 'View Route',
  perPersonLabel: 'Per Person',
  cardNoImage: 'No image',
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
}

export function getFerryPageUiStrings(locale: SiteLocale): FerryPageUiStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  if (locale === 'ru') return RU
  return TR
}
