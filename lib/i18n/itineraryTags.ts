import type { SiteLocale } from './config'

/** Sanity’de Türkçe girilen yaygın rota etiketleri için yerel çeviri. */
const ITINERARY_TAG: Record<string, Partial<Record<SiteLocale, string>>> = {
  Yüzme: { en: 'Swimming', de: 'Schwimmen' },
  Doğa: { en: 'Nature', de: 'Natur' },
  'Öğle Yemeği': { en: 'Lunch', de: 'Mittagessen' },
  Fotoğraf: { en: 'Photo', de: 'Foto' },
  Keşif: { en: 'Explore', de: 'Entdeckung' },
}

export function translateItineraryTag(tag: string, locale: SiteLocale): string {
  const trimmed = tag.trim()
  if (!trimmed || locale === 'tr') return trimmed
  return ITINERARY_TAG[trimmed]?.[locale] ?? trimmed
}
