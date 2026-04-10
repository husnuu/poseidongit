import type { SiteLocale } from './config'

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function mergeCovesPageLocale<T extends Record<string, unknown>>(data: T | null, locale: SiteLocale): T | null {
  if (!data || locale === 'tr') return data
  const pt = data.pageTranslations as { en?: Record<string, unknown>; de?: Record<string, unknown> } | undefined
  if (!pt) return data
  const patch = locale === 'en' ? pt.en : pt.de
  if (!patch || typeof patch !== 'object') return data

  const out = { ...data } as Record<string, unknown>
  delete out.pageTranslations

  if (patch.seo && isPlainObject(patch.seo)) {
    const p = patch.seo as Record<string, unknown>
    if (typeof p.metaTitle === 'string' && p.metaTitle.trim()) out.metaTitle = p.metaTitle
    if (typeof p.metaDescription === 'string' && p.metaDescription.trim()) {
      out.metaDescription = p.metaDescription
    }
  }

  for (const key of ['title', 'description'] as const) {
    const v = patch[key]
    if (typeof v === 'string' && v.trim()) out[key] = v
  }

  const empty = patch.emptyListMessage
  if (typeof empty === 'string' && empty.trim()) {
    out.emptyListMessage = empty.trim()
  }

  return out as T
}

export function mergeCovesPageSeoForLocale(
  metaTitle: string | null | undefined,
  metaDescription: string | null | undefined,
  pageTranslations: { en?: Record<string, unknown>; de?: Record<string, unknown> } | null | undefined,
  locale: SiteLocale,
): { metaTitle?: string | null; metaDescription?: string | null } {
  if (locale === 'tr' || !pageTranslations) {
    return { metaTitle, metaDescription }
  }
  const patch = locale === 'en' ? pageTranslations.en : pageTranslations.de
  let nextTitle = metaTitle
  let nextDesc = metaDescription
  if (!patch) return { metaTitle: nextTitle, metaDescription: nextDesc }

  const pSeo = patch.seo as Record<string, unknown> | undefined
  if (pSeo) {
    if (typeof pSeo.metaTitle === 'string' && pSeo.metaTitle.trim()) nextTitle = pSeo.metaTitle as string
    if (typeof pSeo.metaDescription === 'string' && pSeo.metaDescription.trim()) {
      nextDesc = pSeo.metaDescription as string
    }
  }

  return { metaTitle: nextTitle, metaDescription: nextDesc }
}
