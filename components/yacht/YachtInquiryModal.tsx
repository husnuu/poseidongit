'use client'

import { useEffect, useState } from 'react'
import YachtCalendar, { type YachtCalendarRange } from '@/components/yacht/YachtCalendar'
import YachtRentalModeTabs from '@/components/yacht/YachtRentalModeTabs'
import YachtInquiryForm from '@/components/yacht/YachtInquiryForm'
import type { YachtRentalDocument } from '@/lib/yachtTypes'
import bookingStyles from '@/components/booking/booking.module.css'
import stickyCardStyles from '@/components/StickyBookingCard.module.css'
import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtUi } from '@/lib/i18n/yachtUi'
import { Check, ChevronLeft, X } from 'lucide-react'
import {
  isValidOvernightRange,
  overnightNights,
  priceFromForMode,
  type YachtRentalMode,
} from '@/lib/yachtRentalModes'
import { yachtDailyUnitPrice, yachtOvernightStayTotal } from '@/lib/yachtCalendarPricing'

interface YachtInquiryModalProps {
  open: boolean
  onClose: () => void
  /** Açılışta hangi adım: 1 = takvim + misafir, 2 = form */
  initialStep: 1 | 2
  yacht: YachtRentalDocument
  locale?: SiteLocale
  rentalMode: YachtRentalMode
  onRentalModeChange: (m: YachtRentalMode) => void
  showRentalModeTabs: boolean
  blockedDates?: string[]
  selectionMode: 'single' | 'range'
  selectedDate: string | null
  onSelectDate: (d: string) => void
  overnightRange: YachtCalendarRange
  onOvernightRangeChange: (v: YachtCalendarRange) => void
  guestCount: number
  onGuestCountChange: (n: number) => void
  maxGuests: number
  ctaText?: string
  resolveDayPrice?: (iso: string) => number | undefined
}

