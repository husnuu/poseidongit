import type { SiteLocale } from './config'

/** `toLocaleDateString` için BCP 47 benzeri yerel ayar */
export function dateLocaleForSite(locale: SiteLocale): string {
  if (locale === 'en') return 'en-US'
  if (locale === 'de') return 'de-DE'
  return 'tr-TR'
}
