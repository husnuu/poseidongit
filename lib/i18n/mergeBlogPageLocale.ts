import type { SiteLocale } from './config'
import { mergeDeep } from './mergeDeep'

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function mergeBlogPageLocale<T extends Record<string, unknown>>(data: T | null, locale: SiteLocale): T | null {
  if (!data || locale === 'tr') return data
  const pt = data.pageTranslations as { en?: Record<string, unknown>; de?: Record<string, unknown> } | undefined
  if (!pt) return data
  const patch = locale === 'en' ? pt.en : pt.de
  if (!patch || typeof patch !== 'object') return data

  const out = { ...data } as Record<string, unknown>
  delete out.pageTranslations

  if (patch.seo && isPlainObject(out.seo)) {
    out.seo = mergeDeep(out.seo as Record<string, unknown>, patch.seo as Record<string, unknown>)
  } else if (patch.seo && isPlainObject(patch.seo)) {
    out.seo = { ...(patch.seo as Record<string, unknown>) }
  }

  for (const key of ['heroTitle', 'heroHighlightTitlePart', 'heroDescription', 'heroImageAlt', 'emptyListMessage'] as const) {
    const v = patch[key]
    if (typeof v === 'string' && v.trim()) out[key] = v
  }

  if (patch.heroImageAlt && isPlainObject(out.heroImage)) {
    out.heroImage = { ...(out.heroImage as Record<string, unknown>), alt: patch.heroImageAlt }
  }

  return out as T
}

export function mergeBlogPageSeoForLocale(
  seo: Record<string, unknown> | null | undefined,
  pageTranslations: { en?: Record<string, unknown>; de?: Record<string, unknown> } | null | undefined,
  locale: SiteLocale,
): Record<string, unknown> | null | undefined {
  if (locale === 'tr' || !pageTranslations) return seo
  const patch = locale === 'en' ? pageTranslations.en : pageTranslations.de
  const pSeo = patch?.seo as Record<string, unknown> | undefined
  if (!pSeo) return seo
  const base = isPlainObject(seo) ? seo : {}
  return mergeDeep(base as Record<string, unknown>, pSeo)
}
