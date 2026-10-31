'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { openBookingModal } from '@/components/booking/bookingEvents'
import DemandNotice from '@/components/booking/DemandNotice'
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
  /** Özel tur grup fiyatı — verilirse "Kişi başı" yerine "Grup fiyatı" gösterilir, kapora satırı olmaz. */
  groupPrice?: number | null
  bookingCard?: BookingCard
  deposit?: DepositConfig | null
  /** When set, opens modal instead of navigating to /rezervasyon/[slug] */
  onRezervasyonClick?: () => void
  locale?: SiteLocale
  /** Yalnızca popüler turda "talepler yoğun" kutusu gösterilir. */
  highDemand?: boolean
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
  groupPrice = null,
  onRezervasyonClick,
  locale = 'tr',
  highDemand = false,
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

  const adultPrice = groupPrice ?? getAdultPrice()
  const depositLabel = groupPrice != null ? ui.privateTourPaymentNote : deposit ? getDepositLabel(deposit, ui) : null
  const trustBadges =
    bookingCard?.trustBadges?.length ? bookingCard.trustBadges : ui.stickyTrustBadges
  const ctaText = bookingCard?.ctaText || ui.stickyBookCtaDesktop

  return (
    <div className={styles.sidebar}>
      <div className={styles.content}>
        <h2 className={styles.title}>{ui.stickyBookTitle}</h2>

        <div className={styles.priceBlock}>
          <span className={styles.priceFrom}>{groupPrice != null ? ui.priceGroup : ui.pricePerPerson}</span>
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

        {/* Paylaşımlı bileşen — mobilde TourHeader'daki compact şerit aynısını
            gösterir. Yalnızca Sanity'de "popüler" işaretli turda. */}
        {highDemand && <DemandNotice locale={locale} className="mt-4" />}
      </div>
    </div>
  )
}
