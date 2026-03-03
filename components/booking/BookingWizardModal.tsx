'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, FileDown } from 'lucide-react'
import type { TourForBooking, BookingWizardState, PricingSummary } from '@/lib/sanity/bookingTypes'
import { DEFAULT_BOOKING_STATE, MAX_PAX_FALLBACK, getTourIdForFirebase } from '@/lib/sanity/bookingTypes'
import { getRemainingCapacityForDate } from '@/lib/sanity/bookingPricing'
import { useAvailability, type UsedByDateAndClass } from '@/lib/hooks/useAvailability'
import {
  Step1PeopleDate,
  Step2ClassSelect,
  Step3CustomerInfo,
  Step4Payment,
} from './steps'
import styles from './booking.module.css'

export interface BookingWizardModalProps {
  open: boolean
  onClose: () => void
  tourSlug: string
  initialTourData: TourForBooking
}

export default function BookingWizardModal({
  open,
  onClose,
  tourSlug,
  initialTourData: tour,
}: BookingWizardModalProps) {
  const [state, setState] = useState<BookingWizardState>({
    ...DEFAULT_BOOKING_STATE,
    tourSlug,
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [bookingResult, setBookingResult] = useState<{
    bookingId: string
    summary: { tourTitle: string; date: string; className: string; totalPrice: number; currency: string; status: string }
  } | null>(null)
  const [step3Valid, setStep3Valid] = useState(false)
  /** Rezervasyon başarılı olunca anlık kalan kontenjan = Sanity kapasitesi - (API used + bu). */
  const [optimisticUsed, setOptimisticUsed] = useState<UsedByDateAndClass | null>(null)
  /** Modal her açıldığında güncellenir; useAvailability bu sayede önceki rezervasyonları yeniden çeker. */
  const [availabilityInvalidateKey, setAvailabilityInvalidateKey] = useState('')
  const paneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) setAvailabilityInvalidateKey(String(Date.now()))
  }, [open])

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

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  // Onay ekranına geçince içeriği en üste kaydır
  useEffect(() => {
    if (submitted && paneRef.current) {
      const main = paneRef.current.querySelector('main')
      if (main) main.scrollTop = 0
    }
  }, [submitted])

  const handleClose = useCallback(() => {
    if (submitted) {
      setSubmitted(false)
      setBookingResult(null)
      setOptimisticUsed(null)
      setState((prev) => ({ ...DEFAULT_BOOKING_STATE, tourSlug: prev.tourSlug }))
    }
    onClose()
  }, [submitted, onClose, tourSlug])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  // Focus trap
  useEffect(() => {
    if (!open || !paneRef.current) return
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
  }, [open, state.step])

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
  const { usedByDate, availability } = useAvailability(getTourIdForFirebase(tour), datesForAvailability, {
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
  const canProceedStep2 = Boolean(
    state.selectedClassKey && state.pricingSummary && hasEnoughCapacityStep2
  )
  const canProceedStep3 = step3Valid

  const handleCta = useCallback(async () => {
    if (state.step === 1 && canProceedStep1) goNext()
    else if (state.step === 2 && canProceedStep2) goNext()
    else if (state.step === 3 && canProceedStep3) goNext()
    else if (state.step === 4) {
      setSubmitError(null)
      setSubmitting(true)
      const tourId = getTourIdForFirebase(tour)
      const phoneDisplay = state.customer.phoneCountryCode && state.customer.phone
        ? `+${state.customer.phoneCountryCode} ${state.customer.phone}`
        : state.customer.phone
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

  const { ctaLabel, ctaDisabled } = useMemo(() => {
    let label: string
    if (state.step === 1) label = 'Devam'
    else if (state.step === 2) label = 'Devam'
    else if (state.step === 3) label = 'Ödemeye Geç'
    else if (state.step === 4 && submitting) label = 'İşleniyor…'
    else label = 'Ödemeyi Tamamla'

    let disabled: boolean
    if (state.step === 1) disabled = !canProceedStep1
    else if (state.step === 2) disabled = !canProceedStep2
    else if (state.step === 3) disabled = !canProceedStep3
    else if (state.step === 4) disabled = submitting
    else disabled = false

    return { ctaLabel: label, ctaDisabled: disabled }
  }, [state.step, submitting, canProceedStep1, canProceedStep2, canProceedStep3])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose()
  }

  if (!open) return null

  const modalContent = (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-wizard-title"
      aria-describedby="booking-wizard-desc"
      onClick={handleBackdropClick}
    >
      <div
        ref={paneRef}
        className={styles.wizardModalPane}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <header className={styles.wizardModalHeader}>
          <h1 id="booking-wizard-title" className={styles.wizardModalTitle}>
            Rezervasyon
          </h1>
          <button
            type="button"
            className={`${styles.closeBtn} ${styles.wizardModalClose}`}
            onClick={handleClose}
            aria-label="Rezervasyonu kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div
          className={styles.wizardModalStepStrip}
          role="progressbar"
          aria-valuenow={state.step}
          aria-valuemin={1}
          aria-valuemax={4}
          aria-label={`Adım ${state.step} / 4`}
          id="booking-wizard-desc"
        >
          {[1, 2, 3, 4].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                className={`${styles.stepCircle} ${
                  state.step > s ? styles.stepCircleDone : state.step === s ? styles.stepCircleActive : ''
                }`}
                aria-current={state.step === s ? 'step' : undefined}
              >
                {state.step > s ? <Check className="w-3.5 h-3.5" aria-hidden /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`${styles.connector} ${state.step > s ? styles.connectorDone : ''}`}
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>

        <main className={styles.wizardModalContent} key={submitted ? 'done' : state.step}>
          {submitted ? (
            <div className={styles.card} style={{ padding: 28, maxWidth: 420, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <h2 className={styles.successTitle} style={{ marginBottom: 8 }}>
                  Rezervasyonunuz onaylandı
                </h2>
                <p className={styles.successText} style={{ margin: 0 }}>
                  Rezervasyon numaranızı not alın; iletişim için kullanılacaktır.
                </p>
              </div>
              {bookingResult ? (
                <>
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
                      <span className={styles.summaryRowValue}>{bookingResult.summary.tourTitle}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryRowLabel}>Tarih</span>
                      <span className={styles.summaryRowValue}>{bookingResult.summary.date}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryRowLabel}>Sınıf</span>
                      <span className={styles.summaryRowValue}>{bookingResult.summary.className}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryRowLabel}>Toplam</span>
                      <span className={styles.summaryRowValue}>
                        {bookingResult.summary.totalPrice.toLocaleString('tr-TR')} {bookingResult.summary.currency}
                      </span>
                    </div>
                  </div>
                </>
              ) : null}
              <p className={styles.successText} style={{ marginBottom: 16, textAlign: 'center', fontSize: 14 }}>
                Ödeme bilgileriniz işlendik. Voucher&apos;ınızı aşağıdan indirebilirsiniz.
              </p>
              {bookingResult && (
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
              )}
              <button type="button" className={styles.ctaButton} onClick={handleClose} style={{ width: '100%', marginTop: 0 }}>
                Kapat
              </button>
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
                  canProceed={canProceedStep2}
                  ctaLabel={ctaLabel}
                  ctaDisabled={ctaDisabled}
                  optimisticUsed={optimisticUsed}
                  availabilityFromParent={availability}
                />
              )}
              {state.step === 3 && Step3CustomerInfo && (
                <Step3CustomerInfo
                  tour={tour}
                  state={state}
                  onUpdate={updateState}
                  onValidationChange={setStep3Valid}
                  onBack={goBack}
                  onNext={handleCta}
                  canProceed={canProceedStep3}
                  ctaLabel={ctaLabel}
                  ctaDisabled={ctaDisabled}
                />
              )}
              {state.step === 4 && (
                <>
                  {submitError && (
                    <div className={styles.errorText} style={{ marginBottom: 12 }} role="alert">
                      {submitError}
                    </div>
                  )}
                  {Step4Payment ? (
                    <Step4Payment
                      state={state}
                      onBack={goBack}
                      onSubmit={handleCta}
                      ctaDisabled={ctaDisabled}
                    />
                  ) : (
                    <div className={styles.card} style={{ padding: 24 }}>
                      <p className={styles.errorText}>Adım bileşeni yüklenemedi. Sayfayı yenileyin.</p>
                    </div>
                  )}
                </>
              )}
              {state.step === 1 && !Step1PeopleDate && (
                <div className={styles.card} style={{ padding: 24 }}>
                  <p className={styles.errorText}>Adım bileşeni yüklenemedi. Sayfayı yenileyin.</p>
                </div>
              )}
              {state.step === 2 && !Step2ClassSelect && (
                <div className={styles.card} style={{ padding: 24 }}>
                  <p className={styles.errorText}>Adım bileşeni yüklenemedi. Sayfayı yenileyin.</p>
                </div>
              )}
              {state.step === 3 && !Step3CustomerInfo && (
                <div className={styles.card} style={{ padding: 24 }}>
                  <p className={styles.errorText}>Adım bileşeni yüklenemedi. Sayfayı yenileyin.</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modalContent, document.body)
}
