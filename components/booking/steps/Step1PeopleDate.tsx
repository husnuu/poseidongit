'use client'

import { useState, useMemo } from 'react'
import { Star, Users, CalendarDays, ChevronDown, Info } from 'lucide-react'
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
  const [rulesOpen, setRulesOpen] = useState(false)

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

  const selectedDateLabel = useMemo(() => {
    if (!state.selectedDate) return null
    const d = new Date(state.selectedDate + 'T00:00:00')
    return d.toLocaleDateString(ui.numberLocale, { day: 'numeric', month: 'short', year: 'numeric' })
  }, [state.selectedDate, ui.numberLocale])

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

      {/* Rezervasyon kuralları accordion */}
      {showRules && (
        <div className={styles.rulesAccordionWrap}>
          <button
            type="button"
            className={styles.rulesAccordionToggle}
            onClick={() => setRulesOpen((v) => !v)}
            aria-expanded={rulesOpen}
          >
            <Info width={13} height={13} aria-hidden />
            Rezervasyon kuralları
            <ChevronDown
              width={14}
              height={14}
              className={`${styles.rulesAccordionChevron} ${rulesOpen ? styles.rulesAccordionChevronOpen : ''}`}
              aria-hidden
            />
          </button>
          {rulesOpen && (
            <div className={styles.rulesAccordionContent} role="region">
              {rules?.title && (
                <p className={styles.rulesAccordionTitle}>{rules.title}</p>
              )}
              <ul className={styles.rulesAccordionList}>
                {(rules?.bullets ?? []).map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Kişi Sayısı ── */}
      <div className={styles.sectionFlat}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <Users width={18} height={18} className={styles.sectionIcon} aria-hidden />
            <h3 className={styles.sectionTitle}>{ui.guestCountTitle}</h3>
          </div>
          {total > 0 && (
            <span className={styles.guestTotalBadge} aria-live="polite">
              {total} kişi
            </span>
          )}
        </div>

        <div className={styles.counterList}>
          {/* Yetişkin */}
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
              >−</button>
              <span className={styles.counterValue} aria-live="polite">{counts.adult}</span>
              <button
                type="button"
                className={`${styles.counterBtn} ${styles.counterBtnPlus}`}
                disabled={!canIncrementAdult}
                onClick={() => onUpdate({ counts: { ...counts, adult: counts.adult + 1 } })}
                aria-label={ui.ariaIncAdult}
              >+</button>
            </div>
          </div>

          {/* Çocuk */}
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
              >−</button>
              <span className={styles.counterValue} aria-live="polite">{counts.child}</span>
              <button
                type="button"
                className={`${styles.counterBtn} ${styles.counterBtnPlus}`}
                disabled={!canIncrementChild}
                onClick={() => onUpdate({ counts: { ...counts, child: counts.child + 1 } })}
                aria-label={ui.ariaIncChild}
              >+</button>
            </div>
          </div>

          {/* Bebek */}
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
              >−</button>
              <span className={styles.counterValue} aria-live="polite">{counts.baby}</span>
              <button
                type="button"
                className={`${styles.counterBtn} ${styles.counterBtnPlus}`}
                disabled={!canIncrementBaby}
                onClick={() => onUpdate({ counts: { ...counts, baby: counts.baby + 1 } })}
                aria-label={ui.ariaIncBaby}
              >+</button>
            </div>
          </div>
        </div>

        {total > maxPax && (
          <p className={styles.errorText} style={{ marginTop: 8 }}>
            {ui.maxGuestsError(maxPax)}
          </p>
        )}
      </div>

      {/* ── Tarih Seçimi ── */}
      <div className={styles.sectionFlat}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <CalendarDays width={18} height={18} className={styles.sectionIcon} aria-hidden />
            <h3 className={styles.sectionTitle}>{ui.selectDateTitle}</h3>
          </div>
          {selectedDateLabel && (
            <span className={styles.selectedDateChip} aria-live="polite">
              {selectedDateLabel}
            </span>
          )}
        </div>

        {/* Ay navigasyon */}
        <div className={styles.calendarMonthHeader}>
          <button
            type="button"
            className={styles.calendarNavBtn}
            aria-label={ui.prevMonthAria}
            disabled={isViewingFirstAvailableMonth}
            onClick={() => {
              if (viewMonth === 1) { setViewMonth(12); setViewYear((y) => y - 1) }
              else setViewMonth((m) => m - 1)
            }}
          >‹</button>
          <span className={styles.calendarMonthLabel}>{monthLabel}</span>
          <button
            type="button"
            className={styles.calendarNavBtn}
            aria-label={ui.nextMonthAria}
            onClick={() => {
              if (viewMonth === 12) { setViewMonth(1); setViewYear((y) => y + 1) }
              else setViewMonth((m) => m + 1)
            }}
          >›</button>
        </div>

        {/* Takvim grid */}
        <div className={styles.calendarWrap}>
          <div className={styles.calendarGrid}>
            {weekdays.map((wd) => (
              <div key={wd} className={styles.weekday} aria-hidden>{wd}</div>
            ))}
            {Array.from({ length: gridStart }, (_, i) => (
              <div key={`empty-${i}`} aria-hidden />
            ))}
            {calendar.map((day) => {
              const dayNum = parseInt(day.date.slice(8), 10)
              const selected = state.selectedDate === day.date
              const available = day.isAvailable && day.date >= todayStr
              const isToday = day.date === todayStr
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
                  style={isToday && !selected ? { borderColor: '#fc6c4f', color: '#fc6c4f' } : undefined}
                >
                  {showStar && (
                    <span className={styles.dayCellStar} aria-hidden>
                      <Star className={styles.dayCellStarIcon} fill="currentColor" aria-hidden />
                    </span>
                  )}
                  <span className={styles.dayNum}>{dayNum}</span>
                  {showPrice && (
                    <span className={styles.dayPrice}>
                      {day.minPrice!.toLocaleString(ui.numberLocale)} ₺
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className={styles.ctaSection}>
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
