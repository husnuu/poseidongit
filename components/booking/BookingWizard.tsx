'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check } from 'lucide-react'
import type { TourForBooking, BookingWizardState, PricingSummary } from '@/lib/sanity/bookingTypes'
import { DEFAULT_BOOKING_STATE, MAX_PAX_FALLBACK, getTourIdForFirebase } from '@/lib/sanity/bookingTypes'
import { additionalTravelerSlotCount, resizeAdditionalTravelers } from '@/lib/bookingAdditionalTravelers'
import { isBookingOnlinePaymentEnabled } from '@/lib/bookingVirtualPos'
import { getRemainingCapacityForDate, computePricingForSelection, isFirstClassKey } from '@/lib/sanity/bookingPricing'
import { useAvailability, type UsedByDateAndClass } from '@/lib/hooks/useAvailability'
import StepPeople from './steps/StepPeople'
import StepDateClass from './steps/StepDateClass'
import StepCustomer from './steps/StepCustomer'
import StepPayment from './steps/StepPayment'
import PaymentSuccessPanel from './PaymentSuccessPanel'
import styles from './booking.module.css'

interface BookingWizardProps {
  tour: TourForBooking
}

export default function BookingWizard({ tour }: BookingWizardProps) {
  const router = useRouter()
  const [state, setState] = useState<BookingWizardState>({
    ...DEFAULT_BOOKING_STATE,
    tourSlug: tour.slug,
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [bookingResult, setBookingResult] = useState<{
    bookingId: string
    accessToken?: string
    summary: { tourTitle: string; date: string; className: string; totalPrice: number; currency: string; status: string }
  } | null>(null)
  /** Rezervasyon başarılı olunca anlık kalan kontenjan = Sanity kapasitesi - (API used + bu). */
  const [optimisticUsed, setOptimisticUsed] = useState<UsedByDateAndClass | null>(null)
  const [step4TermsAccepted, setStep4TermsAccepted] = useState(false)
  /** Step 2'ye her girildiğinde artırılır; böylece dolu loca listesi Firestore'dan yeniden çekilir. */
  const [step2InvalidateKey, setStep2InvalidateKey] = useState(0)
  const prevStepRef = useRef(state.step)

  const maxPax = tour.quickFacts?.maxCapacity ?? MAX_PAX_FALLBACK
  const totalPax = state.counts.adult + state.counts.child + state.counts.baby

  const updateState = useCallback((patch: Partial<BookingWizardState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch }
      if (patch.counts !== undefined) {
        next.additionalTravelers = resizeAdditionalTravelers(prev.additionalTravelers, patch.counts)
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

  const goNext = useCallback(() => {
    if (state.step < 4) {
      setState((prev) => ({ ...prev, step: (prev.step + 1) as 1 | 2 | 3 | 4 }))
    }
  }, [state.step])

  const goBack = useCallback(() => {
    if (state.step > 1) {
      setState((prev) => ({ ...prev, step: (prev.step - 1) as 1 | 2 | 3 | 4 }))
    }
  }, [state.step])

  // Step 2'ye (tarih/sınıf) her girildiğinde availability'yi yeniden çek (dolu loca'lar güncel olsun)
  useEffect(() => {
    const prev = prevStepRef.current
    prevStepRef.current = state.step
    if (prev !== 2 && state.step === 2) setStep2InvalidateKey((k) => k + 1)
  }, [state.step])

  const datesForAvailability = useMemo(
    () => (state.selectedDate ? [state.selectedDate] : []),
    [state.selectedDate]
  )
  const { usedByDate } = useAvailability(getTourIdForFirebase(tour), datesForAvailability, {
    tourSlug: tour?.slug,
    optimisticUsed,
  })
  const canProceedStep1 = totalPax >= 1 && state.counts.adult >= 1 && totalPax <= maxPax
  const capacityForSelectedDate =
    state.selectedDate ? getRemainingCapacityForDate(tour, state.selectedDate, usedByDate) : null
  const capacityForSelectedClass =
    state.selectedClassKey && capacityForSelectedDate
      ? capacityForSelectedDate[state.selectedClassKey] ?? 0
      : 0
  const hasEnoughCapacityForClass = capacityForSelectedClass >= totalPax
  const requiresFirstClassLoca = isFirstClassKey(tour, state.selectedClassKey)
  const requiredFirstClassLocas = requiresFirstClassLoca ? Math.ceil(totalPax / 2) : 0
  const hasRequiredLocas = (state.firstClassLocas?.length ?? 0) === requiredFirstClassLocas
  const canProceedStep2 = Boolean(
    state.selectedDate &&
      state.selectedClassKey &&
      state.pricingSummary &&
      hasEnoughCapacityForClass &&
      (!requiresFirstClassLoca || hasRequiredLocas)
  )
  const [step3Valid, setStep3Valid] = useState(false)
  const canProceedStep3 = step3Valid

  const handleCta = useCallback(async () => {
    if (state.step === 1 && canProceedStep1) goNext()
    else if (state.step === 2 && canProceedStep2) goNext()
    else if (state.step === 3 && canProceedStep3) goNext()
    else if (state.step === 4) {
      if (!isBookingOnlinePaymentEnabled) return
      setSubmitError(null)
      setSubmitting(true)
      const tourId = getTourIdForFirebase(tour)
      const phoneDisplay =
        state.customer.phone?.startsWith('+') || !state.customer.phone
          ? (state.customer.phone ?? '')
          : state.customer.phoneCountryCode && state.customer.phone
            ? `+${state.customer.phoneCountryCode} ${state.customer.phone}`
            : state.customer.phone ?? ''
      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
            },
            ...(additionalTravelerSlotCount(state.counts) > 0 && {
              additionalTravelers: (state.additionalTravelers ?? []).map((t) => ({
                firstName: t.firstName?.trim() ?? '',
                lastName: t.lastName?.trim() ?? '',
              })),
            }),
          }),
        })
        const text = await res.text()
        let data: { error?: string; bookingId?: string; accessToken?: string; summary?: unknown } = {}
        try {
          data = text ? JSON.parse(text) : {}
        } catch {
          if (!res.ok) {
            setSubmitError(`Sunucu hata döndü (${res.status}). Lütfen tekrar deneyin veya destek ile iletişime geçin.`)
            return
          }
        }
        if (!res.ok) {
          setSubmitError(data.error ?? `Rezervasyon kaydedilemedi (${res.status}).`)
          return
        }
        if (!data.bookingId || !data.summary) {
          setSubmitError('Sunucu yanıtı geçersiz. Lütfen tekrar deneyin.')
          return
        }
        const dateNorm = (state.selectedDate ?? '').slice(0, 10)
        const classKey = state.selectedClassKey ?? 'eco'
        if (dateNorm && classKey) {
          setOptimisticUsed((prev) => ({
            ...prev,
            [dateNorm]: {
              ...(prev?.[dateNorm] ?? {}),
              [classKey]: (prev?.[dateNorm]?.[classKey] ?? 0) + totalPax,
            },
          }))
        }
        const summary = data.summary as { tourTitle: string; date: string; className: string; totalPrice: number; currency: string; status: string }
        const accessToken = typeof data.accessToken === 'string' && data.accessToken.trim() ? data.accessToken.trim() : undefined
        setBookingResult({
          bookingId: data.bookingId,
          accessToken,
          summary,
        })
        setSubmitted(true)
      } catch {
        setSubmitError('Bağlantı hatası. Lütfen tekrar deneyin.')
      } finally {
        setSubmitting(false)
      }
    }
  }, [state, tour, canProceedStep1, canProceedStep2, canProceedStep3, goNext])

  const ctaLabel = useMemo(() => {
    if (state.step === 1) return 'Devam'
    if (state.step === 2) return 'Devam'
    if (state.step === 3) return 'Ödemeye Geç'
    if (state.step === 4 && !isBookingOnlinePaymentEnabled) return 'Ödeme kapalı'
    if (state.step === 4 && submitting) return 'İşleniyor…'
    return 'ÖDEMEYİ TAMAMLA'
  }, [state.step, submitting])

  const ctaDisabled = useMemo(() => {
    if (state.step === 1) return !canProceedStep1
    if (state.step === 2) return !canProceedStep2
    if (state.step === 3) return !canProceedStep3
    if (state.step === 4) {
      if (!isBookingOnlinePaymentEnabled) return true
      return submitting || !step4TermsAccepted
    }
    return false
  }, [state.step, canProceedStep1, canProceedStep2, canProceedStep3, submitting, step4TermsAccepted])

  const goBackToTour = useCallback(() => {
    setSubmitted(false)
    setBookingResult(null)
    setOptimisticUsed(null)
    setState((prev) => ({ ...DEFAULT_BOOKING_STATE, tourSlug: prev.tourSlug }))
    router.push(`/tour/${tour.slug}`)
  }, [tour.slug, router])

  if (submitted && bookingResult) {
    return (
      <div className={styles.wizard}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={goBackToTour}
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.card} style={{ maxWidth: 420, margin: '0 auto', padding: 28 }}>
            <PaymentSuccessPanel
              bookingId={bookingResult.bookingId}
              accessToken={bookingResult.accessToken}
              summary={bookingResult.summary}
              doneButtonLabel="Tura Dön"
              onDone={goBackToTour}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wizard}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => router.back()}
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>
        <div className={styles.stepper}>
          {[1, 2, 3, 4].map((step) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                className={`${styles.stepCircle} ${
                  state.step > step ? styles.stepCircleDone : state.step === step ? styles.stepCircleActive : ''
                }`}
              >
                {state.step > step ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  step
                )}
              </div>
              {step < 4 && (
                <div
                  className={`${styles.connector} ${state.step > step ? styles.connectorDone : ''}`}
                />
              )}
            </div>
          ))}
        </div>
        <div style={{ width: 40 }} />
      </header>

      <main className={styles.content}>
        {state.step === 1 && (
          <StepPeople
            tour={tour}
            counts={state.counts}
            maxPax={maxPax}
            onUpdate={(counts) => updateState({ counts })}
          />
        )}
        {state.step === 2 && (
          <StepDateClass
            tour={tour}
            state={state}
            onUpdate={updateState}
            onPricingComputed={onPricingComputed}
            optimisticUsed={optimisticUsed}
            onProceedToNextStep={goNext}
            availabilityInvalidateKey={String(step2InvalidateKey)}
          />
        )}
        {state.step === 3 && (
          <StepCustomer
            tour={tour}
            state={state}
            onUpdate={updateState}
            onValidationChange={setStep3Valid}
          />
        )}
        {state.step === 4 && (
          <>
            {submitError && (
              <div className={styles.errorText} style={{ marginBottom: 12 }}>
                {submitError}
              </div>
            )}
            <StepPayment state={state} onTermsAcceptanceChange={setStep4TermsAccepted} />
          </>
        )}
      </main>

      <div className={styles.ctaWrap}>
        {state.step === 2 && !hasEnoughCapacityForClass && state.selectedClassKey && (
          <p className={styles.errorText} style={{ marginBottom: 12 }}>
            Bu sınıf için yeterli kapasite yok ({totalPax} kişi). Başka sınıf seçin veya kişi sayısını azaltın.
          </p>
        )}
        {state.step > 1 && (
          <button
            type="button"
            onClick={goBack}
            className={styles.ctaButton}
            style={{
              marginBottom: 8,
              background: '#fff',
              color: '#52525b',
              border: '1px solid #e4e4e7',
            }}
          >
            Geri
          </button>
        )}
        <button
          type="button"
          className={styles.ctaButton}
          onClick={handleCta}
          disabled={ctaDisabled}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  )
}
