'use client'

import { useEffect, useRef, useState } from 'react'
import { User, ChevronLeft, ArrowRight } from 'lucide-react'
import type { TourForBooking, BookingWizardState } from '@/lib/sanity/bookingTypes'
import ReservationTicket, { formatTicketDateLabel, boatNameForTour } from '../ReservationTicket'
import FloatingInput from '@/components/ui/FloatingInput'
import AdditionalTravelersFields from './AdditionalTravelersFields'
import PassengerGenderFields from './PassengerGenderFields'
import AllMaleGenderNotice from './AllMaleGenderNotice'
import { TravelerCardTitle, TravelerGenderRow } from './TravelerGenderRow'
import type { PassengerGender } from '@/lib/bookingPassengerGender'
import FloatingTextarea from '@/components/ui/FloatingTextarea'
import PhoneField from '@/components/ui/PhoneField'
import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import { useBookingPassengerValidation } from '../hooks/useBookingPassengerValidation'
import { isFirstClassKey } from '@/lib/sanity/bookingPricing'
import styles from '../booking.module.css'

/** Kullanıcı isteğiyle sadeleştirildi: sadece "Özel istekler" (alerji ibaresi kaldırıldı). */
const SPECIAL_REQUESTS_HEADING: Record<string, string> = {
  tr: 'Özel istekler',
  en: 'Special requests',
  de: 'Besondere Wünsche',
}

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
  /** Şartlar ve Koşullar sayfası linki (Mesafeli Satış Sözleşmesi'nden ayrı). */
  termsAndConditionsHref?: string
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
  termsAndConditionsHref = '/yasal/sartlar-ve-kosullar',
}: Step3CustomerInfoProps) {
  const [termsAccepted, setTermsAccepted] = useState(false)
  const { visibleErrors, touch, attemptSubmit } = useBookingPassengerValidation(
    state,
    ui,
    onValidationChange
  )

  useEffect(() => {
    onTermsAcceptanceChange?.(termsAccepted)
  }, [termsAccepted, onTermsAcceptanceChange])

  const handleField = (field: keyof BookingWizardState['customer'], value: string) => {
    onUpdate({ customer: { ...state.customer, [field]: value } })
  }

  const localeTag = ui.locale === 'tr' ? 'tr-TR' : ui.locale === 'de' ? 'de-DE' : 'en-US'
  const adultOneLabel = `${ui.adult} 1`.toLocaleUpperCase(localeTag)

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
  /** Biletteki sağ sütun için hafta günü dahil uzun tarih, örn. "Pazar, 27 Eylül 2026". */
  const dateWithWeekday = state.selectedDate ? formatTicketDateLabel(state.selectedDate, ui) : null
  const totalPrice = state.pricingSummary?.total ?? 0

  const defaultPickupForAddress = tour.pickupPoints?.find((p) => p.isDefault) ?? tour.pickupPoints?.[0]
  const tourAddress =
    tour.quickFacts?.meetingLocation?.trim() ||
    defaultPickupForAddress?.address?.trim() ||
    defaultPickupForAddress?.name?.trim() ||
    null

  /** Rezervasyon özetinde (bilet) gösterilecek sınıf adı + First Class ise seçilen loca(lar). */
  const selectedTicketClass = tour.ticketClasses?.find((c) => c.key === state.selectedClassKey) ?? null
  const summaryClassLabel = selectedTicketClass?.label?.trim() || null
  const summaryLocaIds =
    summaryClassLabel && isFirstClassKey(tour, state.selectedClassKey)
      ? (state.firstClassLocas ?? []).filter((x) => x?.trim())
      : null

  const ageLabelFor = (ageKey: string) =>
    ageKey === 'adult' ? ui.adult : ageKey === 'child' ? ui.child : ui.baby

  /** Biletteki "Misafir: N × birim fiyat" satırları — fiyat sınıf seçildiği için burada gerçek. */
  const guestLines = (() => {
    const active = (state.pricingSummary?.unitPrices ?? []).filter((u) => u.count > 0)
    if (active.length === 0) return [{ label: ui.peopleCount(totalPax) }]
    return active.map((u) => ({
      label: `${u.count} ${ageLabelFor(u.ageKey)}`,
      unitPriceText: `${u.unitPrice.toLocaleString(ui.numberLocale)} ₺`,
    }))
  })()

  /** Ekstralar + kapora/kalan satırları — hepsi artık ayrı kart değil, biletin
      "yırtık" alt kısmında tek parça olarak gösteriliyor. */
  const ticketBreakdownRows = (() => {
    const p = state.pricingSummary
    if (!p) return []
    const rows: { label: string; value: string; emphasis?: boolean }[] = (p.extras ?? []).map((e) => ({
      label: e.note ? `${e.title} · ${e.note}` : e.title,
      value: `${e.lineTotal.toLocaleString(ui.numberLocale)} ₺`,
    }))
    if (p.cashPaymentEnabled) {
      rows.push({ label: ui.payRemainingAtDoorLabel, value: `${p.remainingAmount.toLocaleString(ui.numberLocale)} ₺` })
      return rows
    }
    rows.push({
      label: ui.payDepositNowLabel(p.depositPercent),
      value: `${p.depositAmount.toLocaleString(ui.numberLocale)} ₺`,
      emphasis: true,
    })
    if (p.remainingAmount > 0) {
      rows.push({
        label: ui.payRemainingAtDoorLabel,
        value: `${p.remainingAmount.toLocaleString(ui.numberLocale)} ₺`,
        emphasis: false,
      })
    }
    return rows
  })()

  const handlePayClick = () => {
    if (!attemptSubmit()) return
    if (!termsAccepted) return
    onNext()
  }

  const payDisabled = ctaDisabled || !termsAccepted

  return (
    <div className={styles.stepContent} style={{ fontFamily: 'var(--font-family)' }}>

      <div className={styles.sectionFlat}>
        <div className={styles.sectionHeaderPlain}>
          <h3 className={styles.sectionTitlePlain}>{ui.summaryTitle}</h3>
        </div>

        <ReservationTicket
          ui={ui}
          tourTitle={tour.title ?? ''}
          durationText={tour.quickFacts?.durationText}
          hostName={boatNameForTour(tour.slug)}
          meetingLocation={tourAddress}
          classLabel={summaryClassLabel}
          locaIds={summaryLocaIds}
          guestLines={guestLines}
          dateLabel={dateWithWeekday}
          timeLabel={tour.quickFacts?.startTime}
          totalValue={state.pricingSummary ? totalPrice : null}
          breakdownRows={ticketBreakdownRows}
          confirmationEmail={state.customer.email?.trim() || null}
        />
      </div>

      <div className={styles.sectionFlat}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <User width={18} height={18} className={styles.sectionIcon} aria-hidden />
            <h3 className={styles.sectionTitle}>{ui.yourDetailsTitle}</h3>
          </div>
        </div>

        <div className={styles.travelerCardsStack}>
          <article className={styles.travelerCard}>
            <TravelerCardTitle label={adultOneLabel} />
            <div className={styles.formGrid2}>
              <FloatingInput
                id="booking-firstName"
                label={ui.labelFirstName}
                autoComplete="given-name"
                value={state.customer.firstName}
                onChange={(e) => handleField('firstName', e.target.value)}
                onBlur={() => touch('firstName')}
                error={visibleErrors.firstName}
                compact
                variant="outlined"
              />
              <FloatingInput
                id="booking-lastName"
                label={ui.labelLastName}
                autoComplete="family-name"
                value={state.customer.lastName}
                onChange={(e) => handleField('lastName', e.target.value)}
                onBlur={() => touch('lastName')}
                error={visibleErrors.lastName}
                compact
                variant="outlined"
              />
            </div>
            <TravelerGenderRow
              value={state.customer.gender}
              onChange={(g: PassengerGender) =>
                onUpdate({ customer: { ...state.customer, gender: g } })
              }
              onBlur={() => touch('customerGender')}
              error={visibleErrors.customerGender}
              ui={ui}
              ariaLabel={`${ui.adult} 1 ${ui.genderAriaSuffix}`}
            />
            <div className={styles.formGrid2} style={{ marginTop: 12 }}>
              <FloatingInput
                id="booking-email"
                label={ui.labelEmail}
                type="email"
                autoComplete="email"
                value={state.customer.email}
                onChange={(e) => handleField('email', e.target.value)}
                onBlur={() => touch('email')}
                error={visibleErrors.email}
                compact
                variant="outlined"
              />
              <PhoneField
                label={ui.labelPhone}
                name="phone"
                value={state.customer.phone ?? ''}
                onChange={(v) => handleField('phone', v ?? '')}
                onBlur={() => touch('phone')}
                error={visibleErrors.phone}
                defaultCountry="TR"
                compact
                variant="outlined"
              />
            </div>
          </article>
        </div>

        <AdditionalTravelersFields
          state={state}
          onUpdate={onUpdate}
          errors={visibleErrors}
          onTouch={touch}
          compact
          variant="outlined"
          ui={ui}
        />

        {hasPickupPoints && (
          <div className={styles.formField} style={{ marginTop: 8 }}>
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
                  <option key={label} value={label}>
                    {label}
                  </option>
                )
              })}
            </select>
          </div>
        )}

        <div className={styles.sectionHeaderPlain} style={{ marginTop: 20 }}>
          <h4 className={styles.sectionTitlePlain} style={{ fontSize: 16 }}>
            {SPECIAL_REQUESTS_HEADING[ui.locale] ?? SPECIAL_REQUESTS_HEADING.tr}
          </h4>
        </div>

        <div className={`${styles.formField} ${styles.optionalFieldWrap}`}>
          <FloatingTextarea
            id="booking-note"
            label={ui.labelNote}
            rows={3}
            value={state.customer.note ?? ''}
            onChange={(e) => handleField('note', e.target.value)}
            variant="outlined"
          />
        </div>

        <PassengerGenderFields
          state={state}
          onUpdate={onUpdate}
          errors={visibleErrors}
          onTouch={touch}
          ui={ui}
        />
        <AllMaleGenderNotice state={state} ui={ui} />
      </div>

      <div className={styles.termsCard}>
        <label className={styles.termsRow}>
          <input
            type="checkbox"
            className={styles.termsCheckbox}
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            aria-describedby="terms-desc-step3"
          />
          <span id="terms-desc-step3" className={styles.termsText}>
            {ui.distanceSalesAgreementLead}
            <a
              href={termsHref}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.termsLink}
              onClick={(e) => e.stopPropagation()}
            >
              {ui.distanceSalesAgreementLinkText}
            </a>
            {ui.distanceSalesAgreementMiddle}
            <a
              href={termsAndConditionsHref}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.termsLink}
              onClick={(e) => e.stopPropagation()}
            >
              {ui.distanceSalesAgreementLinkText2}
            </a>
            {ui.distanceSalesAgreementTrail}
          </span>
        </label>
      </div>

      <div className={styles.ctaSection}>
        <div className={styles.stepActionsRow}>
          <button
            type="button"
            className={styles.stepBtnPrimary}
            onClick={handlePayClick}
            disabled={payDisabled}
            aria-label={ctaLabel}
          >
            {ctaLabel}
            <ArrowRight width={16} height={16} aria-hidden />
          </button>
          <button
            type="button"
            className={styles.stepBtnBack}
            onClick={onBack}
            aria-label={ui.backAria}
          >
            <ChevronLeft width={16} height={16} aria-hidden />
            {ui.back}
          </button>
        </div>
      </div>
    </div>
  )
}
