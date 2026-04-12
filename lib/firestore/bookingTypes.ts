import type { SiteLocale } from '@/lib/i18n/config'

export type BookingStatus = 'pending' | 'paid' | 'cancelled'

export interface BookingCounts {
  adult: number
  child: number
  infant: number
}

export interface BookingCustomer {
  firstName: string
  lastName: string
  email: string
  phone: string
  note?: string
}

/** API response'da createdAt ISO string veya Date olabilir */
export interface Booking {
  id: string
  createdAt: Date | string
  status: BookingStatus
  tourId: string
  tourTitle: string
  date: string
  time?: string
  meetingPoint?: string
  counts: BookingCounts
  classId: string
  className: string
  /** First Class için seçilen localar (L1–L10). Eski kayıtlar için tekil alan da olabilir. */
  firstClassLocas?: string[]
  firstClassLoca?: string
  unitPrice: number
  totalPrice: number
  currency: string
  customer: BookingCustomer
  /** Ana iletişim kişisi dışındaki yetişkin/çocuk ad-soyadı; bebekler counts.infant ile (web rezervasyonu). */
  additionalTravelers?: { firstName: string; lastName: string; mealPreference?: { key: string; label: string } }[]
  /** Tur mealMenu aktifken seçilen menü (Sunucu Sanity ile doğrular). */
  mealPreference?: { key: string; label: string }
  source: string
  /** Secure token for voucher/ticket access. Required for new bookings; legacy docs may lack it. */
  accessToken?: string
}

export interface BookingInput {
  tourId: string
  tourTitle: string
  date: string
  time?: string
  counts: BookingCounts
  classId: string
  className: string
  customer: BookingCustomer
}

export interface BookingCreatePayload {
  /** Rezervasyon sırasında sitede seçilen dil (e-posta / PDF / bilet URL). */
  uiLocale?: SiteLocale
  tourId: string
  tourTitle: string
  date: string
  time?: string
  meetingPoint?: string
  counts: { adult: number; child: number; infant: number }
  classId: string
  className: string
  /** First Class için seçilen localar (L1–L10). */
  firstClassLocas?: string[]
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
    note?: string
  }
  additionalTravelers?: Array<{
    firstName: string
    lastName: string
    mealPreferenceKey?: string
    mealPreference?: { key: string; label: string }
  }>
  mealPreference?: { key: string; label: string }
}
