'use client'

import { useEffect, useMemo } from 'react'
import Image from 'next/image'
import type {
  TourForBooking,
  BookingWizardState,
  PricingSummary,
} from '@/lib/sanity/bookingTypes'
import { getTourIdForFirebase } from '@/lib/sanity/bookingTypes'
import { buildCalendarDaysForMonth, computePricingForSelection, getSeasonMultiplier, getClassStatusForDate, getRemainingCapacityForDate, getCapForTicketClass } from '@/lib/sanity/bookingPricing'
import { useAvailability, type UsedByDateAndClass } from '@/lib/hooks/useAvailability'
import styles from '../booking.module.css'

interface StepClassProps {
  tour: TourForBooking
  state: BookingWizardState
  onUpdate: (patch: Partial<BookingWizardState>) => void
  onPricingComputed: (pricing: PricingSummary | null) => void
  /** Rezervasyon sonrası anlık kalan kontenjan için (Sanity kapasitesi - API used - bu). */
  optimisticUsed?: UsedByDateAndClass | null
}

export default function StepClass({
  tour,
  state,
  onUpdate,
  onPricingComputed,
  optimisticUsed,
}: StepClassProps) {
  const year = state.selectedDate ? parseInt(state.selectedDate.slice(0, 4), 10) : new Date().getFullYear()
  const month = state.selectedDate ? parseInt(state.selectedDate.slice(5, 7), 10) : new Date().getMonth() + 1
  const calendar = useMemo(
    () => buildCalendarDaysForMonth(tour, year, month),
    [tour, year, month]
  )
  const datesToFetch = useMemo(
    () => (state.selectedDate ? [state.selectedDate] : []),
    [state.selectedDate]
  )
  const { usedByDate } = useAvailability(getTourIdForFirebase(tour), datesToFetch, {
    tourSlug: tour?.slug,
    optimisticUsed,
  })
  const capacityForDate = state.selectedDate
    ? getRemainingCapacityForDate(tour, state.selectedDate, usedByDate)
    : null
  const totalPax = state.counts.adult + state.counts.child + state.counts.baby

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
  }, [
    tour,
    state.selectedDate,
    state.selectedClassKey,
    state.counts.adult,
    state.counts.child,
    state.counts.baby,
    onPricingComputed,
  ])

  if (!state.selectedDate) return null

  const fullClassNames = (tour.ticketClasses ?? [])
    .filter((cls) => {
      const cap = getCapForTicketClass(capacityForDate, cls.key)
      const status = state.selectedDate ? getClassStatusForDate(tour, state.selectedDate, cls.key) : null
      return status === 'full' || cap === 0
    })
    .map((c) => c.label)

  const insufficientCapacityList = capacityForDate
    ? (tour.ticketClasses ?? [])
        .filter((cls) => {
          const status = state.selectedDate ? getClassStatusForDate(tour, state.selectedDate, cls.key) : null
          if (status === 'full' || status === 'closed') return false
          const cap = getCapForTicketClass(capacityForDate, cls.key)
          return cap > 0 && cap < totalPax
        })
        .map((cls) => ({ label: cls.label, cap: getCapForTicketClass(capacityForDate, cls.key) }))
    : []
  const someClassesInsufficientCapacity = capacityForDate && (tour.ticketClasses ?? []).some((cls) => {
    const cap = getCapForTicketClass(capacityForDate, cls.key)
    const status = state.selectedDate ? getClassStatusForDate(tour, state.selectedDate, cls.key) : null
    return status !== 'full' && status !== 'closed' && cap > 0 && cap < totalPax
  })

  return (
    <div className={styles.card}>
      <div className={styles.cardCaption}>
        <span className={styles.cardCaptionIcon} aria-hidden>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2" />
            <path d="M13 17v2" />
            <path d="M13 11v2" />
          </svg>
        </span>
        <h3 className={styles.cardCaptionTitle}>Sınıf Seçimi</h3>
      </div>
      <hr className={styles.cardDivider} />
      <div className={styles.cardContent}>
      {fullClassNames.length > 0 && (
        <div
          role="alert"
          style={{
            marginBottom: 16,
            padding: '12px 14px',
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: 8,
            color: '#92400e',
            fontSize: 14,
          }}
        >
          Bu tarih için <strong>{fullClassNames.join(', ')}</strong> sınıf{fullClassNames.length > 1 ? 'ları' : 'ı'} doludur. Lütfen başka bir sınıf veya tarih seçin.
        </div>
      )}
      {(insufficientCapacityList.length > 0 || someClassesInsufficientCapacity) && (
        <div
          role="alert"
          style={{
            marginBottom: 16,
            padding: '14px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#b91c1c',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>
            Bu tarih için mevcut rezervasyonlardan sonra kalan kontenjan yeterli değil
          </p>
          {insufficientCapacityList.length > 0 ? (
            <>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {insufficientCapacityList.map(({ label, cap }) => (
                  <li key={label} style={{ marginBottom: 4 }}>
                    <strong>{label}</strong>: Mevcut rezervasyonlardan sonra kalan <strong>{cap} kişi</strong>. Siz {totalPax} kişi seçtiniz; yeterli yer yok.
                  </li>
                ))}
              </ul>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>
                Kişi sayısını azaltın veya başka bir sınıf / tarih seçin.
              </p>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 13 }}>
              Bu tarih için bazı sınıflarda mevcut rezervasyonlardan sonra {totalPax} kişilik yeterli yer kalmamış. Kişi sayısını azaltın veya başka bir sınıf / tarih seçin.
            </p>
          )}
        </div>
      )}
      {(tour.ticketClasses ?? []).map((cls) => {
        const selected = state.selectedClassKey === cls.key
        const cap = getCapForTicketClass(capacityForDate, cls.key)
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
          <div
            key={cls.key}
            role="article"
            className={`${styles.classCard} ${selected ? styles.classCardSelected : ''} ${isFull || insufficientCap ? styles.classCardDisabled : ''}`}
            style={{
              position: 'relative',
              ...(isFull || insufficientCap ? { opacity: 0.82, filter: 'grayscale(0.4)', cursor: 'not-allowed' } : {}),
            }}
            onClick={() => available && onUpdate({ selectedClassKey: cls.key })}
            onKeyDown={(e) => {
              if (available && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                onUpdate({ selectedClassKey: cls.key })
              }
            }}
            tabIndex={available ? 0 : undefined}
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
                {(classBlocked || cap === 0 || insufficientCap) && (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {cls.badge && (
                  <span
                    className={`${styles.classBadge} ${
                      cls.badge.toLowerCase().includes('popüler') ? styles.classBadgePopular : ''
                    }`}
                  >
                    {cls.badge}
                  </span>
                )}
              </div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 600 }}>{cls.label}</h4>
              {cls.description && (
                <p style={{ margin: '0 0 8px 0', fontSize: 13, color: '#71717a' }}>{cls.description}</p>
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
              {insufficientCap && cap > 0 && (
                <p style={{ margin: '8px 0 0', fontSize: 13, color: '#b91c1c', fontWeight: 600 }} role="alert">
                  Mevcut rezervasyonlardan sonra kalan kontenjan: {cap} kişi. {totalPax} kişilik rezervasyon için yeterli yer yok.
                </p>
              )}
              <div className={styles.classCardFooter}>
                <button
                  type="button"
                  className={styles.classCardSelectBtn}
                  disabled={!available}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (available) onUpdate({ selectedClassKey: cls.key })
                  }}
                  aria-label={`${cls.label} seç`}
                >
                  Seçiniz
                </button>
              </div>
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
          </div>
        )
      })}
      {state.selectedClassKey && capacityForDate && getCapForTicketClass(capacityForDate, state.selectedClassKey) < totalPax && (
        <p className={styles.errorText}>
          Bu tarih ve sınıf için yeterli kapasite yok ({totalPax} kişi).
        </p>
      )}
      </div>
    </div>
  )
}
