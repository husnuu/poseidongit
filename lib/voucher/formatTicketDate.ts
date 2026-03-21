/** Bilet / PDF için tarih (bilet sayfası ile aynı). */
export function formatTicketDate(dateStr: string): string {
  const s = (dateStr ?? '').trim()
  if (!s) return '—'
  try {
    const raw = /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return s
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return s
  }
}
