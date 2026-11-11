'use client'

import BookingWizardModal from '@/components/booking/BookingWizardModal'
import { postToEmbedParent } from '@/components/embed/EmbedShell'
import type { TourForBooking } from '@/lib/sanity/bookingTypes'
import type { SiteLocale } from '@/lib/i18n/config'

/** Widget içindeki rezervasyon formu — sitedeki /rezervasyon sayfasıyla aynı sihirbaz. */
export default function EmbedBooking({
  tour,
  locale,
  partnerSlug,
}: {
  tour: TourForBooking
  locale: SiteLocale
  partnerSlug: string
}) {
  return (
    <BookingWizardModal
      open
      // "Yeni rezervasyon": sihirbaz kendini sıfırlar; dış sayfada formun başına dönülür.
      onClose={() => postToEmbedParent('scrollTop')}
      tourSlug={tour.slug}
      initialTourData={tour}
      locale={locale}
      variant="page"
      embedPartnerSlug={partnerSlug}
    />
  )
}
