'use client'

import { useEffect } from 'react'
import type { BookingWizardState } from '@/lib/sanity/bookingTypes'
import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import styles from '../booking.module.css'

interface StepPaymentProps {
  state: BookingWizardState
  ui: BookingWizardUi
  termsHref?: string
  onTermsAcceptanceChange?: (accepted: boolean) => void
}

export default function StepPayment({ state, ui, onTermsAcceptanceChange }: StepPaymentProps) {
  const p = state.pricingSummary

  useEffect(() => {
    onTermsAcceptanceChange?.(true)
  }, [onTermsAcceptanceChange])

  if (!p) return null

  return (
    <div className={styles.card}>
      <div className={styles.cardCaption}>
        <span className={styles.cardCaptionIcon} aria-hidden>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
            <path d="M12 15a2 2 0 0 1 2 2v4H10v-4a2 2 0 0 1 2-2z" />
          </svg>
        </span>
        <h3 className={styles.cardCaptionTitle}>{ui.paymentInfoTitle}</h3>
      </div>
      <hr className={styles.cardDivider} />
      <div className={styles.cardContent}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryRowLabel}>
            {ui.payNowSummary(p.depositAmount.toLocaleString(ui.numberLocale), p.depositPercent)}
          </span>
          <span className={styles.summaryRowValue} />
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryRowLabel}>
            {ui.remainingPayTourDay(p.remainingAmount.toLocaleString(ui.numberLocale))}
          </span>
          <span className={styles.summaryRowValue} />
        </div>
      </div>
    </div>
  )
}
