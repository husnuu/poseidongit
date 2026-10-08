import type { SiteLocale } from '../config'

export type AboutPageUiStrings = {
  metaTitleFallback: string
  metaDescriptionFallback: string
  loadError: string
  noImage: string
  defaultBoatImageAlt: string
  trustYearsLabel: string
  trustFleetLabel: string
  trustReviewsLabel: (count: string) => string
  heroCtaTours: string
  heroCtaContact: string
  /** Hikaye metninin üstündeki küçük eyebrow etiketi — metin "direkt" başlamasın diye. */
  introEyebrow: string
}

const TR: AboutPageUiStrings = {
  metaTitleFallback: 'Hakkımızda',
  metaDescriptionFallback: 'Hikayemiz ve teknelerimiz.',
  loadError: 'Hakkımızda içeriği yüklenemedi.',
  noImage: 'Görsel yok',
  defaultBoatImageAlt: 'Tekne',
  trustYearsLabel: 'Yıllık Deneyim',
  trustFleetLabel: 'Farklı Teknede Hizmet',
  trustReviewsLabel: (count) => `${count} Misafir Yorumu`,
  heroCtaTours: 'Turlarımızı Keşfet',
  heroCtaContact: 'Bize Ulaşın',
  introEyebrow: 'Hikayemiz',
}

const EN: AboutPageUiStrings = {
  metaTitleFallback: 'About us',
  metaDescriptionFallback: 'Our story and boats.',
  loadError: 'About page could not be loaded.',
  noImage: 'No image',
  defaultBoatImageAlt: 'Boat',
  trustYearsLabel: 'Years of Experience',
  trustFleetLabel: 'Boats in Our Fleet',
  trustReviewsLabel: (count) => `${count} Guest Reviews`,
  heroCtaTours: 'Explore Our Tours',
  heroCtaContact: 'Contact Us',
  introEyebrow: 'Our Story',
}

const DE: AboutPageUiStrings = {
  metaTitleFallback: 'Über uns',
  metaDescriptionFallback: 'Unsere Geschichte und Boote.',
  loadError: 'Die Seite „Über uns“ konnte nicht geladen werden.',
  noImage: 'Kein Bild',
  defaultBoatImageAlt: 'Boot',
  trustYearsLabel: 'Jahre Erfahrung',
  trustFleetLabel: 'Boote in Unserer Flotte',
  trustReviewsLabel: (count) => `${count} Gästebewertungen`,
  heroCtaTours: 'Unsere Touren entdecken',
  heroCtaContact: 'Kontaktieren Sie uns',
  introEyebrow: 'Unsere Geschichte',
}

const RU: AboutPageUiStrings = {
  metaTitleFallback: 'О нас',
  metaDescriptionFallback: 'Наша история и катера.',
  loadError: 'Не удалось загрузить страницу «О нас».',
  noImage: 'Нет фото',
  defaultBoatImageAlt: 'Катер',
  trustYearsLabel: 'Лет опыта',
  trustFleetLabel: 'Катеров в нашем флоте',
  trustReviewsLabel: (count) => `${count} отзывов гостей`,
  heroCtaTours: 'Смотреть наши туры',
  heroCtaContact: 'Связаться с нами',
  introEyebrow: 'Наша история',
}

export function getAboutPageUiStrings(locale: SiteLocale): AboutPageUiStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  if (locale === 'ru') return RU
  return TR
}
