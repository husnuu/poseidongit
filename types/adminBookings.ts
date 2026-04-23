/** Admin panelinde kullanılan rezervasyon satırı (API'den gelen + tourCoverImageUrl). */
export type BookingStatus = 'pending' | 'paid' | 'failed' | 'cancelled'

export interface AdminBookingRow {
  id: string
  tourId: string
  tourTitle: string
  tourCoverImageUrl?: string | null
  date: string
  time?: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
    note?: string
  }
  additionalTravelers?: { firstName: string; lastName: string; mealPreference?: { key: string; label: string } }[]
  counts: { adult: number; child: number; infant: number }
  classId: string
  className: string
  /** First Class localar (L1–L10). Eski tek loca için firstClassLoca da olabilir. */
  firstClassLocas?: string[]
  firstClassLoca?: string
  totalPrice: number
  unitPrice?: number
  currency: string
  status: BookingStatus
  createdAt: string | null
  adminNote?: string | null
  meetingPoint?: string
  mealPreference?: { key: string; label: string; counts?: Array<{ key: string; label: string; count: number }> }
  source?: string
  manualSource?: string | null
  createdByAdmin?: boolean
  reference?: string | null
  /** Secure token for voucher/ticket links. Required for new bookings. */
  accessToken?: string | null
  paymentStatus?: string | null
  nestpayAuthCode?: string | null
  nestpayHostRefNum?: string | null
  nestpayTransId?: string | null
  paidAt?: string | null
  paymentLastError?: string | null
  paymentVerificationStatus?: string | null
}

export const MANUAL_SOURCE_LABELS: Record<string, string> = {
  web: 'Web',
  manual: 'Manuel',
  physical: 'Fiziksel satış',
  office: 'Ofis',
  phone: 'Telefon',
  whatsapp: 'WhatsApp',
  agency: 'Acente',
  other: 'Diğer',
}

export interface BookingsStats {
  totalBookings: number
  todayBookings: number
  totalRevenue: number
  todayOccupancy: number
  currency: string
  onlineBookings?: number
  manualBookings?: number
}

export interface TourOption {
  id: string
  title: string
  slug: string | null
}

export interface DayOccupancyData {
  date: string
  capacity: number
  booked: number
  remaining: number
  percent: number
  byClass?: Record<string, { capacity: number; booked: number; remaining: number }>
  /** First Class: o gün dolu loca numaraları (L1–L10). */
  firstClassLocasBooked?: string[]
}
