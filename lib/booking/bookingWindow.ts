/**
 * Müşteri rezervasyon takviminde seçilebilecek en erken tarih.
 * Ortam değişkeni yoksa varsayılan: 2026-05-28.
 */

const DEFAULT_SALES_OPEN_DATE = '2026-05-28'

export function todayStrLocal(): string {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

/** Sanity / panelden bağımsız satışa açılış tarihi (YYYY-MM-DD). */
export function getBookingSalesOpenDateStr(): string {
  const raw =
    process.env.NEXT_PUBLIC_BOOKING_SALES_OPEN_DATE?.trim() ||
    process.env.BOOKING_SALES_OPEN_DATE?.trim() ||
    ''
  const d = raw.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  return DEFAULT_SALES_OPEN_DATE
}

/** Takvimde seçilebilir ilk gün: bugün ile satış açılış tarihinin geç olanı. */
export function getEarliestBookableDateStr(): string {
  const today = todayStrLocal()
  const open = getBookingSalesOpenDateStr()
  return today > open ? today : open
}

export function isDateBeforeEarliestBookable(dateStr: string): boolean {
  const d = dateStr.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return true
  return d < getEarliestBookableDateStr()
}
