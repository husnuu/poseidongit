import { supabase } from '@/lib/supabase'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { buildVoucherDataFromBookingRow } from '@/lib/voucher/buildVoucherDataFromBookingSnapshot'
import { normalizeBookingFlowLocale } from '@/lib/i18n/bookingFlowLocale'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import { getEmailBaseUrl, manageBookingUrlForLocale, ticketPageUrlForLocale } from '@/lib/siteUrls'
import { timeMinutesBefore } from '@/lib/boardingTime'
import { normalizeWhatsAppPhone } from './phone'

/** Bir rezervasyonun WhatsApp mesajlarında kullanılan gerçek bilgileri. */
export type WaBookingContext = {
  bookingId: string
  status: string
  locale: SiteLocale
  phone: string | null
  optedOut: boolean
  firstName: string
  tourTitle: string
  /** "Cumartesi, 18 Ekim" gibi, rezervasyon diline göre. */
  dateLabel: string
  /** YYYY-MM-DD */
  date: string
  /** "10:50" — rezervasyon saati, yoksa turun kalkış saati. */
  time: string | null
  /** Kalkıştan 30 dk önce. */
  boardingTime: string | null
  meetingPoint: string
  mapLink: string
  reservationCode: string
  /** Kalkış anı (epoch ms, İstanbul saatine göre). */
  departureAt: number | null
  ticketUrl: string
  manageUrl: string
  /** WhatsApp'a başlık görseli olarak verilen bilet PNG'si. */
  ticketImageUrl: string
}

const DATE_TAG: Record<SiteLocale, string> = { tr: 'tr-TR', en: 'en-GB', de: 'de-DE', ru: 'ru-RU' }

function rowLocale(row: SupabaseBookingRow): SiteLocale {
  const raw = (row.ui_locale ?? '').toString().trim().toLowerCase()
  if (isSiteLocale(raw)) return raw
  const flow = normalizeBookingFlowLocale(row.ui_locale)
  return isSiteLocale(flow) ? flow : 'tr'
}

export function formatWaDate(dateStr: string, locale: SiteLocale): string {
  const d = /^\d{4}-\d{2}-\d{2}/.test(dateStr) ? dateStr.slice(0, 10) : ''
  if (!d) return dateStr || '—'
  const dt = new Date(`${d}T12:00:00Z`)
  if (Number.isNaN(dt.getTime())) return d
  // Gün adı ayrı alınıp başa konuyor: tr-TR'de Intl gün adını sona yazıyor ("17 Ekim Cumartesi").
  const tag = DATE_TAG[locale]
  const weekday = dt.toLocaleDateString(tag, { weekday: 'long', timeZone: 'UTC' })
  const dayMonth = dt.toLocaleDateString(tag, { day: 'numeric', month: 'long', timeZone: 'UTC' })
  return `${weekday.charAt(0).toLocaleUpperCase(tag)}${weekday.slice(1)}, ${dayMonth}`
}

/** YYYY-MM-DD + HH:mm (İstanbul, UTC+3 sabit) → epoch ms. */
export function istanbulDepartureEpoch(date: string, time: string | null | undefined): number | null {
  const dm = date.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const tm = (time ?? '').match(/^(\d{1,2})\s*:\s*(\d{2})/)
  if (!dm || !tm) return null
  return Date.UTC(+dm[1], +dm[2] - 1, +dm[3], +tm[1] - 3, +tm[2])
}

/** Dinamik URL butonu için son ek: şablondaki sabit tabandan (site adresi) sonrası. */
export function waUrlSuffix(fullUrl: string): string {
  const base = getEmailBaseUrl().replace(/\/$/, '')
  if (fullUrl.startsWith(base)) return fullUrl.slice(base.length).replace(/^\//, '')
  try {
    const u = new URL(fullUrl)
    return `${u.pathname}${u.search}`.replace(/^\//, '')
  } catch {
    return fullUrl
  }
}

function shortCode(id: string): string {
  return /^[0-9a-f-]{36}$/i.test(id) ? id.replace(/-/g, '').slice(0, 10).toUpperCase() : id.slice(0, 18)
}

export async function loadBookingRow(bookingId: string): Promise<SupabaseBookingRow | null> {
  const { data, error } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle()
  if (error) throw new Error(`booking fetch failed: ${error.message}`)
  return (data as SupabaseBookingRow | null) ?? null
}

/** Rezervasyon satırından mesaj bağlamı. Erişim anahtarı (access_token) yoksa null. */
export async function buildWaBookingContext(row: SupabaseBookingRow): Promise<WaBookingContext | null> {
  const bookingId = row.id
  const token = typeof row.access_token === 'string' ? row.access_token.trim() : ''
  if (!bookingId || !token) return null
  const locale = rowLocale(row)
  const voucher = await buildVoucherDataFromBookingRow(bookingId, row, token)
  const date = (row.date ?? '').toString().slice(0, 10)
  const time = (voucher?.time ?? row.time ?? '').toString().trim() || null
  const meetingPoint =
    (row.meeting_point && String(row.meeting_point).trim()) ||
    (voucher?.meetingPickup && voucher.meetingPickup !== '—' ? voucher.meetingPickup : '') ||
    'Çeşme'
  const mapLink =
    voucher?.mapLink?.trim() ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetingPoint)}`
  const base = getEmailBaseUrl().replace(/\/$/, '')
  const q = new URLSearchParams({ bookingId, token })
  return {
    bookingId,
    status: (row.status ?? '').toString(),
    locale,
    phone: normalizeWhatsAppPhone(row.customer_phone),
    optedOut: (row as { whatsapp_opt_in?: boolean | null }).whatsapp_opt_in === false,
    firstName: (row.customer_first_name ?? '').toString().trim() || '—',
    tourTitle: (row.tour_title ?? voucher?.tourTitle ?? '').toString().trim() || 'Poseidon',
    dateLabel: formatWaDate(date, locale),
    date,
    time,
    boardingTime: timeMinutesBefore(time ?? undefined, 30) ?? null,
    meetingPoint,
    mapLink,
    reservationCode: shortCode(voucher?.referenceNumber || bookingId),
    departureAt: istanbulDepartureEpoch(date, time),
    ticketUrl: ticketPageUrlForLocale(bookingId, token, locale),
    manageUrl: manageBookingUrlForLocale(bookingId, locale),
    ticketImageUrl: `${base}/api/ticket/image?${q.toString()}`,
  }
}
