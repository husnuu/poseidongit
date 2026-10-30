import type { SiteLocale } from '@/lib/i18n/config'
import { translateText } from '@/lib/i18n/runtimeTranslate'

/**
 * Locale birleştirmesinden sonra metin hâlâ Türkçe orijinalin aynısıysa
 * (editör o dilde çeviri girmemiş), anlık makine çevirisiyle doldurur.
 * Elle girilmiş çeviri varsa ona dokunmaz; Sanity'e hiçbir şey yazılmaz.
 * Böylece örn. /de/buchten sayfası "Koylar" başlığıyla indekslenmez.
 */
export async function ensureLocalized(
  text: string | null | undefined,
  turkishSource: string | null | undefined,
  locale: SiteLocale,
  /** Elle yazılmış dil karşılığı (ör. UI sözlüğündeki "Buchten") — varsa makine çevirisi yerine kullanılır. */
  curatedFallback?: string
): Promise<string> {
  const value = text?.trim() ?? ''
  if (!value || locale === 'tr') return value
  const source = turkishSource?.trim() ?? ''
  if (source && value !== source) return value
  if (curatedFallback?.trim()) return curatedFallback.trim()
  try {
    return (await translateText(value, locale)) || value
  } catch {
    return value
  }
}
