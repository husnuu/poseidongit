/**
 * Types for the booking wizard. Aligned with Sanity tour schema
 * (ticketClasses, seasonRules, deposit, bookingRules, availability, baseCapacity, availabilityOverrides).
 */

export interface PriceByAge {
  ageKey: string
  ageLabel: string
  minAge?: number
  maxAge?: number
  price: number
}

/** Bir bilet sınıfı için tarih aralığı başına özel yaş fiyatları (Sanity `dateRangePrices`). */
export interface ClassDateRangePrice {
  label?: string
  start: string
  end: string
  pricesByAge?: PriceByAge[]
}

export interface TicketClassForBooking {
  key: string
  label: string
  description?: string
  badge?: string
  classImage?: {
    asset?: { _ref?: string; _type?: string }
    url?: string
    metadata?: { lqip?: string; dimensions?: { width: number; height: number } }
  }
  bullets?: string[]
  pricesByAge?: PriceByAge[]
  /** Tarih aralığına göre sınıf fiyatı; çakışmada listenin ilk eşleşen aralığı geçerli. */
  dateRangePrices?: ClassDateRangePrice[]
}

/** Sezon kuralında bir sınıf için yaş bazlı ₺ farkı (taban fiyata eklenir). */
export interface SeasonClassAdjustment {
  classKey: string
  adultAdjustment?: number | null
  childAdjustment?: number | null
  infantAdjustment?: number | null
}

export interface SeasonRule {
  name: string
  start: string // YYYY-MM-DD
  end: string
  /** @deprecated Sınıf satırı yoksa geriye dönük çarpan; yeni kayıtlarda classAdjustments kullanın. */
  multiplier?: number | null
  classAdjustments?: SeasonClassAdjustment[] | null
}

export interface DepositConfig {
  enabled: boolean
  type?: 'percentage' | 'fixed'
  value?: number
}

export interface BookingRules {
  show?: boolean
  title?: string
  bullets?: string[]
}

export interface BaseCapacity {
  ecoCapacity?: number
  premiumCapacity?: number
  firstCapacity?: number
}

export interface AvailabilityOverride {
  date: string
  eco: number
  premium: number
  first: number
  note?: string
}

export interface DateRange {
  start: string
  end: string
  available: boolean
}

export interface ClassAvailabilityItem {
  classKey: string
  status: 'open' | 'full' | 'closed'
}

/** Özel günde tek bir sınıf (eco / premium / first) için yaş bazlı fiyatlar. */
export interface ClassPriceOverride {
  classKey: string
  adultPrice?: number
  childPrice?: number
  infantPrice?: number
}

export interface SpecificDate {
  date: string
  enabled?: boolean
  defaultAvailable?: boolean
  available?: boolean
  /** Tüm sınıflar için varsayılan özel fiyat; sınıf satırında o yaş boşsa kullanılır. */
  priceOverrides?: {
    adultPrice?: number
    childPrice?: number
    infantPrice?: number
  }
  /** Sınıf bazlı özel fiyat; dolu alan priceOverrides ve normal fiyatın önüne geçer. */
  classPriceOverrides?: ClassPriceOverride[]
  classAvailability?: ClassAvailabilityItem[]
}

export interface AvailabilityConfig {
  enabled?: boolean
  defaultAvailable?: boolean
  dateRanges?: DateRange[]
  specificDates?: SpecificDate[]
}

export interface TourImageForBooking {
  asset?: { _ref?: string; _type?: string }
  url?: string
}

export interface PickupPoint {
  name?: string
  address?: string
  description?: string
  isDefault?: boolean
}

export interface MealMenuOption {
  key?: string
  label?: string
  description?: string
}

export interface MealMenuForBooking {
  enabled?: boolean
  sectionTitle?: string
  description?: string
  options?: MealMenuOption[]
}

export interface ExtraImageForBooking {
  asset?: { _ref?: string; _type?: string }
  url?: string
  alt?: string
  metadata?: { lqip?: string; dimensions?: { width: number; height: number } }
}

