'use client'

import { useState } from 'react'
import type { BookingWizardState } from '@/lib/sanity/bookingTypes'
import FloatingInput from '@/components/ui/FloatingInput'
import styles from '../booking.module.css'

interface Step4PaymentProps {
  state: BookingWizardState
  onBack: () => void
  onSubmit: () => void | Promise<void>
  ctaDisabled: boolean
}

export default function Step4Payment({ state, onBack, onSubmit, ctaDisabled }: Step4PaymentProps) {
  const [loading, setLoading] = useState(false)
  const p = state.pricingSummary

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (ctaDisabled || loading) return
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
      <div className={styles.card}>
        <div className={styles.cardCaption}>
          <span className={styles.cardCaptionIcon} aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
              <path d="M12 15a2 2 0 0 1 2 2v4H10v-4a2 2 0 0 1 2-2z" />
            </svg>
          </span>
          <h3 className={styles.cardCaptionTitle}>Ödeme Özeti</h3>
        </div>
        <hr className={styles.cardDivider} />
        <div className={styles.cardContent}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryRowLabel}>
              Şimdi öde (%{p.depositPercent})
            </span>
            <span className={styles.summaryRowValue} style={{ color: 'var(--primary)' }}>
              {p.depositAmount.toLocaleString('tr-TR')} ₺
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryRowLabel}>Kalan (tur günü öde)</span>
            <span className={styles.summaryRowValue}>
              {p.remainingAmount.toLocaleString('tr-TR')} ₺
            </span>
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
          </div>
        </div>
      </div>

      <div className={styles.stepActions}>
        <div className={styles.stepActionsRow}>
          <button type="button" className={styles.stepBtnBack} onClick={onBack} aria-label="Önceki adıma dön">
            Geri
          </button>
          <button
            type="submit"
            className={styles.stepBtnPrimary}
            disabled={ctaDisabled || loading}
            aria-label="Ödemeyi tamamla"
          >
            {loading ? 'İşleniyor…' : 'Ödemeyi Tamamla'}
          </button>
        </div>
      </div>
    </form>
  )
}
