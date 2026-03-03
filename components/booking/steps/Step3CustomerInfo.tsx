'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import type { TourForBooking, BookingWizardState } from '@/lib/sanity/bookingTypes'
import PhoneCountryCodeSelect from '../PhoneCountryCodeSelect'
import styles from '../booking.module.css'

const PHONE_MIN_LENGTH = 10
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Step3CustomerInfoProps {
  tour: TourForBooking
  state: BookingWizardState
  onUpdate: (patch: Partial<BookingWizardState>) => void
  onValidationChange: (valid: boolean) => void
  onBack: () => void
  onNext: () => void
  canProceed: boolean
  ctaLabel: string
  ctaDisabled: boolean
}

export default function Step3CustomerInfo({
  tour,
  state,
  onUpdate,
  onValidationChange,
  onBack,
  onNext,
  ctaLabel,
  ctaDisabled,
}: Step3CustomerInfoProps) {
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
    else if (phoneDigits.length < PHONE_MIN_LENGTH)
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

  const tourImageUrl =
    tour.mainImage?.asset
      ? urlFor(tour.mainImage.asset).width(500).height(360).quality(90).fit('crop').url()
      : tour.mainImage?.url
        ? `${tour.mainImage.url}?w=500&h=360&fit=crop&q=90`
        : null

  return (
    <div className={styles.stepContent}>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Özet</h3>
        <div className={styles.summaryWithImage}>
          {tourImageUrl && (
            <div className={styles.summaryImageWrap}>
              <Image
                src={tourImageUrl}
                alt={tour.title}
                width={500}
                height={360}
                sizes="(max-width: 480px) 100vw, 140px"
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}
          <div className={styles.summaryBody}>
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
              <span className={styles.summaryRowValue}>{unitPrice.toLocaleString('tr-TR')} ₺</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryRowLabel}>Toplam</span>
              <span className={styles.summaryRowValue}>{totalPrice.toLocaleString('tr-TR')} ₺</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Bilgileriniz</h3>

        <label htmlFor="booking-firstName" className="block mb-1 text-sm font-medium text-zinc-900">
          Ad
        </label>
        <input
          id="booking-firstName"
          type="text"
          autoComplete="given-name"
          className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
          placeholder="Adınız"
          value={state.customer.firstName}
          onChange={(e) => handleField('firstName', e.target.value)}
        />
        {errors.firstName && <p className={styles.errorText}>{errors.firstName}</p>}

        <label htmlFor="booking-lastName" className="block mt-3 mb-1 text-sm font-medium text-zinc-900">
          Soyad
        </label>
        <input
          id="booking-lastName"
          type="text"
          autoComplete="family-name"
          className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
          placeholder="Soyadınız"
          value={state.customer.lastName}
          onChange={(e) => handleField('lastName', e.target.value)}
        />
        {errors.lastName && <p className={styles.errorText}>{errors.lastName}</p>}

        <label htmlFor="booking-email" className="block mt-3 mb-1 text-sm font-medium text-zinc-900">
          E-posta
        </label>
        <input
          id="booking-email"
          type="email"
          autoComplete="email"
          className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
          placeholder="ornek@email.com"
          value={state.customer.email}
          onChange={(e) => handleField('email', e.target.value)}
        />
        {errors.email && <p className={styles.errorText}>{errors.email}</p>}

        <label htmlFor="booking-phone" className="block mt-3 mb-1 text-sm font-medium text-zinc-900">
          Telefon
        </label>
        <div className="flex gap-2" style={{ alignItems: 'stretch' }}>
          <PhoneCountryCodeSelect
            id="booking-phone-country"
            aria-label="Ülke kodu"
            value={state.customer.phoneCountryCode ?? '90'}
            onChange={(code) => handleField('phoneCountryCode', code)}
          />
          <input
            id="booking-phone"
            type="tel"
            autoComplete="tel-national"
            className={`${styles.input} flex-1 ${errors.phone ? styles.inputError : ''}`}
            placeholder="5XX XXX XX XX"
            value={state.customer.phone}
            onChange={(e) => handleField('phone', e.target.value)}
            style={{ paddingLeft: 10 }}
          />
        </div>
        {errors.phone && <p className={styles.errorText}>{errors.phone}</p>}

        <label htmlFor="booking-note" className="block mt-3 mb-1 text-sm font-medium text-zinc-900">
          Özel istek (opsiyonel)
        </label>
        <textarea
          id="booking-note"
          className={styles.input}
          rows={2}
          placeholder="Özel istekleriniz"
          value={state.customer.note ?? ''}
          onChange={(e) => handleField('note', e.target.value)}
        />
      </div>

      <div className={styles.stepActions}>
        <div className={styles.stepActionsRow}>
          <button type="button" className={styles.stepBtnBack} onClick={onBack} aria-label="Önceki adıma dön">
            Geri
          </button>
          <button
            type="button"
            className={styles.stepBtnPrimary}
            onClick={onNext}
            disabled={ctaDisabled}
            aria-label={ctaLabel}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
