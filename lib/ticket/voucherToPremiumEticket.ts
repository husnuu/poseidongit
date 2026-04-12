import type { SiteLocale } from '@/lib/i18n/config'
import { formatParticipantCountsLine, voucherPdfUiStrings } from '@/lib/i18n/bookingFlowLocale'
import type { VoucherData } from '@/lib/voucher/types'
import type { PremiumEticketPayload } from './premiumEticket'

function boardingTimeBefore(time: string | undefined): string | null {
  if (!time?.trim()) return null
  const m = time.trim().match(/^(\d{1,2})\s*:\s*(\d{2})/)
  if (!m) return null
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

function resolvePaidAmountForPdf(data: VoucherData): number | null {
  if (typeof data.paidNow === 'number' && data.paidNow > 0) return data.paidNow
  const st = (data.status ?? '').toLowerCase()
  if (st !== 'paid' && st !== 'confirmed') return null
  if (data.totalPrice <= 0) return null
  if (typeof data.depositAmount === 'number' && data.depositAmount > 0) return data.depositAmount
  return data.totalPrice
}

function premiumPdfLocale(loc: SiteLocale): 'tr' | 'en' {
  if (loc === 'en' || loc === 'de') return 'en'
  return 'tr'
}

/** Rezervasyon kodu: UUID ise kısa görünüm, aksi halde olduğu gibi. */
function reservationCodeShort(ref: string): string {
  const t = ref.trim()
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t)) {
    return t.replace(/-/g, '').slice(0, 10).toUpperCase()
  }
  return t.length > 18 ? `${t.slice(0, 14)}…` : t
}

export function voucherDataToPremiumEticket(
  data: VoucherData,
  locale: SiteLocale
): PremiumEticketPayload {
  const L = premiumPdfLocale(locale)
  const s = voucherPdfUiStrings(locale)
  const depTime = data.time?.trim() || '—'
  const boardingTime = boardingTimeBefore(data.time) ?? depTime
  const returnTime = data.arrivalTime?.trim() || '—'

  const classDisplay = data.firstClassLoca?.trim()
    ? `${(data.className ?? '—').trim()} · ${s.locaPrefix} ${data.firstClassLoca.trim()}`
    : (data.className ?? '—').trim() || '—'

  const paid = resolvePaidAmountForPdf(data) ?? 0
  const total = Number(data.totalPrice) || 0
  const remaining = Math.max(0, total - paid)

  const supportPhone =
    process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || process.env.SUPPORT_PHONE?.trim()

  return {
    passengerName: data.customerName,
    guestCount: formatParticipantCountsLine(
      { adult: data.adults, child: data.children, infant: data.babies },
      locale
    ),
    ticketClass: classDisplay,
    boardingTime,
    departureTime: depTime,
    returnTime,
    qrPayload: data.bookingUrl,
    totalAmount: total,
    paidAmount: paid,
    remainingAmount: remaining,
    currency: /^[A-Za-z]{3}$/.test(data.currency ?? '') ? (data.currency as string).toUpperCase() : 'TRY',
    reservationCode: reservationCodeShort(data.referenceNumber),
    contactEmail: data.supportEmail,
    ...(supportPhone ? { contactPhone: supportPhone } : {}),
    contactWebsite: data.website,
    tourTitle: data.tourTitle !== '—' ? data.tourTitle : undefined,
    meetingPoint: data.meetingPickup !== '—' ? data.meetingPickup : undefined,
    brandName: process.env.NEXT_PUBLIC_SITE_NAME?.trim(),
    logoUrl: data.logoUrl,
    locale: L,
  }
}
