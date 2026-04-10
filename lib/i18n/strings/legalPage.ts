import type { SiteLocale } from '../config'

export type LegalPageUiStrings = {
  backToHome: string
  lastUpdatedPrefix: string
  contentEmpty: string
  metaNotFoundTitle: string
}

const TR: LegalPageUiStrings = {
  backToHome: '← Ana sayfaya dön',
  lastUpdatedPrefix: 'Son güncelleme:',
  contentEmpty: 'İçerik henüz eklenmedi.',
  metaNotFoundTitle: 'Sayfa bulunamadı',
}

const EN: LegalPageUiStrings = {
  backToHome: '← Back to home',
  lastUpdatedPrefix: 'Last updated:',
  contentEmpty: 'Content has not been added yet.',
  metaNotFoundTitle: 'Page not found',
}

const DE: LegalPageUiStrings = {
  backToHome: '← Zur Startseite',
  lastUpdatedPrefix: 'Zuletzt aktualisiert:',
  contentEmpty: 'Inhalt wurde noch nicht hinzugefügt.',
  metaNotFoundTitle: 'Seite nicht gefunden',
}

export function getLegalPageUiStrings(locale: SiteLocale): LegalPageUiStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  return TR
}

export function dateLocaleForSiteLocale(locale: SiteLocale): string {
  if (locale === 'en') return 'en-US'
  if (locale === 'de') return 'de-DE'
  return 'tr-TR'
}
