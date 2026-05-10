import type { SiteLocale } from '@/lib/i18n/config'
import {
  getStaticHelpArticleDetail,
  getStaticHelpArticleStaticParams,
  getStaticHelpCategoriesWithArticles,
  getStaticHelpCategoryPage,
  getStaticHelpCenterPage,
} from '@/lib/helpCenter/staticHelpResolve'
import type {
  HelpArticleDetail,
  HelpCategoryPageDoc,
  HelpCategoryWithArticles,
  HelpCenterPageDoc,
} from '@/lib/sanity/types/helpCenter'

/** Yardım merkezi içeriği kod içi statik veriden gelir (docs/help-center-faq-icerik-tr.md → staticHelpData). */

export async function fetchHelpCenterPage(locale: SiteLocale): Promise<HelpCenterPageDoc | null> {
  return getStaticHelpCenterPage(locale)
}

export async function fetchHelpCategoriesWithArticles(
  locale: SiteLocale,
): Promise<HelpCategoryWithArticles[]> {
  return getStaticHelpCategoriesWithArticles(locale)
}

export async function fetchHelpArticleDetail(
  categorySlug: string,
  articleSlug: string,
  locale: SiteLocale,
): Promise<HelpArticleDetail | null> {
  return getStaticHelpArticleDetail(categorySlug, articleSlug, locale)
}

export async function fetchHelpCategoryPage(
  categorySlug: string,
  locale: SiteLocale,
): Promise<HelpCategoryPageDoc | null> {
  return getStaticHelpCategoryPage(categorySlug, locale)
}

export async function fetchHelpArticleStaticParams(): Promise<
  { locale: SiteLocale; categorySlug: string; articleSlug: string }[]
> {
  return getStaticHelpArticleStaticParams()
}
