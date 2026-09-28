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
  defaultMetaDescription: 'Feribot bileti satın alın.',
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
  listMetaDescription: 'Feribot hatlarımıza göz atın ve biletinizi dakikalar içinde alın.',
  listEmptyMessage: 'Henüz feribot hattı eklenmemiş.',
  viewRouteButton: 'Seferi Görüntüle',
  perPersonLabel: 'Kişi Başı',
  cardNoImage: 'Görsel yok',
}

const EN: FerryPageUiStrings = {
  defaultTitle: 'Ferry Ticket',
  defaultMetaDescription: 'Buy your ferry ticket.',
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
  listMetaDescription: 'Browse our ferry routes and get your ticket in minutes.',
  listEmptyMessage: 'No ferry routes have been added yet.',
  viewRouteButton: 'View Route',
  perPersonLabel: 'Per Person',
  cardNoImage: 'No image',
}

const DE: FerryPageUiStrings = {
  defaultTitle: 'Fährticket',
  defaultMetaDescription: 'Kaufen Sie Ihr Fährticket.',
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

export function getFerryPageUiStrings(locale: SiteLocale): FerryPageUiStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  return TR
}
