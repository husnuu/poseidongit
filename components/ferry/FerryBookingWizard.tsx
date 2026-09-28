'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { X, Minus, Plus, ChevronLeft, ChevronRight, Info, Check, Calendar as CalendarIcon } from 'lucide-react'
import PhoneField from '@/components/ui/PhoneField'
import NationalitySelect from './NationalitySelect'
import type { SiteLocale } from '@/lib/i18n/config'
import { getNationalityLabel } from './nationalityOptions'
import { adultFromFare, fareForTier, type FerryAgeTier, type FerryTripType, type FerryDirection } from './ferryTypes'
import styles from './FerryBookingWizard.module.css'

interface FerryBookingWizardProps {
  open: boolean
  onClose: () => void
  ferryTitle: string
  departurePort: string
  arrivalPort: string
  currency: string
  ageTiers: FerryAgeTier[]
  importantNotes: string[]
  waBaseHref: string | null
  locale: SiteLocale
  numberLocale: string
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i)

const STEP_LABELS: Record<SiteLocale, string[]> = {
  tr: ['Sefer', 'Bilgileriniz', 'Ödeme'],
  en: ['Trip', 'Your Details', 'Payment'],
  de: ['Reise', 'Ihre Daten', 'Zahlung'],
}

const TRIP_TYPE_LABELS: Record<SiteLocale, Record<FerryTripType, string>> = {
  tr: { oneway: 'Tek Yön', sameday: 'Aynı Gün Gidiş-Dönüş', diffday: 'Farklı Gün Gidiş-Dönüş' },
  en: { oneway: 'One Way', sameday: 'Same-Day Round Trip', diffday: 'Different-Day Round Trip' },
  de: { oneway: 'Einfache Fahrt', sameday: 'Hin- und Rückfahrt (gleicher Tag)', diffday: 'Hin- und Rückfahrt (anderer Tag)' },
}

const DATE_PLACEHOLDER: Record<SiteLocale, string> = {
  tr: 'Tarih seçin',
  en: 'Select date',
  de: 'Datum wählen',
}

const SAME_DAY_RETURN_HINT: Record<SiteLocale, string> = {
  tr: 'Gidiş ile aynı gün',
  en: 'Same day as departure',
  de: 'Am selben Tag wie die Hinfahrt',
}

