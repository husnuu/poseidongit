'use client'

import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtUi } from '@/lib/i18n/yachtUi'
import { MOBILE_BOTTOM_CTA_BAR_ID } from '@/lib/mobileBottomCtaBarId'
import styles from '@/components/MobileStickyBookingBar.module.css'

interface MobileYachtInquiryBarProps {
  priceLabel?: string
  priceValue: string
  dateSubtitle: string | null
  onOpenInquiry: () => void
  ctaText?: string
  isModalOpen: boolean
  locale?: SiteLocale
}

export default function MobileYachtInquiryBar({
  priceLabel,
  priceValue,
  dateSubtitle,
  onOpenInquiry,
  ctaText,
  isModalOpen,
  locale = 'tr',
}: MobileYachtInquiryBarProps) {
  const ui = getYachtUi(locale)
  const resolvedCtaText = ctaText ?? ui.defaultInquiryCta
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
            <div className={styles.depositLine}>{ui.selectFromCalendarFallback}</div>
          )}
        </div>
        <div className={styles.rightBlock}>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={onOpenInquiry}
            aria-label={resolvedCtaText}
          >
            {resolvedCtaText}
          </button>
        </div>
      </div>
    </div>
  )
}
