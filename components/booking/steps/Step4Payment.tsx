'use client'

import { useState } from 'react'
import type { BookingWizardState } from '@/lib/sanity/bookingTypes'
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
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit(e)
      }}
      noValidate
    >
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Ödeme Özeti</h3>
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

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Kart Bilgileri</h3>
        <label htmlFor="booking-cardName" className="block mb-1 text-sm font-medium text-zinc-900">
          Kart Sahibi Adı
        </label>
        <input
          id="booking-cardName"
          type="text"
          autoComplete="cc-name"
          className={styles.input}
          placeholder="Ad Soyad"
          style={{ marginBottom: 12 }}
        />
        <label htmlFor="booking-cardNumber" className="block mb-1 text-sm font-medium text-zinc-900">
          Kart Numarası
        </label>
        <input
          id="booking-cardNumber"
          type="text"
          autoComplete="cc-number"
          className={styles.input}
          placeholder="0000 0000 0000 0000"
          style={{ marginBottom: 12 }}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="booking-cardExpiry" className="block mb-1 text-sm font-medium text-zinc-900">
              Son Kullanma
            </label>
            <input
              id="booking-cardExpiry"
              type="text"
              autoComplete="cc-exp"
              className={styles.input}
              placeholder="AA/YY"
            />
          </div>
          <div>
            <label htmlFor="booking-cardCvc" className="block mb-1 text-sm font-medium text-zinc-900">
              CVC
            </label>
            <input
              id="booking-cardCvc"
              type="text"
              autoComplete="cc-csc"
              className={styles.input}
              placeholder="000"
            />
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
