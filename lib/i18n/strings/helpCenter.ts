import type { SiteLocale } from '../config'

export type HelpCenterUiStrings = {
  breadcrumbHome: string
  breadcrumbHelp: string
  breadcrumbCategoryFallback: string
  breadcrumbArticleFallback: string
  metaHelpTitleFallback: string
  metaHelpDescriptionFallback: string
  metaCategoryNotFoundTitle: string
  metaArticleNotFoundTitle: string
  metaCategoryTitleSuffix: string
  metaCategoryDescriptionFallback: (categoryTitle: string) => string
  allHelpTopicsLink: string
  noArticlesInCategory: string
  noArticlesInCategoryCard: string
  articleFallbackTitle: string
  categoryFallbackTitle: string
  categoryCardEyebrowFallback: string
  articleBodyEmpty: string
  relatedArticlesHeading: string
  supportHeading: string
  supportBody: string
  supportWhatsappCta: string
  supportWhatsappMissing: string
  supportContactCta: string
  searchPlaceholder: string
  searchLabelSrOnly: string
  searchCountNone: string
  searchCountListed: (n: number) => string
  homeSectionEyebrow: string
  homeTopicsHeadingPrimary: string
  homeTopicsHeadingSecondary: string
  homeEmptySearch: string
  homeEmptyNoArticles: string
}

const TR: HelpCenterUiStrings = {
  breadcrumbHome: 'Ana Sayfa',
  breadcrumbHelp: 'Yardım Merkezi',
  breadcrumbCategoryFallback: 'Kategori',
  breadcrumbArticleFallback: 'Makale',
  metaHelpTitleFallback: 'Yardım Merkezi',
  metaHelpDescriptionFallback:
    'Tekne turu rezervasyonu, tur günü ve sık sorulan konularda yardım.',
  metaCategoryNotFoundTitle: 'Kategori bulunamadı',
  metaArticleNotFoundTitle: 'Makale bulunamadı',
  metaCategoryTitleSuffix: 'Yardım',
  metaCategoryDescriptionFallback: (categoryTitle: string) =>
    `${categoryTitle} kategorisindeki makaleler.`,
  allHelpTopicsLink: '← Tüm yardım konuları',
  noArticlesInCategory: 'Bu kategoride henüz makale yok.',
  noArticlesInCategoryCard: 'Bu kategoride makale yok.',
  articleFallbackTitle: 'Makale',
  categoryFallbackTitle: 'Kategori',
  categoryCardEyebrowFallback: 'Kategori',
  articleBodyEmpty: 'Bu makale için henüz metin eklenmemiş.',
  relatedArticlesHeading: 'İlgili makaleler',
  supportHeading: 'Aradığınız cevabı bulamadınız mı?',
  supportBody:
    'Ekibimiz tekne turu, rezervasyon ve tur günü sorularınız için mesajınızı bekliyor.',
  supportWhatsappCta: 'WhatsApp’tan ulaşın',
  supportWhatsappMissing:
    'WhatsApp numarası yapılandırılmamış. İletişim sayfamızdan bize ulaşabilirsiniz.',
  supportContactCta: 'İletişim',
  searchPlaceholder: 'Makale veya konu ara…',
  searchLabelSrOnly: 'Yardım makalelerinde ara',
  searchCountNone: 'Eşleşen makale bulunamadı',
  searchCountListed: (n: number) => `${n} makale listeleniyor`,
  homeSectionEyebrow: 'Rehber',
  homeTopicsHeadingPrimary: 'Konulara',
  homeTopicsHeadingSecondary: ' göz atın',
  homeEmptySearch: 'Aramanızla eşleşen makale bulunamadı. Farklı bir kelime deneyin.',
  homeEmptyNoArticles: 'Henüz gösterilecek makale yok. Lütfen daha sonra tekrar deneyin.',
}

