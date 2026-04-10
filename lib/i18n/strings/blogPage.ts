import type { SiteLocale } from '../config'

export type BlogPageUiStrings = {
  readPostCta: string
  homeBlogCardCta: string
  noCoverImage: string
  noExcerptFallback: string
  backToList: string
  allPosts: string
  relatedPagesHeading: string
  relatedTours: string
  relatedCoves: string
  postNotFoundTitle: string
  readTimeSuffix: string
  blogListTitleSuffix: string
  blogListDefaultDescription: string
}

const TR: BlogPageUiStrings = {
  readPostCta: 'BLOGU OKU',
  homeBlogCardCta: 'Yazıyı oku',
  noCoverImage: 'Görsel yok',
  noExcerptFallback: 'Bu yazı hakkında kısa özet henüz eklenmedi.',
  backToList: '← Blog listesine dön',
  allPosts: '← Tüm yazılar',
  relatedPagesHeading: 'İlgili sayfalar',
  relatedTours: 'Çeşme tekne turları',
  relatedCoves: 'Çeşme koyları',
  postNotFoundTitle: 'Yazı bulunamadı',
  readTimeSuffix: 'dk',
  blogListTitleSuffix: 'Blog',
  blogListDefaultDescription:
    'Tekne turu ipuçları, koy rehberleri ve tatil yazıları.',
}

const EN: BlogPageUiStrings = {
  readPostCta: 'READ POST',
  homeBlogCardCta: 'Read article',
  noCoverImage: 'No image',
  noExcerptFallback: 'No summary has been added for this post yet.',
  backToList: '← Back to blog',
  allPosts: '← All posts',
  relatedPagesHeading: 'Related pages',
  relatedTours: 'Boat tours in Çeşme',
  relatedCoves: 'Çeşme bays & coves',
  postNotFoundTitle: 'Post not found',
  readTimeSuffix: 'min',
  blogListTitleSuffix: 'Blog',
  blogListDefaultDescription:
    'Boat tour tips, cove guides, and travel stories.',
}

const DE: BlogPageUiStrings = {
  readPostCta: 'BEITRAG LESEN',
  homeBlogCardCta: 'Artikel lesen',
  noCoverImage: 'Kein Bild',
  noExcerptFallback: 'Für diesen Beitrag wurde noch keine Kurzbeschreibung hinterlegt.',
  backToList: '← Zurück zum Blog',
  allPosts: '← Alle Beiträge',
  relatedPagesHeading: 'Weitere Seiten',
  relatedTours: 'Bootstouren in Çeşme',
  relatedCoves: 'Buchten in Çeşme',
  postNotFoundTitle: 'Beitrag nicht gefunden',
  readTimeSuffix: 'Min.',
  blogListTitleSuffix: 'Blog',
  blogListDefaultDescription:
    'Tipps zu Bootstouren, Buchtenführer und Reisetexte.',
}

export function getBlogPageUiStrings(locale: SiteLocale): BlogPageUiStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  return TR
}
