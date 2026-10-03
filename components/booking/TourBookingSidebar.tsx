'use client'

import { useState, useEffect, useRef } from 'react'
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

  // GEÇİCİ — canlı test şifresi. Rezervasyon akışı herkese açılmadan önce, gerçek
  // kullanıcıların yanlışlıkla ödeme adımına girmesini engellemek için konuldu.
  // Test bitince bu bloğu (ve requestBookingOpen çağrılarını eski haline) kaldır.
  //
  // Not: StickyBookingCard / MobileStickyBookingBar aynı tıklamada hem bu fonksiyonu
  // doğrudan hem de BOOKING_MODAL_OPEN_EVENT event'ini (bu dosyadaki listener üzerinden
  // yine bu fonksiyonu) tetikliyor — tek tıkta şifre iki kez sorulmasın diye promptRef
  // ile aynı tık içindeki ikinci çağrı sessizce atlanıyor.
  const promptLockRef = useRef(false)
  const requestBookingOpen = () => {
    if (promptLockRef.current) return
    promptLockRef.current = true
    setTimeout(() => {
      promptLockRef.current = false
    }, 0)

    const input = window.prompt('Devam etmek için şifreyi girin:')
    if (input === '53') {
      setIsBookingOpen(true)
    } else if (input !== null) {
      window.alert('Şifre hatalı.')
    }
  }

  useEffect(() => {
    window.addEventListener(BOOKING_MODAL_OPEN_EVENT, requestBookingOpen)
    return () => window.removeEventListener(BOOKING_MODAL_OPEN_EVENT, requestBookingOpen)
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
          onRezervasyonClick={requestBookingOpen}
          locale={locale}
        />
      </aside>
      <MobileStickyBookingBar
        ticketClasses={ticketClasses}
        bookingCard={bookingCard}
        deposit={tour.deposit}
        onReserve={requestBookingOpen}
        isModalOpen={isBookingOpen}
        locale={locale}
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
