import { getEmailBaseUrl } from '@/lib/siteUrls'
import type { SiteLocale } from '@/lib/i18n/config'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { VOUCHER_POLICIES } from '@/lib/i18n/bookingFlowLocale'
import type { VoucherData } from './types'
import { DEFAULT_POLICIES, DEFAULT_CONTACT } from './types'
import { formatTicketDate } from './formatTicketDate'

type BookingDoc = {
  id: string
  tourTitle?: string
  date?: string
  time?: string
  /** paidNow — bilet/PDF “Ödenen tutar” */
  paidNow?: number
  counts?: { adult?: number; child?: number; infant?: number }
  classId?: string
  className?: string
  firstClassLocas?: string[]
  firstClassLoca?: string
  totalPrice?: number
  currency?: string
  status?: string
  meetingPoint?: string
  customer?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
  }
}

/**
 * Booking doc + bookingUrl ile VoucherData üretir.
 */
export function bookingToVoucherData(
  booking: BookingDoc,
  bookingUrl: string,
  locale: SiteLocale = DEFAULT_LOCALE
): VoucherData {
  const customer = booking.customer ?? {}
  const counts = booking.counts ?? { adult: 0, child: 0, infant: 0 }
  const siteUrl = getEmailBaseUrl()
  const baseUrl = siteUrl || bookingUrl.replace(/\/[^/]*$/, '')
  const pol = VOUCHER_POLICIES[locale] ?? VOUCHER_POLICIES.tr

  const rawDate = typeof booking.date === 'string' ? booking.date : ''
  return {
    referenceNumber: booking.id,
    bookingUrl,

    tourTitle: booking.tourTitle ?? '—',
    date: rawDate ? formatTicketDate(rawDate, locale) : '—',
    time: booking.time,
    meetingPickup: (booking as { meetingPoint?: string }).meetingPoint?.trim() || '—',
    language: pol.languageLabel,
    className: booking.className?.trim() || undefined,
    firstClassLoca: (booking.firstClassLocas?.length ? booking.firstClassLocas.join(', ') : booking.firstClassLoca?.trim()) || undefined,
    status: booking.status,

    customerName: [customer.firstName, customer.lastName].filter(Boolean).join(' ') || '—',
    customerEmail: customer.email ?? '—',
    customerPhone: customer.phone ?? '—',

    adults: counts.adult ?? 0,
    children: counts.child ?? 0,
    babies: counts.infant ?? 0,

    totalPrice: booking.totalPrice ?? 0,
    currency: booking.currency ?? 'TRY',
    paidNow:
      typeof booking.paidNow === 'number' && booking.paidNow > 0
        ? booking.paidNow
        : booking.status === 'paid'
          ? (booking.totalPrice ?? 0)
          : undefined,
    remainingAmount: undefined,

    cancellationPolicy: pol.cancellationPolicy,
    voucherNotice: pol.voucherNotice,

    supportEmail: process.env.SUPPORT_EMAIL ?? DEFAULT_CONTACT.supportEmail,
    website: getEmailBaseUrl() || DEFAULT_CONTACT.website,
    copyrightYear: new Date().getFullYear(),
  }
}

/** Mock voucher data (test / 404 fallback için kullanılmaz; sadece örnek). */
export function getMockVoucherData(referenceNumber: string): VoucherData {
  const siteUrl = getEmailBaseUrl()
  return {
    referenceNumber,
    bookingUrl: `${siteUrl}/rezervasyon`,

    tourTitle: 'Sunset Cruise – Çeşme',
    date: '15 June 2026',
    time: '18:00',
    meetingPickup: 'Çeşme Marina, Pier A',
    language: 'Turkish',

    customerName: 'Jane Doe',
    customerEmail: 'jane@example.com',
    customerPhone: '+90 532 123 4567',

    adults: 2,
    children: 1,
    babies: 0,

    totalPrice: 1500,
    currency: 'TRY',
    paidNow: 500,
    remainingAmount: 1000,

    cancellationPolicy: DEFAULT_POLICIES.cancellationPolicy,
    voucherNotice: DEFAULT_POLICIES.voucherNotice,

    supportEmail: DEFAULT_CONTACT.supportEmail,
    website: DEFAULT_CONTACT.website,
    copyrightYear: new Date().getFullYear(),
  }
}
