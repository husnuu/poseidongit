/**
 * Voucher PDF için kullanılan veri yapısı.
 * Booking objesinden veya mock'tan doldurulur.
 */
export interface VoucherData {
  referenceNumber: string
  bookingUrl: string

  /** Tour bölümü */
  tourTitle: string
  date: string
  time?: string
  meetingPickup: string
  language: string

  /** Customer bölümü */
  customerName: string
  customerEmail: string
  customerPhone: string

  /** Participants */
  adults: number
  children: number
  babies: number

  /** Payment summary */
  totalPrice: number
  currency: string
  paidNow?: number
  remainingAmount?: number

  /** Policies (kısa metin) */
  cancellationPolicy: string
  voucherNotice: string

  /** Footer */
  supportEmail: string
  website: string
  copyrightYear: number
}

/** Varsayılan policy metinleri */
export const DEFAULT_POLICIES = {
  cancellationPolicy:
    'Free cancellation up to 24 hours before the tour. After that, the amount paid is non-refundable.',
  voucherNotice: 'Show this voucher to the staff.',
}

/** Varsayılan iletişim (env ile override edilebilir) */
export const DEFAULT_CONTACT = {
  supportEmail: 'info@poseidonbooking.com',
  website: 'https://poseidonbooking.com',
}
