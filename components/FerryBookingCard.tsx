import { Check } from 'lucide-react'
import { adultFromFare, type FerryAgeTier } from '@/components/ferry/ferryTypes'
import styles from './FerryBookingCard.module.css'

export type FerryExtraFee = { label?: string | null; amount?: string | null }

interface FerryBookingCardProps {
  title: string
  ageTiers: FerryAgeTier[]
  currency: string
  numberLocale: string
  cashNote?: string | null
  extraFees?: FerryExtraFee[] | null
  bulletItems?: string[] | null
  ctaLabel: string
  onReserve: () => void
}

export default function FerryBookingCard({
  title,
  ageTiers,
  currency,
  numberLocale,
  cashNote,
  extraFees,
  bulletItems,
  ctaLabel,
  onReserve,
}: FerryBookingCardProps) {
  const hasFees = Array.isArray(extraFees) && extraFees.length > 0
  const hasBullets = Array.isArray(bulletItems) && bulletItems.length > 0
  const fromPrice = adultFromFare(ageTiers)

  return (
    <div className={styles.content}>
      <h2 className={styles.title}>{title}</h2>

      <div className={styles.priceBlock}>
        {fromPrice != null && (
          <>
            <span className={styles.priceFrom}>Kişi Başı</span>
            <span className={styles.priceValue}>
              {fromPrice.toLocaleString(numberLocale)} {currency}
            </span>
          </>
        )}
        {(cashNote || hasFees) && (
          <div className={styles.feesNote}>
            {cashNote && <span>{cashNote}</span>}
            {hasFees && (
              <span className={styles.feesRow}>
                {extraFees!
                  .filter((f) => f?.label && f?.amount)
                  .map((f, i, arr) => (
                    <span key={i}>
                      {f.label} <strong>{f.amount}</strong>
                      {i < arr.length - 1 ? ' · ' : ''}
                    </span>
                  ))}
              </span>
            )}
          </div>
        )}
      </div>

      {hasBullets && (
        <ul className={styles.list}>
          {bulletItems!.map((item, i) => (
            <li key={i} className={styles.listItem}>
              <Check className={styles.checkIcon} strokeWidth={2.5} aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className={styles.ctaButton} onClick={onReserve}>
        {ctaLabel}
      </button>
    </div>
  )
}
