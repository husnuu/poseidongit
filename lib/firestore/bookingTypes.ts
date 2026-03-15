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

/** Firestore'dan okunduğunda createdAt bir Timestamp; API response'da ISO string veya Date olabilir */
export interface Booking {
  id: string
  createdAt: Date | { toDate(): Date } | string
  status: BookingStatus
  tourId: string
  tourTitle: string
  date: string
  time?: string
  meetingPoint?: string
  counts: BookingCounts
  classId: string
  className: string
  unitPrice: number
  totalPrice: number
  currency: string
  customer: BookingCustomer
  source: string
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
  tourId: string
  tourTitle: string
  date: string
  time?: string
  meetingPoint?: string
  counts: { adult: number; child: number; infant: number }
  classId: string
  className: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
    note?: string
  }
}
