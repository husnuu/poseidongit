import type { SiteLocale } from '@/lib/i18n/config'
import { dateLocaleForSite } from '@/lib/i18n/dateLocale'

/**
 * Blog / kart tarihleri: `YYYY-MM-DD` değerini UTC gece yarısı sanıp parse etmek
 * (new Date('2025-04-11')) sunucu ile istemcide farklı takvim günü üretebilir → hydration #418.
 * Bu yardımcı tarihi yerel takvim günü olarak yorumlar; SSR ile ilk client render aynı metni verir.
 */
export function formatDisplayDateForLocaleTag(
  isoOrDate: string | null | undefined,
  dateLocaleTag: string
): string {
  if (!isoOrDate?.trim()) return ''
  try {
    const t = isoOrDate.trim()
    const dOnly = t.slice(0, 10)
    let d: Date
    if (/^\d{4}-\d{2}-\d{2}$/.test(dOnly)) {
      const y = parseInt(dOnly.slice(0, 4), 10)
      const mo = parseInt(dOnly.slice(5, 7), 10) - 1
      const day = parseInt(dOnly.slice(8, 10), 10)
      d = new Date(y, mo, day)
    } else {
      d = new Date(t)
    }
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString(dateLocaleTag, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export function formatDisplayDateForSite(
  isoOrDate: string | null | undefined,
  locale: SiteLocale
): string {
  return formatDisplayDateForLocaleTag(isoOrDate, dateLocaleForSite(locale))
}
