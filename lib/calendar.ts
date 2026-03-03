/**
 * Google Calendar "Add event" URL builder.
 * Timezone-safe: bookingTimeZone kullanır, yoksa Europe/Istanbul. Çıktı her zaman UTC (Z).
 */

const DEFAULT_TIME_ZONE = 'Europe/Istanbul'
const GOOGLE_CALENDAR_BASE = 'https://calendar.google.com/calendar/render'

export interface GoogleCalendarBooking {
  tourTitle: string
  /** ISO date YYYY-MM-DD veya date-only string */
  date: string
  /** Opsiyonel: HH:mm veya HH:mm:ss (booking timezone'da) */
  time?: string
  /** Etkinlik süresi (saat). time verilmezse 00:00 kabul edilir; end = start + durationHours */
  durationHours?: number
  /** Toplanma / meeting point */
  pickup?: string
  referenceNumber: string
  bookingUrl: string
  /** IANA timezone (örn. Europe/Istanbul). Yoksa Europe/Istanbul. */
  timeZone?: string
}

/**
 * Verilen timezone'da bir tarih/saat anını UTC Date'e çevirir.
 * Örnek: date=2026-06-15, time=18:00, timeZone=Europe/Istanbul -> 2026-06-15T15:00:00Z
 */
function localToUtc(
  dateStr: string,
  timeStr: string,
  timeZone: string
): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh = 0, mm = 0] = timeStr.split(':').map(Number)
  // Öğlen UTC'de o gün için timezone offset'ini al (DST için doğru olsun)
  const noonUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  const offsetMinutes = getTimezoneOffsetMinutes(noonUtc, timeZone)
  const localMs = Date.UTC(y, m - 1, d, hh, mm, 0)
  const utcMs = localMs - offsetMinutes * 60 * 1000
  return new Date(utcMs)
}

/**
 * Timezone'ın o an için UTC'ye göre offset'ini dakika cinsinden döner (+03:00 -> 180).
 */
function getTimezoneOffsetMinutes(date: Date, timeZone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone,
      timeZoneName: 'longOffset',
    })
    const parts = formatter.formatToParts(date)
    const tzPart = parts.find((p) => p.type === 'timeZoneName')
    const value = tzPart?.value ?? ''
    const match = value.match(/GMT([+-])(\d{1,2}):?(\d{2})?/)
    if (match) {
      const sign = match[1] === '+' ? 1 : -1
      const hours = parseInt(match[2], 10)
      const minutes = match[3] ? parseInt(match[3], 10) : 0
      return sign * (hours * 60 + minutes)
    }
  } catch {
    // fallback
  }
  if (timeZone === 'Europe/Istanbul' || timeZone.includes('Istanbul')) return 180
  return 0
}

/**
 * UTC Date'i Google Calendar dates parametresi formatına çevirir: YYYYMMDDTHHmmssZ
 */
function formatGoogleCalendarUtc(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const h = String(d.getUTCHours()).padStart(2, '0')
  const min = String(d.getUTCMinutes()).padStart(2, '0')
  const s = String(d.getUTCSeconds()).padStart(2, '0')
  return `${y}${m}${day}T${h}${min}${s}Z`
}

/**
 * Rezervasyon bilgisiyle "Add to Google Calendar" linki üretir.
 * Tarihler booking timezone'a göre yorumlanır, linke UTC (Z) basılır.
 */
export function buildGoogleCalendarUrl(booking: GoogleCalendarBooking): string {
  const timeZone = booking.timeZone?.trim() || DEFAULT_TIME_ZONE
  const dateStr = booking.date.trim()
  const timeStr = (booking.time ?? '00:00').trim().slice(0, 8)
  const durationHours = Math.max(0, booking.durationHours ?? 2)

  const startUtc = localToUtc(dateStr, timeStr, timeZone)
  const endUtc = new Date(startUtc.getTime() + durationHours * 60 * 60 * 1000)

  const datesParam = `${formatGoogleCalendarUtc(startUtc)}/${formatGoogleCalendarUtc(endUtc)}`
  const text = booking.tourTitle
  const details = [
    `Rezervasyon no: ${booking.referenceNumber}`,
    booking.bookingUrl ? `Detaylar: ${booking.bookingUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
  const location = booking.pickup?.trim() || ''

  const query = [
    `action=${encodeURIComponent('TEMPLATE')}`,
    `text=${encodeURIComponent(text)}`,
    `dates=${encodeURIComponent(datesParam)}`,
    `details=${encodeURIComponent(details)}`,
    ...(location ? [`location=${encodeURIComponent(location)}`] : []),
  ].join('&')

  return `${GOOGLE_CALENDAR_BASE}?${query}`
}

// --- Örnekler ve test senaryoları ---
// dateStart/dateEnd UTC formatı: YYYYMMDDTHHmmssZ/YYYYMMDDTHHmmssZ
//
// Örnek 1: Europe/Istanbul 2026-06-15 18:00, 2 saat
//   date: '2026-06-15', time: '18:00', durationHours: 2, timeZone: 'Europe/Istanbul'
//   Beklenen: start 2026-06-15T15:00:00Z, end 2026-06-15T17:00:00Z (Istanbul UTC+3)
//
// Örnek 2: time yok, varsayılan 00:00
//   date: '2026-07-01', durationHours: 3
//   Beklenen: start 2026-06-30T21:00:00Z, end 2026-07-01T00:00:00Z (Istanbul 01 Temmuz 00:00 = 30 Haziran 21:00 UTC)
//
// Örnek 3: timeZone yok -> Europe/Istanbul
//   date: '2026-08-10', time: '09:30', durationHours: 1
//   Beklenen: start 2026-08-10T06:30:00Z, end 2026-08-10T07:30:00Z