export default function YachtInquiryModal({
  open,
  onClose,
  initialStep,
  yacht,
  locale = 'tr',
  rentalMode,
  onRentalModeChange,
  showRentalModeTabs,
  blockedDates,
  selectionMode,
  selectedDate,
  onSelectDate,
  overnightRange,
  onOvernightRangeChange,
  guestCount,
  onGuestCountChange,
  maxGuests,
  ctaText,
  resolveDayPrice,
}: YachtInquiryModalProps) {
  const ui = getYachtUi(locale)
  const [step, setStep] = useState<1 | 2>(initialStep)

  useEffect(() => {
    if (open) setStep(initialStep)
  }, [open, initialStep])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const locLabel = [yacht.locationTitle, yacht.marina].filter(Boolean).join(' · ') || null
  const modalSubtitle = step === 1 ? ui.step1Subtitle : ui.step2Subtitle

  const rangeOk =
    overnightRange.checkIn && overnightRange.checkOut
      ? isValidOvernightRange({
          checkIn: overnightRange.checkIn,
          checkOut: overnightRange.checkOut,
        })
      : false

  const stayTotal =
    rangeOk && overnightRange.checkIn && overnightRange.checkOut
      ? yachtOvernightStayTotal(yacht, overnightRange.checkIn, overnightRange.checkOut)
      : undefined

  const step1Ready =
    rentalMode === 'daily' ? Boolean(selectedDate) : rangeOk && stayTotal != null

  const summaryPrice =
    rentalMode === 'daily' && selectedDate
      ? yachtDailyUnitPrice(yacht, selectedDate)
      : rentalMode === 'overnight' && rangeOk && overnightRange.checkIn && overnightRange.checkOut
        ? stayTotal
        : priceFromForMode(yacht, rentalMode)

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="yacht-inquiry-modal-title"
      aria-describedby="yacht-inquiry-modal-step-desc"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl rounded-b-none shadow-2xl flex flex-col overflow-hidden max-sm:h-[92dvh] max-sm:max-h-[92dvh] sm:max-h-[min(92vh,720px)] sm:h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 z-20 overflow-hidden sm:rounded-t-2xl">
          <header className={bookingStyles.wizardModalHeader}>
            <h2 id="yacht-inquiry-modal-title" className={bookingStyles.wizardModalTitle}>
              {ui.inquiryModalTitle}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={`${bookingStyles.closeBtn} ${bookingStyles.wizardModalClose}`}
              aria-label={ui.modalCloseAria}
            >
              <X className="w-5 h-5" aria-hidden />
            </button>
          </header>

          <div className={bookingStyles.wizardModalStepArea} id="yacht-inquiry-modal-step-desc">
            <div
              className={bookingStyles.wizardStepper}
              role="progressbar"
              aria-valuenow={step}
              aria-valuemin={1}
              aria-valuemax={2}
              aria-label={ui.stepAria(step, 2)}
            >
              {(
                [
                  { s: 1, label: ui.step1Label },
                  { s: 2, label: ui.step2Label },
                ] as const
              ).map(({ s, label }, index) => (
                <div key={s} className={bookingStyles.wizardStepperSegment}>
                  <div className={bookingStyles.wizardStepColumn}>
                    <div
                      className={`${bookingStyles.stepCircle} ${
                        step > s
                          ? bookingStyles.stepCircleDone
                          : step === s
                            ? bookingStyles.stepCircleActive
                            : ''
                      }`}
                      aria-current={step === s ? 'step' : undefined}
                    >
                      {step > s ? <Check className="w-3.5 h-3.5" aria-hidden /> : s}
                    </div>
                    <span
                      className={
                        step === s ? bookingStyles.wizardStepLabelActive : bookingStyles.wizardStepLabel
                      }
                    >
                      {label}
                    </span>
                  </div>
                  {index < 1 && (
                    <div
                      className={`${bookingStyles.wizardStepConnector} ${
                        step > s ? bookingStyles.wizardStepConnectorDone : ''
                      }`}
                      aria-hidden
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {step === 1 ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 sm:px-6 sm:pt-6">
              <p
                className="text-xs font-semibold text-zinc-500 m-0 mb-4"
                style={{ fontFamily: 'var(--font-family)' }}
              >
                {modalSubtitle}
              </p>
              {showRentalModeTabs ? (
                <YachtRentalModeTabs value={rentalMode} onChange={onRentalModeChange} locale={locale} />
              ) : null}
              <YachtCalendar
                blockedDates={blockedDates}
                selectionMode={selectionMode}
                selectedDate={selectedDate}
                onSelectDate={onSelectDate}
                rangeValue={overnightRange}
                onRangeChange={onOvernightRangeChange}
                resolveDayPrice={resolveDayPrice}
                locale={locale}
              />

              <div className="mt-6 mb-2">
                <p
                  className="text-sm font-semibold text-zinc-700 mb-2"
                  style={{ fontFamily: 'var(--font-family)' }}
                >
                  {ui.guestCountLabel}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className={bookingStyles.counterBtn}
                    aria-label={ui.decreaseAria}
                    disabled={guestCount <= 1}
                    onClick={() => onGuestCountChange(Math.max(1, guestCount - 1))}
                  >
                    −
                  </button>
                  <span className={bookingStyles.counterValue}>{guestCount}</span>
                  <button
                    type="button"
                    className={`${bookingStyles.counterBtn} ${bookingStyles.counterBtnPlus}`}
                    aria-label={ui.increaseAria}
                    disabled={guestCount >= maxGuests}
                    onClick={() => onGuestCountChange(Math.min(maxGuests, guestCount + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div
              className="shrink-0 border-t border-zinc-100 bg-white px-4 pt-3 pb-3 sm:px-6 sm:pb-6 sm:shadow-[0_-6px_16px_rgba(15,23,42,0.06)] max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              {!step1Ready ? (
                <p className="text-xs text-zinc-500 m-0 mb-2 text-center sm:text-left">
                  {rentalMode === 'daily'
                    ? ui.pickDayHint
                    : !rangeOk
                      ? ui.pickRangeHint
                      : ui.overnightPriceHint}
                </p>
              ) : null}
              <button
                type="button"
                className={`${stickyCardStyles.ctaButton} disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:transform-none`}
                disabled={!step1Ready}
                onClick={() => setStep(2)}
              >
                {ui.continueButton}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#2168b8] hover:opacity-90 -ml-1 px-1 py-1 rounded-lg hover:bg-zinc-50"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              <ChevronLeft className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden />
              {ui.backToDateGuests}
            </button>
            <p
              className="text-xs font-semibold text-zinc-500 m-0 mb-4"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              {modalSubtitle}
            </p>

            <YachtInquiryForm
              yachtSlug={yacht.slug}
              yachtName={yacht.name}
              locationLabel={locLabel}
              rentalMode={rentalMode}
              priceFrom={summaryPrice}
              currency={yacht.currency}
              selectedDate={selectedDate}
              overnightCheckIn={overnightRange.checkIn}
              overnightCheckOut={overnightRange.checkOut}
              overnightNights={
                rangeOk && overnightRange.checkIn && overnightRange.checkOut
                  ? overnightNights(overnightRange.checkIn, overnightRange.checkOut)
                  : null
              }
              guestCount={guestCount}
              submitLabel={ctaText?.trim() || ui.defaultInquiryCta}
              locale={locale}
            />
          </div>
        )}
      </div>
    </div>
  )
}
