import type { PortableTextBlock } from '@portabletext/react'
import type { SiteLocale } from '@/lib/i18n/config'
import type {
  HelpArticleDetail,
  HelpCategoryPageDoc,
  HelpCategoryWithArticles,
  HelpCenterPageDoc,
} from '@/lib/sanity/types/helpCenter'
import { STATIC_HELP_CATEGORIES, STATIC_HELP_PAGE } from './staticHelpData'

/** İçerik güncellendiğinde (isteğe bağlı) tarih */
const STATIC_UPDATED_AT = '2026-05-01T12:00:00.000Z'

const ALL_LOCALES: SiteLocale[] = ['tr', 'en', 'de']

export function answerToPortableBlocks(answer: string): PortableTextBlock[] {
  const paras = answer
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  return paras.map((p, i) => ({
    _type: 'block',
    _key: `p-${i}`,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `s-${i}`, text: p, marks: [] }],
  })) as PortableTextBlock[]
}

function excerpt(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut) + '…'
}

function articleShortDescription(answer: string): string {
  const parts = answer.split(/(?<=[.!?])\s+/)
  const first = parts[0]?.trim()
  if (first && first.length <= 220) return first
  return excerpt(answer, 180)
}

export function getStaticHelpCenterPage(_locale: SiteLocale): HelpCenterPageDoc {
  return {
    heroEyebrow: STATIC_HELP_PAGE.heroEyebrow,
    title: STATIC_HELP_PAGE.title,
    shortDescription: STATIC_HELP_PAGE.shortDescription,
    seoTitle: STATIC_HELP_PAGE.seoTitle,
    seoDescription: STATIC_HELP_PAGE.seoDescription,
    heroImage: null,
    pageTranslations: null,
  }
}

export function getStaticHelpCategoriesWithArticles(_locale: SiteLocale): HelpCategoryWithArticles[] {
  return STATIC_HELP_CATEGORIES.map((cat) => ({
    _id: `static-cat-${cat.slug}`,
    title: cat.title,
    slug: cat.slug,
    shortDescription: cat.shortDescription,
    iconName: cat.iconName,
    isFeatured: cat.isFeatured,
    order: cat.order,
    translations: null,
    articles: cat.articles.map((a, idx) => ({
      _id: `static-art-${cat.slug}-${a.slug}`,
      title: a.title,
      slug: a.slug,
      shortDescription: articleShortDescription(a.answer),
      order: (idx + 1) * 10,
      translations: null,
    })),
  }))
}

export function getStaticHelpCategoryPage(
  categorySlug: string,
  _locale: SiteLocale,
): HelpCategoryPageDoc | null {
  const cat = STATIC_HELP_CATEGORIES.find((c) => c.slug === categorySlug)
  if (!cat) return null
  return {
    _id: `static-cat-${cat.slug}`,
    title: cat.title,
    slug: cat.slug,
    shortDescription: cat.shortDescription,
    iconName: cat.iconName,
    translations: null,
    audience: null,
    articles: cat.articles.map((a, idx) => ({
      _id: `static-art-${cat.slug}-${a.slug}`,
      title: a.title,
      slug: a.slug,
      shortDescription: articleShortDescription(a.answer),
      order: (idx + 1) * 10,
      translations: null,
    })),
  }
}

export function getStaticHelpArticleDetail(
  categorySlug: string,
  articleSlug: string,
  _locale: SiteLocale,
): HelpArticleDetail | null {
  const cat = STATIC_HELP_CATEGORIES.find((c) => c.slug === categorySlug)
  if (!cat) return null
  const art = cat.articles.find((a) => a.slug === articleSlug)
  if (!art) return null

  const others = cat.articles.filter((a) => a.slug !== articleSlug).slice(0, 3)
  const relatedArticles = others.map((r) => ({
    _id: `static-art-${cat.slug}-${r.slug}`,
    title: r.title,
    slug: r.slug,
    isPublished: true as const,
    categorySlug: cat.slug,
    category: { slug: cat.slug, translations: null },
    translations: null,
  }))

  const shortDesc = articleShortDescription(art.answer)
  return {
    _id: `static-art-${cat.slug}-${art.slug}`,
    title: art.title,
    slug: art.slug,
    shortDescription: shortDesc,
    body: answerToPortableBlocks(art.answer),
    seoTitle: `${art.title} | Poseidon Çeşme`,
    seoDescription: excerpt(art.answer, 155),
    order: null,
    translations: null,
    category: {
      title: cat.title,
      slug: cat.slug,
      shortDescription: cat.shortDescription,
      translations: null,
    },
    audience: null,
    relatedArticles,
    _updatedAt: STATIC_UPDATED_AT,
  }
}

export function getStaticHelpArticleStaticParams(): {
  locale: SiteLocale
  categorySlug: string
  articleSlug: string
}[] {
  const out: { locale: SiteLocale; categorySlug: string; articleSlug: string }[] = []
  for (const locale of ALL_LOCALES) {
    for (const cat of STATIC_HELP_CATEGORIES) {
      for (const art of cat.articles) {
        out.push({ locale, categorySlug: cat.slug, articleSlug: art.slug })
      }
    }
  }
  return out
}
