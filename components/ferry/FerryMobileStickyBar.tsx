'use client'

import { MOBILE_BOTTOM_CTA_BAR_ID } from '@/lib/mobileBottomCtaBarId'
import styles from './FerryMobileStickyBar.module.css'

interface FerryMobileStickyBarProps {
  fromPrice: number | null
  currency: string
  numberLocale: string
  ctaLabel: string
  onReserve: () => void
  isModalOpen: boolean
}

export default function FerryMobileStickyBar({
  fromPrice,
  currency,
  numberLocale,
  ctaLabel,
  onReserve,
  isModalOpen,
}: FerryMobileStickyBarProps) {
  if (isModalOpen) return null

  return (
    <div id={MOBILE_BOTTOM_CTA_BAR_ID} className={styles.bookingBar}>
      <div className={styles.bookingBarInner}>
        <div className={styles.priceBlock}>
          <span className={styles.priceFrom}>Kişi Başı</span>
          {fromPrice != null ? (
            <span className={styles.priceValue}>
              {fromPrice.toLocaleString(numberLocale)} {currency}
            </span>
          ) : (
            <span className={styles.priceValueSmall}>Fiyat için devam edin</span>
          )}
        </div>
        <div className={styles.rightBlock}>
          <button type="button" className={styles.ctaButton} onClick={onReserve} aria-label={ctaLabel}>
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
