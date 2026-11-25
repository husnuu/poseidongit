import type { SiteLocale } from './config'

/**
 * "Öğle yemeği dahil" ibaresi: tur sayfası başlığındaki bilgi satırlarında ve
 * tur kartında gösterilir; bu turlarda "Öne Çıkanlar"daki yemek maddesi
 * (icon: food) gizlenir — aynı bilgi iki kez görünmesin. Yalnızca aşağıdaki
 * turlar; anahtar Sanity tur _id'si.
 */
const LUNCH_INCLUDED_TOUR_IDS = new Set([
  '86942097-bbba-45d9-91b6-3397f870ddb1', // Çeşme Adalar & Koylar Turu (cesme-tekne-turu)
  'd430b103-80bd-460c-bc9c-0dad6cff54bb', // İzmir Çıkışlı Çeşme Tekne Turu
  '79de8e59-7f26-4dfa-8b8e-0a96581921ee', // Çeşme Tüplü Dalış & Şnorkel
])

export const LUNCH_INCLUDED_LABEL: Record<SiteLocale, string> = {
  tr: 'Öğle yemeği dahil',
  en: 'Lunch included',
  de: 'Mittagessen inklusive',
  ru: 'Обед включён',
}

export function isLunchIncludedTour(tourId: string | null | undefined): boolean {
  return Boolean(tourId && LUNCH_INCLUDED_TOUR_IDS.has(tourId.replace(/^drafts\./, '')))
}
