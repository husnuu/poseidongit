import type { SiteLocale } from './config'
import { mergeDeep } from './mergeDeep'

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function mergeArrayItemsByIndex(
  base: unknown,
  patch: unknown,
  mergeItem: (b: Record<string, unknown>, p: Record<string, unknown>) => Record<string, unknown>,
): unknown {
  if (!Array.isArray(patch) || patch.length === 0) return base
  if (!Array.isArray(base)) return base
  return (base as Record<string, unknown>[]).map((item, i) => {
    const p = patch[i] as Record<string, unknown> | undefined
    if (!p || !isPlainObject(item)) return item
    return mergeItem(item, p)
  })
}

/**
 * Applies `pageTranslations.en` or `pageTranslations.de` onto fetched home page data.
 * Mutates a shallow clone; safe for server components.
 */
export function mergeHomePageLocale<T extends Record<string, unknown>>(data: T | null, locale: SiteLocale): T | null {
  if (!data || locale === 'tr') return data
  const pt = data.pageTranslations as { en?: Record<string, unknown>; de?: Record<string, unknown> } | undefined
  if (!pt) return data
  const patch = locale === 'en' ? pt.en : pt.de
  if (!patch || typeof patch !== 'object') return data

  const out = { ...data } as Record<string, unknown>
  delete out.pageTranslations

  if (patch.seo) {
    out.seo = mergeDeep((isPlainObject(out.seo) ? out.seo : {}) as Record<string, unknown>, patch.seo as Record<string, unknown>)
  }

  if (patch.searchForm && isPlainObject(out.searchForm)) {
    out.searchForm = mergeDeep(out.searchForm as Record<string, unknown>, patch.searchForm as Record<string, unknown>)
  }

  if (patch.hero && isPlainObject(out.hero)) {
    out.hero = mergeDeep(
      { ...(out.hero as Record<string, unknown>) },
      patch.hero as Record<string, unknown>
    )
  }

  if (patch.featureBar) {
    out.featureBar = mergeArrayItemsByIndex(out.featureBar, patch.featureBar, (b, p) => ({
      ...b,
      ...(typeof p.icon === 'string' && p.icon.trim() ? { icon: p.icon } : {}),
      ...(typeof p.title === 'string' && p.title.trim() ? { title: p.title } : {}),
      ...(typeof p.description === 'string' && p.description.trim() ? { description: p.description } : {}),
    }))
  }

  if (patch.popularToursSection && isPlainObject(out.popularToursSection)) {
    out.popularToursSection = mergeDeep(
      out.popularToursSection as Record<string, unknown>,
      patch.popularToursSection as Record<string, unknown>
    )
  }

  if (patch.popularYachtsSection && isPlainObject(out.popularYachtsSection)) {
    const sec = { ...(out.popularYachtsSection as Record<string, unknown>) }
    const p = patch.popularYachtsSection as Record<string, unknown>
    if (typeof p.title === 'string' && p.title.trim()) sec.title = p.title
    if (typeof p.subtitle === 'string' && p.subtitle.trim()) sec.subtitle = p.subtitle
    if (p.ctaButton && isPlainObject(p.ctaButton)) {
      sec.ctaButton = mergeDeep(
        (isPlainObject(sec.ctaButton) ? sec.ctaButton : {}) as Record<string, unknown>,
        p.ctaButton as Record<string, unknown>
      )
    }
    out.popularYachtsSection = sec
  }

  if (patch.aboutTeaser && isPlainObject(out.aboutTeaser)) {
    const sec = { ...(out.aboutTeaser as Record<string, unknown>) }
    const p = patch.aboutTeaser as Record<string, unknown>
    if (typeof p.heading === 'string' && p.heading.trim()) sec.heading = p.heading
    if (Array.isArray(p.body) && p.body.length > 0) sec.body = p.body
    if (p.primaryCta && isPlainObject(p.primaryCta)) {
      sec.primaryCta = mergeDeep(
        (isPlainObject(sec.primaryCta) ? sec.primaryCta : {}) as Record<string, unknown>,
        p.primaryCta as Record<string, unknown>
      )
    }
    if (p.secondaryCta && isPlainObject(p.secondaryCta)) {
      sec.secondaryCta = mergeDeep(
        (isPlainObject(sec.secondaryCta) ? sec.secondaryCta : {}) as Record<string, unknown>,
        p.secondaryCta as Record<string, unknown>
      )
    }
    out.aboutTeaser = sec
  }

  if (patch.blogSection && isPlainObject(out.blogSection)) {
    const sec = { ...(out.blogSection as Record<string, unknown>) }
    const p = patch.blogSection as Record<string, unknown>
    if (typeof p.heading === 'string' && p.heading.trim()) sec.heading = p.heading
    if (typeof p.subtitle === 'string' && p.subtitle.trim()) sec.subtitle = p.subtitle
    if (p.ctaButton && isPlainObject(p.ctaButton)) {
      sec.ctaButton = mergeDeep(
        (isPlainObject(sec.ctaButton) ? sec.ctaButton : {}) as Record<string, unknown>,
        p.ctaButton as Record<string, unknown>
      )
    }
    out.blogSection = sec
  }

  if (patch.routeSection && isPlainObject(out.routeSection)) {
    const sec = { ...(out.routeSection as Record<string, unknown>) }
    const p = patch.routeSection as Record<string, unknown>
    if (typeof p.heading === 'string' && p.heading.trim()) sec.heading = p.heading
    if (typeof p.description === 'string' && p.description.trim()) sec.description = p.description
    if (p.ctaButton && isPlainObject(p.ctaButton)) {
      sec.ctaButton = mergeDeep(
        (isPlainObject(sec.ctaButton) ? sec.ctaButton : {}) as Record<string, unknown>,
        p.ctaButton as Record<string, unknown>
      )
    }
    if (p.locations) {
      sec.locations = mergeArrayItemsByIndex(sec.locations, p.locations, (b, loc) => ({
        ...b,
        ...(typeof loc.name === 'string' && loc.name.trim() ? { name: loc.name } : {}),
        ...(typeof loc.location === 'string' && loc.location.trim() ? { location: loc.location } : {}),
      }))
    }
    out.routeSection = sec
  }

  if (patch.instagramSection && isPlainObject(out.instagramSection)) {
    out.instagramSection = mergeDeep(
      out.instagramSection as Record<string, unknown>,
      patch.instagramSection as Record<string, unknown>
    )
  }

  if (patch.ctaBand && isPlainObject(out.ctaBand)) {
    out.ctaBand = mergeDeep(out.ctaBand as Record<string, unknown>, patch.ctaBand as Record<string, unknown>)
  }

  return out as T
}

/** Metadata: merge only SEO from pageTranslations */
export function mergeHomePageSeoForLocale(
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
