'use client'

import { useEffect, useState, useCallback } from 'react'
import type { TourForBooking, BookingWizardState } from '@/lib/sanity/bookingTypes'
import FloatingInput from '@/components/ui/FloatingInput'
import FloatingTextarea from '@/components/ui/FloatingTextarea'
import PhoneField from '@/components/ui/PhoneField'
import styles from '../booking.module.css'

interface StepCustomerProps {
  tour: TourForBooking
  state: BookingWizardState
  onUpdate: (patch: Partial<BookingWizardState>) => void
  onValidationChange: (valid: boolean) => void
}

const PHONE_MIN_DIGITS = 10
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function StepCustomer({
  tour,
  state,
  onUpdate,
  onValidationChange,
}: StepCustomerProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = useCallback(() => {
    const next: Record<string, string> = {}
    const c = state.customer
    if (!c.firstName?.trim()) next.firstName = 'Ad zorunludur.'
    if (!c.lastName?.trim()) next.lastName = 'Soyad zorunludur.'
    if (!c.email?.trim()) next.email = 'E-posta zorunludur.'
    else if (!EMAIL_REGEX.test(c.email)) next.email = 'Geçerli bir e-posta adresi giriniz.'
    const phoneDigits = (c.phone ?? '').replace(/\D/g, '')
    if (!phoneDigits.length) next.phone = 'Telefon zorunludur.'
    else if (phoneDigits.length < PHONE_MIN_DIGITS)
      next.phone = 'Geçerli bir telefon numarası giriniz.'
    setErrors(next)
    const valid = Object.keys(next).length === 0
    onValidationChange(valid)
  }, [state.customer, onValidationChange])

  useEffect(() => {
    validate()
  }, [validate])

  const handleField = (field: keyof BookingWizardState['customer'], value: string) => {
    onUpdate({
      customer: { ...state.customer, [field]: value },
    })
  }

  const totalPax = state.counts.adult + state.counts.child + state.counts.baby
  const dateStr = state.selectedDate
    ? new Date(state.selectedDate).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—'
  const totalPrice = state.pricingSummary?.total ?? 0
  const unitPrice =
    state.pricingSummary?.unitPrices?.find((u) => u.ageKey === 'adult')?.unitPrice ?? 0

  return (
    <>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Özet</h3>
        <div className={styles.summaryRow}>
          <span className={styles.summaryRowLabel}>Tur</span>
          <span className={styles.summaryRowValue}>{tour.title}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryRowLabel}>Tarih</span>
          <span className={styles.summaryRowValue}>{dateStr}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryRowLabel}>Kişi</span>
          <span className={styles.summaryRowValue}>{totalPax}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryRowLabel}>Birim fiyat (Yetişkin)</span>
          <span className={styles.summaryRowValue}>
            {unitPrice.toLocaleString('tr-TR')} ₺
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryRowLabel}>Toplam</span>
          <span className={styles.summaryRowValue}>
            {totalPrice.toLocaleString('tr-TR')} ₺
          </span>
        </div>
      </div>

      <section className="min-w-0" aria-labelledby="booking-form-heading">
        <h2 id="booking-form-heading" className="sr-only">
          Bilgileriniz
        </h2>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <form
            className="space-y-5"
            style={{ fontFamily: 'var(--font-family)' }}
            noValidate
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Row1: Ad | Soyad – contact’taki Full Name | Group Size ile aynı yapı */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FloatingInput
                id="booking-firstName"
                label="Ad *"
                autoComplete="given-name"
                value={state.customer.firstName}
                onChange={(e) => handleField('firstName', e.target.value)}
                error={errors.firstName}
              />
              <FloatingInput
                id="booking-lastName"
                label="Soyad *"
                autoComplete="family-name"
                value={state.customer.lastName}
                onChange={(e) => handleField('lastName', e.target.value)}
                error={errors.lastName}
              />
            </div>

            {/* Row2: E-posta | Telefon – contact’taki Email | Phone Number ile aynı */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FloatingInput
                id="booking-email"
                label="E-posta *"
                type="email"
                autoComplete="email"
                value={state.customer.email}
                onChange={(e) => handleField('email', e.target.value)}
                error={errors.email}
              />
              <PhoneField
                label="Telefon"
                name="phone"
                value={state.customer.phone ?? ''}
                onChange={(v) => handleField('phone', v ?? '')}
                onBlur={() => {}}
                error={errors.phone}
                defaultCountry="TR"
              />
            </div>

            {/* Row3: Özel istek – contact’taki Message * ile aynı tam genişlik, rows=5 */}
            <FloatingTextarea
              id="booking-note"
              label="Özel istek (opsiyonel)"
              rows={5}
              value={state.customer.note ?? ''}
              onChange={(e) => handleField('note', e.target.value)}
            />
          </form>
        </div>
      </section>
    </>
  )
}
