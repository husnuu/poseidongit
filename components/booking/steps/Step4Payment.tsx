'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { BookingWizardState } from '@/lib/sanity/bookingTypes'
import FloatingInput from '@/components/ui/FloatingInput'
import styles from '../booking.module.css'

interface Step4PaymentProps {
  state: BookingWizardState
  onBack: () => void
  onSubmit: () => void | Promise<void>
  ctaDisabled: boolean
  /** Şartlar & Koşullar sayfası linki (varsayılan: /terms) */
  termsHref?: string
}

export default function Step4Payment({ state, onBack, onSubmit, ctaDisabled, termsHref = '/terms' }: Step4PaymentProps) {
  const [loading, setLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
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
          aria-label="Önceki adıma dön"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Geri
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
            <h3 className={styles.paymentSummaryTitle}>Ödeme Özeti</h3>
            <p className={styles.paymentSummarySubtitle}>Toplam fiyat ve şimdi ödeyeceğiniz tutar</p>
          </div>
        </div>
        <div className={styles.paymentSummaryBody}>
          <div className={styles.paymentSummaryRow}>
            <span className={styles.paymentSummaryLabel}>Toplam fiyat</span>
            <span className={styles.paymentSummaryAmount}>{p.total.toLocaleString('tr-TR')} ₺</span>
          </div>
          <div className={styles.paymentSummaryDue}>
            <span className={styles.paymentSummaryDueLabel}>Şimdi ödenecek tutar</span>
            <span className={styles.paymentSummaryDueAmount}>
              {p.depositAmount.toLocaleString('tr-TR')} ₺
              <span className={styles.paymentSummaryDueBadge}>%{p.depositPercent} kapora</span>
            </span>
          </div>
          <div className={styles.paymentSummaryRow}>
            <span className={styles.paymentSummaryLabel}>Kalan (tur günü öde)</span>
            <span className={styles.paymentSummaryAmount}>{p.remainingAmount.toLocaleString('tr-TR')} ₺</span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardCaption}>
          <span className={styles.cardCaptionIcon} aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
          </span>
          <h3 className={styles.cardCaptionTitle}>Kart Bilgileri</h3>
        </div>
        <hr className={styles.cardDivider} />
        <div className={styles.cardContent}>
          <div className="space-y-4">
            <FloatingInput
              id="booking-cardName"
              label="Kart Sahibi Adı *"
              type="text"
              autoComplete="cc-name"
              compact
            />
            <FloatingInput
              id="booking-cardNumber"
              label="Kart Numarası *"
              type="text"
              autoComplete="cc-number"
              compact
            />
            <div className="grid grid-cols-2 gap-4">
              <FloatingInput
                id="booking-cardExpiry"
                label="Son Kullanma (AA/YY) *"
                type="text"
                autoComplete="cc-exp"
                compact
              />
              <FloatingInput
                id="booking-cardCvc"
                label="CVC *"
                type="text"
                autoComplete="cc-csc"
                compact
              />
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-zinc-600">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                aria-describedby="terms-checkbox-desc"
              />
              <span id="terms-checkbox-desc">
                <Link href={termsHref} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                  Şartlar &amp; Koşullar
                </Link>
                &apos;ı okudum ve kabul ediyorum.
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className={styles.stepActions}>
        <div className={styles.stepActionsRow}>
          <button
            type="submit"
            className={styles.stepBtnPrimary}
            disabled={ctaDisabled || loading || !termsAccepted}
            aria-label="Ödemeyi tamamla"
            style={{ width: '100%' }}
          >
            {loading ? 'İşleniyor…' : 'Ödemeyi Tamamla'}
          </button>
        </div>
      </div>
    </form>
  )
}