const DEPARTURE_LABEL: Record<SiteLocale, string> = { tr: 'Gidiş', en: 'Departure', de: 'Hinfahrt' }
const RETURN_LABEL: Record<SiteLocale, string> = { tr: 'Dönüş', en: 'Return', de: 'Rückfahrt' }
const DATE_LABEL_SINGLE: Record<SiteLocale, string> = { tr: 'Tarih', en: 'Date', de: 'Datum' }

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatMoney(n: number, currency: string, numberLocale: string): string {
  return `${n.toLocaleString(numberLocale)} ${currency}`
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`
}

function parseIsoParts(iso: string): { y: number; m: number; d: number } | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return { y, m, d }
}

const DATE_LOCALE_MAP: Record<SiteLocale, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE' }
const WEEKDAYS_MAP: Record<SiteLocale, string[]> = {
  tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
}

function formatDateDisplay(iso: string, locale: SiteLocale): string {
  const p = parseIsoParts(iso)
  if (!p) return ''
  const d = new Date(p.y, p.m - 1, p.d)
  return d.toLocaleDateString(DATE_LOCALE_MAP[locale] ?? DATE_LOCALE_MAP.tr, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** "Pazartesi, 28 Eylül 2026" — tur rezervasyon biletimizdeki (ReservationTicket) format ile aynı. */
function formatDateDisplayLong(iso: string, locale: SiteLocale): string {
  const p = parseIsoParts(iso)
  if (!p) return ''
  const localeTag = DATE_LOCALE_MAP[locale] ?? DATE_LOCALE_MAP.tr
  const d = new Date(p.y, p.m - 1, p.d)
  const weekday = d.toLocaleDateString(localeTag, { weekday: 'long' })
  const dayMonthYear = d.toLocaleDateString(localeTag, { day: 'numeric', month: 'long', year: 'numeric' })
  const weekdayCap = weekday.charAt(0).toLocaleUpperCase(localeTag) + weekday.slice(1)
  return `${weekdayCap}, ${dayMonthYear}`
}

interface PassengerInfo {
  firstName: string
  lastName: string
  birthDay: string
  birthMonth: string
  birthYear: string
  nationality: string
}

function emptyPassenger(): PassengerInfo {
  return { firstName: '', lastName: '', birthDay: '', birthMonth: '', birthYear: '', nationality: 'TR' }
}

const MONTH_NAMES_MAP: Record<SiteLocale, string[]> = {
  tr: MONTHS_TR,
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
}

interface MiniCalendarProps {
  label: string
  value: string
  onChange: (iso: string) => void
  minIso: string
  locale: SiteLocale
}

/** Referans sitedeki takvim ile birebir: tarih seçilince tek satıra kapanır (tekrar tıklanınca açılır),
    "Ay › Yıl ›" etiketleri tıklanabilir (gizli native select), ayrıca yuvarlak ‹ › ok butonları. */
function MiniCalendar({ label, value, onChange, minIso, locale }: MiniCalendarProps) {
  const minParts = parseIsoParts(minIso) ?? parseIsoParts(todayIso())!
  const initial = parseIsoParts(value) ?? minParts
  const [viewYear, setViewYear] = useState(initial.y)
  const [viewMonth, setViewMonth] = useState(initial.m)
  // Referans site ile birebir: takvim başta her zaman kapalı — önce ikon + etiketli
  // bir "buton" gösterilir, tıklanınca takvim açılır (tarih seçiliyken de aynı buton,
  // sadece içeriği seçilen tarihe döner).
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const p = parseIsoParts(value)
    if (p) {
      setViewYear(p.y)
      setViewMonth(p.m)
    }
  }, [value])

  const monthNames = MONTH_NAMES_MAP[locale] ?? MONTH_NAMES_MAP.tr
  const monthOptions = useMemo(() => {
    const startMonth = viewYear === minParts.y ? minParts.m : 1
    return Array.from({ length: 12 - startMonth + 1 }, (_, i) => startMonth + i)
  }, [viewYear, minParts.y, minParts.m])
  const yearOptions = [minParts.y, minParts.y + 1, minParts.y + 2]

  const weekdays = WEEKDAYS_MAP[locale] ?? WEEKDAYS_MAP.tr
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1)
  const gridStart = (firstDayOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate()
  const isAtMinMonth = viewYear === minParts.y && viewMonth === minParts.m

  const goPrev = () => {
    if (viewMonth === 1) {
      setViewMonth(12)
      setViewYear((y) => y - 1)
    } else setViewMonth((m) => m - 1)
  }
  const goNext = () => {
    if (viewMonth === 12) {
      setViewMonth(1)
      setViewYear((y) => y + 1)
    } else setViewMonth((m) => m + 1)
  }

  if (!expanded) {
    return (
      <div className={styles.calendarSection}>
        <button type="button" className={styles.dateTrigger} onClick={() => setExpanded(true)}>
          <span className={styles.dateTriggerIcon}>
            <CalendarIcon size={18} strokeWidth={2} aria-hidden />
          </span>
          <span className={styles.dateTriggerText}>
            {label && <span className={styles.dateTriggerLabel}>{label}</span>}
            <span className={value ? styles.dateTriggerValue : `${styles.dateTriggerValue} ${styles.dateTriggerPlaceholder}`}>
              {value ? formatDateDisplayLong(value, locale) : DATE_PLACEHOLDER[locale] ?? DATE_PLACEHOLDER.tr}
            </span>
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className={styles.calendarSection}>
      {label && <span className={styles.calendarLabel}>{label}</span>}
      <div className={styles.calendarMonthHeader}>
        <div className={styles.calendarMonthYearLabels}>
          <div className={styles.calendarMonthYearWrap}>
            <select
              className={styles.calendarMonthYearSelect}
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              aria-label="Ay seç"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {monthNames[m - 1]}
                </option>
              ))}
            </select>
            <span className={styles.calendarMonthYearItem} aria-hidden>
              {monthNames[viewMonth - 1]}
              <ChevronRight width={14} height={14} aria-hidden />
            </span>
          </div>
          <div className={styles.calendarMonthYearWrap}>
            <select
              className={styles.calendarMonthYearSelect}
              value={viewYear}
              onChange={(e) => {
                const y = Number(e.target.value)
                setViewYear(y)
                if (y === minParts.y && viewMonth < minParts.m) setViewMonth(minParts.m)
              }}
              aria-label="Yıl seç"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <span className={styles.calendarMonthYearItem} aria-hidden>
              {viewYear}
              <ChevronRight width={14} height={14} aria-hidden />
            </span>
          </div>
        </div>
        <div className={styles.calendarNavBtnGroup}>
          <button
            type="button"
            className={styles.calendarNavBtn}
            aria-label="Önceki ay"
            disabled={isAtMinMonth}
            onClick={goPrev}
          >
            <ChevronLeft size={17} strokeWidth={2} aria-hidden />
          </button>
          <button type="button" className={styles.calendarNavBtn} aria-label="Sonraki ay" onClick={goNext}>
            <ChevronRight size={17} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
      <div className={styles.calendarGrid}>
        {weekdays.map((wd) => (
          <div key={wd} className={styles.weekday} aria-hidden>
            {wd}
          </div>
        ))}
        {Array.from({ length: gridStart }, (_, i) => (
          <div key={`empty-${i}`} aria-hidden />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
          const iso = toIso(viewYear, viewMonth, dayNum)
          const disabled = iso < minIso
          const selected = value === iso
          return (
            <button
              key={iso}
              type="button"
              className={`${styles.dayCell} ${selected ? styles.dayCellSelected : ''} ${disabled ? styles.dayCellDisabled : ''}`}
              disabled={disabled}
              onClick={() => {
                onChange(iso)
                setExpanded(false)
              }}
            >
              <span className={styles.dayNum}>{dayNum}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function FerryBookingWizard({
  open,
  onClose,
  ferryTitle,
  departurePort,
  arrivalPort,
  currency,
  ageTiers,
  importantNotes,
  waBaseHref,
  locale,
  numberLocale,
}: FerryBookingWizardProps) {
  const titleId = useId()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [tripType, setTripType] = useState<FerryTripType>('oneway')
  const [direction, setDirection] = useState<FerryDirection>('departure')
  const [departureDate, setDepartureDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [counts, setCounts] = useState<Record<string, number>>({})

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState<string | undefined>('')

  // Birden fazla yolcu seçilirse hepsi için ayrı bilgi kartı (referans site ile birebir).
  const [passengers, setPassengers] = useState<PassengerInfo[]>([])
  const [primaryIsDifferentPerson, setPrimaryIsDifferentPerson] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // Modal her açıldığında baştan başla
  useEffect(() => {
    if (open) setStep(1)
  }, [open])

  const stepLabels = STEP_LABELS[locale] ?? STEP_LABELS.tr
  const tripTypeLabels = TRIP_TYPE_LABELS[locale] ?? TRIP_TYPE_LABELS.tr

  const totalPassengers = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts],
  )

  const totalPrice = useMemo(() => {
    return ageTiers.reduce((sum, tier) => {
      const c = counts[tier.key] ?? 0
      if (c <= 0) return sum
      return sum + c * fareForTier(tier, tripType, direction)
    }, 0)
  }, [ageTiers, counts, tripType, direction])

  const fromPrice = useMemo(() => adultFromFare(ageTiers), [ageTiers])

  // Her yaş grubundan seçilen adet kadar "yolcu koltuğu" — her biri kendi bilgi kartını alır.
  const passengerSlots = useMemo(() => {
    const slots: { tierLabel: string }[] = []
    ageTiers.forEach((tier) => {
      const c = counts[tier.key] ?? 0
      for (let i = 0; i < c; i++) slots.push({ tierLabel: tier.label })
    })
    return slots
  }, [ageTiers, counts])

  useEffect(() => {
    setPassengers((prev) => passengerSlots.map((_, i) => prev[i] ?? emptyPassenger()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passengerSlots.length])

  if (!open) return null

  const setCount = (key: string, delta: number) => {
    setCounts((prev) => {
      const next = Math.max(0, (prev[key] ?? 0) + delta)
      return { ...prev, [key]: next }
    })
  }

  const updatePassenger = (index: number, patch: Partial<PassengerInfo>) => {
    setPassengers((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  const getPassengerName = (index: number): string => {
    if (index === 0 && !primaryIsDifferentPerson) return `${firstName} ${lastName}`.trim()
    const p = passengers[index]
    return p ? `${p.firstName} ${p.lastName}`.trim() : ''
  }

  const step1Valid =
    totalPassengers > 0 &&
    !!departureDate &&
    (tripType !== 'diffday' || (!!returnDate && returnDate >= departureDate))

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const passengerNamesValid = passengerSlots.every((_, i) => {
    if (i === 0 && !primaryIsDifferentPerson) return true
    const p = passengers[i]
    return !!p && p.firstName.trim().length > 1 && p.lastName.trim().length > 1
  })
  const step2Valid =
    firstName.trim().length > 1 &&
    lastName.trim().length > 1 &&
    emailValid &&
    !!phone &&
    passengerNamesValid

  const routeLine =
    tripType === 'oneway'
      ? direction === 'departure'
        ? `${departurePort} → ${arrivalPort}`
        : `${arrivalPort} → ${departurePort}`
      : `${departurePort} ↔ ${arrivalPort}`

  const buildWhatsAppMessage = (): string => {
    const lines: string[] = []
    lines.push(`Merhaba, ${ferryTitle} için rezervasyon talebim var.`)
    lines.push('')
    lines.push(`Güzergah: ${routeLine}`)
    lines.push(`Sefer tipi: ${tripTypeLabels[tripType]}`)
    if (tripType === 'diffday') {
      lines.push(`Gidiş tarihi: ${formatDateDisplay(departureDate, locale)}`)
      lines.push(`Dönüş tarihi: ${formatDateDisplay(returnDate, locale)}`)
    } else {
      lines.push(`Tarih: ${formatDateDisplay(departureDate, locale)}`)
    }
    lines.push('')
    lines.push('Yolcular:')
    ageTiers.forEach((tier) => {
      const c = counts[tier.key] ?? 0
      if (c > 0) {
        const fare = fareForTier(tier, tripType, direction)
        lines.push(`- ${tier.label} × ${c} (${formatMoney(fare, currency, numberLocale)} / kişi)`)
      }
    })
    lines.push('')
    lines.push(`Toplam: ${formatMoney(totalPrice, currency, numberLocale)}`)
    lines.push('')
    lines.push(`İletişim — Ad Soyad: ${firstName} ${lastName}`)
    lines.push(`E-posta: ${email}`)
    lines.push(`Telefon: ${phone ?? ''}`)
    lines.push('')
    lines.push('Yolcu Detayları:')
    passengerSlots.forEach((slot, i) => {
      const p = passengers[i]
      const name = getPassengerName(i) || '—'
      const birthdate = p && p.birthDay && p.birthMonth && p.birthYear ? `${p.birthDay}.${p.birthMonth}.${p.birthYear}` : null
      const parts = [name]
      if (birthdate) parts.push(`d.t. ${birthdate}`)
      if (p?.nationality) parts.push(getNationalityLabel(p.nationality, locale))
      lines.push(`${i + 1}. ${slot.tierLabel} — ${parts.join(', ')}`)
    })
    return lines.join('\n')
  }

  const handleSend = () => {
    if (!waBaseHref) return
    const href = `${waBaseHref}?text=${encodeURIComponent(buildWhatsAppMessage())}`
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  // Referans siteki bilet kesiği ile birebir — tur rezervasyon modülümüzdeki
  // ReservationTicket ile aynı teknik (dikey kesik çizgi + "Buradan yırtın" etiketi).
  // Hem 1. adımın altında (canlı özet) hem de 3. (ödeme) adımında kullanılır.
  const ticketSummary = (
    <div className={styles.ticketStackWrap}>
      <div className={styles.ticketStackLayer} aria-hidden />
      <div className={styles.ticketCard}>
        <div className={styles.ticketBodyCell}>
          <div className={styles.ticketBodyBg} aria-hidden />
          <div>
            <div className={styles.ticketStub}>
              <div className={styles.ticketStubLeft}>
                <p className={styles.ticketRouteTitle}>{routeLine}</p>
                <div className={styles.ticketInfoGroup}>
                  <p className={styles.ticketInfoLineBold}>
                    <span className={styles.ticketInfoLabel}>Sefer tipi:</span> {tripTypeLabels[tripType]}
                  </p>
                  {tripType === 'diffday' ? (
                    <>
                      <p className={styles.ticketInfoLine}>
                        <span className={styles.ticketInfoLabel}>Gidiş:</span>{' '}
                        {formatDateDisplay(departureDate, locale)}
                      </p>
                      <p className={styles.ticketInfoLine}>
                        <span className={styles.ticketInfoLabel}>Dönüş:</span>{' '}
                        {formatDateDisplay(returnDate, locale)}
                      </p>
                    </>
                  ) : (
                    <p className={styles.ticketInfoLine}>
                      <span className={styles.ticketInfoLabel}>Tarih:</span> {formatDateDisplay(departureDate, locale)}
                    </p>
                  )}
                  {ageTiers
                    .filter((t) => (counts[t.key] ?? 0) > 0)
                    .map((tier) => {
                      const c = counts[tier.key] ?? 0
                      const fare = fareForTier(tier, tripType, direction)
                      return (
                        <p key={tier.key} className={styles.ticketInfoLine}>
                          {tier.label} × {c} ({formatMoney(fare, currency, numberLocale)}/kişi)
                        </p>
                      )
                    })}
                </div>
              </div>

              <div className={styles.ticketDividerLine} aria-hidden>
                <span className={styles.ticketTearLabel}>Buradan yırtın</span>
              </div>

              <div className={styles.ticketStubRight}>
                <span className={styles.ticketTotalLabel}>Bugün ödenecek toplam</span>
                <span className={styles.ticketTotalValue}>{formatMoney(totalPrice, currency, numberLocale)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className={styles.overlay} role="presentation">
      <button type="button" aria-label="Kapat" className={styles.backdrop} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {ferryTitle}
          </h2>
          <button type="button" onClick={onClose} aria-label="Kapat" className={styles.closeBtn}>
            <X size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className={styles.stepper}>
          {stepLabels.map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3
            const done = step > n
            const active = step === n
            return (
              <div key={label} className={styles.stepItem}>
                <span
                  className={`${styles.stepDot} ${done ? styles.stepDone : ''} ${active ? styles.stepActive : ''}`}
                >
                  {done ? <Check size={14} strokeWidth={3} aria-hidden /> : n}
                </span>
                <span className={`${styles.stepLabel} ${active ? styles.stepLabelActive : ''}`}>{label}</span>
                {i < stepLabels.length - 1 && (
                  <span className={`${styles.stepLine} ${step > n ? styles.stepLineDone : ''}`} />
                )}
              </div>
            )
          })}
        </div>

        <div className={styles.body}>
          {step === 1 && (
            <>
              <div className={styles.sectionHeaderPlain}><h3 className={styles.sectionTitlePlain}>Bilet tipi</h3></div>
              <div className={styles.tabs}>
                {(['oneway', 'sameday', 'diffday'] as FerryTripType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`${styles.tab} ${tripType === t ? styles.tabActive : ''}`}
                    onClick={() => setTripType(t)}
                  >
                    {tripTypeLabels[t]}
                  </button>
                ))}
              </div>

              {tripType === 'oneway' && (
                <div className={styles.directionRow}>
                  <button
                    type="button"
                    className={`${styles.directionBtn} ${direction === 'departure' ? styles.directionActive : ''}`}
                    onClick={() => setDirection('departure')}
                  >
                    {departurePort} → {arrivalPort}
                  </button>
                  <button
                    type="button"
                    className={`${styles.directionBtn} ${direction === 'return' ? styles.directionActive : ''}`}
                    onClick={() => setDirection('return')}
                  >
                    {arrivalPort} → {departurePort}
                  </button>
                </div>
              )}

              <div className={styles.sectionHeaderPlain}><h3 className={styles.sectionTitlePlain}>Tarih</h3></div>
              <MiniCalendar
                label={tripType === 'diffday' ? (DEPARTURE_LABEL[locale] ?? DEPARTURE_LABEL.tr) : (DATE_LABEL_SINGLE[locale] ?? DATE_LABEL_SINGLE.tr)}
                value={departureDate}
                onChange={(iso) => {
                  setDepartureDate(iso)
                  if (tripType === 'diffday' && returnDate && returnDate < iso) setReturnDate('')
                }}
                minIso={todayIso()}
                locale={locale}
              />
              {tripType === 'diffday' && (
                <div className={styles.calendarSecond}>
                  <MiniCalendar
                    label={RETURN_LABEL[locale] ?? RETURN_LABEL.tr}
                    value={returnDate}
                    onChange={setReturnDate}
                    minIso={departureDate || todayIso()}
                    locale={locale}
                  />
                </div>
              )}
              {tripType === 'sameday' && (
                <div className={styles.calendarSecond}>
                  <div className={styles.calendarSection}>
                    <div className={`${styles.dateTrigger} ${styles.dateTriggerDisabled}`}>
                      <span className={styles.dateTriggerIcon}>
                        <CalendarIcon size={18} strokeWidth={2} aria-hidden />
                      </span>
                      <span className={styles.dateTriggerText}>
                        <span className={styles.dateTriggerLabel}>{RETURN_LABEL[locale] ?? RETURN_LABEL.tr}</span>
                        <span className={`${styles.dateTriggerValue} ${styles.dateTriggerPlaceholder}`}>
                          {SAME_DAY_RETURN_HINT[locale] ?? SAME_DAY_RETURN_HINT.tr}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.sectionHeaderPlain}><h3 className={styles.sectionTitlePlain}>Yolcular</h3></div>
              <div className={styles.passengerList}>
                {ageTiers.map((tier) => {
                  const fare = fareForTier(tier, tripType, direction)
                  const ageText =
                    tier.minAge != null
                      ? tier.maxAge != null
                        ? `${tier.minAge}-${tier.maxAge} yaş`
                        : `${tier.minAge}+ yaş`
                      : null
                  return (
                    <div key={tier.key} className={styles.passengerRow}>
                      <div>
                        <div className={styles.passengerLabel}>{tier.label}</div>
                        <div className={styles.passengerSub}>
                          {ageText ? `${ageText} · ` : ''}
                          {formatMoney(fare, currency, numberLocale)}
                        </div>
                      </div>
                      <div className={styles.counter}>
                        <button
                          type="button"
                          onClick={() => setCount(tier.key, -1)}
                          className={styles.counterBtn}
                          aria-label={`${tier.label} azalt`}
                          disabled={(counts[tier.key] ?? 0) <= 0}
                        >
                          <Minus size={16} strokeWidth={2.5} aria-hidden />
                        </button>
                        <span className={styles.counterValue}>{counts[tier.key] ?? 0}</span>
                        <button
                          type="button"
                          onClick={() => setCount(tier.key, 1)}
                          className={styles.counterBtn}
                          aria-label={`${tier.label} artır`}
                        >
                          <Plus size={16} strokeWidth={2.5} aria-hidden />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {importantNotes.length > 0 && (
                <div className={styles.notesBlock}>
                  <div className={styles.notesTitle}>
                    <Info size={16} strokeWidth={2} aria-hidden /> Önemli Bilgiler
                  </div>
                  <ul className={styles.notesList}>
                    {importantNotes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}

              {totalPassengers > 0 && (
                <>
                  <div className={styles.sectionHeaderPlain}><h3 className={styles.sectionTitlePlain}>Bilet Özeti</h3></div>
                  {ticketSummary}
                </>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div className={styles.sectionHeaderPlain}><h3 className={styles.sectionTitlePlain}>İletişim bilgileriniz</h3></div>
              <div className={styles.formGrid}>
                <input
                  type="text"
                  placeholder="Ad"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={styles.textInput}
                />
                <input
                  type="text"
                  placeholder="Soyad"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={styles.textInput}
                />
                <input
                  type="email"
                  placeholder="E-posta Adresiniz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${styles.textInput} ${styles.fullWidth}`}
                />
                <div className={styles.fullWidth}>
                  <PhoneField label="Telefon Numarası" value={phone} onChange={setPhone} compact />
                </div>
              </div>

              <div className={styles.sectionHeaderPlain}><h3 className={styles.sectionTitlePlain}>Yolcu bilgileri</h3></div>
              <div className={styles.travelerStack}>
                {passengerSlots.map((slot, i) => {
                  const p = passengers[i] ?? emptyPassenger()
                  const isPrimary = i === 0
                  const showNameFields = !isPrimary || primaryIsDifferentPerson
                  return (
                    <div key={i} className={styles.travelerCard}>
                      <h4 className={styles.travelerCardTitle}>
                        Yolcu {i + 1} · {slot.tierLabel}
                      </h4>

                      {isPrimary && (
                        <>
                          {!primaryIsDifferentPerson && (
                            <p className={styles.travelerSummaryLine}>
                              {firstName} {lastName}{' '}
                              <span className={styles.travelerSummaryMuted}>
                                · Ana yolcu — iletişim bilgilerinizle aynı
                              </span>
                            </p>
                          )}
                          <label className={styles.travelerCheckboxRow}>
                            <input
                              type="checkbox"
                              className={styles.travelerCheckbox}
                              checked={primaryIsDifferentPerson}
                              onChange={(e) => setPrimaryIsDifferentPerson(e.target.checked)}
                            />
                            <span className={styles.travelerCheckboxLabel}>Bu yolcu ben değilim</span>
                          </label>
                        </>
                      )}

                      {showNameFields && (
                        <div className={styles.travelerFormGrid}>
                          <input
                            type="text"
                            placeholder="Ad"
                            value={p.firstName}
                            onChange={(e) => updatePassenger(i, { firstName: e.target.value })}
                            className={styles.textInput}
                          />
                          <input
                            type="text"
                            placeholder="Soyad"
                            value={p.lastName}
                            onChange={(e) => updatePassenger(i, { lastName: e.target.value })}
                            className={styles.textInput}
                          />
                        </div>
                      )}

                      <span className={styles.travelerFieldLabel}>Doğum tarihi</span>
                      <div className={styles.travelerFormGrid}>
                        <select
                          value={p.birthDay}
                          onChange={(e) => updatePassenger(i, { birthDay: e.target.value })}
                          className={styles.select}
                        >
                          <option value="">Gün</option>
                          {DAYS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <select
                          value={p.birthMonth}
                          onChange={(e) => updatePassenger(i, { birthMonth: e.target.value })}
                          className={styles.select}
                        >
                          <option value="">Ay</option>
                          {MONTHS_TR.map((m, mi) => (
                            <option key={m} value={mi + 1}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <select
                          value={p.birthYear}
                          onChange={(e) => updatePassenger(i, { birthYear: e.target.value })}
                          className={`${styles.select} ${styles.fullWidth}`}
                        >
                          <option value="">Yıl</option>
                          {YEARS.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>

                      <NationalitySelect
                        value={p.nationality}
                        onChange={(code) => updatePassenger(i, { nationality: code })}
                        locale={locale}
                      />
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {importantNotes.length > 0 && (
                <div className={styles.notesBlock}>
                  <div className={styles.notesTitle}>
                    <Info size={16} strokeWidth={2} aria-hidden /> Önemli Bilgiler
                  </div>
                  <ul className={styles.notesList}>
                    {importantNotes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={styles.sectionHeaderPlain}><h3 className={styles.sectionTitlePlain}>Ödeme</h3></div>
              {ticketSummary}
              <p className={styles.finalNote}>
                Bu bir ön rezervasyon talebidir. "WhatsApp'tan Gönder"e bastığınızda talebiniz ekibimize iletilir,
                ödeme ve kesin onay WhatsApp üzerinden tamamlanır.
              </p>
            </>
          )}
        </div>

        <div className={styles.footer}>
          {step > 1 && (
            <button type="button" className={styles.backBtn} onClick={() => setStep((s) => (s - 1) as 1 | 2)}>
              <ChevronLeft size={18} strokeWidth={2} aria-hidden /> Geri
            </button>
          )}
          <div className={styles.footerTotal}>
            <span className={styles.footerTotalLabel}>Toplam Ücret</span>
            <span className={styles.footerTotalValue}>
              {totalPassengers > 0
                ? formatMoney(totalPrice, currency, numberLocale)
                : fromPrice != null
                  ? formatMoney(fromPrice, currency, numberLocale)
                  : '—'}
            </span>
          </div>
          {step === 1 && (
            <button type="button" className={styles.nextBtn} disabled={!step1Valid} onClick={() => setStep(2)}>
              Devam Et
            </button>
          )}
          {step === 2 && (
            <button type="button" className={styles.nextBtn} disabled={!step2Valid} onClick={() => setStep(3)}>
              Ödemeye Geç
            </button>
          )}
          {step === 3 && (
            <button type="button" className={styles.nextBtn} disabled={!waBaseHref} onClick={handleSend}>
              WhatsApp&apos;tan Gönder
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
