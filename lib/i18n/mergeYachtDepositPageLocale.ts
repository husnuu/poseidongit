import type { SiteLocale } from './config'
import {
  getYachtDepositPageContent,
  resolveYachtDepositPageContent,
} from '@/lib/yachtDepositDefaults'

export type YachtDepositPageData = {
  enabled?: boolean | null
  depositAmount?: number | null
  titleTop?: string | null
  titleBottom?: string | null
  intro?: string | null
  bullets?: string[] | null
  seo?: { title?: string | null; description?: string | null } | null
  pageTranslations?: {
    en?: Record<string, unknown> | null
  } | null
  formOverlay?: Record<string, unknown> | null
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function mergeYachtDepositPageLocale<T extends YachtDepositPageData>(
  data: T | null,
  locale: SiteLocale
): T | null {
  if (!data) return data

  const defaults = getYachtDepositPageContent(locale)
  const out = { ...data } as Record<string, unknown>

  if (locale !== 'tr') {
    const patch = data.pageTranslations?.en
    if (patch && isPlainObject(patch)) {
      if (patch.seo && isPlainObject(patch.seo)) {
        const p = patch.seo
        out.seo = {
          ...(isPlainObject(out.seo) ? out.seo : {}),
          ...(typeof p.metaTitle === 'string' && p.metaTitle.trim() ? { title: p.metaTitle } : {}),
          ...(typeof p.metaDescription === 'string' && p.metaDescription.trim()
            ? { description: p.metaDescription }
            : {}),
        }
      }
      for (const key of ['titleTop', 'titleBottom', 'intro'] as const) {
        const v = patch[key]
        if (typeof v === 'string' && v.trim()) out[key] = v
      }
      if (Array.isArray(patch.bullets) && patch.bullets.length > 0) {
        out.bullets = patch.bullets
      }
      if (patch.form && isPlainObject(patch.form)) {
        out.formOverlay = patch.form
      }
    } else if (locale === 'en' || locale === 'de') {
      out.titleTop = defaults.titleTop
      out.titleBottom = defaults.titleBottom
      out.intro = defaults.intro
      out.bullets = defaults.bullets
      out.seo = { title: defaults.seo.title, description: defaults.seo.description }
    }
    delete out.pageTranslations
  }

  const resolved = resolveYachtDepositPageContent(locale, out as YachtDepositPageData)
  out.titleTop = resolved.titleTop
  out.titleBottom = resolved.titleBottom
  out.intro = resolved.intro
  out.bullets = resolved.bullets
  out.seo = resolved.seo

  return out as T
}
