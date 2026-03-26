'use client'

import { CheckCircle2 } from 'lucide-react'
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
  priceHeadline: string
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
  priceHeadline,
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
        <p className={styles.price}>{priceHeadline}</p>

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

        <span className="hero-primary-btn-wrap mt-0 w-full rounded-xl p-[2px] block yacht-inquiry-cta-wrap">
          <button
            type="button"
            className={`hero-primary-inner hero-btn-shine w-full rounded-[10px] ${styles.yachtInquiryCta}`}
            style={{ borderRadius: 10 }}
            onClick={onOpenInquiry}
          >
            {ctaText}
          </button>
        </span>

        <div
          className="mt-5 flex gap-3 rounded-xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/90 to-teal-50/40 px-4 py-3.5"
          role="note"
        >
          <CheckCircle2
            className="h-5 w-5 shrink-0 text-emerald-600"
            strokeWidth={2.25}
            aria-hidden
          />
          <div className="min-w-0">
            <p
              className="text-sm font-bold text-emerald-950 m-0"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              {noteTitle}
            </p>
            <p
              className="text-xs font-medium text-emerald-900/85 mt-1 m-0 leading-snug"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              {noteSubtitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
