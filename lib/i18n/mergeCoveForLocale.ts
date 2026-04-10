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
  const raw = (locale === 'en' ? translations.en : translations.de) as Record<string, unknown> | undefined
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
