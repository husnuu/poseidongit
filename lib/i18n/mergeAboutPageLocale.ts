import type { SiteLocale } from './config'
import { mergeDeep } from './mergeDeep'

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function mergeBoatsOverlay(base: unknown, patch: unknown): unknown {
  if (!Array.isArray(patch) || patch.length === 0) return base
  if (!Array.isArray(base)) return base
  return (base as Record<string, unknown>[]).map((item, i) => {
    const p = patch[i] as Record<string, unknown> | undefined
    if (!p || !isPlainObject(item)) return item
    const next = { ...item }
    if (typeof p.name === 'string' && p.name.trim()) next.name = p.name.trim()
    if (typeof p.description === 'string') next.description = p.description
    const alt = typeof p.imageAlt === 'string' ? p.imageAlt.trim() : ''
    if (alt && next.image && isPlainObject(next.image)) {
      next.image = { ...(next.image as Record<string, unknown>), alt }
    }
    return next
  })
}

export function mergeAboutPageLocale<T extends Record<string, unknown>>(data: T | null, locale: SiteLocale): T | null {
  if (!data || locale === 'tr') return data
  const pt = data.pageTranslations as { en?: Record<string, unknown>; de?: Record<string, unknown> } | undefined
  if (!pt) return data
  const patch = locale === 'en' ? pt.en : pt.de
  if (!patch || typeof patch !== 'object') return data

  const out = { ...data } as Record<string, unknown>
  delete out.pageTranslations

  if (patch.seo && isPlainObject(patch.seo)) {
    const p = patch.seo as Record<string, unknown>
    const baseSeo = isPlainObject(out.seo) ? (out.seo as Record<string, unknown>) : {}
    out.seo = mergeDeep(baseSeo, p)
  }

  for (const key of [
    'titleTop',
    'titleBottom',
    'sectionTitle',
    'sectionSubtitle',
    'timelineTitle',
    'timelineDescription',
  ] as const) {
    const v = patch[key]
    if (typeof v === 'string' && v.trim()) out[key] = v
  }

  if (Array.isArray(patch.intro) && patch.intro.length > 0) out.intro = patch.intro
  if (Array.isArray(patch.sectionBody) && patch.sectionBody.length > 0) out.sectionBody = patch.sectionBody

  const patchLogo = patch.heroLogo as Record<string, unknown> | undefined
  if (patchLogo && isPlainObject(patchLogo) && patchLogo.asset) {
    out.heroLogo = patchLogo
  }

  if (patch.boats) {
    out.boats = mergeBoatsOverlay(out.boats, patch.boats)
  }

  return out as T
}

/**
 * Editör `pageTranslations.en`/`.de` içine bu alanı elle çevirmiş mi?
 * true dönerse runtime (makine) çeviri fallback'i bu alana UYGULANMAMALI.
 */
export function aboutFieldHasManualTranslation(
  data: Record<string, unknown>,
  locale: SiteLocale,
  field: string
): boolean {
  if (locale === 'tr') return true
  const pt = data.pageTranslations as { en?: Record<string, unknown>; de?: Record<string, unknown> } | undefined
  if (!pt) return false
  const patch = locale === 'en' ? pt.en : pt.de
  if (!patch || typeof patch !== 'object') return false
  const value = (patch as Record<string, unknown>)[field]
  if (value == null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

/** Filodaki bir tekne için editör elle isim/açıklama çevirisi girmiş mi? */
export function aboutBoatFieldHasManualTranslation(
  data: Record<string, unknown>,
  locale: SiteLocale,
  index: number,
  field: 'name' | 'description'
): boolean {
  if (locale === 'tr') return true
  const pt = data.pageTranslations as { en?: Record<string, unknown>; de?: Record<string, unknown> } | undefined
  if (!pt) return false
  const patch = locale === 'en' ? pt.en : pt.de
  const boatsPatch = patch?.boats
  if (!Array.isArray(boatsPatch)) return false
  const boatPatch = boatsPatch[index] as Record<string, unknown> | undefined
  if (!boatPatch) return false
  const value = boatPatch[field]
  return typeof value === 'string' && value.trim().length > 0
}

export function mergeAboutPageSeoForLocale(
  seo: Record<string, unknown> | null | undefined,
  pageTranslations: { en?: Record<string, unknown>; de?: Record<string, unknown> } | null | undefined,
  locale: SiteLocale,
): { metaTitle?: string | null; metaDescription?: string | null } {
  if (locale === 'tr' || !pageTranslations) {
    const s = seo as { metaTitle?: string | null; metaDescription?: string | null } | undefined
    return { metaTitle: s?.metaTitle, metaDescription: s?.metaDescription }
  }
  const patch = locale === 'en' ? pageTranslations.en : pageTranslations.de
  let metaTitle =
    (seo as { metaTitle?: string | null } | undefined)?.metaTitle ?? null
  let metaDescription =
    (seo as { metaDescription?: string | null } | undefined)?.metaDescription ?? null

  if (patch?.seo && isPlainObject(patch.seo)) {
    const p = patch.seo as Record<string, unknown>
    if (typeof p.metaTitle === 'string' && p.metaTitle.trim()) metaTitle = p.metaTitle
    if (typeof p.metaDescription === 'string' && p.metaDescription.trim()) {
      metaDescription = p.metaDescription
    }
  }

  return { metaTitle, metaDescription }
}
