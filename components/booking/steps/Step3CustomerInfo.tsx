'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import type { TourForBooking, BookingWizardState } from '@/lib/sanity/bookingTypes'
import { validateAdditionalTravelers } from '@/lib/bookingAdditionalTravelers'
import FloatingInput from '@/components/ui/FloatingInput'
import AdditionalTravelersFields from './AdditionalTravelersFields'
import MealPreferenceFields, { isTourMealMenuActive, tourMealOptions } from './MealPreferenceFields'
import FloatingTextarea from '@/components/ui/FloatingTextarea'
import PhoneField from '@/components/ui/PhoneField'
import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'
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
  ui: BookingWizardUi
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
  ui,
}: Step3CustomerInfoProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = useCallback(() => {
    const next: Record<string, string> = {}
    const c = state.customer
    const v = ui.validation
    if (!c.firstName?.trim()) next.firstName = v.firstName
    if (!c.lastName?.trim()) next.lastName = v.lastName
    if (!c.email?.trim()) next.email = v.emailRequired
    else if (!EMAIL_REGEX.test(c.email)) next.email = v.emailInvalid
    const phoneDigits = (c.phone ?? '').replace(/\D/g, '')
    if (!phoneDigits.length) next.phone = v.phoneRequired
    else if (phoneDigits.length < PHONE_MIN_LENGTH) next.phone = v.phoneInvalid
    Object.assign(
      next,
      validateAdditionalTravelers(state.additionalTravelers, state.counts, {
        requireMealPreference: isTourMealMenuActive(tour),
        messages: {
          firstName: v.travelerFirst,
          lastName: v.travelerLast,
          meal: v.mealPreference,
        },
      })
    )
    setErrors(next)
    const valid = Object.keys(next).length === 0
    onValidationChange(valid)
  }, [state.customer, state.additionalTravelers, state.counts, onValidationChange, tour, ui.validation])

  useEffect(() => {
    validate()
  }, [validate])

  const handleField = (field: keyof BookingWizardState['customer'], value: string) => {
    onUpdate({
      customer: { ...state.customer, [field]: value },
    })
  }

  const pickupPoints = tour.pickupPoints?.filter((p) => p.name?.trim()) ?? []
  const hasPickupPoints = pickupPoints.length > 0
  const defaultPickup = pickupPoints.find((p) => p.isDefault) ?? pickupPoints[0]
  const defaultMeetingPoint =
    defaultPickup?.address?.trim()
      ? `${defaultPickup.name?.trim() ?? ''} – ${defaultPickup.address.trim()}`.trim()
      : defaultPickup?.name?.trim() ?? ''
  const hasSetDefaultPickup = useRef(false)
  useEffect(() => {
    if (hasPickupPoints && defaultMeetingPoint && !hasSetDefaultPickup.current) {
      hasSetDefaultPickup.current = true
      onUpdate({ meetingPoint: defaultMeetingPoint })
    }
  }, [hasPickupPoints, defaultMeetingPoint, onUpdate])

  const totalPax = state.counts.adult + state.counts.child + state.counts.baby
  const dateStr = state.selectedDate
    ? new Date(state.selectedDate).toLocaleDateString(ui.numberLocale, {
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
  const defaultPickupForAddress = tour.pickupPoints?.find((p) => p.isDefault) ?? tour.pickupPoints?.[0]
  const tourAddress =
    defaultPickupForAddress?.address?.trim() ||
    (defaultPickupForAddress?.name?.trim() ? defaultPickupForAddress.name.trim() : null) ||
    '—'
  const selectedClassLabel =
    tour.ticketClasses?.find((c) => c.key === state.selectedClassKey)?.label ?? '—'

  return (
    <div className={styles.stepContent} style={{ fontFamily: 'var(--font-family)' }}>
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
          <h3 className={`${styles.cardCaptionTitle} ${styles.wizardMainStepTitle}`}>{ui.summaryTitle}</h3>
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
              <span className={styles.summaryHeroOverlay}>{ui.tourOverlayLabel}</span>
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
              <span className={styles.summaryInfoLabel}>{ui.labelDate}</span>
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
              <span className={styles.summaryInfoLabel}>{ui.labelClass}</span>
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
              <span className={styles.summaryInfoLabel}>{ui.labelParticipants}</span>
              <span className={styles.summaryInfoValue}>{ui.peopleCount(totalPax)}</span>
            </div>
            <div className={styles.summaryInfoRow}>
              <span className={styles.summaryInfoIcon} aria-hidden>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </span>
              <span className={styles.summaryInfoLabel}>{ui.labelUnitPrice}</span>
              <span className={styles.summaryInfoValue}>{unitPrice.toLocaleString(ui.numberLocale)} ₺</span>
            </div>
          </div>

          <div className={styles.summaryTotalBox}>
            <p className={styles.summaryTotalLabel}>{ui.totalLabel}</p>
            <p className={styles.summaryTotalValue}>{totalPrice.toLocaleString(ui.numberLocale)} ₺</p>
          </div>
          {state.pricingSummary && (
            <div className={styles.summaryDueBox}>
              <p className={styles.summaryDueLabel}>{ui.dueNowLabel}</p>
              <p className={styles.summaryDueValue}>
                {state.pricingSummary.depositAmount.toLocaleString(ui.numberLocale)} ₺
                <span className={styles.summaryDueBadge}>%{state.pricingSummary.depositPercent}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardCaption}>
          <span className={styles.cardCaptionIcon} aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <h3 className={`${styles.cardCaptionTitle} ${styles.wizardMainStepTitle}`}>{ui.yourDetailsTitle}</h3>
        </div>
        <hr className={styles.cardDivider} />
        <div className={styles.cardContent}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 20 }}>
            <FloatingInput
              id="booking-firstName"
              label={ui.labelFirstName}
              autoComplete="given-name"
              value={state.customer.firstName}
              onChange={(e) => handleField('firstName', e.target.value)}
              error={errors.firstName}
              compact
              variant="outlined"
            />
            <FloatingInput
              id="booking-lastName"
              label={ui.labelLastName}
              autoComplete="family-name"
              value={state.customer.lastName}
              onChange={(e) => handleField('lastName', e.target.value)}
              error={errors.lastName}
              compact
              variant="outlined"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 20 }}>
            <FloatingInput
              id="booking-email"
              label={ui.labelEmail}
              type="email"
              autoComplete="email"
              value={state.customer.email}
              onChange={(e) => handleField('email', e.target.value)}
              error={errors.email}
              compact
              variant="outlined"
            />
            <PhoneField
              label={ui.labelPhone}
              name="phone"
              value={state.customer.phone ?? ''}
              onChange={(v) => handleField('phone', v ?? '')}
              onBlur={() => {}}
              error={errors.phone}
              defaultCountry="TR"
              compact
              variant="outlined"
            />
          </div>

          {hasPickupPoints && (
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="booking-pickup" className={styles.formLabel}>
                {ui.pickupLabel}
              </label>
              <select
                id="booking-pickup"
                className={styles.input}
                value={state.meetingPoint ?? ''}
                onChange={(e) => onUpdate({ meetingPoint: e.target.value || undefined })}
                aria-label={ui.pickupAria}
                style={{ marginTop: 6, width: '100%' }}
              >
                {pickupPoints.map((p) => {
                  const label = p.address?.trim()
                    ? `${p.name?.trim() ?? ''} – ${p.address.trim()}`.trim()
                    : (p.name?.trim() ?? '')
                  return (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  )
                })}
              </select>
            </div>
          )}

          <MealPreferenceFields
            tour={tour}
            state={state}
            onUpdate={onUpdate}
            error={errors.mealPreference}
            mealFallbackTitle={ui.mealFallbackTitle}
          />

          <FloatingTextarea
            id="booking-note"
            label={ui.labelNote}
            rows={3}
            value={state.customer.note ?? ''}
            onChange={(e) => handleField('note', e.target.value)}
            variant="outlined"
          />

          <AdditionalTravelersFields
            state={state}
            onUpdate={onUpdate}
            errors={errors}
            mealOptions={isTourMealMenuActive(tour) ? tourMealOptions(tour) : undefined}
            compact
            variant="outlined"
            ui={ui}
          />
        </div>
      </div>

      <div className={styles.stepActions}>
        <div className={styles.stepActionsRow}>
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
