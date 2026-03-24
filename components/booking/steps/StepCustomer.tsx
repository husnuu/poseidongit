'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'
import type { TourForBooking, BookingWizardState } from '@/lib/sanity/bookingTypes'
import { urlFor } from '@/lib/sanity'
import { validateAdditionalTravelers } from '@/lib/bookingAdditionalTravelers'
import FloatingInput from '@/components/ui/FloatingInput'
import AdditionalTravelersFields from './AdditionalTravelersFields'
import MealPreferenceFields, { isTourMealMenuActive, tourMealOptions } from './MealPreferenceFields'
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
    Object.assign(
      next,
      validateAdditionalTravelers(state.additionalTravelers, state.counts, {
        requireMealPreference: isTourMealMenuActive(tour),
      })
    )
    setErrors(next)
    const valid = Object.keys(next).length === 0
    onValidationChange(valid)
  }, [state.customer, state.additionalTravelers, state.counts, onValidationChange])

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
  const tourImageUrl = tour.mainImage?.asset
    ? urlFor(tour.mainImage.asset).width(600).height(340).quality(90).fit('crop').url()
    : tour.mainImage?.url
      ? `${tour.mainImage.url}?w=600&h=340&fit=crop&q=90`
      : null
  const defaultPickup = tour.pickupPoints?.find((p) => p.isDefault) ?? tour.pickupPoints?.[0]
  const tourAddress =
    defaultPickup?.address?.trim() ||
    (defaultPickup?.name?.trim() ? defaultPickup.name.trim() : null) ||
    '—'
  const selectedClassLabel =
    tour.ticketClasses?.find((c) => c.key === state.selectedClassKey)?.label ?? '—'

  return (
    <>
      <div className={`${styles.card} ${styles.summaryCardPremium}`}>
        <div className={styles.cardCaption}>
          <span className={styles.cardCaptionIcon} aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
              <path d="M10 9H8" />
            </svg>
          </span>
          <h3 className={`${styles.cardCaptionTitle} ${styles.wizardMainStepTitle}`}>Özet</h3>
        </div>
        <hr className={styles.cardDivider} />
        <div className={styles.cardContent}>
          {tourImageUrl && (
            <div className={styles.summaryHero}>
              <Image
                src={tourImageUrl}
                alt={tour.title}
                fill
                sizes="(max-width: 520px) 100vw, 472px"
                className={styles.summaryHeroImage}
                style={{ objectFit: 'cover' }}
              />
              <span className={styles.summaryHeroOverlay}>Tekne Turu</span>
            </div>
          )}
          <h4 className={styles.summaryTourTitle}>{tour.title}</h4>
          {tourAddress !== '—' && (
            <p className={styles.summaryTourSubtitle}>{tourAddress}</p>
          )}

          <div className={styles.summarySection}>
            <div className={styles.summaryInfoRow}>
              <span className={styles.summaryInfoIcon} aria-hidden>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              </span>
              <span className={styles.summaryInfoLabel}>Tarih</span>
              <span className={styles.summaryInfoValue}>{dateStr}</span>
            </div>
            <div className={styles.summaryInfoRow}>
              <span className={styles.summaryInfoIcon} aria-hidden>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                  <path d="M13 5v2" />
                  <path d="M13 17v2" />
                  <path d="M13 11v2" />
                </svg>
              </span>
              <span className={styles.summaryInfoLabel}>Sınıf</span>
              <span className={styles.summaryInfoValue}>{selectedClassLabel}</span>
            </div>
            <div className={styles.summaryInfoRow}>
              <span className={styles.summaryInfoIcon} aria-hidden>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <span className={styles.summaryInfoLabel}>Katılımcı</span>
              <span className={styles.summaryInfoValue}>{totalPax} kişi</span>
            </div>
            <div className={styles.summaryInfoRow}>
              <span className={styles.summaryInfoIcon} aria-hidden>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </span>
              <span className={styles.summaryInfoLabel}>Birim fiyat</span>
              <span className={styles.summaryInfoValue}>{unitPrice.toLocaleString('tr-TR')} ₺</span>
            </div>
          </div>

          <div className={styles.summaryTotalBox}>
            <p className={styles.summaryTotalLabel}>Toplam</p>
            <p className={styles.summaryTotalValue}>{totalPrice.toLocaleString('tr-TR')} ₺</p>
          </div>
          {state.pricingSummary && (
            <div className={styles.summaryDueBox}>
              <p className={styles.summaryDueLabel}>Şimdi ödenecek tutar</p>
              <p className={styles.summaryDueValue}>
                {state.pricingSummary.depositAmount.toLocaleString('tr-TR')} ₺
                <span className={styles.summaryDueBadge}>%{state.pricingSummary.depositPercent}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      <section className="min-w-0" aria-labelledby="booking-form-heading">
        <h2 id="booking-form-heading" className="sr-only">
          Bilgileriniz
        </h2>
        <div className={styles.card}>
          <div className={styles.cardCaption}>
            <span className={styles.cardCaptionIcon} aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <h3 className={`${styles.cardCaptionTitle} ${styles.wizardMainStepTitle}`}>Bilgileriniz</h3>
          </div>
          <hr className={styles.cardDivider} />
          <div className={styles.cardContent}>
            <form
            className="space-y-5"
            style={{ fontFamily: 'var(--font-family)' }}
            noValidate
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Row1: Ad | Soyad – contact’taki Full Name | Group Size ile aynı yapı */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingInput
                id="booking-firstName"
                label="Ad *"
                autoComplete="given-name"
                value={state.customer.firstName}
                onChange={(e) => handleField('firstName', e.target.value)}
                error={errors.firstName}
                compact
              />
              <FloatingInput
                id="booking-lastName"
                label="Soyad *"
                autoComplete="family-name"
                value={state.customer.lastName}
                onChange={(e) => handleField('lastName', e.target.value)}
                error={errors.lastName}
                compact
              />
            </div>

            {/* Row2: E-posta | Telefon – contact’taki Email | Phone Number ile aynı */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingInput
                id="booking-email"
                label="E-posta *"
                type="email"
                autoComplete="email"
                value={state.customer.email}
                onChange={(e) => handleField('email', e.target.value)}
                error={errors.email}
                compact
              />
              <PhoneField
                label="Telefon *"
                name="phone"
                value={state.customer.phone ?? ''}
                onChange={(v) => handleField('phone', v ?? '')}
                onBlur={() => {}}
                error={errors.phone}
                defaultCountry="TR"
                compact
              />
            </div>

            <MealPreferenceFields
              tour={tour}
              state={state}
              onUpdate={onUpdate}
              error={errors.mealPreference}
            />

            {/* Row3: Özel istek – contact’taki Message * ile aynı tam genişlik, rows=5 */}
            <FloatingTextarea
              id="booking-note"
              label="Özel istek (opsiyonel)"
              rows={3}
              value={state.customer.note ?? ''}
              onChange={(e) => handleField('note', e.target.value)}
            />

            <AdditionalTravelersFields
              state={state}
              onUpdate={onUpdate}
              errors={errors}
              mealOptions={isTourMealMenuActive(tour) ? tourMealOptions(tour) : undefined}
              compact
            />

              <div className={styles.cardNoticeSuccess}>
                <Check className={styles.cardNoticeSuccessIcon} aria-hidden />
                <span>Bilet bilgileriniz SMS ve e-postayla ücretsiz gönderilecektir.</span>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
