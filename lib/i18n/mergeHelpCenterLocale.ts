import type { SiteLocale } from './config'
import { mergeDeep } from './mergeDeep'

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function flattenSlug(slug: unknown): string | undefined {
  if (typeof slug === 'string' && slug.trim()) return slug.trim()
  if (isPlainObject(slug) && typeof slug.current === 'string' && slug.current.trim()) {
    return slug.current.trim()
  }
  return undefined
}

function pickTranslationPatch(
  doc: Record<string, unknown> | null | undefined,
  locale: SiteLocale,
): Record<string, unknown> | null {
  if (!doc || locale === 'tr') return null
  const translations = doc.translations as Record<string, unknown> | undefined
  if (!translations) return null
  const raw = (locale === 'en' ? translations.en : translations.de) as Record<string, unknown> | undefined
  return raw && typeof raw === 'object' ? { ...raw } : null
}

/** helpCenterPage singleton */
export function mergeHelpCenterPageDoc<T extends Record<string, unknown>>(data: T | null, locale: SiteLocale): T | null {
  if (!data || locale === 'tr') return data
  const pt = data.pageTranslations as { en?: Record<string, unknown>; de?: Record<string, unknown> } | undefined
  if (!pt) return data
  const patch = locale === 'en' ? pt.en : pt.de
  if (!patch || typeof patch !== 'object') return data

  const out = { ...data } as Record<string, unknown>
  delete out.pageTranslations

  const pSeo = patch.seo as Record<string, unknown> | undefined
  if (pSeo) {
    if (typeof pSeo.seoTitle === 'string' && pSeo.seoTitle.trim()) out.seoTitle = pSeo.seoTitle
    if (typeof pSeo.seoDescription === 'string' && pSeo.seoDescription.trim()) {
      out.seoDescription = pSeo.seoDescription
    }
  }
  for (const key of ['heroEyebrow', 'title', 'shortDescription'] as const) {
    const v = patch[key]
    if (typeof v === 'string' && v.trim()) out[key] = v
  }
  const alt = typeof patch.heroImageAlt === 'string' ? patch.heroImageAlt.trim() : ''
  if (alt && out.heroImage && isPlainObject(out.heroImage)) {
    out.heroImage = { ...(out.heroImage as Record<string, unknown>), alt }
  }

  return out as T
}

/** helpCategory belgesi veya category->{...} projeksiyonu */
export function mergeHelpCategoryDoc<T extends Record<string, unknown>>(cat: T | null | undefined, locale: SiteLocale): T | null | undefined {
  if (!cat || locale === 'tr') return cat
  const patch = pickTranslationPatch(cat as Record<string, unknown>, locale)
  if (!patch) return cat

  const slugStr = flattenSlug(patch.slug)
  if (slugStr) patch.slug = slugStr
  else delete patch.slug
  delete patch.translations

  return mergeDeep(cat as Record<string, unknown>, patch as Record<string, unknown>) as T
}

/** helpArticle liste öğesi (kısa) */
export function mergeHelpArticleListDoc<T extends Record<string, unknown>>(article: T | null | undefined, locale: SiteLocale): T | null | undefined {
  if (!article || locale === 'tr') return article
  const patch = pickTranslationPatch(article as Record<string, unknown>, locale)
  if (!patch) return article

  const slugStr = flattenSlug(patch.slug)
  if (slugStr) patch.slug = slugStr
  else delete patch.slug
  delete patch.body
  delete patch.seoTitle
  delete patch.seoDescription
  delete patch.translations

  return mergeDeep(article as Record<string, unknown>, patch as Record<string, unknown>) as T
}

/** Makale detay (gövde + SEO) */
export function mergeHelpArticleDetailDoc<T extends Record<string, unknown>>(article: T | null, locale: SiteLocale): T | null {
  if (!article || locale === 'tr') return article
  const patch = pickTranslationPatch(article, locale)
  if (!patch) return article

  const slugStr = flattenSlug(patch.slug)
  if (slugStr) patch.slug = slugStr
  else delete patch.slug
  const patchCopy = { ...patch }
  delete patchCopy.translations

  const merged = mergeDeep(
    article as Record<string, unknown>,
    patchCopy as Record<string, unknown>,
  ) as T

  const m = merged as Record<string, unknown>
  if (m.category && isPlainObject(m.category)) {
    m.category = mergeHelpCategoryDoc(m.category as Record<string, unknown>, locale)
  }

  return merged as T
}

/** İlgili makale satırı (kategori slug ile) */
export function mergeHelpRelatedArticleRow(
  row: Record<string, unknown> | null | undefined,
  locale: SiteLocale,
): {
  _id: string
  title?: string | null
  slug?: string | null
  isPublished?: boolean | null
  categorySlug?: string | null
} | null {
  if (!row) return null
  const merged = mergeHelpArticleListDoc(row as Record<string, unknown>, locale) as Record<string, unknown>
  const cat = row.category as Record<string, unknown> | undefined
  const mergedCat = mergeHelpCategoryDoc(cat, locale) as Record<string, unknown> | undefined
  const categorySlug =
    typeof mergedCat?.slug === 'string'
      ? mergedCat.slug
      : typeof row.categorySlug === 'string'
        ? row.categorySlug
        : null
  return {
    _id: String(row._id),
    title: (merged.title as string) ?? (row.title as string) ?? null,
    slug: (merged.slug as string) ?? (row.slug as string) ?? null,
    isPublished: row.isPublished as boolean | undefined,
    categorySlug,
  }
}
