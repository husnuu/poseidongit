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
  /** Sanity quickFacts.returnTime — “Tahmini varış” satırı */
  arrivalTime?: string
  language: string
  /** Sınıf (Eco / Premium / First Class vb.) */
  className?: string
  /** First Class loca (L1–L10). */
  firstClassLoca?: string
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
  /** Toplanma noktası harita linki (Sanity whereSection.locationMapLink) */
  mapLink?: string
  /** Toplanma noktası statik harita görseli (Sanity whereSection.mapEmbedUrl'den türetilir) */
  mapImageUrl?: string
  /** Yemek tercihi dağılımı (örn. Balık × 2, Tavuk × 1) */
  mealCounts?: { label: string; count: number }[]

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

/** Varsayılan iletişim (env ile override edilebilir) — gerçek işletme bilgileri,
 *  lib/email.ts'deki e-posta şablonlarıyla aynı (bkz. SUPPORT_EMAIL/SUPPORT_PHONE
 *  oradaki varsayılanlar). Önceden "poseidonbooking.com" gibi uydurma bir
 *  placeholder domain kullanılıyordu — site/env değişkeni eksikse müşteri
 *  biletinde YANLIŞ iletişim bilgisi görünüyordu. */
export const DEFAULT_CONTACT = {
  supportEmail: 'turkeycesme@hotmail.com',
  website: 'https://cesmetekneturu.net',
}
