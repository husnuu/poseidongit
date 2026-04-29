'use client'

import { openBookingModal } from '@/components/booking/bookingEvents'
import { MOBILE_BOTTOM_CTA_BAR_ID } from '@/lib/mobileBottomCtaBarId'
import type { DepositConfig, TourForBooking } from '@/lib/sanity/bookingTypes'
import styles from './MobileStickyBookingBar.module.css'

interface MobileStickyBookingBarProps {
  ticketClasses?: TourForBooking['ticketClasses']
  bookingCard?: { ctaText?: string }
  deposit?: DepositConfig | null
  onReserve: () => void
  isModalOpen: boolean
}

function getDepositLabel(deposit: DepositConfig): string | null {
  if (!deposit?.enabled || deposit.value == null) return null
  if (deposit.type === 'percentage') return `%${deposit.value} kapora ile ödeyin`
  if (deposit.type === 'fixed') return 'Kapora ile ödeyin'
  return `%${deposit.value} kapora ile ödeyin`
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
}: MobileStickyBookingBarProps) {
  const adultPrice = getAdultPrice(ticketClasses)
  const ctaText = bookingCard?.ctaText || 'REZERVE ET'
  const depositLabel = deposit ? getDepositLabel(deposit) : null

  if (isModalOpen) return null

  return (
    <div id={MOBILE_BOTTOM_CTA_BAR_ID} className={styles.bookingBar}>
      <div className={styles.bookingBarInner}>
        <div className={styles.priceBlock}>
          <span className={styles.priceFrom}>Kişi başı</span>
          {adultPrice ? (
            <span className={styles.priceValue}>
              {adultPrice.toLocaleString('tr-TR')} ₺
            </span>
          ) : (
            <span className={styles.priceValueSmall}>Fiyat için devam edin</span>
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
