'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { BookingWizardState } from '@/lib/sanity/bookingTypes'
import { isBookingOnlinePaymentEnabled } from '@/lib/bookingVirtualPos'
import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import styles from '../booking.module.css'

interface StepPaymentProps {
  state: BookingWizardState
  ui: BookingWizardUi
  /** Şartlar & Koşullar linki (varsayılan: /terms) */
  termsHref?: string
  /** Checkbox değişince parent'ın ödeme butonunu devre dışı bırakması için */
  onTermsAcceptanceChange?: (accepted: boolean) => void
}

export default function StepPayment({ state, ui, termsHref = '/terms', onTermsAcceptanceChange }: StepPaymentProps) {
  const p = state.pricingSummary
  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    if (!isBookingOnlinePaymentEnabled) {
      onTermsAcceptanceChange?.(true)
      return
    }
    onTermsAcceptanceChange?.(termsAccepted)
  }, [termsAccepted, onTermsAcceptanceChange])

  if (!p) return null

  return (
    <>
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

      {!isBookingOnlinePaymentEnabled && (
        <div className={styles.virtualPosDisabledNotice} role="status">
          <strong>{ui.testModeTitle}</strong>{' '}
          {ui.testModePageBeforePay}
          <em>{ui.pay}</em>
          {ui.testModePageAfterPay}
        </div>
      )}

      {isBookingOnlinePaymentEnabled && (
        <div className={styles.card} style={{ fontFamily: 'var(--font-family)' }}>
          <div className={styles.cardCaption}>
            <span className={styles.cardCaptionIcon} aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <h3 className={styles.cardCaptionTitle}>{ui.nestpayRedirectTitle}</h3>
          </div>
          <hr className={styles.cardDivider} />
          <div className={styles.cardContent}>
            <p className="text-sm leading-relaxed text-zinc-600" style={{ margin: 0 }}>
              {ui.nestpayRedirectBody}
            </p>
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-zinc-600">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                aria-describedby="terms-checkbox-desc-step"
              />
              <span id="terms-checkbox-desc-step">
                {ui.termsCheckboxLead}
                <Link href={termsHref} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                  {ui.termsLinkText}
                </Link>
                {ui.termsCheckboxTrail}
              </span>
            </label>
          </div>
        </div>
      )}
    </>
  )
}
