import type { PortableTextBlock } from '@portabletext/react'

/** Ham fetch; birleştirme sonrası pageTranslations kullanılmaz */
export type HelpCenterPageDoc = {
  heroEyebrow?: string | null
  title?: string | null
  shortDescription?: string | null
  pageTranslations?: {
    en?: Record<string, unknown> | null
    de?: Record<string, unknown> | null
  } | null
  heroImage?: {
    asset?: { _ref?: string }
    url?: string | null
    alt?: string | null
    metadata?: { lqip?: string | null; dimensions?: { width?: number; height?: number } | null } | null
  } | null
  seoTitle?: string | null
  seoDescription?: string | null
}

export type HelpArticleListItem = {
  _id: string
  title?: string | null
  slug?: string | null
  shortDescription?: string | null
  order?: number | null
  translations?: Record<string, unknown> | null
}

export type HelpCategoryWithArticles = {
  _id: string
  title?: string | null
  slug?: string | null
  shortDescription?: string | null
  iconName?: string | null
  isFeatured?: boolean | null
  order?: number | null
  translations?: Record<string, unknown> | null
  articles?: HelpArticleListItem[] | null
}

export type HelpCategoryPageDoc = {
  _id: string
  title?: string | null
  slug?: string | null
  shortDescription?: string | null
  iconName?: string | null
  translations?: Record<string, unknown> | null
  audience?: { title?: string | null; slug?: string | null } | null
  articles?: HelpArticleListItem[] | null
}

export type HelpArticleDetail = {
  _id: string
  title?: string | null
  slug?: string | null
  shortDescription?: string | null
  body?: PortableTextBlock[] | null
  seoTitle?: string | null
  seoDescription?: string | null
  order?: number | null
  translations?: Record<string, unknown> | null
  category?: {
    title?: string | null
    slug?: string | null
    shortDescription?: string | null
    translations?: Record<string, unknown> | null
  } | null
  audience?: { title?: string | null; slug?: string | null } | null
  relatedArticles?: Array<{
    _id: string
    title?: string | null
    slug?: string | null
    isPublished?: boolean | null
    categorySlug?: string | null
    translations?: Record<string, unknown> | null
    category?: {
      slug?: string | null
      translations?: Record<string, unknown> | null
    } | null
  }> | null
  _updatedAt?: string | null
}
