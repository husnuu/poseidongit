'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { openBookingModal } from '@/components/booking/bookingEvents'
import type { SiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import styles from './StickyBookingCard.module.css'

interface PriceByAge {
  ageKey: string
  ageLabel: string
  minAge?: number
  maxAge?: number
  price: number
}

interface TicketClass {
  key: string
  label: string
  description?: string
  badge?: string
  pricesByAge?: PriceByAge[]
}

interface BookingCard {
  fromText?: string
  ctaText?: string
  urgencyText?: string
  trustBadges?: string[]
}

interface DepositConfig {
  enabled: boolean
  type?: 'percentage' | 'fixed'
  value?: number
}

interface StickyBookingCardProps {
  tourSlug: string
  /** Tam path; /en/rezervasyon/... gibi. Boşsa `/rezervasyon/${tourSlug}` */
  rezervasyonHref?: string
  ticketClasses?: TicketClass[]
  bookingCard?: BookingCard
  deposit?: DepositConfig | null
  /** When set, opens modal instead of navigating to /rezervasyon/[slug] */
  onRezervasyonClick?: () => void
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

function DemandIcon() {
  return (
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
  )
}

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

export default function StickyBookingCard({
  tourSlug,
  rezervasyonHref,
  ticketClasses,
  bookingCard,
  deposit,
  onRezervasyonClick,
  locale = 'tr',
}: StickyBookingCardProps) {
  const ui = useMemo(() => getTourPageUi(locale), [locale])
  const reservePath = rezervasyonHref?.trim() || `/rezervasyon/${tourSlug}`
  const getAdultPrice = (): number | null => {
    if (!ticketClasses?.length) return null
    for (const ticketClass of ticketClasses) {
      if (ticketClass.pricesByAge?.length) {
        const adult = ticketClass.pricesByAge.find((p) => p.ageKey === 'adult')
        if (adult) return adult.price
      }
    }
    return null
  }

  const adultPrice = getAdultPrice()
  const depositLabel = deposit ? getDepositLabel(deposit, ui) : null
  const trustBadges =
    bookingCard?.trustBadges?.length ? bookingCard.trustBadges : ui.stickyTrustBadges
  const ctaText = bookingCard?.ctaText || ui.stickyBookCtaDesktop

  return (
    <div className={styles.sidebar}>
      <div className={styles.content}>
        <h2 className={styles.title}>{ui.stickyBookTitle}</h2>

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
            <span className={styles.depositLine}>{depositLabel}</span>
          )}
        </div>

        <ul className={styles.list}>
          {trustBadges.map((badge, index) => (
            <li key={index} className={styles.listItem}>
              <CheckIcon />
              <span>{badge}</span>
            </li>
          ))}
        </ul>

        {onRezervasyonClick ? (
          <button
            type="button"
            className={styles.ctaButton}
            onClick={() => {
              openBookingModal()
              onRezervasyonClick()
            }}
          >
            {ctaText}
          </button>
        ) : (
          <Link href={reservePath} className={styles.ctaButton}>
            {ctaText}
          </Link>
        )}

        <div className={styles.demand} role="note" aria-label={ui.stickyDemandAria}>
          <DemandIcon />
          <div className={styles.demandText}>
            <p className={styles.demandTitle}>{ui.stickyDemandTitle}</p>
            <p className={styles.demandSubtitle}>{ui.stickyDemandSubtitle}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
