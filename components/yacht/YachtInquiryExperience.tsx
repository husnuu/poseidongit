'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import StickyInquiryCard from '@/components/yacht/StickyInquiryCard'
import MobileYachtInquiryBar from '@/components/yacht/MobileYachtInquiryBar'
import YachtInquiryModal from '@/components/yacht/YachtInquiryModal'
import type { YachtRentalDocument } from '@/lib/yachtTypes'
import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtUi } from '@/lib/i18n/yachtUi'
import {
  blockedDatesForMode,
  effectiveOvernightAdvertisedPrice,
  effectiveYachtRentalModes,
  formatDateTrShort,
  formatOvernightSummaryTr,
  isValidOvernightRange,
  type YachtRentalMode,
} from '@/lib/yachtRentalModes'
import type { YachtCalendarRange } from '@/components/yacht/YachtCalendar'
import {
  yachtDailyUnitPrice,
  yachtOvernightCellDisplayPrice,
  yachtOvernightStayTotal,
} from '@/lib/yachtCalendarPricing'
import {
  formatYachtOvernightStickyPriceLine,
  formatYachtStickyPriceLine,
  splitYachtOvernightStickyLine,
  type YachtStickyPriceDisplay,
} from '@/lib/yachtFormat'

interface YachtInquiryExperienceProps {
  yacht: YachtRentalDocument
  locale?: SiteLocale
}

const EMPTY_RANGE: YachtCalendarRange = { checkIn: null, checkOut: null }

