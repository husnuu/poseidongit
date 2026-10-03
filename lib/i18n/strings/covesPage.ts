import type { SiteLocale } from '../config'

export type CovesPageUiStrings = {
  metaTitleFallback: string
  metaDescriptionFallback: string
  pageTitleFallback: string
  emptyList: string
  noImage: string
  detailHint: string
  defaultCoveTitle: string
  closeAria: string
  cardAriaLabel: (title: string) => string
}

const TR: CovesPageUiStrings = {
  metaTitleFallback: 'Koylar',
  metaDescriptionFallback: 'Keşfedeceğiniz koylar.',
  pageTitleFallback: 'Koylar',
  emptyList: 'Henüz koy eklenmemiş.',
  noImage: 'Görsel yok',
  detailHint: 'Devamını oku',
  defaultCoveTitle: 'Koy',
  closeAria: 'Kapat',
  cardAriaLabel: (title) => `${title} hakkında devamını oku`,
}

const EN: CovesPageUiStrings = {
  metaTitleFallback: 'Bays & coves',
  metaDescriptionFallback: 'Coves and bays to explore.',
  pageTitleFallback: 'Bays & coves',
  emptyList: 'No coves have been added yet.',
  noImage: 'No image',
  detailHint: 'Read more',
  defaultCoveTitle: 'Cove',
  closeAria: 'Close',
  cardAriaLabel: (title) => `Read more about ${title}`,
}

const DE: CovesPageUiStrings = {
  metaTitleFallback: 'Buchten',
  metaDescriptionFallback: 'Buchten und Buchten zum Entdecken.',
  pageTitleFallback: 'Buchten',
  emptyList: 'Es wurden noch keine Buchten hinzugefügt.',
  noImage: 'Kein Bild',
  detailHint: 'Mehr lesen',
  defaultCoveTitle: 'Bucht',
  closeAria: 'Schließen',
  cardAriaLabel: (title) => `Mehr über ${title} lesen`,
}

export function getCovesPageUiStrings(locale: SiteLocale): CovesPageUiStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  return TR
}
