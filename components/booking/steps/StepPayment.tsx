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
      {/* Özet kartı – contact ile aynı card görünümü */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h3 className={styles.cardTitle}>Ödeme Bilgileri</h3>
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

      {/* Kart bilgileri – contact form ile aynı card + kutucuklar + telefon componenti */}
      <div
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
        style={{ fontFamily: 'var(--font-family)' }}
      >
        <h3 className={styles.cardTitle}>Kart Bilgileri</h3>

        <div className="space-y-5">
          <FloatingInput
            id="booking-cardName"
            label="Kart Sahibi Adı *"
            type="text"
            autoComplete="cc-name"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
          />

          <FloatingInput
            id="booking-cardNumber"
            label="Kart Numarası *"
            type="text"
            autoComplete="cc-number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FloatingInput
              id="booking-cardExpiry"
              label="Son Kullanma (AA/YY) *"
              type="text"
              autoComplete="cc-exp"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(e.target.value)}
            />
            <FloatingInput
              id="booking-cardCvc"
              label="CVC *"
              type="text"
              autoComplete="cc-csc"
              value={cardCvc}
              onChange={(e) => setCardCvc(e.target.value)}
            />
          </div>

          {/* Contact formdaki ile birebir aynı telefon componenti */}
          <PhoneField
            label="Phone Number"
            value={contactPhone}
            onChange={(v) => setContactPhone(v ?? '')}
            onBlur={() => {}}
            defaultCountry="TR"
          />
        </div>
      </div>
    </>
  )
}
