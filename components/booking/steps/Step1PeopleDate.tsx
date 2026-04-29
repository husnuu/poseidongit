'use client'

import { useState, useMemo } from 'react'
import { Star, Info } from 'lucide-react'
import type { TourForBooking, BookingWizardState } from '@/lib/sanity/bookingTypes'
import { buildCalendarDaysForMonth, getFirstAvailableYearMonth } from '@/lib/sanity/bookingPricing'
import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import styles from '../booking.module.css'

interface Step1PeopleDateProps {
  tour: TourForBooking
  state: BookingWizardState
  maxPax: number
  onUpdate: (patch: Partial<BookingWizardState>) => void
  onBack: () => void
  onNext: () => void
  canProceed: boolean
  ctaLabel: string
  ctaDisabled: boolean
  ui: BookingWizardUi
}

export default function Step1PeopleDate({
  tour,
  state,
  maxPax,
  onUpdate,
  onBack,
  onNext,
  canProceed,
  ctaLabel,
  ctaDisabled,
  ui,
}: Step1PeopleDateProps) {
  const MAX_PER_CATEGORY = 9
  const counts = state.counts
  const total = counts.adult + counts.child + counts.baby
  const canDecrementAdult = counts.adult > 1
  const canIncrement = total < maxPax
  const canIncrementAdult = canIncrement && counts.adult < MAX_PER_CATEGORY
  const canIncrementChild = canIncrement && counts.child < MAX_PER_CATEGORY
  const canIncrementBaby  = canIncrement && counts.baby  < MAX_PER_CATEGORY

  const rules = tour.bookingRules
  const showRules = rules?.show !== false && (rules?.bullets?.length ?? 0) > 0

  const firstAvailable = useMemo(() => getFirstAvailableYearMonth(tour), [tour])
  const [viewYear, setViewYear] = useState(() => firstAvailable.year)
  const [viewMonth, setViewMonth] = useState(() => firstAvailable.month)
  const isViewingFirstAvailableMonth =
    viewYear === firstAvailable.year && viewMonth === firstAvailable.month
  const todayStr = useMemo(() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  }, [])

  const calendar = useMemo(
    () => buildCalendarDaysForMonth(tour, viewYear, viewMonth),
    [tour, viewYear, viewMonth]
  )
  const monthLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth - 1, 1)
    return d.toLocaleDateString(ui.numberLocale, { month: 'long', year: 'numeric' })
  }, [viewYear, viewMonth, ui.numberLocale])
  const weekdays = ui.weekdaysShort
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1)
  const gridStart = (firstDayOfMonth.getDay() + 6) % 7

  const minPriceInMonth = useMemo(() => {
    const prices = calendar
      .filter((d) => d.isAvailable && d.date >= todayStr && d.minPrice != null)
      .map((d) => d.minPrice!)
    return prices.length === 0 ? null : Math.min(...prices)
  }, [calendar, todayStr])

  return (
    <div className={styles.stepContent}>
      {showRules && (
        <div className={styles.infoBox}>
          <span className={styles.infoBoxAccent} aria-hidden />
          <h3 className={styles.infoBoxTitle}>
            <Info className="w-4 h-4 flex-shrink-0" aria-hidden />
            {rules?.title ?? ui.rulesTitleFallback}
          </h3>
          <ul className={styles.infoBoxList}>
            {(rules?.bullets ?? []).slice(0, 4).map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.cardCaption}>
          <span className={styles.cardCaptionIcon} aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <h3 className={`${styles.cardCaptionTitle} ${styles.wizardMainStepTitle}`}>{ui.guestCountTitle}</h3>
        </div>
        <hr className={styles.cardDivider} />
        <div className={styles.cardContent}>
        <div className={styles.counterList}>
        <div className={styles.counterRow}>
          <div>
            <div className={styles.counterLabel}>{ui.adult}</div>
            <div className={styles.counterSub}>{ui.adultAge}</div>
          </div>
          <div className={styles.counterControls}>
            <button
              type="button"
              className={styles.counterBtn}
              disabled={!canDecrementAdult}
              onClick={() => onUpdate({ counts: { ...counts, adult: Math.max(1, counts.adult - 1) } })}
              aria-label={ui.ariaDecAdult}
            >
              −
            </button>
            <span className={styles.counterValue}>{counts.adult}</span>
            <button
              type="button"
              className={`${styles.counterBtn} ${styles.counterBtnPlus}`}
              disabled={!canIncrementAdult}
              onClick={() => onUpdate({ counts: { ...counts, adult: counts.adult + 1 } })}
              aria-label={ui.ariaIncAdult}
            >
              +
            </button>
          </div>
        </div>
        <div className={styles.counterRow}>
          <div>
            <div className={styles.counterLabel}>{ui.child}</div>
            <div className={styles.counterSub}>{ui.childAge}</div>
          </div>
          <div className={styles.counterControls}>
            <button
              type="button"
              className={styles.counterBtn}
              disabled={counts.child <= 0}
              onClick={() => onUpdate({ counts: { ...counts, child: Math.max(0, counts.child - 1) } })}
              aria-label={ui.ariaDecChild}
            >
              −
            </button>
            <span className={styles.counterValue}>{counts.child}</span>
            <button
              type="button"
              className={`${styles.counterBtn} ${styles.counterBtnPlus}`}
              disabled={!canIncrementChild}
              onClick={() => onUpdate({ counts: { ...counts, child: counts.child + 1 } })}
              aria-label={ui.ariaIncChild}
            >
              +
            </button>
          </div>
        </div>
        <div className={styles.counterRow}>
          <div>
            <div className={styles.counterLabel}>{ui.baby}</div>
            <div className={styles.counterSub}>{ui.babyAge}</div>
          </div>
          <div className={styles.counterControls}>
            <button
              type="button"
              className={styles.counterBtn}
              disabled={counts.baby <= 0}
              onClick={() => onUpdate({ counts: { ...counts, baby: Math.max(0, counts.baby - 1) } })}
              aria-label={ui.ariaDecBaby}
            >
              −
            </button>
            <span className={styles.counterValue}>{counts.baby}</span>
            <button
              type="button"
              className={`${styles.counterBtn} ${styles.counterBtnPlus}`}
              disabled={!canIncrementBaby}
              onClick={() => onUpdate({ counts: { ...counts, baby: counts.baby + 1 } })}
              aria-label={ui.ariaIncBaby}
            >
              +
            </button>
          </div>
        </div>
        </div>
        {total > maxPax && (
          <p className={styles.errorText} style={{ marginTop: 8 }}>
            {ui.maxGuestsError(maxPax)}
          </p>
        )}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardCaption}>
          <span className={styles.cardCaptionIcon} aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </span>
          <h3 className={`${styles.cardCaptionTitle} ${styles.wizardMainStepTitle}`}>{ui.selectDateTitle}</h3>
        </div>
        <hr className={styles.cardDivider} />
        <div className={styles.cardContent}>
        <div className="flex items-center justify-between mb-2" style={{ gap: 8 }}>
          <button
            type="button"
            className={styles.counterBtn}
            aria-label={ui.prevMonthAria}
            disabled={isViewingFirstAvailableMonth}
            onClick={() => {
              if (viewMonth === 1) {
                setViewMonth(12)
                setViewYear((y) => y - 1)
              } else setViewMonth((m) => m - 1)
            }}
          >
            ←
          </button>
          <span className="font-semibold text-sm">{monthLabel}</span>
          <button
            type="button"
            className={styles.counterBtn}
            aria-label={ui.nextMonthAria}
            onClick={() => {
              if (viewMonth === 12) {
                setViewMonth(1)
                setViewYear((y) => y + 1)
              } else setViewMonth((m) => m + 1)
            }}
          >
            →
          </button>
        </div>
        <div className={styles.calendarWrap}>
          <div className={styles.calendarGrid}>
            {weekdays.map((wd) => (
              <div key={wd} className={styles.weekday} aria-hidden>
                {wd}
              </div>
            ))}
            {Array.from({ length: gridStart }, (_, i) => (
              <div key={`empty-${i}`} aria-hidden />
            ))}
            {calendar.map((day) => {
              const dayNum = parseInt(day.date.slice(8), 10)
              const selected = state.selectedDate === day.date
              const available = day.isAvailable && day.date >= todayStr
              const showPrice = available && day.minPrice != null
              const showStar = available && minPriceInMonth != null && day.minPrice === minPriceInMonth
              return (
                <button
                  key={day.date}
                  type="button"
                  className={`${styles.dayCell} ${selected ? styles.dayCellSelected : ''} ${!available ? styles.dayCellDisabled : ''}`}
                  onClick={() => available && onUpdate({ selectedDate: day.date })}
                  disabled={!available}
                  aria-label={ui.calendarDayAria(
                    dayNum,
                    day.date,
                    showPrice && day.minPrice != null ? `, ${day.minPrice} TL` : ''
                  )}
                  aria-pressed={selected}
                >
                  {showStar && (
                    <span className={styles.dayCellStar} aria-hidden>
                      <Star className={styles.dayCellStarIcon} fill="currentColor" aria-hidden />
                    </span>
                  )}
                  <span className={styles.dayNum}>{dayNum}</span>
                  {showPrice && (
                    <span className={styles.dayPrice}>{day.minPrice!.toLocaleString(ui.numberLocale)} ₺</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
        </div>
      </div>

      <div className={styles.stepActions}>
        <div className={styles.stepActionsRow}>
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
