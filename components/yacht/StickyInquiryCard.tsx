'use client'

import YachtCalendar, { type YachtCalendarRange } from '@/components/yacht/YachtCalendar'
import YachtRentalModeTabs from '@/components/yacht/YachtRentalModeTabs'
import type { YachtInquiryCard as InquiryCardConfig } from '@/lib/yachtTypes'
import type { YachtRentalMode } from '@/lib/yachtRentalModes'
import {
  DEFAULT_NOTE_SUBTITLE,
  DEFAULT_NOTE_TITLE,
  DEFAULT_STICKY_TRUST_BULLETS,
  DEFAULT_YACHT_INQUIRY_CTA,
  DEFAULT_YACHT_INQUIRY_TITLE,
} from '@/lib/yachtConversionCopy'
import styles from '@/components/StickyBookingCard.module.css'
import bookingStyles from '@/components/booking/booking.module.css'

function CheckIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={styles.checkIcon}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.70711 14.2929L19 5L20.4142 6.41421L9.70711 17.1213L4 11.4142L5.41421 10L9.70711 14.2929Z"
        fill="currentColor"
      />
    </svg>
  )
}

interface StickyInquiryCardProps {
  priceLabel?: string
  priceValue: string
  resolveDayPrice?: (iso: string) => number | undefined
  inquiryCard?: InquiryCardConfig | null
  blockedDates?: string[]
  rentalMode: YachtRentalMode
  onRentalModeChange: (m: YachtRentalMode) => void
  showRentalModeTabs: boolean
  selectionMode: 'single' | 'range'
  selectedDate: string | null
  onSelectDate: (d: string) => void
  overnightRange: YachtCalendarRange
  onOvernightRangeChange: (v: YachtCalendarRange) => void
  guestCount: number
  onGuestCountChange: (n: number) => void
  maxGuests?: number
  onOpenInquiry: () => void
}

export default function StickyInquiryCard({
  priceLabel,
  priceValue,
  resolveDayPrice,
  inquiryCard,
  blockedDates,
  rentalMode,
  onRentalModeChange,
  showRentalModeTabs,
  selectionMode,
  selectedDate,
  onSelectDate,
  overnightRange,
  onOvernightRangeChange,
  guestCount,
  onGuestCountChange,
  maxGuests = 80,
  onOpenInquiry,
}: StickyInquiryCardProps) {
  const title = inquiryCard?.title?.trim() || DEFAULT_YACHT_INQUIRY_TITLE
  const ctaText = inquiryCard?.ctaText?.trim() || DEFAULT_YACHT_INQUIRY_CTA
  const trustBadges =
    inquiryCard?.trustBadges?.length && inquiryCard.trustBadges.length > 0
      ? inquiryCard.trustBadges
      : [...DEFAULT_STICKY_TRUST_BULLETS]
  const noteTitle = inquiryCard?.noteTitle?.trim() || DEFAULT_NOTE_TITLE
  const noteSubtitle = inquiryCard?.noteSubtitle?.trim() || DEFAULT_NOTE_SUBTITLE

  return (
    <div className={styles.sidebar}>
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>

        <div className={styles.priceBlock}>
          {priceLabel ? <span className={styles.priceFrom}>{priceLabel}</span> : null}
          <span className={styles.priceValue}>{priceValue}</span>
        </div>

        <ul className={styles.list}>
          {trustBadges.map((badge, index) => (
            <li key={index} className={styles.listItem}>
              <CheckIcon />
              <span>{badge}</span>
            </li>
          ))}
        </ul>

        {showRentalModeTabs ? (
          <YachtRentalModeTabs value={rentalMode} onChange={onRentalModeChange} />
        ) : null}

        <div className="mb-4">
          <YachtCalendar
            blockedDates={blockedDates}
            selectionMode={selectionMode}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            rangeValue={overnightRange}
            onRangeChange={onOvernightRangeChange}
            resolveDayPrice={resolveDayPrice}
            compactTitle
          />
        </div>

        <div className="mb-4">
          <p
            className="text-sm font-semibold text-zinc-700 mb-2"
            style={{ fontFamily: 'var(--font-family)' }}
          >
            Misafir sayısı
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={bookingStyles.counterBtn}
              aria-label="Azalt"
              disabled={guestCount <= 1}
              onClick={() => onGuestCountChange(Math.max(1, guestCount - 1))}
            >
              −
            </button>
            <span className={bookingStyles.counterValue}>{guestCount}</span>
            <button
              type="button"
              className={`${bookingStyles.counterBtn} ${bookingStyles.counterBtnPlus}`}
              aria-label="Artır"
              disabled={guestCount >= maxGuests}
              onClick={() => onGuestCountChange(Math.min(maxGuests, guestCount + 1))}
            >
              +
            </button>
          </div>
        </div>

        <button type="button" className={styles.ctaButton} onClick={onOpenInquiry}>
          {ctaText}
        </button>

        <div className={styles.demand} role="note">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
            className={styles.demandIcon}
          >
            <path
              d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22Z"
              stroke="#fc6c4f"
              strokeWidth="2"
            />
            <path
              d="M12 7V12L15 14"
              stroke="#fc6c4f"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className={styles.demandText}>
            <p className={styles.demandTitle}>{noteTitle}</p>
            <p className={styles.demandSubtitle}>{noteSubtitle}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
