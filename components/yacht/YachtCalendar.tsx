'use client'

import { useMemo, useState } from 'react'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  buildYachtCalendarDaysForMonth,
  todayStrLocal,
} from '@/lib/yachtCalendar'
import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtCalendarUi } from '@/lib/yachtCalendarUi'
import styles from '@/components/booking/booking.module.css'

export type YachtCalendarRange = { checkIn: string | null; checkOut: string | null }

interface YachtCalendarProps {
  blockedDates?: string[]
  /** Varsayılan: tek gün seçimi */
  selectionMode?: 'single' | 'range'
  selectedDate?: string | null
  onSelectDate?: (isoDate: string) => void
  rangeValue?: YachtCalendarRange
  onRangeChange?: (v: YachtCalendarRange) => void
  /** Tur takvimi gibi gün altında fiyat (₺) */
  resolveDayPrice?: (isoDate: string) => number | undefined
  /** Kart içinde daha kompakt başlık */
  compactTitle?: boolean
  locale?: SiteLocale
  /** Başlık metni (yoksa dile göre varsayılan) */
  title?: string
}

function normalizeBlocked(set: Set<string>, raw?: string[]) {
  if (!raw?.length) return
  for (const d of raw) {
    if (typeof d === 'string' && d.length >= 10) set.add(d.slice(0, 10))
  }
}