export interface ExtraForBooking {
  _key?: string
  key?: string
  title: string
  description?: string
  price: number
  priceType?: 'perPerson' | 'total'
  icon?: string
  extraKind?: 'standard' | 'hotelTransfer'
  offerInBooking?: boolean
  image?: ExtraImageForBooking
  hotelNameLabel?: string
  hotelNamePlaceholder?: string
  hotelNameHelp?: string
  requireHotelName?: boolean
  transferFromHotelLabel?: string
  transferFromHotelDescription?: string
  requireTransferFromHotel?: boolean
}

export interface SelectedBookingExtraState {
  key: string
  hotelName?: string
  transferFromHotel?: boolean
}

export interface TourForBooking {
  _id?: string
  title: string
  slug: string
  mainImage?: TourImageForBooking
  ticketClasses?: TicketClassForBooking[]
  seasonRules?: SeasonRule[]
  deposit?: DepositConfig
  /** Sanity: nakit / kapıda ödeme — online NestPay atlanır. */
  cashPaymentEnabled?: boolean
  quickFacts?: { maxCapacity?: number }
  bookingRules?: BookingRules
  baseCapacity?: BaseCapacity
  availabilityOverrides?: AvailabilityOverride[]
  availability?: AvailabilityConfig
  pickupPoints?: PickupPoint[]
  mealMenu?: MealMenuForBooking
  extras?: ExtraForBooking[]
}

/** Supabase bookings: tourId = Sanity _id (UUID), date "YYYY-MM-DD", classId "eco"|"premium"|"first", counts { adult, child, infant }, status "pending"|"paid". */
export function getTourIdForBooking(tour: TourForBooking | null | undefined): string | undefined {
  if (!tour) return undefined
  const id = tour._id ?? tour.slug
  return id && String(id).trim() ? String(id).trim() : undefined
}


export interface CalendarDay {
  date: string // YYYY-MM-DD
  minPrice: number | null
  isAvailable: boolean
  capacityByClass?: Record<string, number>
}

export interface PricingUnit {
  ageKey: string
  ageLabel: string
  unitPrice: number
  count: number
  subtotal: number
}

export interface PricingSummary {
  unitPrices: PricingUnit[]
  total: number
  depositPercent: number
  depositAmount: number
  remainingAmount: number
  currency?: string
  cashPaymentEnabled?: boolean
  /** Bilet tutarı (ekstralar hariç). */
  ticketsTotal?: number
  extrasTotal?: number
}

export interface BookingWizardState {
  tourSlug: string
  counts: { adult: number; child: number; baby: number }
  selectedDate: string | null
  selectedClassKey: string | null
  /** First Class seçildiğinde seçilen localar (L1–L10). Her loca 2 kişilik; N kişi → N/2 loca. */
  firstClassLocas?: string[] | null
  /** Seçilen toplanma / alım noktası (Sanity pickupPoints varsa müşteri seçer). */
  meetingPoint?: string
  /** Tur mealMenu aktifken seçilen seçenek anahtarı (Sunucu etiketi Sanity’den doğrular). */
  mealPreferenceKey?: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phoneCountryCode: string
    phone: string
    note?: string
    /** Ana yolcu cinsiyeti (bay/bayan). */
    gender?: 'male' | 'female' | ''
  }
  /** Ana rezervasyon sahibi dışındaki yolcular (sıra: kalan yetişkinler, çocuklar; bebekler counts.baby ile). */
  additionalTravelers: {
    firstName: string
    lastName: string
    mealPreferenceKey?: string
    gender?: 'male' | 'female' | ''
  }[]
  /** Bebekler için cinsiyet (counts.baby uzunluğunda). */
  infantGenders?: ('male' | 'female' | '')[]
  /** Sınıf seçiminden sonra popup’ta işaretlenen ekstralar. */
  selectedExtras?: SelectedBookingExtraState[]
  pricingSummary: PricingSummary | null
  step: 1 | 2 | 3 | 4
}

export const DEFAULT_BOOKING_STATE: Omit<BookingWizardState, 'tourSlug'> = {
  counts: { adult: 1, child: 0, baby: 0 },
  selectedDate: null,
  selectedClassKey: null,
  firstClassLocas: [],
  customer: { firstName: '', lastName: '', email: '', phoneCountryCode: '90', phone: '', note: '', gender: '' },
  additionalTravelers: [],
  infantGenders: [],
  selectedExtras: [],
  pricingSummary: null,
  step: 1,
}

export const MAX_PAX_FALLBACK = 90
