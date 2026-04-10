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

/**
 * Blog yazısı: `translations.en` / `translations.de` ile Türkçe tabanı birleştirir.
 * Slug yoksa Türkçe slug kullanılır (aynı URL tüm dillerde).
 */
export function mergeBlogForLocale<T extends Record<string, unknown>>(post: T, locale: SiteLocale): T {
  if (locale === 'tr') return post
  const translations = post.translations as Record<string, unknown> | undefined
  if (!translations) return post
  const raw = (locale === 'en' ? translations.en : translations.de) as Record<string, unknown> | undefined
  if (!raw || typeof raw !== 'object') return post

  const patch = { ...raw } as Record<string, unknown>
  const slugStr = flattenSlug(patch.slug)
  if (slugStr) patch.slug = slugStr
  else delete patch.slug

  const seoPatch = patch.seo
  const coverAlt = typeof patch.coverAlt === 'string' ? patch.coverAlt.trim() : ''
  delete patch.seo
  delete patch.coverAlt
  delete patch.translations

  let merged = mergeDeep(post, patch as Partial<T>) as T

  if (seoPatch && isPlainObject(seoPatch)) {
    const m0 = merged as Record<string, unknown>
    const baseSeo = isPlainObject(m0.seo) ? (m0.seo as Record<string, unknown>) : {}
    merged = {
      ...m0,
      seo: mergeDeep(baseSeo, seoPatch as Record<string, unknown>),
    } as unknown as T
  }

  const m = merged as Record<string, unknown>
  if (coverAlt && m.coverImage && isPlainObject(m.coverImage)) {
    m.coverImage = { ...(m.coverImage as Record<string, unknown>), alt: coverAlt }
  }

  const auth =
    typeof m.authorName === 'string' && m.authorName.trim()
      ? String(m.authorName).trim()
      : typeof m.author === 'string' && m.author.trim()
        ? m.author.trim()
        : ''
  if (auth) m.author = auth

  return merged as T
}
