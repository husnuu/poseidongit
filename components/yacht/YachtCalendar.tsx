'use client'

import { useMemo, useState } from 'react'
import {
  buildYachtCalendarDaysForMonth,
  todayStrLocal,
} from '@/lib/yachtCalendar'
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

  const monthLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth - 1, 1)
    return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
  }, [viewYear, viewMonth])

  const weekdays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1)
  const gridStart = (firstDayOfMonth.getDay() + 6) % 7

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

  const title =
    selectionMode === 'range' ? 'Giriş ve ayrılış tarihi' : 'Tercih ettiğiniz tarih'

  return (
    <div className={compactTitle ? undefined : styles.card}>
      {!compactTitle && (
        <h3 className={`${styles.cardTitle} ${styles.wizardMainStepTitle}`}>{title}</h3>
      )}
      <div
        className="flex items-center justify-between mb-2"
        style={{ marginBottom: 8 }}
      >
        <button
          type="button"
          className={styles.counterBtn}
          aria-label="Önceki ay"
          disabled={
            viewYear < t.getFullYear() ||
            (viewYear === t.getFullYear() && viewMonth <= t.getMonth() + 1)
          }
          onClick={() => {
            if (viewMonth === 1) {
              setViewMonth(12)
              setViewYear((y) => y - 1)
            } else setViewMonth((m) => m - 1)
          }}
        >
          ←
        </button>
        <span className="font-semibold text-[15px]" style={{ fontFamily: 'var(--font-family)' }}>
          {monthLabel}
        </span>
        <button
          type="button"
          className={styles.counterBtn}
          aria-label="Sonraki ay"
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
            const blockedDay = blocked.has(day.date)
            const past = isBeforeToday(day.date)
            const selectable = !past && !blockedDay
            const cellPrice = resolveDayPrice?.(day.date)
            const showPrice = selectable && cellPrice != null && cellPrice > 0

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
                    ? `${dayNum} müsait değil`
                    : past
                      ? `${dayNum} geçmiş`
                      : `${dayNum} ${day.date}`
                }
              >
                <span className={styles.dayNum}>{dayNum}</span>
                {showPrice ? (
                  <span className={styles.dayPrice}>{cellPrice!.toLocaleString('tr-TR')} ₺</span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>
      {selectionMode === 'range' && rangeValue.checkIn && !rangeValue.checkOut && (
        <p className="text-xs text-zinc-600 mt-2 mb-0" style={{ fontFamily: 'var(--font-family)' }}>
          Ayrılış gününü seçin (son konaklama gecesinden sonraki gün).
        </p>
      )}
      {blocked.size > 0 && (
        <p className="text-xs text-zinc-500 mt-2 mb-0" style={{ fontFamily: 'var(--font-family)' }}>
          Gri günler şu an için uygun değil. Diğer tarihler için talep bırakabilirsiniz.
        </p>
      )}
    </div>
  )
}
