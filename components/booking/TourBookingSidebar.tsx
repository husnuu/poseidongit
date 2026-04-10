'use client'

import { useState, useEffect } from 'react'
import StickyBookingCard from '@/components/StickyBookingCard'
import MobileStickyBookingBar from '@/components/MobileStickyBookingBar'
import BookingWizardModal from '@/components/booking/BookingWizardModal'
import { BOOKING_MODAL_OPEN_EVENT } from '@/components/booking/bookingEvents'
import type { TourForBooking } from '@/lib/sanity/bookingTypes'
import type { SiteLocale } from '@/lib/i18n/config'

interface TourBookingSidebarProps {
  tour: TourForBooking
  locale?: SiteLocale
  /** Optional: pass through from main tour (ticketClasses, bookingCard) for the card display */
  ticketClasses?: TourForBooking['ticketClasses']
  bookingCard?: { fromText?: string; ctaText?: string; urgencyText?: string; trustBadges?: string[] }
  /** Örn. withLocalePath(locale, `/rezervasyon/${slug}`) */
  rezervasyonHref?: string
}

export default function TourBookingSidebar({
  tour,
  ticketClasses = tour.ticketClasses,
  bookingCard,
  rezervasyonHref,
  locale = 'tr',
}: TourBookingSidebarProps) {
  const [isBookingOpen, setIsBookingOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => setIsBookingOpen(true)
    window.addEventListener(BOOKING_MODAL_OPEN_EVENT, handleOpen)
    return () => window.removeEventListener(BOOKING_MODAL_OPEN_EVENT, handleOpen)
  }, [])

  return (
    <>
      <aside className="hidden lg:block lg:flex-shrink-0 lg:w-[360px]">
        <StickyBookingCard
          tourSlug={tour.slug}
          rezervasyonHref={rezervasyonHref}
          ticketClasses={ticketClasses}
          bookingCard={bookingCard}
          deposit={tour.deposit}
          onRezervasyonClick={() => setIsBookingOpen(true)}
        />
      </aside>
      <MobileStickyBookingBar
        ticketClasses={ticketClasses}
        bookingCard={bookingCard}
        deposit={tour.deposit}
        onReserve={() => setIsBookingOpen(true)}
        isModalOpen={isBookingOpen}
      />
      <BookingWizardModal
        open={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        tourSlug={tour.slug}
        initialTourData={tour}
        locale={locale}
      />
    </>
  )
}
