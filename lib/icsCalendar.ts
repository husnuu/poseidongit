/**
 * Basit .ics (iCalendar) üretici — Apple Calendar / Outlook "Takvime Ekle" için.
 * Harici paket gerekmez; format düz metindir (RFC 5545'in gerekli alt kümesi).
 */
import { computeEventUtcRange } from '@/lib/calendar'

export interface IcsEventInput {
  uid: string
  title: string
  date: string
  time?: string
  durationHours?: number
  location?: string
  description?: string
  timeZone?: string
}

function formatIcsUtc(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const h = String(d.getUTCHours()).padStart(2, '0')
  const min = String(d.getUTCMinutes()).padStart(2, '0')
  const s = String(d.getUTCSeconds()).padStart(2, '0')
  return `${y}${m}${day}T${h}${min}${s}Z`
}

/** RFC 5545: satırlar CRLF ile biter, satır uzunluğu 75 oktet aşarsa katlanır, ayraç karakterleri kaçırılır. */
function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function foldLine(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = []
  let rest = line
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75))
    rest = ' ' + rest.slice(75)
  }
  parts.push(rest)
  return parts.join('\r\n')
}

export function buildIcsFile(event: IcsEventInput): string {
  const durationHours = Math.max(0, event.durationHours ?? 2)
  const { startUtc, endUtc } = computeEventUtcRange(event.date, event.time, durationHours, event.timeZone)
  const nowStamp = formatIcsUtc(new Date())

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Poseidon//Booking Confirmation//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART:${formatIcsUtc(startUtc)}`,
    `DTEND:${formatIcsUtc(endUtc)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    ...(event.location ? [`LOCATION:${escapeIcsText(event.location)}`] : []),
    ...(event.description ? [`DESCRIPTION:${escapeIcsText(event.description)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.map(foldLine).join('\r\n') + '\r\n'
}