const EN: HelpCenterUiStrings = {
  breadcrumbHome: 'Home',
  breadcrumbHelp: 'Help center',
  breadcrumbCategoryFallback: 'Category',
  breadcrumbArticleFallback: 'Article',
  metaHelpTitleFallback: 'Help center',
  metaHelpDescriptionFallback:
    'Help with boat tour bookings, tour day questions, and FAQs.',
  metaCategoryNotFoundTitle: 'Category not found',
  metaArticleNotFoundTitle: 'Article not found',
  metaCategoryTitleSuffix: 'Help',
  metaCategoryDescriptionFallback: (categoryTitle: string) =>
    `Articles in the ${categoryTitle} category.`,
  allHelpTopicsLink: '← All help topics',
  noArticlesInCategory: 'There are no articles in this category yet.',
  noArticlesInCategoryCard: 'No articles in this category.',
  articleFallbackTitle: 'Article',
  categoryFallbackTitle: 'Category',
  categoryCardEyebrowFallback: 'Category',
  articleBodyEmpty: 'No body text has been added for this article yet.',
  relatedArticlesHeading: 'Related articles',
  supportHeading: 'Couldn’t find what you need?',
  supportBody:
    'Our team is happy to help with boat tours, bookings, and day-of questions.',
  supportWhatsappCta: 'Message us on WhatsApp',
  supportWhatsappMissing:
    'WhatsApp is not configured. You can reach us from the contact page.',
  supportContactCta: 'Contact',
  searchPlaceholder: 'Search articles or topics…',
  searchLabelSrOnly: 'Search help articles',
  searchCountNone: 'No matching articles',
  searchCountListed: (n: number) => (n === 1 ? '1 article listed' : `${n} articles listed`),
  homeSectionEyebrow: 'Guide',
  homeTopicsHeadingPrimary: 'Browse',
  homeTopicsHeadingSecondary: ' topics',
  homeEmptySearch: 'No articles matched your search. Try a different keyword.',
  homeEmptyNoArticles: 'There are no articles to show yet. Please check back later.',
}

const DE: HelpCenterUiStrings = {
  breadcrumbHome: 'Startseite',
  breadcrumbHelp: 'Hilfe-Center',
  breadcrumbCategoryFallback: 'Kategorie',
  breadcrumbArticleFallback: 'Artikel',
  metaHelpTitleFallback: 'Hilfe-Center',
  metaHelpDescriptionFallback:
    'Hilfe zu Bootstouren, Buchungen und häufigen Fragen.',
  metaCategoryNotFoundTitle: 'Kategorie nicht gefunden',
  metaArticleNotFoundTitle: 'Artikel nicht gefunden',
  metaCategoryTitleSuffix: 'Hilfe',
  metaCategoryDescriptionFallback: (categoryTitle: string) =>
    `Artikel in der Kategorie „${categoryTitle}“.`,
  allHelpTopicsLink: '← Alle Hilfethemen',
  noArticlesInCategory: 'In dieser Kategorie gibt es noch keine Artikel.',
  noArticlesInCategoryCard: 'Keine Artikel in dieser Kategorie.',
  articleFallbackTitle: 'Artikel',
  categoryFallbackTitle: 'Kategorie',
  categoryCardEyebrowFallback: 'Kategorie',
  articleBodyEmpty: 'Für diesen Artikel wurde noch kein Text hinzugefügt.',
  relatedArticlesHeading: 'Verwandte Artikel',
  supportHeading: 'Nicht die richtige Antwort gefunden?',
  supportBody:
    'Unser Team hilft gern bei Bootstouren, Buchungen und Fragen am Reisetag.',
  supportWhatsappCta: 'Per WhatsApp schreiben',
  supportWhatsappMissing:
    'WhatsApp ist nicht konfiguriert. Sie erreichen uns über die Kontaktseite.',
  supportContactCta: 'Kontakt',
  searchPlaceholder: 'Artikel oder Thema suchen…',
  searchLabelSrOnly: 'Hilfe-Artikel durchsuchen',
  searchCountNone: 'Keine passenden Artikel',
  searchCountListed: (n: number) => `${n} Artikel angezeigt`,
  homeSectionEyebrow: 'Leitfaden',
  homeTopicsHeadingPrimary: 'Themen',
  homeTopicsHeadingSecondary: ' durchsuchen',
  homeEmptySearch: 'Keine Artikel zu Ihrer Suche. Bitte anderen Begriff versuchen.',
  homeEmptyNoArticles: 'Es gibt noch keine Artikel. Bitte später erneut vorbeischauen.',
}

export function getHelpCenterUiStrings(locale: SiteLocale): HelpCenterUiStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  return TR
}

export function helpSearchLocaleTag(locale: SiteLocale): string {
  if (locale === 'en') return 'en-US'
  if (locale === 'de') return 'de-DE'
  return 'tr-TR'
}
