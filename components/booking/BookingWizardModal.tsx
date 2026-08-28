'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { submitNestpayForm } from '@/lib/nestpay/submitPaymentForm'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { getBookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import { createPortal } from 'react-dom'
import { X, Check } from 'lucide-react'
import type { TourForBooking, BookingWizardState, PricingSummary } from '@/lib/sanity/bookingTypes'
import { DEFAULT_BOOKING_STATE, MAX_PAX_FALLBACK, getTourIdForBooking } from '@/lib/sanity/bookingTypes'
import { additionalTravelerSlotCount, resizeAdditionalTravelers } from '@/lib/bookingAdditionalTravelers'
import { allPassengersAreMale, resizeInfantGenders } from '@/lib/bookingPassengerGender'
import { getRemainingCapacityForDate, computePricingForSelection, isFirstClassKey } from '@/lib/sanity/bookingPricing'
import { useAvailability, type UsedByDateAndClass } from '@/lib/hooks/useAvailability'
import {
  Step1PeopleDate,
  Step2ClassSelect,
  Step3CustomerInfo,
  Step4Payment,
} from './steps'
import PaymentSuccessPanel from './PaymentSuccessPanel'
import PaymentLoadingOverlay from './PaymentLoadingOverlay'
import ReservationTourSnapshot from './ReservationTourSnapshot'
import styles from './booking.module.css'

/** CMS başlığının kısa özeti — tire/pipe sonrası alt başlığı atar, tek bakışta tur adı. */
export function shortTourHeading(title: string | undefined | null): string {
  const raw = (title ?? '').replace(/\s+/g, ' ').trim()
  if (!raw) return ''
  const primary = raw.split(/\s+[–—|:]\s+/)[0]?.trim() || raw
  if (primary.length <= 56) return primary
  return `${primary.slice(0, 53).trimEnd()}…`
}

export interface BookingWizardModalProps {
  open: boolean
  onClose: () => void
  tourSlug: string
  initialTourData: TourForBooking
  locale?: SiteLocale
  /** Dedicated /rezervasyon/[slug] page: same wizard UI, no dimmed dismissible overlay */
  variant?: 'modal' | 'page'
}

