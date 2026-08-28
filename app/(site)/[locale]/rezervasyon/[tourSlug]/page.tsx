import { notFound } from 'next/navigation'
import { fetchTourForBooking } from '@/lib/sanity/bookingQueries'
import BookingWizard from '@/components/booking/BookingWizard'
import type { TourForBooking } from '@/lib/sanity/bookingTypes'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'

/** Client'a güvenli geçmek için tur verisini düz obje yap (serialization hatası önlenir) */
function serializeTour(tour: TourForBooking): TourForBooking {
  return JSON.parse(JSON.stringify(tour))
}

export default async function RezervasyonPage({
  params,
}: {
  params: Promise<{ locale: string; tourSlug: string }>
}) {
  let tour: TourForBooking | null = null
  let locale: SiteLocale = 'tr'
  try {
    const { tourSlug, locale: loc } = await params
    if (!tourSlug || typeof tourSlug !== 'string') {
      notFound()
    }
    if (!isSiteLocale(loc)) notFound()
    locale = loc as SiteLocale
    tour = await fetchTourForBooking(tourSlug, locale)
  } catch (err) {
    console.error('Rezervasyon fetch error:', err)
    notFound()
  }

  if (!tour) {
    notFound()
  }

  const safeTour = serializeTour(tour)

  return (
    <div className="min-h-[100dvh] bg-[#e8eef5]">
      <BookingWizard tour={safeTour} locale={locale} />
    </div>
  )
}
