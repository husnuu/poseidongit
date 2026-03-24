'use client'

import { useState, useCallback, useMemo } from 'react'
import StickyInquiryCard from '@/components/yacht/StickyInquiryCard'
import MobileYachtInquiryBar from '@/components/yacht/MobileYachtInquiryBar'
import YachtInquiryModal from '@/components/yacht/YachtInquiryModal'
import type { YachtRentalDocument } from '@/lib/yachtTypes'
import { DEFAULT_YACHT_INQUIRY_CTA } from '@/lib/yachtConversionCopy'

interface YachtInquiryExperienceProps {
  yacht: YachtRentalDocument
}

export default function YachtInquiryExperience({ yacht }: YachtInquiryExperienceProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [guestCount, setGuestCount] = useState(2)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalInitialStep, setModalInitialStep] = useState<1 | 2>(1)

  const maxGuests = useMemo(() => {
    const cap = yacht.specifications?.capacity
    if (typeof cap === 'number' && cap > 0) return Math.min(cap, 80)
    return 80
  }, [yacht.specifications?.capacity])

  const openModalFromMobile = useCallback(() => {
    setModalInitialStep(1)
    setModalOpen(true)
  }, [])

  const openModalFromDesktop = useCallback(() => {
    setModalInitialStep(selectedDate ? 2 : 1)
    setModalOpen(true)
  }, [selectedDate])

  const ctaText = yacht.inquiryCard?.ctaText?.trim() || DEFAULT_YACHT_INQUIRY_CTA

  return (
    <>
      <aside className="hidden lg:block lg:flex-shrink-0 lg:w-[360px]">
        <StickyInquiryCard
          priceFrom={yacht.priceFrom}
          currency={yacht.currency}
          inquiryCard={yacht.inquiryCard}
          blockedDates={yacht.blockedDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          guestCount={Math.min(guestCount, maxGuests)}
          onGuestCountChange={(n) => setGuestCount(Math.min(maxGuests, Math.max(1, n)))}
          maxGuests={maxGuests}
          onOpenInquiry={openModalFromDesktop}
        />
      </aside>

      <MobileYachtInquiryBar
        priceFrom={yacht.priceFrom}
        currency={yacht.currency}
        selectedDate={selectedDate}
        onOpenInquiry={openModalFromMobile}
        ctaText={ctaText}
        isModalOpen={modalOpen}
      />

      <YachtInquiryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialStep={modalInitialStep}
        yacht={yacht}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        guestCount={Math.min(guestCount, maxGuests)}
        onGuestCountChange={(n) => setGuestCount(Math.min(maxGuests, Math.max(1, n)))}
        maxGuests={maxGuests}
        ctaText={ctaText}
      />
    </>
  )
}
