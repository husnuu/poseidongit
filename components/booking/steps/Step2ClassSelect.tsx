'use client'

import { useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'
import type {
  TourForBooking,
  BookingWizardState,
  PricingSummary,
} from '@/lib/sanity/bookingTypes'
import { getTourIdForBooking } from '@/lib/sanity/bookingTypes'
import { computePricingForSelection, getDisplayedAdultUnitPriceForClass, getClassStatusForDate, getRemainingCapacityForDate, getCapForTicketClass, isFirstClassKey } from '@/lib/sanity/bookingPricing'
import { useAvailability, type UsedByDateAndClass } from '@/lib/hooks/useAvailability'
import type { Availability } from '@/types/availability'
import FirstClassSeatSelector from '../FirstClassSeatSelector'
import styles from '../booking.module.css'

interface Step2ClassSelectProps {
  tour: TourForBooking
  state: BookingWizardState
  onUpdate: (patch: Partial<BookingWizardState>) => void
  onPricingComputed: (pricing: PricingSummary | null) => void
  onBack: () => void
  onNext: () => void
  /** Sınıf seçildiğinde doğrudan bir sonraki adıma geçmek için (state güncellenmeden önce çağrılır, tek tıkla ilerleme). */
  onStepNext?: () => void
  canProceed: boolean
  ctaLabel: string
  ctaDisabled: boolean
  /** Rezervasyon sonrası anlık kalan kontenjan için (Sanity kapasitesi - API used - bu). */
  optimisticUsed?: UsedByDateAndClass | null
  /** Modal'dan gelen availability (tarih seçildiğinde Step1'de çekildi, Step2'de anında doğru kalan gösterilir). */
  availabilityFromParent?: Availability | null
}

export default function Step2ClassSelect({
  tour,
  state,
  onUpdate,
  onPricingComputed,
  onBack,
  onNext,
  onStepNext,
  ctaLabel,
  ctaDisabled,
  optimisticUsed,
  availabilityFromParent,
}: Step2ClassSelectProps) {
  const locaSectionRef = useRef<HTMLDivElement>(null)
  const advance = onStepNext ?? onNext
  const datesToFetch = useMemo(
    () => (state.selectedDate ? [state.selectedDate] : []),
    [state.selectedDate]
  )
  const { usedByDate, availability } = useAvailability(getTourIdForBooking(tour), datesToFetch, {
    tourSlug: tour?.slug,
    optimisticUsed,
  })
  const LOW_STOCK_THRESHOLD = 5
  const capacityForDate = state.selectedDate
    ? getRemainingCapacityForDate(tour, state.selectedDate, usedByDate)
    : null
  // Önce parent'tan gelen (Step1'de çekilmiş) availability, yoksa hook'tan; optimistic varsa birleşmiş değer
  const hasOptimisticForDate = Boolean(
    state.selectedDate && optimisticUsed?.[state.selectedDate] && Object.keys(optimisticUsed[state.selectedDate]).length > 0
  )
  const effectiveAvailability = availabilityFromParent ?? availability
  const capForClass = (classKey: string) => {
    if (!hasOptimisticForDate && effectiveAvailability?.date === state.selectedDate && effectiveAvailability?.classes[classKey] != null)
      return effectiveAvailability.classes[classKey].remaining
    return getCapForTicketClass(capacityForDate, classKey)
  }
  const totalPax = state.counts.adult + state.counts.child + state.counts.baby

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

  // First Class seçilince loca alanına kaydır
  useEffect(() => {
    if (!state.selectedClassKey || !isFirstClassKey(tour, state.selectedClassKey)) return
    const t = setTimeout(() => {
      locaSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return () => clearTimeout(t)
  }, [tour, state.selectedClassKey])

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

  const dateFormatted = state.selectedDate
    ? new Date(state.selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    : '—'

  if (!state.selectedDate) return null

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHeaderWithBack}>
        <button
          type="button"
          className={`${styles.stepBackBtn} ${styles.stepBackBtnSmall}`}
          onClick={onBack}
          aria-label="Önceki adıma dön"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Geri
        </button>
      </div>

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
          <h3 className={`${styles.cardCaptionTitle} ${styles.wizardMainStepTitle}`}>Sınıf Seçimi</h3>
        </div>
        <hr className={styles.cardDivider} />
        <div className={styles.cardContent}>
        <div className={styles.classCardGrid}>
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
            const badgePopular = cls.badge?.toLowerCase().includes('popüler')

            return (
              <div
                key={cls.key}
                role="article"
                className={`${styles.classCardPremium} ${selected ? styles.classCardPremiumSelected : ''} ${isFull || insufficientCap ? styles.classCardDisabled : ''}`}
                style={{
                  position: 'relative',
                  ...(isFull || insufficientCap ? { opacity: 0.82, filter: 'grayscale(0.4)', cursor: 'not-allowed' } : {}),
                }}
                onClick={() => {
                  if (available) {
                    const isFirst = isFirstClassKey(tour, cls.key)
                    onUpdate({
                      selectedClassKey: cls.key,
                      ...(isFirst ? {} : { firstClassLocas: [] }),
                    })
                    if (!isFirst) advance()
                  }
                }}
                onKeyDown={(e) => {
                  if (available && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    const isFirst = isFirstClassKey(tour, cls.key)
                    onUpdate({
                      selectedClassKey: cls.key,
                      ...(isFirst ? {} : { firstClassLocas: [] }),
                    })
                    if (!isFirst) advance()
                  }
                }}
                tabIndex={available ? 0 : undefined}
                aria-label={`${cls.label}, ${price != null ? `${price} TL` : ''}, ${available ? 'Müsait' : insufficientCap ? 'Kapasite yetersiz' : isFull ? 'Dolu' : 'Kapalı'}`}
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
                <div className={styles.classCardPremiumImageWrap} style={{ position: 'relative' }}>
                  {cls.classImage?.url ? (
                    <Image
                      src={`${cls.classImage.url}?w=600&h=340&fit=crop`}
                      alt=""
                      width={600}
                      height={340}
                      className={styles.classCardPremiumImage}
                    />
                  ) : (
                    <div className={styles.classCardPremiumImage} style={{ background: '#e4e4e7' }} />
                  )}
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
                  <div className={styles.classCardPremiumBadges}>
                    {cls.badge && (
                      <span
                        className={`${styles.classBadge} ${badgePopular ? styles.classBadgePopular : ''}`}
                      >
                        {cls.badge.toUpperCase()}
                      </span>
                    )}
                    {!isFull && !insufficientCap && cap > 0 && cap <= LOW_STOCK_THRESHOLD && (
                      <span className={styles.classBadge} style={{ background: '#b45309', color: '#fff' }}>
                        Son {cap} yer
                      </span>
                    )}
                    <span style={{ flex: 1 }} />
                  </div>
                </div>
                <div className={styles.classCardPremiumBody}>
                  <h4 className={styles.classCardPremiumTitle}>{cls.label}</h4>
                  {cls.description && (
                    <p className={styles.classCardPremiumDesc}>{cls.description}</p>
                  )}
                  {cls.bullets && cls.bullets.length > 0 && (
                    <ul className={styles.classCardPremiumBullets}>
                      {cls.bullets.slice(0, 3).map((b, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--primary)' }} aria-hidden />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                  {price != null && (
                    <p className={styles.classCardPremiumPrice}>
                      Yetişkin ({dateFormatted}): {price.toLocaleString('tr-TR')} ₺
                    </p>
                  )}
                  {cap > 0 && cap < totalPax && (
                    <p className={styles.classCardPremiumCapacity} style={{ color: '#b91c1c', fontWeight: 600 }} role="alert">
                      Mevcut rezervasyonlardan sonra kalan kontenjan: {cap} kişi. {totalPax} kişilik rezervasyon için yeterli yer yok.
                    </p>
                  )}
                  {cap >= totalPax && (
                    <p className={styles.classCardPremiumCapacity}>
                      {cap <= LOW_STOCK_THRESHOLD && cap > 0
                        ? `Son ${cap} yer`
                        : `Kalan: ${cap} kişi`}
                    </p>
                  )}
                  <div className={styles.classCardPremiumFooter}>
                    <button
                      type="button"
                      className={styles.classCardSelectBtn}
                      disabled={!available}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (available) {
                          const isFirst = isFirstClassKey(tour, cls.key)
                          onUpdate({
                            selectedClassKey: cls.key,
                            ...(isFirst ? {} : { firstClassLocas: [] }),
                          })
                          if (!isFirst) advance()
                        }
                      }}
                      aria-label={isFirstClassKey(tour, cls.key) ? `${cls.label} seç, loca seçin` : `${cls.label} seç ve devam et`}
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
        </div>
        {state.selectedClassKey && capForClass(state.selectedClassKey) < totalPax && (
          <p className={styles.errorText} style={{ marginTop: 12 }} role="alert">
            Bu sınıf için yeterli kapasite yok ({totalPax} kişi). Başka sınıf seçin veya kişi sayısını azaltın.
          </p>
        )}
        {state.selectedClassKey && isFirstClassKey(tour, state.selectedClassKey) && (() => {
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
            <div ref={locaSectionRef} style={{ marginTop: 20 }}>
              <h4 className={styles.cardTitle} style={{ marginBottom: 0 }}>Loca Seçimi</h4>
              <FirstClassSeatSelector
                selectedLocaIds={selected}
                reservedLocaIds={effectiveAvailability?.date === state.selectedDate ? (effectiveAvailability?.firstClassLocasReserved || []) : []}
                requiredCount={requiredLocas}
                onToggle={handleToggle}
                onReplace={(removeId, addId) => onUpdate({ firstClassLocas: [...(state.firstClassLocas ?? []).filter((x) => x !== removeId), addId.trim().toUpperCase()] })}
                onAfterSelect={advance}
                aria-label="First Class loca seçimi"
              />
            </div>
          )
        })()}
        </div>
      </div>
    </div>
  )
}
