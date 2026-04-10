import { client } from '@/lib/sanity'
import type { SiteLocale } from '@/lib/i18n/config'
import {
  mergeHelpArticleDetailDoc,
  mergeHelpArticleListDoc,
  mergeHelpCategoryDoc,
  mergeHelpCenterPageDoc,
  mergeHelpRelatedArticleRow,
} from '@/lib/i18n/mergeHelpCenterLocale'
import {
  helpArticleBySlugsQuery,
  helpArticleSlugsByLocaleQuery,
  helpCategoriesWithArticlesQuery,
  helpCategoryBySlugQuery,
  helpCenterPageQuery,
} from '@/lib/sanity/queries/helpCenter'
import type {
  HelpArticleDetail,
  HelpArticleListItem,
  HelpCategoryPageDoc,
  HelpCategoryWithArticles,
  HelpCenterPageDoc,
} from '@/lib/sanity/types/helpCenter'

/** Taslakları hariç tut; yalnız yayımlanmış dataset görünümü (yardım içeriği listelenmesi için kritik). */
const published = { perspective: 'published' as const }

export async function fetchHelpCenterPage(locale: SiteLocale): Promise<HelpCenterPageDoc | null> {
  const raw = await client.fetch<HelpCenterPageDoc | null>(helpCenterPageQuery, {}, published)
  if (!raw) return null
  return mergeHelpCenterPageDoc(raw as Record<string, unknown>, locale) as HelpCenterPageDoc
}

export async function fetchHelpCategoriesWithArticles(
  locale: SiteLocale,
): Promise<HelpCategoryWithArticles[]> {
  const rows = await client.fetch<HelpCategoryWithArticles[] | null>(
    helpCategoriesWithArticlesQuery,
    {},
    published,
  )
  if (!rows?.length) return []
  return rows.map((row) => {
    const mergedCat = mergeHelpCategoryDoc(row as unknown as Record<string, unknown>, locale) as HelpCategoryWithArticles
    const articles = (mergedCat.articles ?? []).map(
      (a) => mergeHelpArticleListDoc(a as unknown as Record<string, unknown>, locale) as HelpArticleListItem,
    )
    return { ...mergedCat, articles }
  })
}

export async function fetchHelpArticleDetail(
  categorySlug: string,
  articleSlug: string,
  locale: SiteLocale,
): Promise<HelpArticleDetail | null> {
  const raw = await client.fetch<HelpArticleDetail | null>(
    helpArticleBySlugsQuery,
    { categorySlug, articleSlug },
    published,
  )
  if (!raw) return null
  const merged = mergeHelpArticleDetailDoc(raw as Record<string, unknown>, locale) as HelpArticleDetail
  const relatedRaw = raw.relatedArticles ?? []
  const relatedArticles = relatedRaw
    .map((r) => mergeHelpRelatedArticleRow(r as unknown as Record<string, unknown>, locale))
    .filter(Boolean) as NonNullable<HelpArticleDetail['relatedArticles']>
  return { ...merged, relatedArticles }
}

export async function fetchHelpCategoryPage(
  categorySlug: string,
  locale: SiteLocale,
): Promise<HelpCategoryPageDoc | null> {
  const raw = await client.fetch<HelpCategoryPageDoc | null>(
    helpCategoryBySlugQuery,
    { categorySlug },
    published,
  )
  if (!raw) return null
  const mergedCat = mergeHelpCategoryDoc(raw as unknown as Record<string, unknown>, locale) as HelpCategoryPageDoc
  const articles = (mergedCat.articles ?? []).map(
    (a) => mergeHelpArticleListDoc(a as unknown as Record<string, unknown>, locale) as HelpArticleListItem,
  )
  return { ...mergedCat, articles }
}

type SlugRow = {
  trCat?: string | null
  trArt?: string | null
  enCat?: string | null
  enArt?: string | null
  deCat?: string | null
  deArt?: string | null
}

export async function fetchHelpArticleStaticParams(): Promise<
  { locale: SiteLocale; categorySlug: string; articleSlug: string }[]
> {
  const rows = await client.fetch<SlugRow[] | null>(helpArticleSlugsByLocaleQuery, {}, published)
  if (!rows?.length) return []
  const out: { locale: SiteLocale; categorySlug: string; articleSlug: string }[] = []
  for (const r of rows) {
    if (r.trCat?.trim() && r.trArt?.trim()) {
      out.push({ locale: 'tr', categorySlug: r.trCat.trim(), articleSlug: r.trArt.trim() })
    }
    if (r.enCat?.trim() && r.enArt?.trim()) {
      out.push({ locale: 'en', categorySlug: r.enCat.trim(), articleSlug: r.enArt.trim() })
    }
    if (r.deCat?.trim() && r.deArt?.trim()) {
      out.push({ locale: 'de', categorySlug: r.deCat.trim(), articleSlug: r.deArt.trim() })
    }
  }
  return out
}
