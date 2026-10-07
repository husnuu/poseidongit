import type { SiteLocale } from './config'
import { mergeDeep } from './mergeDeep'

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** EN/DE için `translations.{en|de}` metinlerini Türkçe kayıt üzerine yazar
 * (görseller ve fiyat her zaman Türkçe kayıttan gelir). */
export function mergeFerryRouteLocale<T extends Record<string, unknown>>(
  ferryRoute: T,
  locale: SiteLocale,
): T {
  if (locale === 'tr') return ferryRoute
  const translations = ferryRoute.translations as Record<string, unknown> | undefined
  if (!translations) return ferryRoute
  const raw = (locale === 'en' ? translations.en : locale === 'de' ? translations.de : undefined) as
    | Record<string, unknown>
    | undefined
  if (!raw || typeof raw !== 'object') return ferryRoute

  const patch = { ...raw } as Record<string, unknown>
  delete patch.translations

  return mergeDeep(ferryRoute, patch as Partial<T>) as T
}

/** Bu dilde elle çeviri girilmiş mi? (anlık makine çevirisiyle doldurmak için) */
export function ferryRouteFieldHasManualTranslation(
  raw: Record<string, unknown> | null | undefined,
  locale: SiteLocale,
  field: string,
): boolean {
  if (locale === 'tr' || !raw) return true
  const translations = raw.translations as Record<string, unknown> | undefined
  const overlay = (locale === 'en' ? translations?.en : locale === 'de' ? translations?.de : undefined) as
    | Record<string, unknown>
    | undefined
  const value = overlay?.[field]
  if (value == null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (isPlainObject(value)) return Object.keys(value).length > 0
  return true
}
