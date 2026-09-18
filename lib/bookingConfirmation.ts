/**
 * Rezervasyon onay sayfası — /payment/success ve /rezervasyon/onaylandi tarafından paylaşılan
 * tek veri kaynağı. Supabase booking satırını + Sanity tur meta verisini birleştirip
 * BookingConfirmationView'ün ihtiyaç duyduğu tüm alanları üretir.
 */
import { supabase } from '@/lib/supabase'
import { client } from '@/lib/sanity'
import { tourImageAndPickupQuery, siteSettingsWhatsappQuery } from '@/lib/queries'
import { normalizeMealPreferenceColumn, type SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { normalizeAdditionalTravelersFromStorage } from '@/lib/bookingAdditionalTravelers'
import { isYachtDepositBooking } from '@/lib/yachtDepositBooking'
import { buildGoogleCalendarUrl } from '@/lib/calendar'
import { withLocalePath } from '@/lib/i18n/paths'
import { getSiteBaseUrl } from '@/lib/siteUrls'
import { formatTicketDate } from '@/lib/voucher/formatTicketDate'
import { buildWhatsAppHref } from '@/lib/buildWhatsAppHref'
import type { SiteLocale } from '@/lib/i18n/config'

/** ui_locale sütunundan sadece desteklenen dilleri kabul eder; diğerleri (veya boş) TR'ye düşer. */
export function confirmationLocaleFromBooking(uiLocale: string | null | undefined): SiteLocale {
  if (uiLocale === 'en' || uiLocale === 'de') return uiLocale
  return 'tr'
}

export interface BookingConfirmationGuest {
  name: string
  mealLabel?: string
  isPrimary: boolean
}

export interface BookingConfirmationData {
  bookingId: string
  locale: SiteLocale
  isYachtDeposit: boolean
  status: string
  isPaid: boolean
  isPendingCash: boolean
  isFailed: boolean
  isCancelled: boolean
  reference: string
  tourTitle: string
  dateFormatted: string
  dateRaw: string
  time?: string
  boardingTime?: string
  arrivalTime?: string
  meetingPoint: string
  mapLink?: string
  className: string
  counts: { adult: number; child: number; infant: number }
  totalPax: number
  guests: BookingConfirmationGuest[]
  totalPrice: number
  paidAmount: number | null
  remainingAtDoor: number
  currency: string
  paidAt: string | null
  customerFirstName: string
  customerEmail: string
  accessToken: string
  qrUrl: string | null
  ticketPath: string | null
  pdfPath: string | null
  manageUrl: string
  homeUrl: string
  menuUrl: string
  canCancel: boolean
  cancelDeadlineLabel: string | null
  googleCalendarUrl: string | null
  icsUrl: string | null
  notIncluded: string[]
  whatsappHref: string | null
}

type TourMeta = {
  meetingPoint?: string | null
  quickFacts?: { meetingLocation?: string | null; startTime?: string | null; returnTime?: string | null } | null
  whereSection?: { meetingPointAddress?: string | null; locationMapLink?: string | null } | null
  deposit?: { enabled?: boolean; type?: string; value?: number } | null
  notIncluded?: string[] | null
}

/** Bilet sayfasındaki ile aynı kural: kalkıştan 30 dk önce biniş saati. */
function boardingTimeBefore(time: string | undefined): string | undefined {
  if (!time?.trim()) return undefined
  const m = time.trim().match(/^(\d{1,2})\s*:\s*(\d{2})/)
  if (!m) return undefined
  let h = parseInt(m[1], 10)
  let min = parseInt(m[2], 10)
  min -= 30
  if (min < 0) {
    min += 60
    h -= 1
  }
  if (h < 0) h += 24
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

function resolvePaidAmount(
  totalPrice: number,
  status: string,
  paidNowStored: number | undefined,
  tourMeta: TourMeta | null
): number | null {
  if (typeof paidNowStored === 'number' && paidNowStored > 0) return paidNowStored
  const st = status.toLowerCase()
  if (st !== 'paid' && st !== 'confirmed') return null
  if (totalPrice <= 0) return null
  const dep = tourMeta?.deposit
  if (dep?.enabled && dep.value != null) {
    return dep.type === 'percentage' ? Math.round((totalPrice * dep.value) / 100) : Math.round(dep.value)
  }
  return totalPrice
}

/** /api/booking/cancel ile birebir aynı kural: tur gününden bir önceki gün saat 11:00 (Europe/Istanbul). */
function resolveCancelInfo(dateStr: string): { canCancel: boolean; deadlineLabel: string | null } {
  if (!dateStr) return { canCancel: false, deadlineLabel: null }
  const cancelDeadline = new Date(new Date(`${dateStr}T00:00:00+03:00`).getTime() - 13 * 60 * 60 * 1000)
  const canCancel = Date.now() < cancelDeadline.getTime()
  const deadlineLabel = cancelDeadline.toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  })
  return { canCancel, deadlineLabel }
}

