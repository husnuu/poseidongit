'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, FileDown } from 'lucide-react'
import type { TourForBooking, BookingWizardState, PricingSummary } from '@/lib/sanity/bookingTypes'
import { DEFAULT_BOOKING_STATE, MAX_PAX_FALLBACK, getTourIdForFirebase } from '@/lib/sanity/bookingTypes'
import { getRemainingCapacityForDate } from '@/lib/sanity/bookingPricing'
import { useAvailability, type UsedByDateAndClass } from '@/lib/hooks/useAvailability'
import StepPeople from './steps/StepPeople'
import StepDateClass from './steps/StepDateClass'
import StepCustomer from './steps/StepCustomer'
import StepPayment from './steps/StepPayment'
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
    summary: { tourTitle: string; date: string; className: string; totalPrice: number; currency: string; status: string }
  } | null>(null)
  /** Rezervasyon başarılı olunca anlık kalan kontenjan = Sanity kapasitesi - (API used + bu). */
  const [optimisticUsed, setOptimisticUsed] = useState<UsedByDateAndClass | null>(null)

  const maxPax = tour.quickFacts?.maxCapacity ?? MAX_PAX_FALLBACK
  const totalPax = state.counts.adult + state.counts.child + state.counts.baby

  const updateState = useCallback((patch: Partial<BookingWizardState>) => {
    setState((prev) => ({ ...prev, ...patch }))
  }, [])

  const onPricingComputed = useCallback((pricingSummary: PricingSummary | null) => {
    setState((prev) => {
      if (prev.pricingSummary === pricingSummary) return prev
      return { ...prev, pricingSummary }
    })
  }, [])

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
  const canProceedStep2 = Boolean(
    state.selectedDate &&
      state.selectedClassKey &&
      state.pricingSummary &&
      hasEnoughCapacityForClass
  )
  const [step3Valid, setStep3Valid] = useState(false)
  const canProceedStep3 = step3Valid

  const handleCta = useCallback(async () => {
    if (state.step === 1 && canProceedStep1) goNext()
    else if (state.step === 2 && canProceedStep2) goNext()
    else if (state.step === 3 && canProceedStep3) goNext()
    else if (state.step === 4) {
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
            counts: {
              adult: state.counts.adult,
              child: state.counts.child,
              infant: state.counts.baby,
            },
            classId: state.selectedClassKey ?? '',
            className: tour.ticketClasses?.find((c) => c.key === state.selectedClassKey)?.label ?? state.selectedClassKey ?? '',
            customer: {
              firstName: state.customer.firstName?.trim() ?? '',
              lastName: state.customer.lastName?.trim() ?? '',
              email: state.customer.email?.trim() ?? '',
              phone: phoneDisplay ?? '',
              note: state.customer.note?.trim() || undefined,
            },
          }),
        })
        const text = await res.text()
        let data: { error?: string; bookingId?: string; summary?: unknown } = {}
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
        setBookingResult({ bookingId: data.bookingId, summary })
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
    if (state.step === 4 && submitting) return 'İşleniyor…'
    return 'ÖDEMEYİ TAMAMLA'
  }, [state.step, submitting])

  const ctaDisabled = useMemo(() => {
    if (state.step === 1) return !canProceedStep1
    if (state.step === 2) return !canProceedStep2
    if (state.step === 3) return !canProceedStep3
    if (state.step === 4) return submitting
    return false
  }, [state.step, canProceedStep1, canProceedStep2, canProceedStep3, submitting])

  const goBackToTour = useCallback(() => {
    setSubmitted(false)
    setBookingResult(null)
    setOptimisticUsed(null)
    setState((prev) => ({ ...DEFAULT_BOOKING_STATE, tourSlug: prev.tourSlug }))
    router.push(`/tour/${tour.slug}`)
  }, [tour.slug, router])

  if (submitted && bookingResult) {
    const s = bookingResult.summary
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
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2 className={styles.successTitle} style={{ marginBottom: 8 }}>
                Rezervasyonunuz onaylandı
              </h2>
              <p className={styles.successText} style={{ margin: 0 }}>
                Rezervasyon numaranızı not alın; iletişim için kullanılacaktır.
              </p>
            </div>
            <div
              className={styles.summaryBody}
              style={{
                background: 'var(--primary)',
                color: '#fff',
                padding: '16px 20px',
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>Rezervasyon no</div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.02em' }}>
                {bookingResult.bookingId}
              </div>
            </div>
            <div className={styles.summaryBody} style={{ marginBottom: 20 }}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Tur</span>
                <span className={styles.summaryRowValue}>{s.tourTitle}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Tarih</span>
                <span className={styles.summaryRowValue}>{s.date}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Sınıf</span>
                <span className={styles.summaryRowValue}>{s.className}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Toplam</span>
                <span className={styles.summaryRowValue}>{s.totalPrice.toLocaleString('tr-TR')} {s.currency}</span>
              </div>
            </div>
            <p className={styles.successText} style={{ marginBottom: 16, textAlign: 'center', fontSize: 14 }}>
              Ödeme bilgileriniz işlendik. Voucher&apos;ınızı aşağıdan indirebilirsiniz.
            </p>
            <a
              href={`/api/voucher?bookingId=${bookingResult.bookingId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ticketPdfBtn}
              style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
            >
              <FileDown className="w-5 h-5" aria-hidden />
              Voucher&apos;ı İndir (PDF)
            </a>
            <button
              type="button"
              className={styles.ctaButton}
              onClick={goBackToTour}
              style={{ display: 'block', width: '100%', textAlign: 'center' }}
            >
              Tura Dön
            </button>
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
            <StepPayment state={state} />
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
