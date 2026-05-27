'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Image from 'next/image'
import { Star } from 'lucide-react'
import type {
  TourForBooking,
  BookingWizardState,
  CalendarDay,
  PricingSummary,
} from '@/lib/sanity/bookingTypes'
import { getTourIdForBooking } from '@/lib/sanity/bookingTypes'
import { getEarliestBookableDateStr } from '@/lib/booking/bookingWindow'
import { computePricingForSelection, buildCalendarDaysForMonth, getFirstAvailableYearMonth, getDisplayedAdultUnitPriceForClass, getClassStatusForDate, getRemainingCapacityForDate, getCapForTicketClass, isFirstClassKey } from '@/lib/sanity/bookingPricing'
import { useAvailability, type UsedByDateAndClass } from '@/lib/hooks/useAvailability'
import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import { isBadgePopular } from '@/lib/i18n/bookingWizardUi'
import FirstClassSeatSelector from '../FirstClassSeatSelector'
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
  /** Step 2'ye her girildiğinde değişirse availability yeniden çekilir (dolu loca'lar güncel olsun). */
  availabilityInvalidateKey?: string
  ui: BookingWizardUi
}

export default function StepDateClass({
  tour,
  state,
  onUpdate,
  onPricingComputed,
  optimisticUsed,
  availabilityInvalidateKey,
  ui,
}: StepDateClassProps) {
  const locaSectionRef = useRef<HTMLDivElement>(null)
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
  const { usedByDate, availability } = useAvailability(getTourIdForBooking(tour), datesToFetch, {
    tourSlug: tour?.slug,
    optimisticUsed,
    invalidateKey: availabilityInvalidateKey ?? '',
  })
  const LOW_STOCK_THRESHOLD = 5

  useEffect(() => {
    const total = state.counts.adult + state.counts.child + state.counts.baby
    if (state.selectedClassKey === 'first' && (state.counts.child > 0 || state.counts.baby > 0)) {
      onUpdate({ selectedClassKey: null, firstClassLocas: [] })
      return
    }
    if (state.selectedClassKey === 'first' && total % 2 !== 0) {
      onUpdate({ selectedClassKey: null, firstClassLocas: [] })
      return
    }
    if (state.selectedDate && state.selectedClassKey) {
      const status = getClassStatusForDate(tour, state.selectedDate, state.selectedClassKey)
      if (status === 'full' || status === 'closed') onUpdate({ selectedClassKey: null, firstClassLocas: [] })
    }
  }, [tour, state.selectedDate, state.selectedClassKey, state.counts.adult, state.counts.child, state.counts.baby, onUpdate])

  // Tarih değişince First Class loca seçimini sıfırla (müsaitlik tarihe göre).
  const prevDateRef = useRef<string | null>(null)
  useEffect(() => {
    if (prevDateRef.current !== null && prevDateRef.current !== state.selectedDate && (state.firstClassLocas?.length ?? 0) > 0) {
      onUpdate({ firstClassLocas: [] })
    }
    prevDateRef.current = state.selectedDate
  }, [state.selectedDate, state.firstClassLocas, onUpdate])

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

  const minBookableStr = useMemo(() => getEarliestBookableDateStr(), [])

  const monthLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth - 1, 1)
    return d.toLocaleDateString(ui.numberLocale, { month: 'long', year: 'numeric' })
  }, [viewYear, viewMonth, ui.numberLocale])

  const weekdays = ui.weekdaysShort
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1)
  const gridStart = (firstDayOfMonth.getDay() + 6) % 7

  const minPriceInMonth = useMemo(() => {
    const prices = calendar
      .filter((d) => d.isAvailable && d.date >= minBookableStr && d.minPrice != null)
      .map((d) => d.minPrice!)
    return prices.length === 0 ? null : Math.min(...prices)
  }, [calendar, minBookableStr])

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
        <h3 className={`${styles.cardTitle} ${styles.wizardMainStepTitle}`}>{ui.selectDateTitle}</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
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
          <span style={{ fontWeight: 600, fontSize: 15 }}>{monthLabel}</span>
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
              const available = day.isAvailable && day.date >= minBookableStr
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
                      {day.minPrice!.toLocaleString(ui.numberLocale)} ₺
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
          <h3 className={`${styles.cardTitle} ${styles.wizardMainStepTitle}`}>{ui.classSelectTitle}</h3>
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
            const price = state.selectedDate
              ? getDisplayedAdultUnitPriceForClass(tour, state.selectedDate, cls)
              : undefined
            const dateFormatted = new Date(state.selectedDate!).toLocaleDateString(ui.numberLocale, {
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
                onClick={() => {
                  if (available) {
                    onUpdate({
                      selectedClassKey: cls.key,
                      ...(cls.key !== 'first' ? { firstClassLocas: [] } : {}),
                    })
                  }
                }}
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
                    {ui.bungalowTwoPersonOdd}
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
                            {ui.remainingAfterBookings(cap)}
                          </span>
                        )}
                        {cap === 0 && !classBlocked && (
                          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                            {ui.quotaFullThisDate}
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
                          isBadgePopular(cls.badge) ? styles.classBadgePopular : ''
                        }`}
                      >
                        {cls.badge}
                      </span>
                    )}
                    {!isFull && !insufficientCap && cap > 0 && cap <= LOW_STOCK_THRESHOLD && (
                      <span className={styles.classBadge} style={{ background: '#b45309', color: '#fff' }}>
                        {ui.lastNSpots(cap)}
                      </span>
                    )}
                    {selected && (
                      <span className={styles.classBadge} style={{ background: 'var(--primary)', color: '#fff' }}>
                        {ui.selectedBadge}
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
                      {ui.adultPriceLine(dateFormatted, price.toLocaleString(ui.numberLocale))}
                    </p>
                  )}
                  {cap >= totalPax && cap > 0 && (
                    <p style={{ margin: '8px 0 0', fontSize: 13, color: '#166534', fontWeight: 500 }}>
                      {cap <= LOW_STOCK_THRESHOLD ? ui.lastNSpots(cap) : ui.remainingSpots(cap)}
                    </p>
                  )}
                  {insufficientCap && cap > 0 && (
                    <p style={{ margin: '8px 0 0', fontSize: 13, color: '#b91c1c', fontWeight: 600 }} role="alert">
                      {ui.insufficientCapLine(cap, totalPax)}
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
                      {totalPax % 2 !== 0 ? ui.bungalowTwoPersonOdd : ui.firstClassAdultsOnly}
                    </p>
                  </div>
                )}
              </button>
            )
          })}
          {!hasCapacity && state.selectedDate && state.selectedClassKey && (
            <p className={styles.errorText} role="alert">
              {ui.classCapacityShortage(totalPax)}
            </p>
          )}
        </div>
      )}

      {/* First Class seçildiyse loca seçimi ayrı kartta (N kişi → N/2 loca) */}
      {state.selectedDate && state.selectedClassKey && isFirstClassKey(tour, state.selectedClassKey) && (() => {
        const totalPax = state.counts.adult + state.counts.child + state.counts.baby
        const requiredLocas = Math.ceil(totalPax / 2)
        const selected = state.firstClassLocas ?? []
        const handleToggle = (locaId: string) => {
          const id = locaId.trim().toUpperCase()
          if (selected.includes(id)) {
            onUpdate({ firstClassLocas: selected.filter((x) => x !== id) })
          } else if (selected.length < requiredLocas) {
            onUpdate({ firstClassLocas: [...selected, id] })
          }
        }
        return (
          <div ref={locaSectionRef} className={styles.card} style={{ marginTop: 16 }}>
            <h3 className={styles.cardTitle}>{ui.locaSelectTitle}</h3>
            <FirstClassSeatSelector
              selectedLocaIds={selected}
              reservedLocaIds={availability?.date === state.selectedDate ? (availability?.firstClassLocasReserved || []) : []}
              requiredCount={requiredLocas}
              onToggle={handleToggle}
              onReplace={(removeId, addId) => onUpdate({ firstClassLocas: [...(state.firstClassLocas ?? []).filter((x) => x !== removeId), addId.trim().toUpperCase()] })}
              locaUi={ui.firstClassLoca}
            />
          </div>
        )
      })()}
    </>
  )
}
