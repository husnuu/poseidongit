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

function mergeItineraryText(
  base: unknown,
  patch: unknown,
): unknown {
  if (!Array.isArray(patch) || patch.length === 0) return base
  if (!Array.isArray(base)) return base
  return (base as Record<string, unknown>[]).map((item, i) => {
    const p = patch[i] as Record<string, unknown> | undefined
    if (!p) return item
    return {
      ...item,
      ...(p.time !== undefined ? { time: p.time } : {}),
      ...(p.title !== undefined ? { title: p.title } : {}),
      ...(p.description !== undefined ? { description: p.description } : {}),
      ...(p.tag !== undefined ? { tag: p.tag } : {}),
    }
  })
}

function mergeMealOptions(base: unknown, patch: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(patch)) return base
  const bOpts = base.options
  const pOpts = patch.options
  if (!Array.isArray(bOpts) || !Array.isArray(pOpts) || pOpts.length === 0) return base
  const byKey = new Map<string, Record<string, unknown>>()
  for (const row of pOpts as Record<string, unknown>[]) {
    const k = typeof row.key === 'string' ? row.key : ''
    if (k) byKey.set(k, row)
  }
  const merged = (bOpts as Record<string, unknown>[]).map((opt) => {
    const key = typeof opt.key === 'string' ? opt.key : ''
    const p = key ? byKey.get(key) : undefined
    if (!p) return opt
    return {
      ...opt,
      ...(p.label !== undefined ? { label: p.label } : {}),
      ...(p.description !== undefined ? { description: p.description } : {}),
    }
  })
  return { ...base, options: merged }
}

function mergeFoodItems(base: unknown, patch: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(patch)) return base
  const bItems = base.items
  const pItems = patch.items
  if (!Array.isArray(bItems) || !Array.isArray(pItems) || pItems.length === 0) return base
  const merged = (bItems as Record<string, unknown>[]).map((item, i) => {
    const p = pItems[i] as Record<string, unknown> | undefined
    if (!p) return item
    return {
      ...item,
      ...(p.title !== undefined ? { title: p.title } : {}),
      ...(p.excerpt !== undefined ? { excerpt: p.excerpt } : {}),
      ...(p.priceLabel !== undefined ? { priceLabel: p.priceLabel } : {}),
      ...(p.metaLine1 !== undefined ? { metaLine1: p.metaLine1 } : {}),
      ...(p.metaLine2 !== undefined ? { metaLine2: p.metaLine2 } : {}),
    }
  })
  return { ...base, items: merged }
}

function mergeReviewItems(base: unknown, patch: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(patch)) return base
  const bItems = base.items
  const pItems = patch.items
  if (!Array.isArray(bItems) || !Array.isArray(pItems) || pItems.length === 0) return base
  const merged = (bItems as Record<string, unknown>[]).map((item, i) => {
    const p = pItems[i] as Record<string, unknown> | undefined
    if (!p) return item
    return {
      ...item,
      ...(p.name !== undefined ? { name: p.name } : {}),
      ...(p.title !== undefined ? { title: p.title } : {}),
      ...(p.description !== undefined ? { description: p.description } : {}),
    }
  })
  return { ...base, items: merged }
}

function mergeExtrasByIndex(base: unknown, patch: unknown): unknown {
  if (!Array.isArray(base) || !Array.isArray(patch) || patch.length === 0) return base
  return (base as Record<string, unknown>[]).map((item, i) => {
    const p = patch[i] as Record<string, unknown> | undefined
    if (!p) return item
    return {
      ...item,
      ...(p.title !== undefined ? { title: p.title } : {}),
      ...(p.description !== undefined ? { description: p.description } : {}),
    }
  })
}

/**
 * Applies `translations.en` or `translations.de` onto the Turkish base tour for rendering.
 */
export function mergeTourForLocale<T extends Record<string, unknown>>(tour: T, locale: SiteLocale): T {
  if (locale === 'tr') return tour
  const translations = tour.translations as Record<string, unknown> | undefined
  if (!translations) return tour
  const raw = (locale === 'en' ? translations.en : translations.de) as Record<string, unknown> | undefined
  if (!raw || typeof raw !== 'object') return tour

  const patch = { ...raw } as Record<string, unknown>
  const slugStr = flattenSlug(patch.slug)
  if (slugStr) patch.slug = slugStr
  else delete patch.slug

  const itPatch = patch.itinerary
  const mealPatch = patch.mealMenu
  const foodPatch = patch.foodMenu
  const revPatch = patch.reviewsSection
  const exPatch = patch.extras

  delete patch.itinerary
  delete patch.mealMenu
  delete patch.foodMenu
  delete patch.reviewsSection
  delete patch.extras
  delete patch.translations

  let merged = mergeDeep(tour, patch as Partial<T>)

  if (itPatch) {
    merged = {
      ...merged,
      itinerary: mergeItineraryText(merged.itinerary, itPatch),
    } as T
  }
  if (mealPatch) {
    merged = {
      ...merged,
      mealMenu: mergeMealOptions(merged.mealMenu, mealPatch),
    } as T
  }
  if (foodPatch) {
    merged = {
      ...merged,
      foodMenu: mergeFoodItems(merged.foodMenu, foodPatch),
    } as T
  }
  if (revPatch) {
    merged = {
      ...merged,
      reviewsSection: mergeReviewItems(merged.reviewsSection, revPatch),
    } as T
  }
  if (exPatch) {
    merged = {
      ...merged,
      extras: mergeExtrasByIndex(merged.extras, exPatch),
    } as T
  }

  return merged as T
}
