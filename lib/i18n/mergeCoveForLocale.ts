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

export function mergeCoveForLocale<T extends Record<string, unknown>>(cove: T, locale: SiteLocale): T {
  if (locale === 'tr') return cove
  const translations = cove.translations as Record<string, unknown> | undefined
  if (!translations) return cove
  const raw = translations[locale] as Record<string, unknown> | undefined
  if (!raw || typeof raw !== 'object') return cove

  const patch = { ...raw } as Record<string, unknown>
  const slugStr = flattenSlug(patch.slug)
  if (slugStr) patch.slug = slugStr
  else delete patch.slug

  const imageAlt = typeof patch.imageAlt === 'string' ? patch.imageAlt.trim() : ''
  delete patch.imageAlt
  delete patch.translations

  const merged = mergeDeep(cove, patch as Partial<T>) as T
  const m = merged as Record<string, unknown>
  if (imageAlt && m.image && isPlainObject(m.image)) {
    m.image = { ...(m.image as Record<string, unknown>), alt: imageAlt }
  }
  return merged as T
}

/** Çevirmen o dil için alanı elle doldurmuş mu? (boş string / boş dizi sayılmaz) */
export function coveFieldHasManualTranslation(
  cove: Record<string, unknown> | null | undefined,
  locale: SiteLocale,
  field: string,
): boolean {
  if (!cove || locale === 'tr') return false
  const translations = cove.translations as Record<string, unknown> | undefined
  const raw = translations?.[locale] as Record<string, unknown> | undefined
  const v = raw?.[field]
  if (typeof v === 'string') return v.trim().length > 0
  if (Array.isArray(v)) return v.length > 0
  if (isPlainObject(v)) return Object.values(v).some((x) => typeof x === 'string' ? x.trim().length > 0 : x != null)
  return false
}

/** Koyun verilen dildeki slug'ı (çeviri slug'ı yoksa Türkçe slug). */
export function coveSlugForLocale(cove: Record<string, unknown>, locale: SiteLocale): string | undefined {
  const base = flattenSlug(cove.slug)
  if (locale === 'tr') return base
  const translations = cove.translations as Record<string, unknown> | undefined
  const raw = translations?.[locale] as Record<string, unknown> | undefined
  return flattenSlug(raw?.slug) ?? base
}
