import type { SiteLocale } from '../config'

export type AboutPageUiStrings = {
  metaTitleFallback: string
  metaDescriptionFallback: string
  loadError: string
  noImage: string
  defaultBoatImageAlt: string
}

const TR: AboutPageUiStrings = {
  metaTitleFallback: 'Hakkımızda',
  metaDescriptionFallback: 'Hikayemiz ve teknelerimiz.',
  loadError: 'Hakkımızda içeriği yüklenemedi.',
  noImage: 'Görsel yok',
  defaultBoatImageAlt: 'Tekne',
}

const EN: AboutPageUiStrings = {
  metaTitleFallback: 'About us',
  metaDescriptionFallback: 'Our story and boats.',
  loadError: 'About page could not be loaded.',
  noImage: 'No image',
  defaultBoatImageAlt: 'Boat',
}

const DE: AboutPageUiStrings = {
  metaTitleFallback: 'Über uns',
  metaDescriptionFallback: 'Unsere Geschichte und Boote.',
  loadError: 'Die Seite „Über uns“ konnte nicht geladen werden.',
  noImage: 'Kein Bild',
  defaultBoatImageAlt: 'Boot',
}

export function getAboutPageUiStrings(locale: SiteLocale): AboutPageUiStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  return TR
}
