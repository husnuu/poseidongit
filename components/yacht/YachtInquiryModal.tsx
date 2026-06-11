'use client'

import { useEffect, useState } from 'react'
import YachtCalendar, { type YachtCalendarRange } from '@/components/yacht/YachtCalendar'
import YachtRentalModeTabs from '@/components/yacht/YachtRentalModeTabs'
import YachtInquiryForm from '@/components/yacht/YachtInquiryForm'
import type { YachtRentalDocument } from '@/lib/yachtTypes'
import bookingStyles from '@/components/booking/booking.module.css'
import stickyCardStyles from '@/components/StickyBookingCard.module.css'
import { DEFAULT_YACHT_INQUIRY_CTA } from '@/lib/yachtConversionCopy'
import { Check, ChevronLeft } from 'lucide-react'
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
  const modalSubtitle =
    step === 1 ? 'Tarih ve misafir sayısını seçin' : 'İletişim bilgilerinizi bırakın'

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
        <div className="shrink-0 z-20 bg-white sm:rounded-t-2xl border-b border-zinc-100">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <h2
              id="yacht-inquiry-modal-title"
              className="text-lg font-black uppercase tracking-wide text-[#1e3a5f] m-0 truncate"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              Rezervasyon talebi
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 shrink-0"
              aria-label="Kapat"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div
            id="yacht-inquiry-modal-step-desc"
            className={bookingStyles.wizardModalStepStrip}
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={2}
            aria-label={`Adım ${step} / 2`}
          >
            {[1, 2].map((s) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                {s < 2 && (
                  <div
                    className={`${bookingStyles.connector} ${step > s ? bookingStyles.connectorDone : ''}`}
                    aria-hidden
                  />
                )}
              </div>
            ))}
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
                <YachtRentalModeTabs value={rentalMode} onChange={onRentalModeChange} />
              ) : null}
              <YachtCalendar
                blockedDates={blockedDates}
                selectionMode={selectionMode}
                selectedDate={selectedDate}
                onSelectDate={onSelectDate}
                rangeValue={overnightRange}
                onRangeChange={onOvernightRangeChange}
                resolveDayPrice={resolveDayPrice}
              />

              <div className="mt-6 mb-2">
                <p
                  className="text-sm font-semibold text-zinc-700 mb-2"
                  style={{ fontFamily: 'var(--font-family)' }}
                >
                  Misafir sayısı
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className={bookingStyles.counterBtn}
                    aria-label="Azalt"
                    disabled={guestCount <= 1}
                    onClick={() => onGuestCountChange(Math.max(1, guestCount - 1))}
                  >
                    −
                  </button>
                  <span className={bookingStyles.counterValue}>{guestCount}</span>
                  <button
                    type="button"
                    className={`${bookingStyles.counterBtn} ${bookingStyles.counterBtnPlus}`}
                    aria-label="Artır"
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
                    ? 'Devam etmek için takvimden bir gün seçin.'
                    : !rangeOk
                      ? 'Devam etmek için giriş ve ayrılış günlerini seçin (en az 1 gece).'
                      : 'Konaklama fiyatı için gece takviminde tüm geceler tanımlı olmalı veya konaklamalı toplam fiyat (referans) girilmeli.'}
                </p>
              ) : null}
              <button
                type="button"
                className={`${stickyCardStyles.ctaButton} disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:transform-none`}
                disabled={!step1Ready}
                onClick={() => setStep(2)}
              >
                Devam et
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
              Tarih ve misafir
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
              submitLabel={ctaText?.trim() || DEFAULT_YACHT_INQUIRY_CTA}
            />
          </div>
        )}
      </div>
    </div>
  )
}
