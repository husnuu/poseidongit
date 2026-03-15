'use client'

import { useState } from 'react'
import type { BookingWizardState } from '@/lib/sanity/bookingTypes'
import FloatingInput from '@/components/ui/FloatingInput'
import PhoneField from '@/components/ui/PhoneField'
import styles from '../booking.module.css'

interface StepPaymentProps {
  state: BookingWizardState
}

export default function StepPayment({ state }: StepPaymentProps) {
  const p = state.pricingSummary
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [contactPhone, setContactPhone] = useState(state.customer.phone ?? '')

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
          <h3 className={styles.cardCaptionTitle}>Ödeme Bilgileri</h3>
        </div>
        <hr className={styles.cardDivider} />
        <div className={styles.cardContent}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryRowLabel}>
              Şimdi öde: {p.depositAmount.toLocaleString('tr-TR')} ₺ (%{p.depositPercent})
            </span>
            <span className={styles.summaryRowValue} />
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryRowLabel}>
              Kalan: {p.remainingAmount.toLocaleString('tr-TR')} ₺ (tur günü öde)
            </span>
            <span className={styles.summaryRowValue} />
          </div>
        </div>
      </div>

      <div className={styles.card} style={{ fontFamily: 'var(--font-family)' }}>
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
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            compact
          />

          <FloatingInput
            id="booking-cardNumber"
            label="Kart Numarası *"
            type="text"
            autoComplete="cc-number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            compact
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatingInput
              id="booking-cardExpiry"
              label="Son Kullanma (AA/YY) *"
              type="text"
              autoComplete="cc-exp"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(e.target.value)}
              compact
            />
            <FloatingInput
              id="booking-cardCvc"
              label="CVC *"
              type="text"
              autoComplete="cc-csc"
              value={cardCvc}
              onChange={(e) => setCardCvc(e.target.value)}
              compact
            />
          </div>

          <PhoneField
            label="Telefon *"
            value={contactPhone}
            onChange={(v) => setContactPhone(v ?? '')}
            onBlur={() => {}}
            defaultCountry="TR"
            compact
          />
        </div>
        </div>
      </div>
    </>
  )
}
