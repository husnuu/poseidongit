import type { PortableTextBlock } from '@portabletext/react'
import type { SiteLocale } from '@/lib/i18n/config'
import type {
  HelpArticleDetail,
  HelpCategoryPageDoc,
  HelpCategoryWithArticles,
  HelpCenterPageDoc,
} from '@/lib/sanity/types/helpCenter'
import { STATIC_HELP_CATEGORIES, STATIC_HELP_PAGE } from './staticHelpData'
import { translateText, translatePortableTextBlocks } from '@/lib/i18n/runtimeTranslate'

/** İçerik güncellendiğinde (isteğe bağlı) tarih — app/sitemap.ts da kullanıyor. */
export const STATIC_UPDATED_AT = '2026-05-01T12:00:00.000Z'

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

export async function getStaticHelpCenterPage(locale: SiteLocale): Promise<HelpCenterPageDoc> {
  const [heroEyebrow, title, shortDescription, seoTitle, seoDescription] = await Promise.all([
    translateText(STATIC_HELP_PAGE.heroEyebrow, locale),
    translateText(STATIC_HELP_PAGE.title, locale),
    translateText(STATIC_HELP_PAGE.shortDescription, locale),
    translateText(STATIC_HELP_PAGE.seoTitle, locale),
    translateText(STATIC_HELP_PAGE.seoDescription, locale),
  ])
  return {
    heroEyebrow,
    title,
    shortDescription,
    seoTitle,
    seoDescription,
    heroImage: null,
    pageTranslations: null,
  }
}

export async function getStaticHelpCategoriesWithArticles(locale: SiteLocale): Promise<HelpCategoryWithArticles[]> {
  return Promise.all(
    STATIC_HELP_CATEGORIES.map(async (cat) => {
      const [title, shortDescription] = await Promise.all([
        translateText(cat.title, locale),
        translateText(cat.shortDescription, locale),
      ])
      const articles = await Promise.all(
        cat.articles.map(async (a, idx) => ({
          _id: `static-art-${cat.slug}-${a.slug}`,
          title: await translateText(a.title, locale),
          slug: a.slug,
          shortDescription: await translateText(articleShortDescription(a.answer), locale),
          order: (idx + 1) * 10,
          translations: null,
        }))
      )
      return {
        _id: `static-cat-${cat.slug}`,
        title,
        slug: cat.slug,
        shortDescription,
        iconName: cat.iconName,
        isFeatured: cat.isFeatured,
        order: cat.order,
        translations: null,
        articles,
      }
    })
  )
}

export async function getStaticHelpCategoryPage(
  categorySlug: string,
  locale: SiteLocale,
): Promise<HelpCategoryPageDoc | null> {
  const cat = STATIC_HELP_CATEGORIES.find((c) => c.slug === categorySlug)
  if (!cat) return null
  const [title, shortDescription] = await Promise.all([
    translateText(cat.title, locale),
    translateText(cat.shortDescription, locale),
  ])
  const articles = await Promise.all(
    cat.articles.map(async (a, idx) => ({
      _id: `static-art-${cat.slug}-${a.slug}`,
      title: await translateText(a.title, locale),
      slug: a.slug,
      shortDescription: await translateText(articleShortDescription(a.answer), locale),
      order: (idx + 1) * 10,
      translations: null,
    }))
  )
  return {
    _id: `static-cat-${cat.slug}`,
    title,
    slug: cat.slug,
    shortDescription,
    iconName: cat.iconName,
    translations: null,
    audience: null,
    articles,
  }
}

export async function getStaticHelpArticleDetail(
  categorySlug: string,
  articleSlug: string,
  locale: SiteLocale,
): Promise<HelpArticleDetail | null> {
  const cat = STATIC_HELP_CATEGORIES.find((c) => c.slug === categorySlug)
  if (!cat) return null
  const art = cat.articles.find((a) => a.slug === articleSlug)
  if (!art) return null

  const others = cat.articles.filter((a) => a.slug !== articleSlug).slice(0, 3)
  const relatedArticles = await Promise.all(
    others.map(async (r) => ({
      _id: `static-art-${cat.slug}-${r.slug}`,
      title: await translateText(r.title, locale),
      slug: r.slug,
      isPublished: true as const,
      categorySlug: cat.slug,
      category: { slug: cat.slug, translations: null },
      translations: null,
    }))
  )

  const shortDesc = articleShortDescription(art.answer)
  const [
    title,
    shortDescription,
    body,
    seoDescription,
    catTitle,
    catShortDescription,
  ] = await Promise.all([
    translateText(art.title, locale),
    translateText(shortDesc, locale),
    translatePortableTextBlocks(answerToPortableBlocks(art.answer), locale),
    translateText(excerpt(art.answer, 155), locale),
    translateText(cat.title, locale),
    translateText(cat.shortDescription, locale),
  ])

  return {
    _id: `static-art-${cat.slug}-${art.slug}`,
    title,
    slug: art.slug,
    shortDescription,
    body: body ?? answerToPortableBlocks(art.answer),
    seoTitle: `${title} | Poseidon Çeşme`,
    seoDescription,
    order: null,
    translations: null,
    category: {
      title: catTitle,
      slug: cat.slug,
      shortDescription: catShortDescription,
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
