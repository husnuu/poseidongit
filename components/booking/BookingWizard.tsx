'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { TourForBooking } from '@/lib/sanity/bookingTypes'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import BookingWizardModal from './BookingWizardModal'

interface BookingWizardProps {
  tour: TourForBooking
  locale?: SiteLocale
}

/** Standalone /rezervasyon/[slug] — same 3-step UI as the tour-page booking modal. */
export default function BookingWizard({ tour, locale = 'tr' }: BookingWizardProps) {
  const router = useRouter()

  const handleClose = useCallback(() => {
    router.push(withLocalePath(locale, `/tur/${tour.slug}`))
  }, [locale, router, tour.slug])

  return (
    <BookingWizardModal
      open
      onClose={handleClose}
      tourSlug={tour.slug}
      initialTourData={tour}
      locale={locale}
      variant="page"
    />
  )
}
