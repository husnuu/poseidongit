'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import { CalendarDays, Ticket, Users, ChevronLeft, User } from 'lucide-react'
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
  onTermsAcceptanceChange?: (accepted: boolean) => void
  onBack: () => void
  onNext: () => void
  canProceed: boolean
  ctaLabel: string
  ctaDisabled: boolean
  ui: BookingWizardUi
  termsHref?: string
}

export default function Step3CustomerInfo({
  tour,
  state,
  onUpdate,
  onValidationChange,
  onTermsAcceptanceChange,
  onBack,
  onNext,
  ctaLabel,
  ctaDisabled,
  ui,
  termsHref = '/terms',
}: Step3CustomerInfoProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    onTermsAcceptanceChange?.(termsAccepted)
  }, [termsAccepted, onTermsAcceptanceChange])

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
    if (isTourMealMenuActive(tour) && !state.mealPreferenceKey?.trim()) {
      next.mealPreference = v.mealPreference ?? 'Lütfen yemek tercihinizi seçin.'
    }
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
    onValidationChange(Object.keys(next).length === 0)
  }, [state.customer, state.additionalTravelers, state.counts, state.mealPreferenceKey, onValidationChange, tour, ui.validation])

  useEffect(() => { validate() }, [validate])

  const handleField = (field: keyof BookingWizardState['customer'], value: string) => {
    onUpdate({ customer: { ...state.customer, [field]: value } })
  }

  const pickupPoints = tour.pickupPoints?.filter((p) => p.name?.trim()) ?? []
  const hasPickupPoints = pickupPoints.length > 0
  const defaultPickup = pickupPoints.find((p) => p.isDefault) ?? pickupPoints[0]
  const defaultMeetingPoint = defaultPickup?.address?.trim()
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
    ? new Date(state.selectedDate + 'T00:00:00').toLocaleDateString(ui.numberLocale, {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—'
  const totalPrice = state.pricingSummary?.total ?? 0
  const selectedClassLabel =
    tour.ticketClasses?.find((c) => c.key === state.selectedClassKey)?.label ?? '—'

  const tourImageUrl = tour.mainImage?.asset
    ? urlFor(tour.mainImage.asset).width(600).height(340).quality(90).fit('crop').url()
    : tour.mainImage?.url
      ? `${tour.mainImage.url}?w=600&h=340&fit=crop&q=90`
      : null

  const defaultPickupForAddress = tour.pickupPoints?.find((p) => p.isDefault) ?? tour.pickupPoints?.[0]
  const tourAddress =
    defaultPickupForAddress?.address?.trim() ||
    defaultPickupForAddress?.name?.trim() ||
    null

  return (
    <div className={styles.stepContent} style={{ fontFamily: 'var(--font-family)' }}>

      {/* ── Rezervasyon özeti ── */}
      <div className={styles.sectionFlat}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <CalendarDays width={18} height={18} className={styles.sectionIcon} aria-hidden />
            <h3 className={styles.sectionTitle}>{ui.summaryTitle}</h3>
          </div>
        </div>

        {/* Tur görseli */}
        {tourImageUrl && (
          <Image
            src={tourImageUrl}
            alt={tour.title ?? ''}
            width={600}
            height={340}
            className={styles.summaryTourImage}
          />
        )}

        <p className={styles.summaryTourName}>{tour.title}</p>
        {tourAddress && <p className={styles.summaryTourAddr}>{tourAddress}</p>}

        {/* Meta chip'ler */}
        <div className={styles.summaryMetaRow}>
          <span className={styles.summaryMetaChip}>
            <CalendarDays width={12} height={12} aria-hidden />
            {dateStr}
          </span>
          <span className={styles.summaryMetaChip}>
            <Ticket width={12} height={12} aria-hidden />
            {selectedClassLabel}
          </span>
          <span className={styles.summaryMetaChip}>
            <Users width={12} height={12} aria-hidden />
            {ui.peopleCount(totalPax)}
          </span>
        </div>

        {/* Fiyat özeti */}
        <div className={styles.summaryPriceBlock}>
          {/* Kişi başı fiyat satırları */}
          {(state.pricingSummary?.unitPrices ?? []).map((u) => {
            if (u.count === 0) return null
            const label = u.ageKey === 'adult'
              ? ui.adult
              : u.ageKey === 'child'
                ? ui.child
                : ui.baby
            return (
              <div key={u.ageKey} className={styles.summaryPriceRow}>
                <span className={styles.summaryPriceLbl}>
                  {label} × {u.count}
                </span>
                <span className={styles.summaryPriceVal}>
                  {u.subtotal.toLocaleString(ui.numberLocale)} ₺
                </span>
              </div>
            )
          })}

          {/* Toplam */}
          <div className={`${styles.summaryPriceRow} ${styles.summaryPriceRowTotal}`}>
            <span className={styles.summaryPriceLbl}>{ui.totalLabel}</span>
            <span className={styles.summaryPriceVal}>
              {totalPrice.toLocaleString(ui.numberLocale)} ₺
            </span>
          </div>

          {/* Bugün ödenecek */}
          {state.pricingSummary && (
            <div className={`${styles.summaryPriceRow} ${styles.summaryPriceRowDeposit}`}>
              <span className={styles.summaryPriceLbl}>{ui.dueNowLabel}</span>
              <span className={styles.summaryPriceVal}>
                {state.pricingSummary.depositAmount.toLocaleString(ui.numberLocale)} ₺
                <span className={styles.summaryDepositBadge}>
                  %{state.pricingSummary.depositPercent}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Bilgileriniz ── */}
      <div className={styles.sectionFlat}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <User width={18} height={18} className={styles.sectionIcon} aria-hidden />
            <h3 className={styles.sectionTitle}>{ui.yourDetailsTitle}</h3>
          </div>
        </div>

        {/* Ad — Soyad */}
        <div className={styles.formGrid2}>
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

        {/* E-posta — Telefon */}
        <div className={styles.formGrid2}>
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

        {/* Toplanma noktası */}
        {hasPickupPoints && (
          <div className={styles.formField}>
            <label htmlFor="booking-pickup" className={styles.formLabel}>
              {ui.pickupLabel}
            </label>
            <select
              id="booking-pickup"
              className={styles.select}
              value={state.meetingPoint ?? ''}
              onChange={(e) => onUpdate({ meetingPoint: e.target.value || undefined })}
              aria-label={ui.pickupAria}
              style={{ marginTop: 6 }}
            >
              {pickupPoints.map((p) => {
                const label = p.address?.trim()
                  ? `${p.name?.trim() ?? ''} – ${p.address.trim()}`.trim()
                  : (p.name?.trim() ?? '')
                return (
                  <option key={label} value={label}>{label}</option>
                )
              })}
            </select>
          </div>
        )}

        {/* Yemek tercihi */}
        <MealPreferenceFields
          tour={tour}
          state={state}
          onUpdate={onUpdate}
          error={errors.mealPreference}
          mealFallbackTitle={ui.mealFallbackTitle}
        />

        {/* Not */}
        <div className={styles.formField}>
          <FloatingTextarea
            id="booking-note"
            label={ui.labelNote}
            rows={3}
            value={state.customer.note ?? ''}
            onChange={(e) => handleField('note', e.target.value)}
            variant="outlined"
          />
        </div>

        {/* Ek yolcular */}
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

      {/* ── Sözleşme ── */}
      <label className={styles.termsRow}>
        <input
          type="checkbox"
          className={styles.termsCheckbox}
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          aria-describedby="terms-desc-step3"
        />
        <span id="terms-desc-step3">
          <a
            href={termsHref}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.termsLink}
            onClick={(e) => e.stopPropagation()}
          >
            Mesafeli Satış Sözleşmesi
          </a>
          {`'ni okudum ve kabul ediyorum.`}
        </span>
      </label>

      {/* ── CTA ── */}
      <div className={styles.ctaSection}>
        <div className={styles.stepActionsRow}>
          <button
            type="button"
            className={styles.stepBtnBack}
            onClick={onBack}
            aria-label={ui.backAria}
          >
            <ChevronLeft width={16} height={16} aria-hidden />
            {ui.back}
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
