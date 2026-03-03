'use client'

import { openBookingModal } from '@/components/booking/bookingEvents'
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

  const priceText = adultPrice
    ? `Kişi başı ${adultPrice.toLocaleString('tr-TR')} ₺`
    : 'Fiyat bilgisi için rezervasyon adımına geçiniz'

  if (isModalOpen) return null

  return (
    <div className={styles.bookingBar}>
      <div className={styles.bookingBarInner}>
        <div className={styles.priceBlock}>
          <div className={styles.priceValue}>
            {adultPrice ? `Fiyat: ${priceText}` : priceText}
          </div>
          {depositLabel && (
            <div className={styles.depositLine}>{depositLabel}</div>
          )}
        </div>
        <div className={styles.rightBlock}>
          <span className="hero-primary-btn-wrap inline-flex rounded-xl p-[2px]">
            <button
              type="button"
              className={`hero-primary-inner hero-btn-shine w-full rounded-[10px] ${styles.ctaButton}`}
              style={{ borderRadius: 10 }}
              onClick={() => {
                openBookingModal()
                onReserve()
              }}
              aria-label={ctaText}
            >
              {ctaText}
            </button>
          </span>
        </div>
      </div>
    </div>
  )
}
