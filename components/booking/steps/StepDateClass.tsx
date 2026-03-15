'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import { Star } from 'lucide-react'
import type {
  TourForBooking,
  BookingWizardState,
  CalendarDay,
  PricingSummary,
} from '@/lib/sanity/bookingTypes'
import { getTourIdForFirebase } from '@/lib/sanity/bookingTypes'
import { computePricingForSelection, buildCalendarDaysForMonth, getFirstAvailableYearMonth, getSeasonMultiplier, getClassStatusForDate, getRemainingCapacityForDate, getCapForTicketClass } from '@/lib/sanity/bookingPricing'
import { useAvailability, type UsedByDateAndClass } from '@/lib/hooks/useAvailability'
import styles from '../booking.module.css'

function datesForMonth(year: number, month: number): string[] {
  const daysInMonth = new Date(year, month, 0).getDate()
  const out: string[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    out.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
  }
  return out
}

interface StepDateClassProps {
  tour: TourForBooking
  state: BookingWizardState
  onUpdate: (patch: Partial<BookingWizardState>) => void
  onPricingComputed: (pricing: PricingSummary | null) => void
  /** Rezervasyon sonrası anlık kalan kontenjan için (Sanity kapasitesi - API used - bu). */
  optimisticUsed?: UsedByDateAndClass | null
}

