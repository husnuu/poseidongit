import type { SiteLocale } from '../config'

export type BlogPageUiStrings = {
  readPostCta: string
  homeBlogCardCta: string
  noCoverImage: string
  noExcerptFallback: string
  backToList: string
  allPosts: string
  relatedPagesHeading: string
  /** Yazı altındaki ilgili yazılar carousel'i (referans: "Okumaya devam et"). */
  keepReadingHeading: string
  shareThisPost: string
  relatedTours: string
  relatedCoves: string
  postNotFoundTitle: string
  readTimeSuffix: string
  blogListTitleSuffix: string
  blogListDefaultDescription: string
  updatedLabel: string
}

const TR: BlogPageUiStrings = {
  readPostCta: 'BLOGU OKU',
  homeBlogCardCta: 'Yazıyı oku',
  noCoverImage: 'Görsel yok',
  noExcerptFallback: 'Bu yazı hakkında kısa özet henüz eklenmedi.',
  backToList: '← Blog listesine dön',
  allPosts: '← Tüm yazılar',
  relatedPagesHeading: 'İlgili sayfalar',
  keepReadingHeading: 'OKUMAYA DEVAM ET',
  shareThisPost: 'Bu yazıyı paylaş',
  relatedTours: 'Çeşme tekne turları',
  relatedCoves: 'Çeşme koyları',
  postNotFoundTitle: 'Yazı bulunamadı',
  readTimeSuffix: 'dk okuma',
  blogListTitleSuffix: 'Blog',
  blogListDefaultDescription:
    'Çeşme tekne turu rehberleri, en güzel koylar, tatil ipuçları ve gezi önerileri: tekne turunuzu planlamadan önce okumanız gereken yazılar.',
  updatedLabel: 'Son güncelleme',
}

const EN: BlogPageUiStrings = {
  readPostCta: 'READ POST',
  homeBlogCardCta: 'Read article',
  noCoverImage: 'No image',
  noExcerptFallback: 'No summary has been added for this post yet.',
  backToList: '← Back to blog',
  allPosts: '← All posts',
  relatedPagesHeading: 'Related pages',
  keepReadingHeading: 'KEEP READING',
  shareThisPost: 'Share this post',
  relatedTours: 'Boat tours in Çeşme',
  relatedCoves: 'Çeşme bays & coves',
  postNotFoundTitle: 'Post not found',
  readTimeSuffix: 'min read',
  blogListTitleSuffix: 'Blog',
  blogListDefaultDescription:
    'Çeşme boat tour guides, the most beautiful coves, holiday tips and travel ideas — everything worth reading before you plan your boat trip.',
  updatedLabel: 'Last updated',
}

const DE: BlogPageUiStrings = {
  readPostCta: 'BEITRAG LESEN',
  homeBlogCardCta: 'Artikel lesen',
  noCoverImage: 'Kein Bild',
  noExcerptFallback: 'Für diesen Beitrag wurde noch keine Kurzbeschreibung hinterlegt.',
  backToList: '← Zurück zum Blog',
  allPosts: '← Alle Beiträge',
  relatedPagesHeading: 'Weitere Seiten',
  keepReadingHeading: 'WEITERLESEN',
  shareThisPost: 'Diesen Beitrag teilen',
  relatedTours: 'Bootstouren in Çeşme',
  relatedCoves: 'Buchten in Çeşme',
  postNotFoundTitle: 'Beitrag nicht gefunden',
  readTimeSuffix: 'Min. Lesezeit',
  blogListTitleSuffix: 'Blog',
  blogListDefaultDescription:
    'Ratgeber zu Bootstouren in Çeşme, die schönsten Buchten, Urlaubstipps und Reiseideen – alles, was Sie vor Ihrer Bootstour wissen sollten.',
  updatedLabel: 'Letzte Aktualisierung',
}

const RU: BlogPageUiStrings = {
  readPostCta: 'ЧИТАТЬ СТАТЬЮ',
  homeBlogCardCta: 'Читать статью',
  noCoverImage: 'Нет фото',
  noExcerptFallback: 'Для этой статьи пока не добавлено краткое описание.',
  backToList: '← Назад к блогу',
  allPosts: '← Все статьи',
  relatedPagesHeading: 'Похожие страницы',
  keepReadingHeading: 'ЧИТАТЬ ДАЛЬШЕ',
  shareThisPost: 'Поделиться статьёй',
  relatedTours: 'Морские прогулки в Чешме',
  relatedCoves: 'Бухты Чешме',
  postNotFoundTitle: 'Статья не найдена',
  readTimeSuffix: 'мин чтения',
  blogListTitleSuffix: 'Блог',
  blogListDefaultDescription:
    'Гиды по морским прогулкам в Чешме, самые красивые бухты, советы для отпуска и идеи для поездок — всё, что стоит прочитать перед прогулкой.',
  updatedLabel: 'Последнее обновление',
}

export function getBlogPageUiStrings(locale: SiteLocale): BlogPageUiStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  if (locale === 'ru') return RU
  return TR
}

/** Blog bölümünün sabit başlığı ve kısa spotu — hem anasayfadaki
    BlogSection hem /blog sayfası buradan okur, ikisi aynı kalsın diye.
    Sanity'deki blogPage.heroTitle / heroHighlightTitlePart /
    heroDescription alanları artık GÖRÜNTÜLENMİYOR: başlık kısa ve sabit
    istendi, CMS'teki metin uzun bir cümleydi. */
export const BLOG_SECTION_TITLE: Record<SiteLocale, string> = {
  tr: 'MAVİ HİKAYELER',
  en: 'BLUE STORIES',
  de: 'BLAUE GESCHICHTEN',
  ru: 'СИНИЕ ИСТОРИИ',
}

export const BLOG_PAGE_LEAD: Record<SiteLocale, string> = {
  tr: 'Çeşme, tekne turları ve tatil ipuçları.',
  en: 'Çeşme, boat tours and travel tips.',
  de: 'Çeşme, Bootstouren und Reisetipps.',
  ru: 'Чешме, морские прогулки и советы для отдыха.',
}
