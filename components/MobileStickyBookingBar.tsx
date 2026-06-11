'use client'

import { useMemo } from 'react'
import { openBookingModal } from '@/components/booking/bookingEvents'
import { MOBILE_BOTTOM_CTA_BAR_ID } from '@/lib/mobileBottomCtaBarId'
import type { SiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import type { DepositConfig, TourForBooking } from '@/lib/sanity/bookingTypes'
import styles from './MobileStickyBookingBar.module.css'

interface MobileStickyBookingBarProps {
  ticketClasses?: TourForBooking['ticketClasses']
  bookingCard?: { ctaText?: string }
  deposit?: DepositConfig | null
  onReserve: () => void
  isModalOpen: boolean
  locale?: SiteLocale
}

function getDepositLabel(
  deposit: DepositConfig,
  ui: ReturnType<typeof getTourPageUi>
): string | null {
  if (!deposit?.enabled || deposit.value == null) return null
  if (deposit.type === 'percentage') return ui.stickyDepositPercentage(deposit.value)
  if (deposit.type === 'fixed') return ui.stickyDepositFixed
  return ui.stickyDepositPercentage(deposit.value)
}

function getAdultPrice(ticketClasses?: TourForBooking['ticketClasses']): number | null {
  if (!ticketClasses?.length) return null
  for (const ticketClass of ticketClasses) {
    const adult = ticketClass.pricesByAge?.find((p) => p.ageKey === 'adult')
    if (adult) return adult.price
  }
  return null
}

export default function MobileStickyBookingBar({
  ticketClasses,
  bookingCard,
  deposit,
  onReserve,
  isModalOpen,
  locale = 'tr',
}: MobileStickyBookingBarProps) {
  const ui = useMemo(() => getTourPageUi(locale), [locale])
  const adultPrice = getAdultPrice(ticketClasses)
  const ctaText = bookingCard?.ctaText || ui.stickyBookCtaMobile
  const depositLabel = deposit ? getDepositLabel(deposit, ui) : null

  if (isModalOpen) return null

  return (
    <div id={MOBILE_BOTTOM_CTA_BAR_ID} className={styles.bookingBar}>
      <div className={styles.bookingBarInner}>
        <div className={styles.priceBlock}>
          <span className={styles.priceFrom}>{ui.pricePerPerson}</span>
          {adultPrice ? (
            <span className={styles.priceValue}>
              {adultPrice.toLocaleString(ui.numberLocale)} ₺
            </span>
          ) : (
            <span className={styles.priceValueSmall}>{ui.stickyBookContinueForPrice}</span>
          )}
          {depositLabel && (
            <div className={styles.depositLine}>{depositLabel}</div>
          )}
        </div>
        <div className={styles.rightBlock}>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={() => {
              openBookingModal()
              onReserve()
            }}
            aria-label={ctaText}
          >
            {ctaText}
          </button>
        </div>
      </div>
    </div>
  )
}
