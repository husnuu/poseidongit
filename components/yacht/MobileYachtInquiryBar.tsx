'use client'

import { DEFAULT_YACHT_INQUIRY_CTA } from '@/lib/yachtConversionCopy'
import { MOBILE_BOTTOM_CTA_BAR_ID } from '@/lib/mobileBottomCtaBarId'
import styles from './MobileYachtInquiryBar.module.css'

interface MobileYachtInquiryBarProps {
  priceHeadline: string
  dateSubtitle: string | null
  onOpenInquiry: () => void
  ctaText?: string
  isModalOpen: boolean
}

export default function MobileYachtInquiryBar({
  priceHeadline,
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
          <div className={styles.priceValue}>{priceHeadline}</div>
          {dateSubtitle ? (
            <div className={styles.dateLine}>{dateSubtitle}</div>
          ) : (
            <div className={styles.dateLineMuted}>Takvimden seçim yapın</div>
          )}
        </div>
        <div className={styles.rightBlock}>
          <span className="hero-primary-btn-wrap inline-flex rounded-xl p-[2px]">
            <button
              type="button"
              className={`hero-primary-inner hero-btn-shine w-full rounded-[10px] ${styles.ctaButton}`}
              style={{ borderRadius: 10 }}
              onClick={onOpenInquiry}
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
