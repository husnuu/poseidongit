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
}

export interface SeasonRule {
  name: string
  start: string // YYYY-MM-DD
  end: string
  multiplier: number
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

export interface SpecificDate {
  date: string
  enabled?: boolean
  defaultAvailable?: boolean
  available?: boolean
  priceOverrides?: {
    adultPrice?: number
    childPrice?: number
    infantPrice?: number
  }
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

export interface TourForBooking {
  _id?: string
  title: string
  slug: string
  mainImage?: TourImageForBooking
  ticketClasses?: TicketClassForBooking[]
  seasonRules?: SeasonRule[]
  deposit?: DepositConfig
  quickFacts?: { maxCapacity?: number }
  bookingRules?: BookingRules
  baseCapacity?: BaseCapacity
  availabilityOverrides?: AvailabilityOverride[]
  availability?: AvailabilityConfig
}

/** Firestore bookings: tourId = Sanity _id (UUID), date "YYYY-MM-DD", classId "eco"|"premium"|"first", counts { adult, child, infant }, status "pending"|"paid". */
export function getTourIdForFirebase(tour: TourForBooking | null | undefined): string | undefined {
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
}

export interface BookingWizardState {
  tourSlug: string
  counts: { adult: number; child: number; baby: number }
  selectedDate: string | null
  selectedClassKey: string | null
  customer: {
    firstName: string
    lastName: string
    email: string
    phoneCountryCode: string
    phone: string
    note?: string
  }
  pricingSummary: PricingSummary | null
  step: 1 | 2 | 3 | 4
}

export const DEFAULT_BOOKING_STATE: Omit<BookingWizardState, 'tourSlug'> = {
  counts: { adult: 1, child: 0, baby: 0 },
  selectedDate: null,
  selectedClassKey: null,
  customer: { firstName: '', lastName: '', email: '', phoneCountryCode: '90', phone: '', note: '' },
  pricingSummary: null,
  step: 1,
}

export const MAX_PAX_FALLBACK = 90
