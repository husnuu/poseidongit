'use client'

import Link from 'next/link'
import { openBookingModal } from '@/components/booking/bookingEvents'
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
  ticketClasses?: TicketClass[]
  bookingCard?: BookingCard
  deposit?: DepositConfig | null
  /** When set, opens modal instead of navigating to /rezervasyon/[slug] */
  onRezervasyonClick?: () => void
}

function getDepositLabel(deposit: DepositConfig): string | null {
  if (!deposit?.enabled || deposit.value == null) return null
  if (deposit.type === 'percentage') return `%${deposit.value} kapora ile ödeyin`
  if (deposit.type === 'fixed') return 'Kapora ile ödeyin'
  return `%${deposit.value} kapora ile ödeyin`
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
        stroke="#1e3a5f"
        strokeWidth="2"
      />
      <path
        d="M12 7V12L15 14"
        stroke="#1e3a5f"
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
  ticketClasses,
  bookingCard,
  deposit,
  onRezervasyonClick,
}: StickyBookingCardProps) {
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
  const depositLabel = deposit ? getDepositLabel(deposit) : null
  const trustBadges =
    bookingCard?.trustBadges?.length
      ? bookingCard.trustBadges
      : ['En İyi Fiyat Garantisi', 'Küçük Grup Deneyimi', 'Esnek İptal']
  const ctaText = bookingCard?.ctaText || 'REZERVASYON YAP'

  const priceText = adultPrice
    ? `${adultPrice.toLocaleString('tr-TR')} ₺'den başlayan fiyatlarla`
    : 'Fiyat bilgisi için rezervasyon adımına geçiniz'

  return (
    <div className={styles.sidebar}>
      <div className={styles.content}>
        <h2 className={styles.title}>REZERVE ET</h2>
        <p className={styles.price}>{priceText}</p>
        {depositLabel && (
          <p className={styles.depositLine}>{depositLabel}</p>
        )}

        <ul className={styles.list}>
          {trustBadges.map((badge, index) => (
            <li key={index} className={styles.listItem}>
              <CheckIcon />
              <span>{badge}</span>
            </li>
          ))}
        </ul>

        <span className="hero-primary-btn-wrap mt-0 w-full rounded-xl p-[2px] block">
          {onRezervasyonClick ? (
            <button
              type="button"
              className={`hero-primary-inner hero-btn-shine w-full rounded-[10px] ${styles.ctaButton}`}
              style={{ borderRadius: 10 }}
              onClick={() => {
                openBookingModal()
                onRezervasyonClick()
              }}
            >
              {ctaText}
            </button>
          ) : (
            <Link
              href={`/rezervasyon/${tourSlug}`}
              className={`hero-primary-inner hero-btn-shine w-full rounded-[10px] ${styles.ctaButton}`}
              style={{ borderRadius: 10 }}
            >
              {ctaText}
            </Link>
          )}
        </span>

        <div className={styles.demand} role="note" aria-label="Talep uyarısı">
          <DemandIcon />
          <div className={styles.demandText}>
            <p className={styles.demandTitle}>Bu tur için talepler yoğun</p>
            <p className={styles.demandSubtitle}>Erken rezervasyon önerilir</p>
          </div>
        </div>
      </div>
    </div>
  )
}
