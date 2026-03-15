/** Admin panelinde kullanılan rezervasyon satırı (API'den gelen + tourCoverImageUrl). */
export type BookingStatus = 'pending' | 'paid' | 'cancelled'

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
  counts: { adult: number; child: number; infant: number }
  classId: string
  className: string
  totalPrice: number
  unitPrice?: number
  currency: string
  status: BookingStatus
  createdAt: string | null
  adminNote?: string | null
  meetingPoint?: string
  source?: string
  manualSource?: string | null
  createdByAdmin?: boolean
  reference?: string | null
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
}
