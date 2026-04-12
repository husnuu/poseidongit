import type { SiteLocale } from '@/lib/i18n/config'

function localeTagForDate(loc: SiteLocale): string {
  if (loc === 'en') return 'en-GB'
  if (loc === 'de') return 'de-DE'
  return 'tr-TR'
}

/** Bilet / PDF için tarih (bilet sayfası ile aynı). */
export function formatTicketDate(dateStr: string, locale: SiteLocale = 'tr'): string {
  const s = (dateStr ?? '').trim()
  if (!s) return '—'
  try {
    const raw = /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return s
    return d.toLocaleDateString(localeTagForDate(locale), { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return s
  }
}