export default function BookingWizardModal({
  open,
  onClose,
  tourSlug,
  initialTourData: tour,
  locale = 'tr',
  variant = 'modal',
}: BookingWizardModalProps) {
  const ui = useMemo(() => getBookingWizardUi(locale), [locale])
  const pageTourTitle = useMemo(
    () => (variant === 'page' ? shortTourHeading(tour.title) : ''),
    [variant, tour.title]
  )
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const el = document.createElement('div')
    el.id = 'booking-wizard-portal'
    document.body.appendChild(el)
    setPortalEl(el)
    return () => { if (el.parentNode) el.parentNode.removeChild(el) }
  }, [])

  const [state, setState] = useState<BookingWizardState>({
    ...DEFAULT_BOOKING_STATE,
    tourSlug,
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [bookingResult, setBookingResult] = useState<{
    bookingId: string
    accessToken?: string
    summary: { tourTitle: string; date: string; className: string; totalPrice: number; currency: string; status: string }
  } | null>(null)
  const [step3Valid, setStep3Valid] = useState(false)
  const [step3TermsAccepted, setStep3TermsAccepted] = useState(false)
  /** Rezervasyon başarılı olunca anlık kalan kontenjan = Sanity kapasitesi - (API used + bu). */
  const [optimisticUsed, setOptimisticUsed] = useState<UsedByDateAndClass | null>(null)
  /** Modal her açıldığında güncellenir; useAvailability bu sayede önceki rezervasyonları yeniden çeker. */
  const [availabilityInvalidateKey, setAvailabilityInvalidateKey] = useState('')
  const paneRef = useRef<HTMLDivElement>(null)
  const prevStepRef = useRef(state.step)

  useEffect(() => {
    if (open) setAvailabilityInvalidateKey(String(Date.now()))
  }, [open])

  // Step 2'ye (sınıf/loca) her girildiğinde availability'yi yeniden çek (dolu loca'lar güncel olsun)
  useEffect(() => {
    const prev = prevStepRef.current
    prevStepRef.current = state.step
    if (prev !== 2 && state.step === 2) setAvailabilityInvalidateKey(String(Date.now()))
  }, [state.step])

  const maxPax = tour.quickFacts?.maxCapacity ?? MAX_PAX_FALLBACK
  const totalPax = state.counts.adult + state.counts.child + state.counts.baby

  const updateState = useCallback((patch: Partial<BookingWizardState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch }
      if (patch.counts !== undefined) {
        next.additionalTravelers = resizeAdditionalTravelers(prev.additionalTravelers, patch.counts)
        next.infantGenders = resizeInfantGenders(prev.infantGenders, patch.counts.baby)
      }
      return next
    })
  }, [])

  const onPricingComputed = useCallback((pricingSummary: PricingSummary | null) => {
    setState((prev) => {
      if (prev.pricingSummary === pricingSummary) return prev
      return { ...prev, pricingSummary }
    })
  }, [])

  // Sınıf/tarih/kişi değişince fiyatı her zaman güncelle (geri gelip başka sınıf seçince doğru fiyat görünsün)
  useEffect(() => {
    if (!state.selectedDate || !state.selectedClassKey) {
      setState((prev) => (prev.pricingSummary == null ? prev : { ...prev, pricingSummary: null }))
      return
    }
    const summary = computePricingForSelection(
      tour,
      state.selectedDate,
      state.selectedClassKey,
      state.counts
    )
    setState((prev) => {
      if (summary && prev.pricingSummary?.total === summary.total && prev.pricingSummary?.currency === summary.currency) return prev
      return { ...prev, pricingSummary: summary ?? null }
    })
  }, [tour, state.selectedDate, state.selectedClassKey, state.counts.adult, state.counts.child, state.counts.baby])

  const handleClose = useCallback(() => {
    setSubmitted(false)
    setBookingResult(null)
    setSubmitError(null)
    setOptimisticUsed(null)
    setState((prev) => ({ ...DEFAULT_BOOKING_STATE, tourSlug: prev.tourSlug }))
    onClose()
  }, [onClose, tourSlug])

  useEffect(() => {
    if (!open) return
    if (variant === 'page') return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open, variant])

  useEffect(() => {
    if (variant === 'page') return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose, variant])

  // Onay ekranına geçince içeriği en üste kaydır
  useEffect(() => {
    if (submitted && paneRef.current) {
      const main = paneRef.current.querySelector('main')
      if (main) main.scrollTop = 0
    }
  }, [submitted])

  // Focus trap
  useEffect(() => {
    if (!open || !paneRef.current || variant === 'page') return
    const pane = paneRef.current
    const focusables = pane.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (first) first.focus()
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    pane.addEventListener('keydown', handleKey)
    return () => pane.removeEventListener('keydown', handleKey)
  }, [open, state.step, variant])

  const goNext = useCallback(() => {
    if (state.step < 4) setState((prev) => ({ ...prev, step: (prev.step + 1) as 1 | 2 | 3 | 4 }))
  }, [state.step])

  const goBack = useCallback(() => {
    if (state.step > 1) setState((prev) => ({ ...prev, step: (prev.step - 1) as 1 | 2 | 3 | 4 }))
  }, [state.step])

  const datesForAvailability = useMemo(
    () => (state.selectedDate ? [state.selectedDate] : []),
    [state.selectedDate]
  )
  const { usedByDate, availability } = useAvailability(getTourIdForBooking(tour), datesForAvailability, {
    tourSlug: tour?.slug,
    optimisticUsed,
    invalidateKey: open ? availabilityInvalidateKey : '',
  })
  const capacityForSelectedDate =
    state.selectedDate ? getRemainingCapacityForDate(tour, state.selectedDate, usedByDate) : null
  const capacityForSelectedClass =
    state.selectedDate && state.selectedClassKey && capacityForSelectedDate
      ? (capacityForSelectedDate[state.selectedClassKey] ?? 0)
      : 0
  const canProceedStep1 = totalPax >= 1 && state.counts.adult >= 1 && totalPax <= maxPax && !!state.selectedDate
  const hasEnoughCapacityStep2 = capacityForSelectedClass >= totalPax
  const requiresFirstClassLoca = isFirstClassKey(tour, state.selectedClassKey)
  const requiredFirstClassLocas = requiresFirstClassLoca ? Math.ceil(totalPax / 2) : 0
  const hasRequiredLocas = (state.firstClassLocas?.length ?? 0) === requiredFirstClassLocas
  const canProceedStep2 = Boolean(
    state.selectedClassKey &&
      state.pricingSummary &&
      hasEnoughCapacityStep2 &&
      (!requiresFirstClassLoca || hasRequiredLocas)
  )
  const canProceedStep3 = step3Valid && step3TermsAccepted && !allPassengersAreMale(state)

  const handleCta = useCallback(async () => {
    if (state.step === 1 && canProceedStep1) goNext()
    else if (state.step === 2 && canProceedStep2) goNext()
    else if (state.step === 3 && canProceedStep3) {
      setSubmitError(null)
      setSubmitting(true)
      const tourId = getTourIdForBooking(tour)
      const phoneDisplay = state.customer.phoneCountryCode && state.customer.phone
        ? `+${state.customer.phoneCountryCode} ${state.customer.phone}`
        : state.customer.phone
      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locale,
            tourId,
            tourTitle: tour.title ?? '',
            date: state.selectedDate ?? '',
            ...(state.meetingPoint?.trim() && { meetingPoint: state.meetingPoint.trim() }),
            counts: {
              adult: state.counts.adult,
              child: state.counts.child,
              infant: state.counts.baby,
            },
            classId: state.selectedClassKey ?? '',
            className: tour.ticketClasses?.find((c) => c.key === state.selectedClassKey)?.label ?? state.selectedClassKey ?? '',
            ...(requiresFirstClassLoca && (state.firstClassLocas?.length ?? 0) > 0 && { firstClassLocas: state.firstClassLocas!.map((id) => id.trim().toUpperCase()) }),
            customer: {
              firstName: state.customer.firstName?.trim() ?? '',
              lastName: state.customer.lastName?.trim() ?? '',
              email: state.customer.email?.trim() ?? '',
              phone: phoneDisplay ?? '',
              note: state.customer.note?.trim() || undefined,
              ...(state.customer.gender === 'male' || state.customer.gender === 'female'
                ? { gender: state.customer.gender }
                : {}),
            },
            ...(additionalTravelerSlotCount(state.counts) > 0 && {
              additionalTravelers: (state.additionalTravelers ?? []).map((t) => ({
                firstName: t.firstName?.trim() ?? '',
                lastName: t.lastName?.trim() ?? '',
                ...(t.gender === 'male' || t.gender === 'female' ? { gender: t.gender } : {}),
              })),
            }),
            ...(state.counts.baby > 0 && {
              infantGenders: (state.infantGenders ?? []).filter((g) => g === 'male' || g === 'female'),
            }),
          }),
        })
        const text = await res.text()
        let data: {
          error?: string
          bookingId?: string
          accessToken?: string
          cashPayment?: boolean
          summary?: unknown
        } = {}
        try {
          data = text ? JSON.parse(text) : {}
        } catch {
          if (!res.ok) {
            setSubmitError(ui.serverError(res.status))
            return
          }
        }
        if (!res.ok) {
          setSubmitError(data.error ?? ui.bookingSaveFailed(res.status))
          return
        }
        if (!data.bookingId || !data.summary) {
          setSubmitError(ui.invalidServerResponse)
          return
        }
        const dateNorm = (state.selectedDate ?? '').slice(0, 10)
        const classKey = state.selectedClassKey ?? 'eco'
        const pax = state.counts.adult + state.counts.child + state.counts.baby
        if (dateNorm && classKey) {
          setOptimisticUsed((prev) => ({
            ...prev,
            [dateNorm]: {
              ...(prev?.[dateNorm] ?? {}),
              [classKey]: (prev?.[dateNorm]?.[classKey] ?? 0) + pax,
            },
          }))
        }

        const useCashPayment = Boolean(data.cashPayment || tour.cashPaymentEnabled)
        if (useCashPayment) {
          window.location.assign(
            withLocalePath(locale, `/rezervasyon/onaylandi?bookingId=${encodeURIComponent(data.bookingId)}`)
          )
          return
        }

        // Ödeme başlatma
        const payRes = await fetch('/api/payment/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: data.bookingId }),
        })
        const payText = await payRes.text()
        let payData: { action?: string; fields?: Record<string, string>; error?: string } = {}
        try { payData = payText ? JSON.parse(payText) : {} } catch { /* ignore */ }

        if (!payRes.ok || !payData.action || !payData.fields) {
          setSubmitError(payData.error ?? 'Ödeme sayfası başlatılamadı. Lütfen tekrar deneyin.')
          return
        }

        // Form bankaya submit edildi — tarayıcı sayfayı terk edene kadar overlay göstermek için
        // setSubmitting(false) ÇAĞIRILMAZ. Bileşen zaten unmount olacak.
        submitNestpayForm(payData.action, payData.fields)
        return
      } catch {
        setSubmitError(ui.connectionError)
        setSubmitting(false)
      }
    }
  }, [state, tour, canProceedStep1, canProceedStep2, canProceedStep3, goNext, ui, locale])

  const { ctaLabel, ctaDisabled } = useMemo(() => {
    let label: string
    if (state.step === 1) label = ui.continue
    else if (state.step === 2) label = ui.continue
    else if (submitting) label = ui.processing
    else if (tour.cashPaymentEnabled) label = ui.confirmCashReservation
    else label = ui.toPayment

    let disabled: boolean
    if (state.step === 1) disabled = !canProceedStep1
    else if (state.step === 2) disabled = !canProceedStep2
    else if (state.step === 3) disabled = submitting || allPassengersAreMale(state)
    else disabled = false

    return { ctaLabel: label, ctaDisabled: disabled }
  }, [state.step, submitting, canProceedStep1, canProceedStep2, state, tour.cashPaymentEnabled, ui])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (variant === 'page') return
    if (e.target === e.currentTarget) handleClose()
  }

  if (!open) return null

  if (submitting) return <PaymentLoadingOverlay />

  const wizardPane = (
      <div
        ref={paneRef}
        className={`${styles.wizardModalPane} ${variant === 'page' ? styles.pagePane : ''}`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <header
          className={`${styles.wizardModalHeader} ${
            variant === 'page' ? styles.wizardModalHeaderPage : ''
          }`}
        >
          {pageTourTitle ? (
            <div className={styles.pageTourHeading}>
              <p className={styles.pageTourKicker}>{ui.modalTitle}</p>
              <h1 id="booking-wizard-title" className={styles.pageTourTitle}>
                {pageTourTitle}
              </h1>
            </div>
          ) : (
            <h1 id="booking-wizard-title" className={styles.wizardModalTitle}>
              {ui.modalTitle}
            </h1>
          )}
          {variant !== 'page' ? (
            <button
              type="button"
              className={`${styles.closeBtn} ${styles.wizardModalClose}`}
              onClick={handleClose}
              aria-label={ui.modalCloseAria}
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
        </header>

        <div className={styles.wizardModalStepArea} id="booking-wizard-desc">
          <p className={styles.wizardStepProgressMeta} aria-live="polite">
            {ui.stepProgressAria(state.step, 3)}
          </p>
          <div
            className={styles.wizardStepper}
            role="progressbar"
            aria-valuenow={state.step}
            aria-valuemin={1}
            aria-valuemax={3}
            aria-label={ui.stepProgressAria(state.step, 3)}
          >
            {(
              [
                { step: 1, label: ui.guestCountTitle },
                { step: 2, label: ui.classSelectTitle },
                { step: 3, label: ui.yourDetailsTitle },
              ] as const
            ).map(({ step: s, label }, index) => (
              <div key={s} className={styles.wizardStepperSegment}>
                <div className={styles.wizardStepColumn}>
                  <div
                    className={`${styles.stepCircle} ${
                      state.step > s
                        ? styles.stepCircleDone
                        : state.step === s
                          ? styles.stepCircleActive
                          : ''
                    }`}
                    aria-current={state.step === s ? 'step' : undefined}
                  >
                    {state.step > s ? <Check className="w-3.5 h-3.5" aria-hidden /> : s}
                  </div>
                  <span
                    className={
                      state.step === s ? styles.wizardStepLabelActive : styles.wizardStepLabel
                    }
                  >
                    {label}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={`${styles.wizardStepConnector} ${
                      state.step > s ? styles.wizardStepConnectorDone : ''
                    }`}
                    aria-hidden
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <main className={styles.wizardModalContent} key={submitted ? 'done' : state.step}>
          {submitted ? (
            <div className={styles.card} style={{ padding: 28, maxWidth: 420, margin: '0 auto' }}>
              {bookingResult ? (
                <PaymentSuccessPanel
                  bookingId={bookingResult.bookingId}
                  accessToken={bookingResult.accessToken}
                  summary={bookingResult.summary}
                  doneButtonLabel={ui.close}
                  onDone={handleClose}
                  locale={locale}
                />
              ) : (
                <>
                  <p className={styles.successText} style={{ textAlign: 'center', margin: '0 0 16px' }}>
                    {ui.savingReservation}
                  </p>
                  <button type="button" className={styles.ctaButton} onClick={handleClose} style={{ width: '100%' }}>
                    {ui.close}
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {state.step === 1 && Step1PeopleDate && (
                <Step1PeopleDate
                  tour={tour}
                  state={state}
                  maxPax={maxPax}
                  onUpdate={updateState}
                  onBack={goBack}
                  onNext={handleCta}
                  canProceed={canProceedStep1}
                  ctaLabel={ctaLabel}
                  ctaDisabled={ctaDisabled}
                  ui={ui}
                />
              )}
              {state.step === 2 && Step2ClassSelect && (
                <Step2ClassSelect
                  tour={tour}
                  state={state}
                  onUpdate={updateState}
                  onPricingComputed={onPricingComputed}
                  onBack={goBack}
                  onNext={handleCta}
                  onStepNext={goNext}
                  canProceed={canProceedStep2}
                  ctaLabel={ctaLabel}
                  ctaDisabled={ctaDisabled}
                  optimisticUsed={optimisticUsed}
                  availabilityFromParent={availability}
                  ui={ui}
                />
              )}
              {state.step === 3 && Step3CustomerInfo && (
                <>
                  {submitError && (
                    <div className={styles.errorText} style={{ marginBottom: 12 }} role="alert">
                      {submitError}
                    </div>
                  )}
                  <Step3CustomerInfo
                    tour={tour}
                    state={state}
                    onUpdate={updateState}
                    onValidationChange={setStep3Valid}
                    onTermsAcceptanceChange={setStep3TermsAccepted}
                    onBack={goBack}
                    onNext={handleCta}
                    canProceed={canProceedStep3}
                    ctaLabel={ctaLabel}
                    ctaDisabled={ctaDisabled}
                    ui={ui}
                    termsHref="https://cesmetekneturu.net/yasal/mesafeli-satis-sozlesmesi"
                  />
                </>
              )}
              {state.step === 1 && !Step1PeopleDate && (
                <div className={styles.card} style={{ padding: 24 }}>
                  <p className={styles.errorText}>{ui.stepLoadError}</p>
                </div>
              )}
              {state.step === 2 && !Step2ClassSelect && (
                <div className={styles.card} style={{ padding: 24 }}>
                  <p className={styles.errorText}>{ui.stepLoadError}</p>
                </div>
              )}
              {state.step === 3 && !Step3CustomerInfo && (
                <div className={styles.card} style={{ padding: 24 }}>
                  <p className={styles.errorText}>{ui.stepLoadError}</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
  )

  const modalContent = (
    <div
      className={variant === 'page' ? styles.pageOverlay : styles.modalOverlay}
      {...(variant === 'page'
        ? {}
        : {
            role: 'dialog' as const,
            'aria-modal': true,
            onClick: handleBackdropClick,
          })}
      aria-labelledby="booking-wizard-title"
      aria-describedby="booking-wizard-desc"
    >
      {variant === 'page' ? (
        <div className={styles.pageLayout}>
          <ReservationTourSnapshot tour={tour} locale={locale} />
          {wizardPane}
        </div>
      ) : (
        wizardPane
      )}
    </div>
  )

  if (variant === 'page') return modalContent
  if (!portalEl) return null
  return createPortal(modalContent, portalEl)
}
