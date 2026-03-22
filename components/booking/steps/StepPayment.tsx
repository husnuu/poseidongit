'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { BookingWizardState } from '@/lib/sanity/bookingTypes'
import { isBookingOnlinePaymentEnabled } from '@/lib/bookingVirtualPos'
import FloatingInput from '@/components/ui/FloatingInput'
import PhoneField from '@/components/ui/PhoneField'
import styles from '../booking.module.css'

interface StepPaymentProps {
  state: BookingWizardState
  /** Şartlar & Koşullar linki (varsayılan: /terms) */
  termsHref?: string
  /** Checkbox değişince parent'ın ödeme butonunu devre dışı bırakması için */
  onTermsAcceptanceChange?: (accepted: boolean) => void
}

export default function StepPayment({ state, termsHref = '/terms', onTermsAcceptanceChange }: StepPaymentProps) {
  const p = state.pricingSummary
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [contactPhone, setContactPhone] = useState(state.customer.phone ?? '')
  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    if (!isBookingOnlinePaymentEnabled) {
      onTermsAcceptanceChange?.(false)
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

      {!isBookingOnlinePaymentEnabled && (
        <div className={styles.virtualPosDisabledNotice} role="status">
          <strong>Sanal POS şu anda aktif değil</strong>
          Online kart ödemesi geçici olarak kapalıdır. Rezervasyonu tamamlamak için lütfen bizimle iletişime geçin veya
          önceki adıma dönüp seçiminizi gözden geçirin.
        </div>
      )}

      {isBookingOnlinePaymentEnabled && (
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

          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]"
              aria-describedby="terms-checkbox-desc-step"
            />
            <span id="terms-checkbox-desc-step">
              <Link href={termsHref} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                Şartlar &amp; Koşullar
              </Link>
              &apos;ı okudum ve kabul ediyorum.
            </span>
          </label>
        </div>
        </div>
      </div>
      )}
    </>
  )
}