async function resolveWhatsappHref(reference: string): Promise<string | null> {
  let whatsapp: string | null | undefined
  try {
    const row = await client.fetch<{ whatsapp?: string | null } | null>(siteSettingsWhatsappQuery)
    whatsapp = row?.whatsapp ?? null
  } catch {
    whatsapp = null
  }
  const base = buildWhatsAppHref(whatsapp)
  if (!base) return null
  const text = `Merhaba, rezervasyonum hakkında bir sorum var. Rezervasyon no: ${reference}`
  return `${base}?text=${encodeURIComponent(text)}`
}

export async function getBookingConfirmationData(
  bookingId: string,
  localeOverride?: SiteLocale
): Promise<BookingConfirmationData | null> {
  const { data, error } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle()
  if (error || !data) return null

  const row = data as SupabaseBookingRow
  const locale = localeOverride ?? confirmationLocaleFromBooking(row.ui_locale ?? null)
  const isYachtDeposit = isYachtDepositBooking(row)
  const status = String(row.status ?? 'pending').toLowerCase()
  const isPaid = status === 'paid' || status === 'confirmed'
  const isFailed = status === 'failed'
  const isCancelled = status === 'cancelled'
  const totalPrice = Number(row.total_price ?? 0)
  const isPendingCash =
    !isPaid && !isFailed && !isCancelled && (row.paid_now == null || Number(row.paid_now) === 0) && totalPrice > 0

  const tourId = typeof row.tour_id === 'string' ? row.tour_id.trim() : ''
  let tourMeta: TourMeta | null = null
  if (!isYachtDeposit && tourId) {
    try {
      tourMeta = await client.fetch<TourMeta | null>(tourImageAndPickupQuery, { tourId })
    } catch {
      tourMeta = null
    }
  }

  const dateRaw = String(row.date ?? '')
  const time = row.time != null ? String(row.time).trim() || undefined : undefined
  const displayTime = time || tourMeta?.quickFacts?.startTime?.trim() || undefined
  const arrivalTime = tourMeta?.quickFacts?.returnTime?.trim() || undefined
  const meetingPoint =
    tourMeta?.meetingPoint?.trim() ||
    tourMeta?.whereSection?.meetingPointAddress?.trim() ||
    String(row.meeting_point ?? '').trim() ||
    '—'
  const mapLink = tourMeta?.whereSection?.locationMapLink?.trim() || undefined

  const counts = {
    adult: Number(row.adult_count ?? 0),
    child: Number(row.child_count ?? 0),
    infant: Number(row.infant_count ?? 0),
  }
  const totalPax = counts.adult + counts.child + counts.infant

  const customerFirstName = String(row.customer_first_name ?? '').trim()
  const customerName = [row.customer_first_name, row.customer_last_name].filter(Boolean).join(' ').trim() || '—'
  const mealPreference = normalizeMealPreferenceColumn(row.meal_preference)
  const additionalTravelers = normalizeAdditionalTravelersFromStorage(row.additional_travelers)

  const guests: BookingConfirmationGuest[] = [
    { name: customerName, mealLabel: mealPreference?.label, isPrimary: true },
    ...additionalTravelers.map((t) => ({
      name: [t.firstName, t.lastName].filter(Boolean).join(' ').trim() || '—',
      mealLabel: t.mealPreference?.label,
      isPrimary: false,
    })),
  ]

  const paidNowRaw = row.paid_now
  const paidNowStored =
    typeof paidNowRaw === 'number' && Number.isFinite(paidNowRaw) && paidNowRaw > 0 ? paidNowRaw : undefined
  const paidAmount = isPendingCash ? null : resolvePaidAmount(totalPrice, status, paidNowStored, tourMeta)
  const remainingAtDoor = isPendingCash
    ? totalPrice
    : Math.max(0, totalPrice - Number(row.paid_now ?? 0))

  const accessToken = typeof row.access_token === 'string' ? row.access_token.trim() : ''
  const currency = String(row.currency ?? 'TRY')
  const reference = (typeof row.reference === 'string' && row.reference.trim()) || row.id.slice(0, 8).toUpperCase()

  const ticketPath = accessToken
    ? withLocalePath(locale, `/bilet/${encodeURIComponent(row.id)}?token=${encodeURIComponent(accessToken)}`)
    : null
  const pdfPath = accessToken
    ? `/api/voucher/access?bookingId=${encodeURIComponent(row.id)}&token=${encodeURIComponent(accessToken)}&download=1`
    : null
  const qrUrl = accessToken
    ? `/api/qr?bookingId=${encodeURIComponent(row.id)}&token=${encodeURIComponent(accessToken)}`
    : null
  const icsUrl = accessToken
    ? `/api/booking/ics?bookingId=${encodeURIComponent(row.id)}&token=${encodeURIComponent(accessToken)}`
    : null

  const base = getSiteBaseUrl().replace(/\/$/, '')
  const manageUrl = withLocalePath(locale, `/rezervasyon/yonet?bookingId=${encodeURIComponent(row.id)}`)
  const homeUrl = withLocalePath(locale, '/')
  const menuUrl = withLocalePath(locale, '/menu')

  const { canCancel: canCancelByDate, deadlineLabel } = resolveCancelInfo(dateRaw)
  const canCancel = canCancelByDate && !isYachtDeposit && !isCancelled && !isFailed

  const googleCalendarUrl =
    !isCancelled && !isFailed && dateRaw
      ? buildGoogleCalendarUrl({
          tourTitle: row.tour_title ?? '',
          date: dateRaw,
          time: displayTime,
          durationHours: 2,
          pickup: meetingPoint !== '—' ? meetingPoint : undefined,
          referenceNumber: reference,
          bookingUrl: `${base}${manageUrl}`,
        })
      : null

  return {
    bookingId: row.id,
    locale,
    isYachtDeposit,
    status,
    isPaid,
    isPendingCash,
    isFailed,
    isCancelled,
    reference,
    tourTitle: String(row.tour_title ?? '—'),
    dateFormatted: formatTicketDate(dateRaw, locale),
    dateRaw,
    time: displayTime,
    boardingTime: boardingTimeBefore(displayTime),
    arrivalTime,
    meetingPoint,
    mapLink,
    className: String(row.class_name ?? ''),
    counts,
    totalPax,
    guests,
    totalPrice,
    paidAmount,
    remainingAtDoor,
    currency,
    paidAt: row.paid_at ? String(row.paid_at) : null,
    customerFirstName,
    customerEmail: String(row.customer_email ?? '').trim(),
    accessToken,
    qrUrl,
    ticketPath,
    pdfPath,
    manageUrl,
    homeUrl,
    menuUrl,
    canCancel,
    cancelDeadlineLabel: canCancel ? deadlineLabel : null,
    googleCalendarUrl,
    icsUrl,
    notIncluded: Array.isArray(tourMeta?.notIncluded) ? tourMeta!.notIncluded!.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : [],
    whatsappHref: await resolveWhatsappHref(reference),
  }
}
