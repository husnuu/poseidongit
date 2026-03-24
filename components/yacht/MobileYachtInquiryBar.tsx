'use client'

import { formatYachtMobilePrice } from '@/lib/yachtFormat'
import { DEFAULT_YACHT_INQUIRY_CTA } from '@/lib/yachtConversionCopy'
import styles from './MobileYachtInquiryBar.module.css'

interface MobileYachtInquiryBarProps {
  priceFrom?: number
  currency?: string
  selectedDate: string | null
  onOpenInquiry: () => void
  ctaText?: string
  isModalOpen: boolean
}

function formatSelectedDateLabel(iso: string | null): string | null {
  if (!iso) return null
  try {
    const d = new Date(iso + 'T12:00:00')
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function MobileYachtInquiryBar({
  priceFrom,
  currency,
  selectedDate,
  onOpenInquiry,
  ctaText = DEFAULT_YACHT_INQUIRY_CTA,
  isModalOpen,
}: MobileYachtInquiryBarProps) {
  if (isModalOpen) return null

  const dateLabel = formatSelectedDateLabel(selectedDate)

  return (
    <div className={styles.bookingBar}>
      <div className={styles.bookingBarInner}>
        <div className={styles.priceBlock}>
          <div className={styles.priceValue}>
            {formatYachtMobilePrice(priceFrom, currency)}
          </div>
          {dateLabel ? (
            <div className={styles.dateLine}>{dateLabel}</div>
          ) : (
            <div className={styles.dateLineMuted}>Takvimden tarih seçin</div>
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
