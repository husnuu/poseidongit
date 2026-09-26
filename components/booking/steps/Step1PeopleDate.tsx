'use client'

import { useState, useMemo } from 'react'
import { Star, ChevronDown, ChevronLeft, ChevronRight, Info, ArrowRight } from 'lucide-react'
import type { TourForBooking, BookingWizardState } from '@/lib/sanity/bookingTypes'
import { getEarliestBookableDateStr, todayStrLocal } from '@/lib/booking/bookingWindow'
import { buildCalendarDaysForMonth, getFirstAvailableYearMonth } from '@/lib/sanity/bookingPricing'
import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import ReservationTicket, { formatTicketDateLabel, BOAT_NAME } from '../ReservationTicket'
import styles from '../booking.module.css'

/** Referans site ile birebir: bu iki başlık ikon yerine büyük/koyu düz metin
    ("Kaç kişi katılacak?", "Bir tarih seçin") — paylaşılan i18n anahtarları
    (ui.guestCountTitle/selectDateTitle) adım göstergesinde de kullanıldığı için
    onlara dokunmuyoruz, sadece bu sayfaya özel yerel metin kullanıyoruz. */
const STEP1_HEADINGS: Record<string, { people: string; date: string }> = {
  tr: { people: 'Kaç kişi katılacak?', date: 'Bir tarih seçin' },
  en: { people: 'How many guests?', date: 'Pick a date' },
  de: { people: 'Wie viele Gäste?', date: 'Datum auswählen' },
}

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
  /** Referans site ile birebir: tarih seçilince takvim kapanır, "‹ [tarih]" satırına tıklayınca yeniden açılır. */
  const [showCalendar, setShowCalendar] = useState(!state.selectedDate)

  const firstAvailable = useMemo(() => getFirstAvailableYearMonth(tour), [tour])
  const [viewYear, setViewYear] = useState(() => firstAvailable.year)
  const [viewMonth, setViewMonth] = useState(() => firstAvailable.month)
  const isViewingFirstAvailableMonth =
    viewYear === firstAvailable.year && viewMonth === firstAvailable.month
  const todayStr = useMemo(() => todayStrLocal(), [])
  const minBookableStr = useMemo(() => getEarliestBookableDateStr(), [])

  const calendar = useMemo(
    () => buildCalendarDaysForMonth(tour, viewYear, viewMonth),
    [tour, viewYear, viewMonth]
  )
  const selectedDateLabel = useMemo(() => {
    if (!state.selectedDate) return null
    const d = new Date(state.selectedDate + 'T00:00:00')
    return d.toLocaleDateString(ui.numberLocale, { day: 'numeric', month: 'short', year: 'numeric' })
  }, [state.selectedDate, ui.numberLocale])

  /** Kapanmış takvim satırında gösterilen tam tarih ("30 Eylül 2026" gibi). */
  const selectedDateLabelLong = useMemo(() => {
    if (!state.selectedDate) return null
    const d = new Date(state.selectedDate + 'T00:00:00')
    return d.toLocaleDateString(ui.numberLocale, { day: 'numeric', month: 'long', year: 'numeric' })
  }, [state.selectedDate, ui.numberLocale])

  const weekdays = ui.weekdaysShort
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1)
  const gridStart = (firstDayOfMonth.getDay() + 6) % 7

  const minPriceInMonth = useMemo(() => {
    const prices = calendar
      .filter((d) => d.isAvailable && d.date >= minBookableStr && d.minPrice != null)
      .map((d) => d.minPrice!)
    return prices.length === 0 ? null : Math.min(...prices)
  }, [calendar, minBookableStr])

  const heading = STEP1_HEADINGS[ui.locale] ?? STEP1_HEADINGS.tr
  const monthNameOnly = useMemo(
    () => new Date(viewYear, viewMonth - 1, 1).toLocaleDateString(ui.numberLocale, { month: 'long' }),
    [viewYear, viewMonth, ui.numberLocale]
  )

  /** Ay/yıl etiketine tıklayınca gerçek bir seçim listesi (native select) açılsın diye. */
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: new Date(2000, i, 1).toLocaleDateString(ui.numberLocale, { month: 'long' }),
      })),
    [ui.numberLocale]
  )
  const yearOptions = useMemo(
    () => [firstAvailable.year, firstAvailable.year + 1, firstAvailable.year + 2],
    [firstAvailable.year]
  )

  const dateWithWeekday = useMemo(
    () => (state.selectedDate ? formatTicketDateLabel(state.selectedDate, ui) : null),
    [state.selectedDate, ui]
  )

  const goToPrevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  const goToNextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

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
            {ui.bookingRulesToggle}
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
        <div className={styles.sectionHeaderPlain}>
          <h3 className={styles.sectionTitlePlain}>{heading.people}</h3>
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
        <div className={styles.sectionHeaderPlain}>
          <h3 className={styles.sectionTitlePlain}>{heading.date}</h3>
          {selectedDateLabel && showCalendar && (
            <span className={styles.selectedDateChip} aria-live="polite">
              {selectedDateLabel}
            </span>
          )}
        </div>

        {!showCalendar && selectedDateLabelLong ? (
          /* Referans site ile birebir: seçili tarih tıklanabilir tek satır, takvimi yeniden açar */
          <button
            type="button"
            className={styles.selectedDateBar}
            onClick={() => setShowCalendar(true)}
          >
            <ChevronLeft width={20} height={20} aria-hidden />
            {selectedDateLabelLong}
          </button>
        ) : (
          <>
            {/* Ay navigasyon — referans site ile birebir: "Ay › Yıl ›" etiketleri solda,
                yuvarlak ‹ › ok butonları sağda. Etiketler artık gerçek bir açılır
                listeye (native select) tıklanabilir bir kapak — istediğin ay/yılı
                doğrudan seçebilirsin. */}
            <div className={styles.calendarMonthHeader}>
              <div className={styles.calendarMonthYearLabels}>
                <div className={styles.calendarMonthYearWrap}>
                  <select
                    className={styles.calendarMonthYearSelect}
                    value={viewMonth}
                    onChange={(e) => setViewMonth(Number(e.target.value))}
                    aria-label={ui.selectMonthAria}
                  >
                    {monthOptions.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
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
                    aria-label={ui.selectYearAria}
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
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
                  aria-label={ui.prevMonthAria}
                  disabled={isViewingFirstAvailableMonth}
                  onClick={goToPrevMonth}
                ><ChevronLeft width={17} height={17} aria-hidden /></button>
                <button
                  type="button"
                  className={styles.calendarNavBtn}
                  aria-label={ui.nextMonthAria}
                  onClick={goToNextMonth}
                ><ChevronRight width={17} height={17} aria-hidden /></button>
              </div>
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
                  const available = day.isAvailable && day.date >= minBookableStr
                  const isToday = day.date === todayStr
                  const showPrice = day.minPrice != null
                  const showStar = available && minPriceInMonth != null && day.minPrice === minPriceInMonth
                  return (
                    <button
                      key={day.date}
                      type="button"
                      className={`${styles.dayCell} ${selected ? styles.dayCellSelected : ''} ${!available ? styles.dayCellDisabled : ''}`}
                      onClick={() => {
                        if (!available) return
                        onUpdate({ selectedDate: day.date })
                        setShowCalendar(false)
                      }}
                      disabled={!available}
                      aria-label={ui.calendarDayAria(
                        dayNum,
                        day.date,
                        showPrice && day.minPrice != null ? `, ${day.minPrice} TL` : ''
                      )}
                      aria-pressed={selected}
                      style={isToday && !selected ? { borderColor: 'var(--primary, #2168b8)', color: 'var(--primary, #2168b8)' } : undefined}
                    >
                      {showStar && (
                        <span className={styles.dayCellStar} aria-hidden>
                          <Star className={styles.dayCellStarIcon} fill="currentColor" aria-hidden />
                        </span>
                      )}
                      <span className={styles.dayNum}>{dayNum}</span>
                      {showPrice && (
                        <span className={`${styles.dayPrice} ${!available ? styles.dayPriceStrike : ''}`}>
                          {day.minPrice!.toLocaleString(ui.numberLocale)} ₺
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Rezervasyon Özeti (bilet) — referans site ile birebir, sınıf seçilmeden
          toplam ücret hesaplanamadığı için o alan yer tutucu olarak kalır. */}
      <div className={styles.sectionFlat}>
        <div className={styles.sectionHeaderPlain}>
          <h3 className={styles.sectionTitlePlain}>{ui.summaryTitle}</h3>
        </div>
        <ReservationTicket
          ui={ui}
          tourTitle={tour.title ?? ''}
          durationText={tour.quickFacts?.durationText}
          hostName={BOAT_NAME}
          meetingLocation={tour.quickFacts?.meetingLocation}
          guestLines={[{ label: String(total) }]}
          dateLabel={dateWithWeekday}
          timeLabel={tour.quickFacts?.startTime}
          totalValue={null}
        />
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
            <ArrowRight width={16} height={16} aria-hidden />
          </button>
        </div>
      </div>

    </div>
  )
}
