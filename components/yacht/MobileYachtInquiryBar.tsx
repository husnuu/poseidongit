'use client'

import { DEFAULT_YACHT_INQUIRY_CTA } from '@/lib/yachtConversionCopy'
import { MOBILE_BOTTOM_CTA_BAR_ID } from '@/lib/mobileBottomCtaBarId'
import styles from '@/components/MobileStickyBookingBar.module.css'

interface MobileYachtInquiryBarProps {
  priceLabel?: string
  priceValue: string
  dateSubtitle: string | null
  onOpenInquiry: () => void
  ctaText?: string
  isModalOpen: boolean
}

export default function MobileYachtInquiryBar({
  priceLabel,
  priceValue,
  dateSubtitle,
  onOpenInquiry,
  ctaText = DEFAULT_YACHT_INQUIRY_CTA,
  isModalOpen,
}: MobileYachtInquiryBarProps) {
  if (isModalOpen) return null

  return (
    <div id={MOBILE_BOTTOM_CTA_BAR_ID} className={styles.bookingBar}>
      <div className={styles.bookingBarInner}>
        <div className={styles.priceBlock}>
          {priceLabel ? <span className={styles.priceFrom}>{priceLabel}</span> : null}
          <span className={styles.priceValue}>{priceValue}</span>
          {dateSubtitle ? (
            <div className={styles.depositLine}>{dateSubtitle}</div>
          ) : (
            <div className={styles.depositLine}>Takvimden seçim yapın</div>
          )}
        </div>
        <div className={styles.rightBlock}>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={onOpenInquiry}
            aria-label={ctaText}
          >
            {ctaText}
          </button>
        </div>
      </div>
    </div>
  )
}
