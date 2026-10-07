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
}

export function getAboutPageUiStrings(locale: SiteLocale): AboutPageUiStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  if (locale === 'ru') return RU
  return TR
}