export default function YachtCalendar({
  blockedDates,
  selectionMode = 'single',
  selectedDate = null,
  onSelectDate,
  rangeValue = { checkIn: null, checkOut: null },
  onRangeChange,
  resolveDayPrice,
  compactTitle,
  locale = 'tr',
  title: titleOverride,
}: YachtCalendarProps) {
  const todayStr = useMemo(() => todayStrLocal(), [])
  const t = new Date()
  const [viewYear, setViewYear] = useState(t.getFullYear())
  const [viewMonth, setViewMonth] = useState(t.getMonth() + 1)

  const blocked = useMemo(() => {
    const s = new Set<string>()
    normalizeBlocked(s, blockedDates)
    return s
  }, [blockedDates])

  const calendar = useMemo(
    () => buildYachtCalendarDaysForMonth(viewYear, viewMonth),
    [viewYear, viewMonth]
  )

  const calUi = getYachtCalendarUi(locale)
  const dateLocale = locale === 'en' ? 'en-US' : locale === 'de' ? 'de-DE' : 'tr-TR'

  /** Ay/yıl etiketine tıklayınca gerçek bir seçim listesi (native select) açılsın diye
      — tur rezervasyon takvimiyle (Step1PeopleDate) birebir aynı desen. */
  const monthNameOnly = useMemo(
    () => new Date(viewYear, viewMonth - 1, 1).toLocaleDateString(dateLocale, { month: 'long' }),
    [viewYear, viewMonth, dateLocale]
  )
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: new Date(2000, i, 1).toLocaleDateString(dateLocale, { month: 'long' }),
      })),
    [dateLocale]
  )
  const yearOptions = useMemo(() => [t.getFullYear(), t.getFullYear() + 1, t.getFullYear() + 2], [])
  const isViewingCurrentMonth = viewYear === t.getFullYear() && viewMonth === t.getMonth() + 1
  const goToPrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12)
      setViewYear((y) => y - 1)
    } else setViewMonth((m) => m - 1)
  }
  const goToNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1)
      setViewYear((y) => y + 1)
    } else setViewMonth((m) => m + 1)
  }

  const weekdays = useMemo(() => {
    const baseMonday = new Date(2024, 0, 1)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(baseMonday)
      d.setDate(baseMonday.getDate() + i)
      return d.toLocaleDateString(dateLocale, { weekday: 'short' })
    })
  }, [dateLocale])
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1)
  const gridStart = (firstDayOfMonth.getDay() + 6) % 7

  const minPriceInMonth = useMemo(() => {
    if (!resolveDayPrice) return null
    const prices = calendar
      .map((day) => {
        const blockedDay = blocked.has(day.date)
        const past = day.date < todayStr
        const selectable = !past && !blockedDay
        if (!selectable) return null
        const p = resolveDayPrice(day.date)
        return p != null && p > 0 ? p : null
      })
      .filter((p): p is number => p != null)
    return prices.length === 0 ? null : Math.min(...prices)
  }, [calendar, blocked, todayStr, resolveDayPrice])

  const isBeforeToday = (dateStr: string) => dateStr < todayStr

  const handleDayClick = (dateStr: string, selectable: boolean) => {
    if (!selectable) return
    if (selectionMode === 'single') {
      onSelectDate?.(dateStr)
      return
    }
    const checkIn = rangeValue.checkIn
    const checkOut = rangeValue.checkOut
    if (!checkIn || (checkIn && checkOut)) {
      onRangeChange?.({ checkIn: dateStr, checkOut: null })
    } else {
      if (dateStr > checkIn) {
        onRangeChange?.({ checkIn, checkOut: dateStr })
      } else {
        onRangeChange?.({ checkIn: dateStr, checkOut: null })
      }
    }
  }

  const defaultTitle =
    selectionMode === 'range' ? calUi.rangeTitle : calUi.singleTitle
  const title = titleOverride?.trim() || defaultTitle

  return (
    <div className={compactTitle ? undefined : styles.card}>
      {!compactTitle && (
        <h3 className={`${styles.cardTitle} ${styles.wizardMainStepTitle}`}>{title}</h3>
      )}
      {/* Tur rezervasyon takvimiyle (Step1PeopleDate) birebir aynı desen:
          "Ay › Yıl ›" etiketleri solda (tıklanabilir native select kapağı),
          yuvarlak ‹ › ok butonları sağda. */}
      <div className={styles.calendarMonthHeader}>
        <div className={styles.calendarMonthYearLabels}>
          <div className={styles.calendarMonthYearWrap}>
            <select
              className={styles.calendarMonthYearSelect}
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              aria-label={calUi.selectMonthAria}
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <span className={styles.calendarMonthYearItem} aria-hidden>
              {monthNameOnly}
              <ChevronRight width={15} height={15} aria-hidden />
            </span>
          </div>
          <div className={styles.calendarMonthYearWrap}>
            <select
              className={styles.calendarMonthYearSelect}
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              aria-label={calUi.selectYearAria}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <span className={styles.calendarMonthYearItem} aria-hidden>
              {viewYear}
              <ChevronRight width={15} height={15} aria-hidden />
            </span>
          </div>
        </div>
        <div className={styles.calendarNavBtnGroup}>
          <button
            type="button"
            className={styles.calendarNavBtn}
            aria-label={calUi.prevMonth}
            disabled={isViewingCurrentMonth}
            onClick={goToPrevMonth}
          >
            <ChevronLeft width={17} height={17} aria-hidden />
          </button>
          <button
            type="button"
            className={styles.calendarNavBtn}
            aria-label={calUi.nextMonth}
            onClick={goToNextMonth}
          >
            <ChevronRight width={17} height={17} aria-hidden />
          </button>
        </div>
      </div>
      <div className={`${styles.calendarWrap} ${styles.yachtCalendarWrap}`}>
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
            const blockedDay = blocked.has(day.date)
            const past = isBeforeToday(day.date)
            const selectable = !past && !blockedDay
            const cellPrice = resolveDayPrice?.(day.date)
            const showPrice = selectable && cellPrice != null && cellPrice > 0
            const showStar =
              showPrice && minPriceInMonth != null && cellPrice === minPriceInMonth
            const isToday = day.date === todayStr

            let selected = false
            let inRange = false
            if (selectionMode === 'single') {
              selected = selectedDate === day.date
            } else {
              const ci = rangeValue.checkIn
              const co = rangeValue.checkOut
              if (ci && co) {
                selected = day.date === ci || day.date === co
                inRange = day.date > ci && day.date < co
              } else if (ci) {
                selected = day.date === ci
              }
            }

            return (
              <button
                key={day.date}
                type="button"
                className={`${styles.dayCell} ${selected ? styles.dayCellSelected : ''} ${inRange ? styles.dayCellInRange : ''} ${!selectable ? styles.dayCellDisabled : ''}`}
                onClick={() => handleDayClick(day.date, selectable)}
                disabled={!selectable}
                aria-label={
                  blockedDay
                    ? calUi.unavailableDay(dayNum)
                    : past
                      ? calUi.pastDay(dayNum)
                      : `${calUi.dayLabel(dayNum, day.date)}${showPrice ? `, ${cellPrice!.toLocaleString(dateLocale)} ₺` : ''}`
                }
                aria-pressed={selected}
                style={
                  isToday && !selected && selectable
                    ? { borderColor: '#fc6c4f', color: '#fc6c4f' }
                    : undefined
                }
              >
                {showStar ? (
                  <span className={styles.dayCellStar} aria-hidden>
                    <Star className={styles.dayCellStarIcon} fill="currentColor" aria-hidden />
                  </span>
                ) : null}
                <span className={styles.dayNum}>{dayNum}</span>
                {showPrice ? (
                  <span className={styles.dayPrice}>
                    {cellPrice!.toLocaleString(dateLocale)} ₺
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>
      {selectionMode === 'range' && rangeValue.checkIn && !rangeValue.checkOut && (
        <p className="text-xs text-zinc-600 mt-2 mb-0" style={{ fontFamily: 'var(--font-family)' }}>
          {calUi.rangeCheckoutHint}
        </p>
      )}
      {blocked.size > 0 && (
        <p className="text-xs text-zinc-500 mt-2 mb-0" style={{ fontFamily: 'var(--font-family)' }}>
          {calUi.blockedHint}
        </p>
      )}
    </div>
  )
}
