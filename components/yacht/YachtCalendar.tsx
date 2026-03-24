'use client'

import { useMemo, useState } from 'react'
import {
  buildYachtCalendarDaysForMonth,
  todayStrLocal,
} from '@/lib/yachtCalendar'
import styles from '@/components/booking/booking.module.css'

interface YachtCalendarProps {
  blockedDates?: string[]
  selectedDate: string | null
  onSelectDate: (isoDate: string) => void
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
  selectedDate,
  onSelectDate,
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

  return (
    <div className={compactTitle ? undefined : styles.card}>
      {!compactTitle && (
        <h3 className={`${styles.cardTitle} ${styles.wizardMainStepTitle}`}>
          Tercih ettiğiniz tarih
        </h3>
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
            const selected = selectedDate === day.date
            const blockedDay = blocked.has(day.date)
            const past = isBeforeToday(day.date)
            const selectable = !past && !blockedDay
            return (
              <button
                key={day.date}
                type="button"
                className={`${styles.dayCell} ${selected ? styles.dayCellSelected : ''} ${!selectable ? styles.dayCellDisabled : ''}`}
                onClick={() => selectable && onSelectDate(day.date)}
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
              </button>
            )
          })}
        </div>
      </div>
      {blocked.size > 0 && (
        <p className="text-xs text-zinc-500 mt-2 mb-0" style={{ fontFamily: 'var(--font-family)' }}>
          Gri günler şu an için uygun değil. Diğer tarihler için talep bırakabilirsiniz.
        </p>
      )}
    </div>
  )
}
