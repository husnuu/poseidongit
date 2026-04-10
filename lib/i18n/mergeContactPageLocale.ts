import type { SiteLocale } from './config'
import { mergeDeep } from './mergeDeep'

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function mergeCardsByIndex(base: unknown, patch: unknown): unknown {
  if (!Array.isArray(patch) || patch.length === 0) return base
  if (!Array.isArray(base)) return base
  return (base as Record<string, unknown>[]).map((item, i) => {
    const p = patch[i] as Record<string, unknown> | undefined
    if (!p || !isPlainObject(item)) return item
    return {
      ...item,
      ...(typeof p.label === 'string' && p.label.trim() ? { label: p.label } : {}),
      ...(typeof p.value === 'string' ? { value: p.value } : {}),
    }
  })
}

/**
 * İletişim singleton: pageTranslations.en / .de ile metinleri günceller.
 * `ui` nesnesi kod varsayılanlarının üzerine yazılır (sayfada merge edilir).
 */
export function mergeContactPageLocale<T extends Record<string, unknown>>(data: T | null, locale: SiteLocale): T | null {
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

  for (const key of ['title', 'metaTitle', 'metaDescription', 'locationTitle', 'popularToursTitle'] as const) {
    const v = patch[key]
    if (typeof v === 'string' && v.trim()) out[key] = v
  }

  if (Array.isArray(patch.intro) && patch.intro.length > 0) {
    out.intro = patch.intro
  }

  if (patch.form && isPlainObject(patch.form)) {
    out.form = mergeDeep(
      (isPlainObject(out.form) ? out.form : {}) as Record<string, unknown>,
      patch.form as Record<string, unknown>,
    )
  }

  if (patch.contactCards) {
    out.contactCards = mergeCardsByIndex(out.contactCards, patch.contactCards)
  }

  if (patch.ui && isPlainObject(patch.ui)) {
    out.ui = patch.ui
  }

  return out as T
}

export function mergeContactPageSeoForLocale(
  metaTitle: string | null | undefined,
  metaDescription: string | null | undefined,
  pageTranslations: { en?: Record<string, unknown>; de?: Record<string, unknown> } | null | undefined,
  locale: SiteLocale,
): { metaTitle?: string | null; metaDescription?: string | null } {
  if (locale === 'tr' || !pageTranslations) {
    return { metaTitle, metaDescription }
  }
  const patch = locale === 'en' ? pageTranslations.en : pageTranslations.de
  if (!patch) return { metaTitle, metaDescription }

  let nextTitle = metaTitle
  let nextDesc = metaDescription

  if (typeof patch.metaTitle === 'string' && patch.metaTitle.trim()) nextTitle = patch.metaTitle
  if (typeof patch.metaDescription === 'string' && patch.metaDescription.trim()) nextDesc = patch.metaDescription

  const pSeo = patch.seo as Record<string, unknown> | undefined
  if (pSeo) {
    if (typeof pSeo.metaTitle === 'string' && pSeo.metaTitle.trim()) nextTitle = pSeo.metaTitle as string
    if (typeof pSeo.metaDescription === 'string' && pSeo.metaDescription.trim()) {
      nextDesc = pSeo.metaDescription as string
    }
  }

  return { metaTitle: nextTitle, metaDescription: nextDesc }
}
