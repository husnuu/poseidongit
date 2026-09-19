/**
 * Sunucu (Vercel) UTC'de çalışır; Türkiye 2016'dan beri DST uygulamıyor ve
 * her zaman UTC+3'te sabit. Bu yüzden "bugün" ve "şu an saat kaç" gibi
 * operasyonel kararlar (gün sonu, sabah kapanışı vb.) bu yardımcılardan
 * hesaplanmalı — sunucunun yerel saatine (`new Date()` UTC saatleri) güvenmek
 * yanlış "bugün" değeri üretebilir.
 */

const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** UTC+3'e kaydırılmış Date — alan değerlerini (getUTCFullYear vb.) İstanbul saatiymiş gibi okuyun. */
export function istanbulNow(): Date {
  return new Date(Date.now() + ISTANBUL_OFFSET_MS)
}

export function todayStrIstanbul(): string {
  const d = istanbulNow()
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

export function tomorrowStrIstanbul(): string {
  const d = istanbulNow()
  d.setUTCDate(d.getUTCDate() + 1)
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

/** İstanbul saatiyle şu anki saat:dakika (0-23 / 0-59). */
export function istanbulHourMinute(): { hour: number; minute: number } {
  const d = istanbulNow()
  return { hour: d.getUTCHours(), minute: d.getUTCMinutes() }
}

/**
 * Verilen tarih (YYYY-MM-DD) İstanbul takvimine göre "bugün" ise ve saat
 * belirtilen kapanış saatini geçtiyse true döner. Geçmiş/gelecek tarihler
 * için her zaman false (kapanış kuralı yalnızca bugünü etkiler).
 */
export function isTodayPastCutoffIstanbul(dateStr: string, cutoffHour: number, cutoffMinute = 0): boolean {
  const dateNorm = (dateStr || '').slice(0, 10)
  if (dateNorm !== todayStrIstanbul()) return false
  const { hour, minute } = istanbulHourMinute()
  return hour > cutoffHour || (hour === cutoffHour && minute >= cutoffMinute)
}
