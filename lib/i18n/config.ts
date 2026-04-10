export const SITE_LOCALES = ['tr', 'en', 'de'] as const
export type SiteLocale = (typeof SITE_LOCALES)[number]

export const DEFAULT_LOCALE: SiteLocale = 'tr'

export function isSiteLocale(x: string): x is SiteLocale {
  return (SITE_LOCALES as readonly string[]).includes(x)
}

export function htmlLangForLocale(locale: SiteLocale): string {
  if (locale === 'en') return 'en'
  if (locale === 'de') return 'de'
  return 'tr'
}

/** Public URL prefix; Turkish has none */
export const LOCALE_PATH_PREFIX: Record<SiteLocale, string> = {
  tr: '',
  en: '/en',
  de: '/de',
}
