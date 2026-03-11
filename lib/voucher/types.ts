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
  /** Toplanma / biniş noktası */
  meetingPickup: string
  /** Süre (örn. "7 Saat") */
  durationLabel?: string
  language: string
  /** Sınıf (Eco / Premium / First Class vb.) */
  className?: string
  /** Rezervasyon durumu: pending, paid, cancelled */
  status?: string

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
  /** Kapora tutarı (tur kaporalıysa ödenen tutar olarak gösterilir) */
  depositAmount?: number
  /** Dahil olanlar (tur içeriği) */
  included?: string[]
  /** Dahil olmayanlar (tur içeriği) */
  notIncluded?: string[]

  /** Policies (kısa metin) */
  cancellationPolicy: string
  voucherNotice: string

  /** Footer */
  supportEmail: string
  website: string
  copyrightYear: number

  /** Opsiyonel: site logosu (PDF üstünde gösterilir). Absolute URL. */
  logoUrl?: string
  /** Opsiyonel: tur kapak görseli (PDF mobil bilet üstünde gösterilir). Absolute URL. */
  tourImageUrl?: string
  /** Opsiyonel: tur galerisi (en fazla 3, PDF altında yan yana). Absolute URL[]. */
  tourGalleryUrls?: string[]
}

/** Varsayılan policy metinleri (Türkçe) */
export const DEFAULT_POLICIES = {
  cancellationPolicy:
    'Tura 24 saat kala ücretsiz iptal. Sonrasında ödenen tutar iade edilmez.',
  voucherNotice: 'Biniş sırasında bu bileti gösteriniz.',
}

/** Varsayılan iletişim (env ile override edilebilir) */
export const DEFAULT_CONTACT = {
  supportEmail: 'info@poseidonbooking.com',
  website: 'https://poseidonbooking.com',
}
