import type { SiteLocale } from './config'

const RATING_LABEL: Record<string, Partial<Record<SiteLocale, string>>> = {
  mükemmel: { tr: 'Mükemmel', en: 'EXCELLENT', de: 'EXZELLENT' },
  'çok iyi': { tr: 'Çok İyi', en: 'VERY GOOD', de: 'SEHR GUT' },
  iyi: { tr: 'İyi', en: 'GOOD', de: 'GUT' },
}

export function translateRatingLabel(label: string, locale: SiteLocale): string | null {
  const key = label.trim().toLocaleLowerCase('tr-TR')
  const entry = RATING_LABEL[key]
  if (!entry) return null
  return entry[locale] ?? null
}

export function resolveTourRatingLabel(
  ratingLabel: string | null | undefined,
  locale: SiteLocale,
  fallback: string
): string {
  if (!ratingLabel?.trim()) return fallback
  if (locale === 'tr') return ratingLabel.trim()
  return translateRatingLabel(ratingLabel, locale) ?? fallback
}
