import { client } from '@/lib/sanity'
import type { SiteLocale } from '@/lib/i18n/config'
import { mergeTourForLocale } from '@/lib/i18n/mergeTourForLocale'
import type { TourForBooking, CalendarDay, PricingSummary } from './bookingTypes'
import { buildCalendarDaysForMonth, computePricingForSelection } from './bookingPricing'

/** Rezervasyon sihirbazı + fiyat hesabı için tur projeksiyonu (slug veya _id sorgularında ortak). */
export const tourForBookingProjection = `{
  _id,
  title,
  "slug": slug.current,
  quickFacts{ maxCapacity },
  bookingRules{ show, title, bullets },
  baseCapacity{ ecoCapacity, premiumCapacity, firstCapacity },
  availabilityOverrides[]{
    date,
    eco,
    premium,
    first,
    note
  },
  availability{
    enabled,
    defaultAvailable,
    dateRanges[]{
      start,
      end,
      available
    },
    specificDates[]{
      date,
      enabled,
      defaultAvailable,
      available,
      priceOverrides{
        adultPrice,
        childPrice,
        infantPrice
      },
      classPriceOverrides[]{
        classKey,
        adultPrice,
        childPrice,
        infantPrice
      },
      classAvailability[]{
        classKey,
        status
      }
    }
  },
  ticketClasses[]{
    key,
    label,
    description,
    badge,
    bullets,
    classImage{
      asset,
      "url": asset->url,
      "metadata": asset->metadata { lqip, dimensions }
    },
    pricesByAge[]{
      ageKey,
      ageLabel,
      minAge,
      maxAge,
      price
    },
    dateRangePrices[]{
      label,
      start,
      end,
      pricesByAge[]{
        ageKey,
        ageLabel,
        minAge,
        maxAge,
        price
      }
    }
  },
  seasonRules[]{
    name,
    start,
    end,
    multiplier,
    classAdjustments[]{
      classKey,
      adultAdjustment,
      childAdjustment,
      infantAdjustment
    }
  },
  deposit{
    enabled,
    type,
    value
  },
  cashPaymentEnabled,
  extras[]{
    _key,
    key,
    title,
    description,
    price,
    priceType,
    icon,
    extraKind,
    offerInBooking,
    hotelNameLabel,
    hotelNamePlaceholder,
    hotelNameHelp,
    requireHotelName,
    transferFromHotelLabel,
    transferFromHotelDescription,
    requireTransferFromHotel,
    image{
      asset,
      alt,
      "url": asset->url,
      "metadata": asset->metadata { lqip, dimensions }
    }
  },
  pickupPoints[]{
    name,
    address,
    description,
    isDefault
  },
  mealMenu{
    enabled,
    sectionTitle,
    description,
    options[]{
      key,
      label,
      description
    }
  },
  translations
}`

const tourForBookingQuery = `*[_type == "tour" && (
  slug.current == $slug ||
  translations.en.slug.current == $slug ||
  translations.de.slug.current == $slug
)][0] ${tourForBookingProjection}`

/** Rezervasyon kayıtlarında saklanan Sanity _id veya slug ile tur çekilir (özel gün fiyatları dahil). */
export const tourForBookingBySanityIdQuery = `*[_type == "tour" && (_id == $id || slug.current == $id)][0] ${tourForBookingProjection}`

export async function fetchTourForBooking(
  slug: string,
  locale: SiteLocale = 'tr'
): Promise<TourForBooking | null> {
  try {
    const tour = await client.fetch<TourForBooking & { translations?: unknown } | null>(
      tourForBookingQuery,
      { slug }
    )
    if (!tour) return null
    if (locale === 'tr') return tour
    return mergeTourForLocale(tour as unknown as Record<string, unknown>, locale) as unknown as TourForBooking
  } catch (err) {
    console.error('fetchTourForBooking error:', err)
    return null
  }
}

export async function fetchMonthlyCalendar(
  slug: string,
  year: number,
  month: number
): Promise<CalendarDay[]> {
  const tour = await fetchTourForBooking(slug)
  if (!tour) return []
  return buildCalendarDaysForMonth(tour, year, month)
}

export async function fetchPricingForSelection(
  slug: string,
  dateStr: string,
  classKey: string,
  counts: { adult: number; child: number; baby: number }
): Promise<PricingSummary | null> {
  const tour = await fetchTourForBooking(slug)
  return computePricingForSelection(tour ?? null, dateStr, classKey, counts)
}
