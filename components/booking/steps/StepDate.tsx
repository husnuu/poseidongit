'use client'

import { useState, useMemo } from 'react'
import { Star } from 'lucide-react'
import type { TourForBooking, BookingWizardState } from '@/lib/sanity/bookingTypes'
import { buildCalendarDaysForMonth, getFirstAvailableYearMonth } from '@/lib/sanity/bookingPricing'
import styles from '../booking.module.css'

interface StepDateProps {
  tour: TourForBooking
  state: BookingWizardState
  onUpdate: (patch: Partial<BookingWizardState>) => void
}

export default function StepDate({ tour, state, onUpdate }: StepDateProps) {
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
    return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
  }, [viewYear, viewMonth])

  const weekdays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1)
  const gridStart = (firstDayOfMonth.getDay() + 6) % 7

  const minPriceInMonth = useMemo(() => {
    const prices = calendar
      .filter((d) => d.isAvailable && d.date >= todayStr && d.minPrice != null)
      .map((d) => d.minPrice!)
    return prices.length === 0 ? null : Math.min(...prices)
  }, [calendar, todayStr])

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Tarih Seçin</h3>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button
          type="button"
          className={styles.counterBtn}
          aria-label="Önceki ay"
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
        <span style={{ fontWeight: 600, fontSize: 15 }}>{monthLabel}</span>
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
              >
                {showStar && (
                  <span className={styles.dayCellStar} aria-hidden>
                    <Star className={styles.dayCellStarIcon} fill="currentColor" aria-hidden />
                  </span>
                )}
                <span className={styles.dayNum}>{dayNum}</span>
                {showPrice && (
                  <span className={styles.dayPrice}>{day.minPrice!.toLocaleString('tr-TR')} ₺</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