export default function YachtInquiryExperience({ yacht, locale = 'tr' }: YachtInquiryExperienceProps) {
  const ui = getYachtUi(locale)
  const numberLocale = ui.numberLocale
  const availableModes = useMemo(() => effectiveYachtRentalModes(yacht), [yacht])
  const [rentalMode, setRentalMode] = useState<YachtRentalMode>(() => availableModes[0] ?? 'daily')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [overnightRange, setOvernightRange] = useState<YachtCalendarRange>(EMPTY_RANGE)
  const [guestCount, setGuestCount] = useState(2)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalInitialStep, setModalInitialStep] = useState<1 | 2>(1)

  useEffect(() => {
    const m = effectiveYachtRentalModes(yacht)
    const next = m[0] ?? 'daily'
    setRentalMode(next)
    setSelectedDate(null)
    setOvernightRange(EMPTY_RANGE)
  }, [yacht._id])

  const maxGuests = useMemo(() => {
    const cap = yacht.specifications?.capacity
    if (typeof cap === 'number' && cap > 0) return Math.min(cap, 80)
    return 80
  }, [yacht.specifications?.capacity])

  const blockedForMode = useMemo(
    () => blockedDatesForMode(yacht, rentalMode),
    [yacht, rentalMode]
  )

  const showModeTabs = availableModes.length === 2
  const canInquire = availableModes.length > 0

  const selectionComplete = useMemo(() => {
    if (rentalMode === 'daily') return Boolean(selectedDate)
    const ok =
      overnightRange.checkIn && overnightRange.checkOut
        ? isValidOvernightRange({
            checkIn: overnightRange.checkIn,
            checkOut: overnightRange.checkOut,
          })
        : false
    if (!ok) return false
    return yachtOvernightStayTotal(yacht, overnightRange.checkIn!, overnightRange.checkOut!) != null
  }, [
    rentalMode,
    selectedDate,
    overnightRange.checkIn,
    overnightRange.checkOut,
    yacht,
  ])

  const sidebarPrice = useMemo((): YachtStickyPriceDisplay & { meta?: string } => {
    const cur = yacht.currency ?? 'TRY'
    if (rentalMode === 'daily') {
      if (selectedDate) {
        const p = yachtDailyUnitPrice(yacht, selectedDate)
        if (p != null) {
          return {
            label: ui.selectedDayLabel,
            value: `${p.toLocaleString(numberLocale)} ₺`,
            meta: formatDateTrShort(selectedDate, locale),
          }
        }
      }
      if (yacht.priceFrom != null) {
        return {
          label: ui.dailyLabel,
          value: `${yacht.priceFrom.toLocaleString(numberLocale)} ₺`,
          meta: ui.perDaySuffix,
        }
      }
      return { value: formatYachtStickyPriceLine(yacht.priceFrom, cur) }
    }
    if (
      overnightRange.checkIn &&
      overnightRange.checkOut &&
      isValidOvernightRange({
        checkIn: overnightRange.checkIn,
        checkOut: overnightRange.checkOut,
      })
    ) {
      const t = yachtOvernightStayTotal(yacht, overnightRange.checkIn, overnightRange.checkOut)
      if (t != null) {
        return {
          label: ui.overnightTotalLabel,
          value: `${t.toLocaleString(numberLocale)} ₺`,
          meta: formatOvernightSummaryTr(
            {
              checkIn: overnightRange.checkIn,
              checkOut: overnightRange.checkOut,
            },
            locale
          ),
        }
      }
    }
    const adv = effectiveOvernightAdvertisedPrice(yacht)
    if (adv != null) {
      return {
        label: ui.overnightLabel,
        value: `${adv.toLocaleString(numberLocale)} ₺`,
        meta: ui.perNightSuffix,
      }
    }
    return splitYachtOvernightStickyLine(formatYachtOvernightStickyPriceLine(adv, cur))
  }, [yacht, rentalMode, selectedDate, overnightRange.checkIn, overnightRange.checkOut, locale, numberLocale, ui])

  const stickyPrice = sidebarPrice

  const mobileDateSubtitle = useMemo(() => {
    if (rentalMode === 'daily') {
      if (!selectedDate) return null
      return formatDateTrShort(selectedDate, locale)
    }
    if (
      overnightRange.checkIn &&
      overnightRange.checkOut &&
      isValidOvernightRange({
        checkIn: overnightRange.checkIn,
        checkOut: overnightRange.checkOut,
      })
    ) {
      return formatOvernightSummaryTr(
        {
          checkIn: overnightRange.checkIn,
          checkOut: overnightRange.checkOut,
        },
        locale
      )
    }
    return null
  }, [rentalMode, selectedDate, overnightRange.checkIn, overnightRange.checkOut])

  const resolveDayPrice = useCallback(
    (iso: string) => {
      if (rentalMode === 'daily') return yachtDailyUnitPrice(yacht, iso)
      return yachtOvernightCellDisplayPrice(yacht, iso)
    },
    [yacht, rentalMode]
  )

  const setMode = useCallback((m: YachtRentalMode) => {
    setRentalMode(m)
    setSelectedDate(null)
    setOvernightRange(EMPTY_RANGE)
  }, [])

  const openModalFromMobile = useCallback(() => {
    setModalInitialStep(1)
    setModalOpen(true)
  }, [])

  const openModalFromDesktop = useCallback(() => {
    setModalInitialStep(selectionComplete ? 2 : 1)
    setModalOpen(true)
  }, [selectionComplete])

  const ctaText = yacht.inquiryCard?.ctaText?.trim() || ui.defaultInquiryCta

  if (!canInquire) {
    return (
      <aside className="w-full max-w-md mx-auto lg:mx-0 lg:flex-shrink-0 lg:w-[360px]">
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-5 text-sm font-semibold text-amber-950">
          {ui.modesClosedWarning}
        </div>
      </aside>
    )
  }

  return (
    <>
      <aside className="hidden lg:block lg:flex-shrink-0 lg:w-[360px]">
        <StickyInquiryCard
          priceLabel={stickyPrice.label}
          priceValue={stickyPrice.value}
          priceMeta={stickyPrice.meta ?? null}
          inquiryCard={yacht.inquiryCard}
          onOpenInquiry={openModalFromDesktop}
          locale={locale}
        />
      </aside>

      <MobileYachtInquiryBar
        priceLabel={stickyPrice.label}
        priceValue={stickyPrice.value}
        dateSubtitle={mobileDateSubtitle}
        onOpenInquiry={openModalFromMobile}
        ctaText={ctaText}
        isModalOpen={modalOpen}
        locale={locale}
      />

      <YachtInquiryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialStep={modalInitialStep}
        yacht={yacht}
        locale={locale}
        rentalMode={rentalMode}
        onRentalModeChange={setMode}
        showRentalModeTabs={showModeTabs}
        blockedDates={blockedForMode}
        selectionMode={rentalMode === 'daily' ? 'single' : 'range'}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        overnightRange={overnightRange}
        onOvernightRangeChange={setOvernightRange}
        guestCount={Math.min(guestCount, maxGuests)}
        onGuestCountChange={(n) => setGuestCount(Math.min(maxGuests, Math.max(1, n)))}
        maxGuests={maxGuests}
        ctaText={ctaText}
        resolveDayPrice={resolveDayPrice}
      />
    </>
  )
}
