import { client } from '@/lib/sanity'
import { tourForBookingBySanityIdQuery } from '@/lib/sanity/bookingQueries'
import { computePricingForSelection } from '@/lib/sanity/bookingPricing'
import { applySinglePriceMode, singlePriceClass } from '@/lib/sanity/singlePrice'
import { privateTourGroupPrice } from '@/lib/sanity/privateTour'
import type { TourForBooking, ExtraLineItem } from '@/lib/sanity/bookingTypes'

/** Sanity turu + tarih: sezon, özel gün sınıf/genel fiyatları (classPriceOverrides → priceOverrides) ile toplam. */
export async function computeBookingPrices(
  tourId: string,
  date: string,
  classId: string,
  counts: { adult: number; child: number; infant: number },
  selectedExtraKeys: string[],
  extraNotes: Record<string, string>,
  extraQuantities: Record<string, number>
): Promise<{
  unitPrice: number
  totalPrice: number
  depositAmount: number
  cashPaymentEnabled: boolean
  extras: ExtraLineItem[]
  extrasTotal: number
  /** Tek fiyat turu: istemci ne gönderirse göndersin kullanılacak sınıf. */
  singleClass: { key: string; label: string } | null
  /** Özel tur: grup fiyatı, ödeme yok — kayıt yalnızca rezervasyon talebidir. */
  privateTour: boolean
}> {
  try {
    const fetched = await client.fetch<TourForBooking | null>(tourForBookingBySanityIdQuery, {
      id: tourId,
    })
    const groupPrice = privateTourGroupPrice(fetched)
    if (groupPrice !== null) {
      return {
        unitPrice: groupPrice,
        totalPrice: groupPrice,
        depositAmount: 0,
        cashPaymentEnabled: false,
        extras: [],
        extrasTotal: 0,
        singleClass: null,
        privateTour: true,
      }
    }
    const singleClass = singlePriceClass(fetched)
    const tour = applySinglePriceMode(fetched)
    const dateStr = date.slice(0, 10)
    const summary = computePricingForSelection(
      tour,
      dateStr,
      singleClass?.key ?? classId,
      { adult: counts.adult, child: counts.child, baby: counts.infant },
      selectedExtraKeys,
      extraNotes,
      extraQuantities
    )
    const totalPax = counts.adult + counts.child + counts.infant
    const cashPaymentEnabled = Boolean(tour?.cashPaymentEnabled)
    if (!summary || totalPax <= 0) {
      return { unitPrice: 0, totalPrice: 0, depositAmount: 0, cashPaymentEnabled, extras: [], extrasTotal: 0, singleClass, privateTour: false }
    }
    const unitPrice = Math.round(summary.total / totalPax)
    return {
      unitPrice,
      totalPrice: summary.total,
      depositAmount: cashPaymentEnabled
        ? 0
        : Math.max(0, Math.min(summary.total, summary.depositAmount)),
      cashPaymentEnabled,
      extras: summary.extras,
      extrasTotal: summary.extrasTotal,
      singleClass,
      privateTour: false,
    }
  } catch {
    return { unitPrice: 0, totalPrice: 0, depositAmount: 0, cashPaymentEnabled: false, extras: [], extrasTotal: 0, singleClass: null, privateTour: false }
  }
}
