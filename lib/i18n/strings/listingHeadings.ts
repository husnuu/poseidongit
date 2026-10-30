import type { SiteLocale } from '@/lib/i18n/config'

/**
 * Liste sayfalarında kart ızgarasının üstündeki (görünmez) H2 başlıkları.
 * Kart başlıkları H3 olduğundan sayfa ana hatları H1 → H2 → H3 sırasını
 * korusun diye — arama motorları ve ekran okuyucular için.
 */
export const LISTING_HEADINGS: Record<
  'tours' | 'coves' | 'blog' | 'yachts' | 'ferries',
  Record<SiteLocale, string>
> = {
  tours: { tr: 'Tüm tekne turları', en: 'All boat tours', de: 'Alle Bootstouren', ru: 'Все морские прогулки' },
  coves: { tr: 'Çeşme koyları ve adaları', en: 'Coves and islands of Çeşme', de: 'Buchten und Inseln von Çeşme', ru: 'Бухты и острова Чешме' },
  blog: { tr: 'Blog yazıları', en: 'Blog posts', de: 'Blogbeiträge', ru: 'Статьи блога' },
  yachts: { tr: 'Kiralık tekneler ve yatlar', en: 'Boats and yachts for charter', de: 'Boote und Yachten zur Miete', ru: 'Лодки и яхты в аренду' },
  ferries: { tr: 'Feribot hatları', en: 'Ferry routes', de: 'Fährverbindungen', ru: 'Паромные маршруты' },
}
