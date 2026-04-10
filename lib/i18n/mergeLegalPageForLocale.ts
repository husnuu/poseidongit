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

export function mergeLegalPageForLocale<T extends Record<string, unknown>>(page: T, locale: SiteLocale): T {
  if (locale === 'tr') return page
  const translations = page.translations as Record<string, unknown> | undefined
  if (!translations) return page
  const raw = (locale === 'en' ? translations.en : translations.de) as Record<string, unknown> | undefined
  if (!raw || typeof raw !== 'object') return page

  const patch = { ...raw } as Record<string, unknown>
  const slugStr = flattenSlug(patch.slug)
  if (slugStr) patch.slug = slugStr
  else delete patch.slug
  const merged = mergeDeep(page, patch as Partial<T>) as Record<string, unknown>
  delete merged.translations
  return merged as T
}
