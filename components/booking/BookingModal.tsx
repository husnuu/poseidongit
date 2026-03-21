'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check } from 'lucide-react'
import type { TourForBooking, BookingWizardState, PricingSummary } from '@/lib/sanity/bookingTypes'
import { DEFAULT_BOOKING_STATE, MAX_PAX_FALLBACK } from '@/lib/sanity/bookingTypes'
import { resizeAdditionalTravelers } from '@/lib/bookingAdditionalTravelers'
import StepPeople from './steps/StepPeople'
import StepDate from './steps/StepDate'
import StepClass from './steps/StepClass'
import StepCustomer from './steps/StepCustomer'
import StepPayment from './steps/StepPayment'
import styles from './booking.module.css'

interface BookingModalProps {
  tour: TourForBooking
  onClose: () => void
}

export default function BookingModal({ tour, onClose }: BookingModalProps) {
  const [state, setState] = useState<BookingWizardState>({
    ...DEFAULT_BOOKING_STATE,
    tourSlug: tour.slug,
  })
  const [submitted, setSubmitted] = useState(false)
  const [step3Valid, setStep3Valid] = useState(false)
  const [step4TermsAccepted, setStep4TermsAccepted] = useState(false)

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

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const goNext = useCallback(() => {
    if (state.step < 4) setState((prev) => ({ ...prev, step: (prev.step + 1) as 1 | 2 | 3 | 4 }))
  }, [state.step])

  const goBack = useCallback(() => {
    if (state.step > 1) setState((prev) => ({ ...prev, step: (prev.step - 1) as 1 | 2 | 3 | 4 }))
  }, [state.step])

  const canProceedStep1 = totalPax >= 1 && state.counts.adult >= 1 && totalPax <= maxPax && !!state.selectedDate
  const canProceedStep2 = Boolean(state.selectedClassKey && state.pricingSummary)
  const canProceedStep3 = step3Valid

  const handleCta = useCallback(() => {
    if (state.step === 1 && canProceedStep1) goNext()
    else if (state.step === 2 && canProceedStep2) goNext()
    else if (state.step === 3 && canProceedStep3) goNext()
    else if (state.step === 4) {
      console.log('Booking payload (mock):', { tourSlug: state.tourSlug, date: state.selectedDate, classKey: state.selectedClassKey, counts: state.counts, customer: state.customer, pricing: state.pricingSummary })
      setSubmitted(true)
    }
  }, [state, canProceedStep1, canProceedStep2, canProceedStep3, goNext])

  const ctaLabel = useMemo(() => {
    if (state.step === 1) return 'Devam'
    if (state.step === 2) return 'Devam'
    if (state.step === 3) return 'Ödemeye Geç'
    return 'ÖDEMEYİ TAMAMLA'
  }, [state.step])

  const ctaDisabled = useMemo(() => {
    if (state.step === 1) return !canProceedStep1
    if (state.step === 2) return !canProceedStep2
    if (state.step === 3) return !canProceedStep3
    if (state.step === 4) return !step4TermsAccepted
    return false
  }, [state.step, canProceedStep1, canProceedStep2, canProceedStep3, step4TermsAccepted])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const modalContent = (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      onClick={handleBackdropClick}
    >
      <div className={styles.modalPane} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <div className={styles.modalHeaderLogo} aria-hidden />
          <h1 id="booking-modal-title" className={styles.modalHeaderTitle}>
            REZERVASYON
          </h1>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className={styles.stepper} style={{ padding: '12px 16px', borderBottom: '1px solid #e4e4e7', background: '#fff' }}>
          {[1, 2, 3, 4].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                className={`${styles.stepCircle} ${
                  state.step > s ? styles.stepCircleDone : state.step === s ? styles.stepCircleActive : ''
                }`}
              >
                {state.step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              {s < 4 && <div className={`${styles.connector} ${state.step > s ? styles.connectorDone : ''}`} />}
            </div>
          ))}
        </div>

        <main className={`${styles.content} ${styles.stepContent}`} key={submitted ? 'done' : state.step}>
          {submitted ? (
            <div className={styles.card} style={{ textAlign: 'center', padding: 32 }}>
              <h2 className={styles.successTitle}>Rezervasyonunuz alındı</h2>
              <p className={styles.successText}>
                Ödeme bilgileriniz işlendik. Tarafınıza e-posta ile onay gönderilecektir.
              </p>
              <button type="button" className={styles.ctaButton} onClick={onClose} style={{ marginTop: 16 }}>
                Kapat
              </button>
            </div>
          ) : (
            <>
              {state.step === 1 && (
                <>
                  <StepPeople tour={tour} counts={state.counts} maxPax={maxPax} onUpdate={(counts) => updateState({ counts })} />
                  <StepDate tour={tour} state={state} onUpdate={updateState} />
                </>
              )}
              {state.step === 2 && (
                <StepClass tour={tour} state={state} onUpdate={updateState} onPricingComputed={onPricingComputed} />
              )}
              {state.step === 3 && (
                <StepCustomer tour={tour} state={state} onUpdate={updateState} onValidationChange={setStep3Valid} />
              )}
              {state.step === 4 && (
                <StepPayment
                  state={state}
                  onTermsAcceptanceChange={setStep4TermsAccepted}
                />
              )}
            </>
          )}
        </main>

        {!submitted && (
          <div className={styles.ctaWrap}>
            {state.step > 1 && (
              <button
                type="button"
                className={styles.ctaButton}
                style={{ marginBottom: 8, background: '#fff', color: '#52525b', border: '1px solid #e4e4e7' }}
                onClick={goBack}
              >
                Geri
              </button>
            )}
            <button type="button" className={styles.ctaButton} onClick={handleCta} disabled={ctaDisabled}>
              {ctaLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modalContent, document.body)
}
