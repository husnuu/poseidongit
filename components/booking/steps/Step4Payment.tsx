'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { BookingWizardState } from '@/lib/sanity/bookingTypes'
import { isBookingOnlinePaymentEnabled } from '@/lib/bookingVirtualPos'
import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import styles from '../booking.module.css'

interface Step4PaymentProps {
  state: BookingWizardState
  onBack: () => void
  onSubmit: () => void | Promise<void>
  ctaDisabled: boolean
  ui: BookingWizardUi
  /** Şartlar & Koşullar sayfası linki (varsayılan: /terms) */
  termsHref?: string
}

export default function Step4Payment({
  state,
  onBack,
  onSubmit,
  ctaDisabled,
  ui,
  termsHref = '/terms',
}: Step4PaymentProps) {
  const [loading, setLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(!isBookingOnlinePaymentEnabled)
  const p = state.pricingSummary

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (ctaDisabled || loading || !termsAccepted) return
    setLoading(true)
    try {
      await Promise.resolve(onSubmit())
    } finally {
      setLoading(false)
    }
  }

  if (!p) return null

  return (
    <form
      className={styles.stepContent}
      style={{ fontFamily: 'var(--font-family)' }}
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit(e)
      }}
      noValidate
    >
      <div className={styles.stepHeaderWithBack}>
        <button
          type="button"
          className={`${styles.stepBackBtn} ${styles.stepBackBtnSmall}`}
          onClick={onBack}
          aria-label={ui.backAria}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          {ui.back}
        </button>
      </div>

      <div className={`${styles.card} ${styles.paymentSummaryCard}`}>
        <div className={styles.paymentSummaryHeader}>
          <span className={styles.paymentSummaryIcon} aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
              <path d="M12 15a2 2 0 0 1 2 2v4H10v-4a2 2 0 0 1 2-2z" />
            </svg>
          </span>
          <div>
            <h3 className={styles.paymentSummaryTitle}>{ui.paymentSummaryTitle}</h3>
            <p className={styles.paymentSummarySubtitle}>{ui.paymentSummarySubtitle}</p>
          </div>
        </div>
        <div className={styles.paymentSummaryBody}>
          <div className={styles.paymentSummaryRow}>
            <span className={styles.paymentSummaryLabel}>{ui.paymentTotalPrice}</span>
            <span className={styles.paymentSummaryAmount}>{p.total.toLocaleString(ui.numberLocale)} ₺</span>
          </div>
          <div className={styles.paymentSummaryDue}>
            <span className={styles.paymentSummaryDueLabel}>{ui.paymentDueNow}</span>
            <span className={styles.paymentSummaryDueAmount}>
              {p.depositAmount.toLocaleString(ui.numberLocale)} ₺
              <span className={styles.paymentSummaryDueBadge}>{ui.depositBadge(p.depositPercent)}</span>
            </span>
          </div>
          <div className={styles.paymentSummaryRow}>
            <span className={styles.paymentSummaryLabel}>{ui.paymentRemainingTourDay}</span>
            <span className={styles.paymentSummaryAmount}>{p.remainingAmount.toLocaleString(ui.numberLocale)} ₺</span>
          </div>
        </div>
      </div>

      {!isBookingOnlinePaymentEnabled && (
        <div className={styles.virtualPosDisabledNotice} role="status">
          <strong>{ui.testModeTitle}</strong>{' '}
          {ui.testModeModalBeforePay}
          <em>{ui.payAria}</em>
          {ui.testModeModalAfterPay}
        </div>
      )}

      {isBookingOnlinePaymentEnabled && (
        <div className={styles.card}>
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
                aria-describedby="terms-checkbox-desc-nestpay"
              />
              <span id="terms-checkbox-desc-nestpay">
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

      <div className={styles.stepActions}>
        <div className={styles.stepActionsRow}>
          <button
            type="submit"
            className={styles.stepBtnPrimary}
            disabled={ctaDisabled || loading || !termsAccepted}
            aria-label={ui.payAria}
            style={{ width: '100%' }}
          >
            {loading ? ui.processing : ui.payAria}
          </button>
        </div>
      </div>
    </form>
  )
}