export default function StepDateClass({
  tour,
  state,
  onUpdate,
  onPricingComputed,
  optimisticUsed,
}: StepDateClassProps) {
  const firstAvailable = useMemo(() => getFirstAvailableYearMonth(tour), [tour])
  const [viewYear, setViewYear] = useState(() => firstAvailable.year)
  const [viewMonth, setViewMonth] = useState(() => firstAvailable.month)
  const isViewingFirstAvailableMonth =
    viewYear === firstAvailable.year && viewMonth === firstAvailable.month

  // Takvimi Sanity tur verisiyle client'ta oluştur – günler ve müsaitlik hep görünsün
  const calendar = useMemo(
    () => buildCalendarDaysForMonth(tour, viewYear, viewMonth),
    [tour, viewYear, viewMonth]
  )

  // Seçili tarih varken tek tarih ile iste (single-date API → doğru kalan kontenjan). Tarih yokken ayın günleri (takvim).
  const datesToFetch = useMemo(() => {
    if (state.selectedDate) return [state.selectedDate]
    return datesForMonth(viewYear, viewMonth)
  }, [viewYear, viewMonth, state.selectedDate])
  const { usedByDate, availability } = useAvailability(getTourIdForFirebase(tour), datesToFetch, {
    tourSlug: tour?.slug,
    optimisticUsed,
  })
  const LOW_STOCK_THRESHOLD = 5

  useEffect(() => {
    const total = state.counts.adult + state.counts.child + state.counts.baby
    if (state.selectedClassKey === 'first' && (state.counts.child > 0 || state.counts.baby > 0)) {
      onUpdate({ selectedClassKey: null })
      return
    }
    if (state.selectedClassKey === 'first' && total % 2 !== 0) {
      onUpdate({ selectedClassKey: null })
      return
    }
    if (state.selectedDate && state.selectedClassKey) {
      const status = getClassStatusForDate(tour, state.selectedDate, state.selectedClassKey)
      if (status === 'full' || status === 'closed') onUpdate({ selectedClassKey: null })
    }
  }, [tour, state.selectedDate, state.selectedClassKey, state.counts.adult, state.counts.child, state.counts.baby, onUpdate])

  useEffect(() => {
    if (!state.selectedDate || !state.selectedClassKey) {
      onPricingComputed(null)
      return
    }
    const summary = computePricingForSelection(
      tour,
      state.selectedDate,
      state.selectedClassKey,
      state.counts
    )
    onPricingComputed(summary)
    // Sadece tarih/sınıf/kişi sayısı değişince fiyat hesapla; onPricingComputed sabit referans
  }, [
    tour,
    state.selectedDate,
    state.selectedClassKey,
    state.counts.adult,
    state.counts.child,
    state.counts.baby,
    onPricingComputed,
  ])

  const todayStr = useMemo(() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  }, [])

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

  const totalPax = state.counts.adult + state.counts.child + state.counts.baby
  const capacityForDate = state.selectedDate
    ? getRemainingCapacityForDate(tour, state.selectedDate, usedByDate)
    : null
  const hasOptimisticForDate = Boolean(
    state.selectedDate && optimisticUsed?.[state.selectedDate] && Object.keys(optimisticUsed[state.selectedDate] ?? {}).length > 0
  )
  const capForClass = (classKey: string) => {
    if (!hasOptimisticForDate && availability?.date === state.selectedDate && availability?.classes[classKey] != null)
      return availability.classes[classKey].remaining
    return getCapForTicketClass(capacityForDate, classKey)
  }
  const selectedCapacity = state.selectedClassKey ? capForClass(state.selectedClassKey) : 0
  const hasCapacity = selectedCapacity >= totalPax

  return (
    <>
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
                    <span className={styles.dayPrice}>
                      {day.minPrice!.toLocaleString('tr-TR')} ₺
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {state.selectedDate && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Sınıf Seçimi</h3>
          {(tour.ticketClasses ?? []).map((cls) => {
            const selected = state.selectedClassKey === cls.key
            const cap = capForClass(cls.key)
            const firstClassNoChildOrBaby = cls.key === 'first' ? state.counts.child === 0 && state.counts.baby === 0 : true
            const firstClassEvenPax = cls.key !== 'first' || totalPax % 2 === 0
            const classStatus = state.selectedDate ? getClassStatusForDate(tour, state.selectedDate, cls.key) : null
            const classBlocked = classStatus === 'full' || classStatus === 'closed'
            const isFull = classBlocked || cap === 0
            const insufficientCap = cap > 0 && cap < totalPax && !classBlocked
            const available = cap >= totalPax && firstClassNoChildOrBaby && firstClassEvenPax && !classBlocked
            const isFirstClassRestricted = cls.key === 'first' && (!firstClassNoChildOrBaby || totalPax % 2 !== 0)
            const isFirstClassOddPaxWarning = cls.key === 'first' && totalPax % 2 !== 0
            const adultPrice = cls.pricesByAge?.find((p) => p.ageKey === 'adult')
            const multiplier = state.selectedDate ? getSeasonMultiplier(tour, state.selectedDate) : 1
            const price =
              adultPrice?.price != null
                ? Math.round(adultPrice.price * multiplier)
                : undefined
            const dateFormatted = new Date(state.selectedDate!).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'short',
            })
            return (
              <button
                key={cls.key}
                type="button"
                className={`${styles.classCard} ${selected ? styles.classCardSelected : ''} ${isFull ? styles.classCardDisabled : ''} ${insufficientCap ? styles.classCardDisabled : ''}`}
                style={{
                  position: 'relative',
                  ...(isFull || insufficientCap ? { opacity: 0.82, filter: 'grayscale(0.4)', cursor: 'not-allowed' } : {}),
                }}
                onClick={() => available && onUpdate({ selectedClassKey: cls.key })}
                disabled={!available}
              >
                {isFirstClassOddPaxWarning && (
                  <div
                    role="alert"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      zIndex: 2,
                      padding: '10px 12px',
                      background: '#fef3c7',
                      border: '1px solid #f59e0b',
                      borderRadius: '8px 8px 0 0',
                      color: '#92400e',
                      fontSize: 13,
                      fontWeight: 500,
                      textAlign: 'center',
                    }}
                  >
                    Bu alandaki bungalov yataklarımız 2 kişiliktir. Tek sayılı kişi ile rezervasyon verilmemektedir.
                  </div>
                )}
                <div
                  style={{
                    filter: isFirstClassRestricted ? 'blur(5px)' : undefined,
                    pointerEvents: isFirstClassRestricted ? 'none' : undefined,
                    transition: 'filter 0.2s ease',
                  }}
                >
                {cls.classImage?.url && (
                  <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 'inherit' }}>
                    <Image
                      src={`${cls.classImage.url}?w=600&h=300&fit=crop`}
                      alt={cls.label}
                      width={600}
                      height={300}
                      className={styles.classCardImage}
                    />
                    {(isFull || insufficientCap) && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 'inherit',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                        aria-hidden
                      >
                        <span
                          style={{
                            color: '#fff',
                            fontSize: 22,
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                          }}
                        >
                          {classBlocked ? (classStatus === 'full' ? 'DOLU' : 'KAPALI') : cap === 0 ? 'DOLU' : 'KAPASİTE YETERSİZ'}
                        </span>
                        {insufficientCap && cap > 0 && (
                          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                            Mevcut rezervasyonlardan sonra kalan: {cap} kişi
                          </span>
                        )}
                        {cap === 0 && !classBlocked && (
                          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                            Bu tarih için kontenjan dolmuştur
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className={styles.classCardBody}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
                    {cls.badge && (
                      <span
                        className={`${styles.classBadge} ${
                          cls.badge.toLowerCase().includes('popüler') ? styles.classBadgePopular : ''
                        }`}
                      >
                        {cls.badge}
                      </span>
                    )}
                    {!isFull && !insufficientCap && cap > 0 && cap <= LOW_STOCK_THRESHOLD && (
                      <span className={styles.classBadge} style={{ background: '#b45309', color: '#fff' }}>
                        Son {cap} yer
                      </span>
                    )}
                    {selected && (
                      <span className={styles.classBadge} style={{ background: 'var(--primary)', color: '#fff' }}>
                        SEÇİLDİ
                      </span>
                    )}
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 600 }}>{cls.label}</h4>
                  {cls.description && (
                    <p style={{ margin: '0 0 8px 0', fontSize: 13, color: '#71717a' }}>
                      {cls.description}
                    </p>
                  )}
                  {cls.bullets && cls.bullets.length > 0 && (
                    <ul style={{ margin: '0 0 8px 0', paddingLeft: 18, fontSize: 13, color: '#52525b' }}>
                      {cls.bullets.slice(0, 3).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {price != null && (
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                      Yetişkin ({dateFormatted}): {price.toLocaleString('tr-TR')} ₺
                    </p>
                  )}
                  {cap >= totalPax && cap > 0 && (
                    <p style={{ margin: '8px 0 0', fontSize: 13, color: '#166534', fontWeight: 500 }}>
                      {cap <= LOW_STOCK_THRESHOLD ? `Son ${cap} yer` : `Kalan: ${cap} kişi`}
                    </p>
                  )}
                  {insufficientCap && cap > 0 && (
                    <p style={{ margin: '8px 0 0', fontSize: 13, color: '#b91c1c', fontWeight: 600 }} role="alert">
                      Mevcut rezervasyonlardan sonra kalan kontenjan: {cap} kişi. {totalPax} kişilik rezervasyon için yeterli yer yok.
                    </p>
                  )}
                </div>
                </div>
                {isFirstClassRestricted && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 16,
                      background: 'rgba(255,255,255,0.88)',
                      borderRadius: 'inherit',
                      zIndex: 1,
                    }}
                    aria-hidden
                  >
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151', textAlign: 'center', lineHeight: 1.4 }}>
                      {totalPax % 2 !== 0
                        ? 'Bu alandaki bungalov yataklarımız 2 kişiliktir. Tek sayılı kişi ile rezervasyon verilmemektedir.'
                        : 'First class için sadece 16 yaş üstü misafirler kabul edilmektedir.'}
                    </p>
                  </div>
                )}
              </button>
            )
          })}
          {!hasCapacity && state.selectedDate && state.selectedClassKey && (
            <p className={styles.errorText} role="alert">
              Bu sınıf için yeterli kapasite yok ({totalPax} kişi). Başka sınıf seçin veya kişi sayısını azaltın.
            </p>
          )}
        </div>
      )}
    </>
  )
}
