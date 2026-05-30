'use client'

import { useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import { Check, ChevronLeft, Users, CalendarDays, Ticket } from 'lucide-react'
import type {
  TourForBooking,
  BookingWizardState,
  PricingSummary,
} from '@/lib/sanity/bookingTypes'
import { getTourIdForBooking } from '@/lib/sanity/bookingTypes'
import {
  computePricingForSelection,
  getDisplayedAdultUnitPriceForClass,
  getClassStatusForDate,
  getRemainingCapacityForDate,
  getCapForTicketClass,
  isFirstClassKey,
} from '@/lib/sanity/bookingPricing'
import { useAvailability, type UsedByDateAndClass } from '@/lib/hooks/useAvailability'
import type { Availability } from '@/types/availability'
import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import { isBadgePopular } from '@/lib/i18n/bookingWizardUi'
import FirstClassSeatSelector from '../FirstClassSeatSelector'
import styles from '../booking.module.css'

interface Step2ClassSelectProps {
  tour: TourForBooking
  state: BookingWizardState
  onUpdate: (patch: Partial<BookingWizardState>) => void
  onPricingComputed: (pricing: PricingSummary | null) => void
  onBack: () => void
  onNext: () => void
  onStepNext?: () => void
  canProceed: boolean
  ctaLabel: string
  ctaDisabled: boolean
  optimisticUsed?: UsedByDateAndClass | null
  availabilityFromParent?: Availability | null
  ui: BookingWizardUi
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
  ui,
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

  const capacityForDate = state.selectedDate
    ? getRemainingCapacityForDate(tour, state.selectedDate, usedByDate)
    : null

  const hasOptimisticForDate = Boolean(
    state.selectedDate &&
      optimisticUsed?.[state.selectedDate] &&
      Object.keys(optimisticUsed[state.selectedDate]).length > 0
  )
  const effectiveAvailability = availabilityFromParent ?? availability

  const capForClass = (classKey: string) => {
    if (
      !hasOptimisticForDate &&
      effectiveAvailability?.date === state.selectedDate &&
      effectiveAvailability?.classes[classKey] != null
    )
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
  }, [
    tour,
    state.selectedDate,
    state.selectedClassKey,
    state.counts.adult,
    state.counts.child,
    state.counts.baby,
    onUpdate,
  ])

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
    ? new Date(state.selectedDate + 'T00:00:00').toLocaleDateString(ui.numberLocale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—'

  const paxLabel = (() => {
    const parts: string[] = []
    if (state.counts.adult > 0) parts.push(`${state.counts.adult} yetişkin`)
    if (state.counts.child > 0) parts.push(`${state.counts.child} çocuk`)
    if (state.counts.baby > 0) parts.push(`${state.counts.baby} bebek`)
    return parts.join(' · ')
  })()

  if (!state.selectedDate) return null

  return (
    <div className={styles.stepContent}>

      {/* Info bar — seçilen tarih + kişi */}
      <div className={styles.classInfoBar}>
        <span className={styles.classInfoChip}>
          <CalendarDays width={12} height={12} aria-hidden />
          {dateFormatted}
        </span>
        <span className={styles.classInfoChip}>
          <Users width={12} height={12} aria-hidden />
          {paxLabel}
        </span>
      </div>

      {/* Sınıf seçim bölümü — flat */}
      <div className={styles.sectionFlat} style={{ paddingTop: 0 }}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <Ticket width={18} height={18} className={styles.sectionIcon} aria-hidden />
            <h3 className={styles.sectionTitle}>{ui.classSelectTitle}</h3>
          </div>
        </div>

        <div className={styles.classCardGrid}>
          {(tour.ticketClasses ?? []).map((cls) => {
            const selected = state.selectedClassKey === cls.key
            const cap = capForClass(cls.key)
            const firstClassNoChildOrBaby =
              cls.key === 'first' ? state.counts.child === 0 && state.counts.baby === 0 : true
            const firstClassEvenPax = cls.key !== 'first' || totalPax % 2 === 0
            const classStatus = state.selectedDate
              ? getClassStatusForDate(tour, state.selectedDate, cls.key)
              : null
            const classBlocked = classStatus === 'full' || classStatus === 'closed'
            const isFull = classBlocked || cap === 0
            const insufficientCap = cap > 0 && cap < totalPax && !classBlocked
            const available =
              cap >= totalPax && firstClassNoChildOrBaby && firstClassEvenPax && !classBlocked
            const isFirstClassRestricted =
              cls.key === 'first' && (!firstClassNoChildOrBaby || totalPax % 2 !== 0)
            const isFirstClassOddPaxWarning = cls.key === 'first' && totalPax % 2 !== 0
            const price = state.selectedDate
              ? getDisplayedAdultUnitPriceForClass(tour, state.selectedDate, cls)
              : undefined
            const badgePopular = isBadgePopular(cls.badge)

            return (
              <div
                key={cls.key}
                role="article"
                className={`${styles.classCardPremium} ${selected ? styles.classCardPremiumSelected : ''} ${
                  isFull || insufficientCap ? styles.classCardDisabled : ''
                }`}
                style={{
                  position: 'relative',
                  ...(isFull || insufficientCap
                    ? { opacity: 0.75, filter: 'grayscale(0.35)', cursor: 'not-allowed' }
                    : {}),
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
                aria-label={`${cls.label}${price != null ? `, ${price} TL` : ''}, ${
                  available
                    ? ui.classAriaAvailable
                    : insufficientCap
                      ? ui.classAriaInsufficient
                      : isFull
                        ? ui.classAriaFull
                        : ui.classAriaClosed
                }`}
              >
                {/* Tek/çift kişi uyarı bandı */}
                {isFirstClassOddPaxWarning && (
                  <div
                    role="alert"
                    style={{
                      padding: '9px 14px',
                      background: '#fef3c7',
                      borderBottom: '1px solid #fcd34d',
                      color: '#92400e',
                      fontSize: 12,
                      fontWeight: 500,
                      textAlign: 'center',
                    }}
                  >
                    {ui.bungalowTwoPersonOdd}
                  </div>
                )}

                {/* Görsel */}
                <div
                  style={{
                    filter: isFirstClassRestricted ? 'blur(4px)' : undefined,
                    pointerEvents: isFirstClassRestricted ? 'none' : undefined,
                    transition: 'filter 0.2s ease',
                  }}
                >
                  <div className={styles.classCardPremiumImageWrap}>
                    {cls.classImage?.url ? (
                      <Image
                        src={`${cls.classImage.url}?w=600&h=340&fit=crop`}
                        alt=""
                        width={600}
                        height={340}
                        className={styles.classCardPremiumImage}
                      />
                    ) : (
                      <div
                        className={styles.classCardPremiumImage}
                        style={{
                          background: 'linear-gradient(135deg, #1e3a5f 0%, #2168b8 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ticket width={32} height={32} style={{ color: 'rgba(255,255,255,0.3)' }} />
                      </div>
                    )}

                    {/* Dolu / yetersiz overlay */}
                    {(isFull || insufficientCap) && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(15,23,42,0.72)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                        aria-hidden
                      >
                        <span
                          style={{
                            color: '#fff',
                            fontSize: 18,
                            fontWeight: 800,
                            letterSpacing: '0.06em',
                          }}
                        >
                          {classBlocked
                            ? classStatus === 'full'
                              ? ui.statusFull
                              : ui.statusClosed
                            : cap === 0
                              ? ui.statusFull
                              : ui.statusInsufficientCap}
                        </span>
                        {insufficientCap && (
                          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                            {ui.insufficientCapLine()}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Seçili checkmark */}
                    {selected && (
                      <div className={styles.classCardSelectedMark} aria-hidden>
                        <Check width={14} height={14} strokeWidth={3} />
                      </div>
                    )}

                    {/* Badge'ler */}
                    <div className={styles.classCardPremiumBadges}>
                      {cls.badge && (
                        <span
                          className={`${styles.classBadge} ${badgePopular ? styles.classBadgePopular : ''}`}
                        >
                          {cls.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Kart içeriği */}
                  <div className={styles.classCardPremiumBody}>
                    <h4 className={styles.classCardPremiumTitle}>{cls.label}</h4>

                    {cls.description && (
                      <p className={styles.classCardPremiumDesc}>{cls.description}</p>
                    )}

                    {cls.bullets && cls.bullets.length > 0 && (
                      <ul className={styles.classCardPremiumBullets}>
                        {cls.bullets.slice(0, 3).map((b, i) => (
                          <li key={i}>
                            <Check
                              width={13}
                              height={13}
                              style={{ color: '#fc6c4f', flexShrink: 0 }}
                              aria-hidden
                            />
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}

                    {insufficientCap && (
                      <p
                        className={styles.classCardPremiumCapacity}
                        style={{ color: '#dc2626', fontWeight: 600 }}
                        role="alert"
                      >
                        {ui.insufficientCapLine()}
                      </p>
                    )}

                    {/* Footer: fiyat + buton */}
                    <div className={styles.classCardPremiumFooter}>
                      <div>
                        {price != null ? (
                          <>
                            <p className={styles.classCardPremiumPrice}>
                              {price.toLocaleString(ui.numberLocale)} ₺
                              <span className={styles.classCardPremiumPriceSub}>/kişi</span>
                            </p>
                          </>
                        ) : (
                          <p className={styles.classCardPremiumCapacity}>&nbsp;</p>
                        )}
                      </div>

                      <button
                        type="button"
                        className={`${styles.classCardSelectBtn} ${selected ? styles.classCardSelectBtnSelected : ''}`}
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
                        aria-label={
                          isFirstClassKey(tour, cls.key)
                            ? ui.selectClassAriaPickLoca(cls.label)
                            : ui.selectClassAriaContinue(cls.label)
                        }
                      >
                        {selected ? (
                          <>
                            <Check width={14} height={14} strokeWidth={3} aria-hidden />
                            Seçildi
                          </>
                        ) : (
                          ui.selectClassButton
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* First class kısıtlama overlay */}
                {isFirstClassRestricted && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 20,
                      background: 'rgba(255,255,255,0.9)',
                      borderRadius: 'inherit',
                      zIndex: 1,
                    }}
                    aria-hidden
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#374151',
                        textAlign: 'center',
                        lineHeight: 1.5,
                      }}
                    >
                      {totalPax % 2 !== 0 ? ui.bungalowTwoPersonOdd : ui.firstClassAdultsOnly}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {state.selectedClassKey && capForClass(state.selectedClassKey) < totalPax && (
          <p className={styles.errorText} style={{ marginTop: 12 }} role="alert">
            {ui.classCapacityShortage()}
          </p>
        )}
      </div>

      {/* First Class loca seçimi */}
      {state.selectedClassKey &&
        isFirstClassKey(tour, state.selectedClassKey) &&
        (() => {
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
            <div ref={locaSectionRef} className={styles.sectionFlat}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>{ui.locaSelectTitle}</h4>
              </div>
              <FirstClassSeatSelector
                selectedLocaIds={selected}
                reservedLocaIds={
                  effectiveAvailability?.date === state.selectedDate
                    ? effectiveAvailability?.firstClassLocasReserved || []
                    : []
                }
                requiredCount={requiredLocas}
                onToggle={handleToggle}
                onReplace={(removeId, addId) =>
                  onUpdate({
                    firstClassLocas: [
                      ...(state.firstClassLocas ?? []).filter((x) => x !== removeId),
                      addId.trim().toUpperCase(),
                    ],
                  })
                }
                locaUi={ui.firstClassLoca}
              />
            </div>
          )
        })()}

      {/* CTA */}
      <div className={styles.ctaSection}>
        <div className={styles.stepActionsRow}>
          <button
            type="button"
            className={styles.stepBtnBack}
            onClick={onBack}
            aria-label={ui.backAria}
          >
            <ChevronLeft width={16} height={16} aria-hidden />
            {ui.back}
          </button>
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
