import type { SiteLocale } from '@/lib/i18n/config'

/**
 * Tur kategorileri — Sanity'de her turun en üstündeki "Tur kategorisi" alanı.
 * Turlar sayfasında filtre butonları olarak gösterilir. Kategori seçilmemiş
 * eski turlar: özel tur seçeneği açıksa "private", değilse "daily" sayılır
 * (bkz. lib/queries.ts toursListQuery).
 */
export const TOUR_CATEGORIES = ['daily', 'private', 'special'] as const
export type TourCategory = (typeof TOUR_CATEGORIES)[number]

export function isTourCategory(x: unknown): x is TourCategory {
  return typeof x === 'string' && (TOUR_CATEGORIES as readonly string[]).includes(x)
}

/** Studio'daki seçenek adları (Türkçe). */
export const TOUR_CATEGORY_STUDIO_TITLES: Record<TourCategory, string> = {
  daily: 'Günlük tur',
  private: 'Özel tur',
  special: 'Özel günler',
}

/** Turlar sayfasındaki buton metinleri. */
export const TOUR_CATEGORY_LABELS: Record<SiteLocale, Record<TourCategory | 'all', string>> = {
  tr: { all: 'Tümü', daily: 'Günlük turlar', private: 'Özel turlar', special: 'Özel günler' },
  en: { all: 'All', daily: 'Daily tours', private: 'Private tours', special: 'Special occasions' },
  de: { all: 'Alle', daily: 'Tagestouren', private: 'Privattouren', special: 'Besondere Anlässe' },
  ru: { all: 'Все', daily: 'Однодневные туры', private: 'Индивидуальные туры', special: 'Особые случаи' },
}

export const TOUR_RESULTS_COUNT: Record<SiteLocale, (n: number) => string> = {
  tr: (n) => `${n} sonuç gösteriliyor`,
  en: (n) => `Showing ${n} ${n === 1 ? 'result' : 'results'}`,
  de: (n) => `${n} ${n === 1 ? 'Ergebnis' : 'Ergebnisse'}`,
  ru: (n) => `Показано результатов: ${n}`,
}

export const TOUR_FILTER_ARIA: Record<SiteLocale, string> = {
  tr: 'Tur kategorisi',
  en: 'Tour category',
  de: 'Tour-Kategorie',
  ru: 'Категория тура',
}
