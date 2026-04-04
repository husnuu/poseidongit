/**
 * Pure booking/pricing helpers – no Sanity client.
 * Safe to import from client components.
 */
import type {
  TourForBooking,
  TicketClassForBooking,
  SpecificDate,
  CalendarDay,
  PricingSummary,
  PricingUnit,
} from './bookingTypes'

/** Seçilen sınıf First Class mı (loca seçimi gerekir). key === 'first' veya label'da "first" geçiyorsa. */
export function isFirstClassKey(tour: TourForBooking, classKey: string | null): boolean {
  if (!classKey) return false
  if (classKey === 'first') return true
  const cls = tour.ticketClasses?.find((c) => c.key === classKey)
  return (cls?.label?.toLowerCase().includes('first') ?? false)
}

/** Özel günde sınıf durumu: 'open' | 'full' | 'closed' | null (null = özel kural yok, kapasiteye bak) */
export function getClassStatusForDate(
  tour: TourForBooking,
  dateStr: string,
  classKey: string
): 'open' | 'full' | 'closed' | null {
  const avail = tour.availability
  if (!avail?.enabled || !avail.specificDates?.length) return null
  const dateNorm = dateStr.slice(0, 10)
  const specific = avail.specificDates.find((s) => (s.date || '').slice(0, 10) === dateNorm)
  if (!specific?.classAvailability?.length) return null
  const item = specific.classAvailability.find((c) => c.classKey === classKey)
  return item?.status ?? null
}

export function getCapacityForDate(
  tour: TourForBooking,
  dateStr: string
): Record<string, number> {
  const dateNorm = dateStr.slice(0, 10)
  const override = tour.availabilityOverrides?.find((o) => (o.date || '').slice(0, 10) === dateNorm)
  const base = tour.baseCapacity
  const eco = override?.eco ?? base?.ecoCapacity ?? 30
  const premium = override?.premium ?? base?.premiumCapacity ?? 20
  const first = override?.first ?? base?.firstCapacity ?? 10
  return { eco, premium, first }
}

/** Kalan kapasite = base kapasite - rezervasyonlar. usedByDateAndClass: API /api/availability’den. */
export function getRemainingCapacityForDate(
  tour: TourForBooking,
  dateStr: string,
  usedByDateAndClass: Record<string, Record<string, number>> | null | undefined
): Record<string, number> {
  const base = getCapacityForDate(tour, dateStr)
  const dateNorm = dateStr.slice(0, 10)
  const used = usedByDateAndClass?.[dateNorm]
  const result: Record<string, number> = {}
  for (const [classKey, cap] of Object.entries(base)) {
    const booked = used?.[classKey] ?? 0
    result[classKey] = Math.max(0, cap - booked)
  }
  return result
}

/** capacityByClass sadece eco/premium/first içerir; ticketClassKey Sanity'den gelebilir (Eco, economy vb.). */
export function getCapForTicketClass(
  capacityByClass: Record<string, number> | null | undefined,
  ticketClassKey: string
): number {
  if (!capacityByClass || !ticketClassKey) return 0
  const k = ticketClassKey.toLowerCase()
  if (capacityByClass[ticketClassKey] != null) return capacityByClass[ticketClassKey]
  if (capacityByClass[k] != null) return capacityByClass[k]
  if (k === 'eco' || k.startsWith('eco')) return capacityByClass.eco ?? 0
  if (k === 'premium' || k.startsWith('prem')) return capacityByClass.premium ?? 0
  if (k === 'first' || k.startsWith('first')) return capacityByClass.first ?? 0
  return 0
}

export function getSeasonMultiplier(tour: TourForBooking, dateStr: string): number {
  const rules = tour.seasonRules ?? []
  const d = new Date(dateStr)
  for (const r of rules) {
    const start = new Date(r.start)
    const end = new Date(r.end)
    if (d >= start && d <= end) return r.multiplier
  }
  return 1
}

function normalizeTicketClassKey(classKey: string): string {
  const k = classKey.toLowerCase().trim()
  if (k === 'eco' || k.startsWith('eco')) return 'eco'
  if (k === 'premium' || k.startsWith('prem')) return 'premium'
  if (k === 'first' || k.startsWith('first')) return 'first'
  return k
}

/** Takvim aktif ve özel gün satırı açıksa o günün kaydı. */
function getActiveSpecificDate(tour: TourForBooking, dateStr: string): SpecificDate | null {
  const avail = tour.availability
  if (!avail?.enabled || !avail.specificDates?.length) return null
  const dateNorm = dateStr.slice(0, 10)
  const specific = avail.specificDates.find((s) => (s.date || '').slice(0, 10) === dateNorm)
  if (!specific || specific.enabled === false) return null
  return specific
}

function unitFromPriceOverrideObject(
  po: { adultPrice?: number; childPrice?: number; infantPrice?: number } | undefined,
  ageKey: 'adult' | 'child' | 'infant'
): number | null {
  if (!po) return null
  const raw =
    ageKey === 'adult' ? po.adultPrice : ageKey === 'child' ? po.childPrice : po.infantPrice
  if (raw != null && Number.isFinite(Number(raw))) return Math.round(Number(raw))
  return null
}

/**
 * Öncelik: sınıfa özel özel gün fiyatı → günlük genel özel gün fiyatı → tur sınıfı × sezon.
 */
function effectiveUnitForAge(
  tour: TourForBooking,
  dateStr: string,
  ticketClassKey: string,
  ageKey: 'adult' | 'child' | 'infant',
  cls: TicketClassForBooking,
  mult: number
): number {
  const specific = getActiveSpecificDate(tour, dateStr)
  if (specific) {
    const norm = normalizeTicketClassKey(ticketClassKey)
    const classRow = specific.classPriceOverrides?.find(
      (x) => normalizeTicketClassKey(x.classKey) === norm
    )
    const fromClassRow = unitFromPriceOverrideObject(classRow, ageKey)
    if (fromClassRow != null) return fromClassRow
    const fromDay = unitFromPriceOverrideObject(specific.priceOverrides, ageKey)
    if (fromDay != null) return fromDay
  }
  const agePrice = cls.pricesByAge?.find((p) => p.ageKey === ageKey)
  return agePrice ? Math.round(agePrice.price * mult) : 0
}

/**
 * Sınıf kartındaki “Yetişkin (tarih): … ₺” — `computePricingForSelection` ile aynı özel gün / sınıf / sezon mantığı.
 */
export function getDisplayedAdultUnitPriceForClass(
  tour: TourForBooking,
  dateStr: string,
  cls: TicketClassForBooking
): number | undefined {
  const mult = getSeasonMultiplier(tour, dateStr)
  const unit = effectiveUnitForAge(tour, dateStr, cls.key, 'adult', cls, mult)
  if (!Number.isFinite(unit) || unit <= 0) return undefined
  return unit
}

function getMinPriceForDate(tour: TourForBooking, dateStr: string): number | null {
  const classes = tour.ticketClasses ?? []
  const mult = getSeasonMultiplier(tour, dateStr)
  let min: number | null = null
  for (const c of classes) {
    const p = effectiveUnitForAge(tour, dateStr, c.key, 'adult', c, mult)
    if (p > 0 && (min === null || p < min)) min = p
  }
  return min
}

function isDateAvailable(tour: TourForBooking, dateStr: string): boolean {
  const avail = tour.availability
  // Sanity'de takvim kapalıysa veya yoksa tüm günler müsait
  if (!avail?.enabled) return true
  // Özel gün tanımlıysa onu kullan (Sanity bazen ISO döndürür, YYYY-MM-DD ile karşılaştır)
  const dateNorm = dateStr.slice(0, 10)
  const specific = avail.specificDates?.find((s) => (s.date || '').slice(0, 10) === dateNorm)
  if (specific != null) {
    if (specific.enabled === false) return false
    if (specific.defaultAvailable !== undefined) return specific.defaultAvailable
    if (specific.available !== undefined) return specific.available
    return true
  }
  // Tarih aralığında mı?
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const range = avail.dateRanges?.find((r) => {
    const start = new Date(r.start)
    const end = new Date(r.end)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    return d >= start && d <= end
  })
  if (range != null) return range.available
  // Hiçbir aralık/özel gün yoksa varsayılan: kapalı (sadece satışa açık tarihler gösterilir)
  return avail.defaultAvailable ?? false
}

export function computePricingForSelection(
  tour: TourForBooking | null,
  dateStr: string | null,
  classKey: string | null,
  counts: { adult: number; child: number; baby: number }
): PricingSummary | null {
  if (!tour || !dateStr || !classKey) return null
  const cls = tour.ticketClasses?.find((c) => c.key === classKey)
  if (!cls?.pricesByAge?.length) return null

  const mult = getSeasonMultiplier(tour, dateStr)
  const unitPrices: PricingUnit[] = []
  const mapping = [
    { key: 'adult' as const, count: counts.adult },
    { key: 'child' as const, count: counts.child },
    { key: 'infant' as const, count: counts.baby },
  ]
  for (const { key, count } of mapping) {
    if (count <= 0) continue
    const agePrice = cls.pricesByAge.find((p) => p.ageKey === key)
    const unitPrice = effectiveUnitForAge(tour, dateStr, classKey, key, cls, mult)
    unitPrices.push({
      ageKey: key,
      ageLabel: agePrice?.ageLabel ?? key,
      unitPrice,
      count,
      subtotal: unitPrice * count,
    })
  }
  const total = unitPrices.reduce((s, u) => s + u.subtotal, 0)
  const deposit = tour.deposit
  let depositPercent = 0
  let depositAmount = 0
  if (deposit?.enabled && deposit.value != null) {
    if (deposit.type === 'percentage') {
      depositPercent = deposit.value
      depositAmount = Math.round((total * deposit.value) / 100)
    } else {
      depositAmount = deposit.value
      depositPercent = total > 0 ? Math.round((deposit.value / total) * 100) : 0
    }
  } else {
    depositPercent = 20
    depositAmount = Math.round(total * 0.2)
  }
  const remainingAmount = total - depositAmount
  return {
    unitPrices,
    total,
    depositPercent,
    depositAmount,
    remainingAmount,
    currency: 'TRY',
  }
}

/** Build calendar days for a month (pure; pass in tour from server). */
export function buildCalendarDaysForMonth(
  tour: TourForBooking,
  year: number,
  month: number
): CalendarDay[] {
  const daysInMonth = new Date(year, month, 0).getDate()
  const result: CalendarDay[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    result.push({
      date: dateStr,
      minPrice: getMinPriceForDate(tour, dateStr),
      isAvailable: isDateAvailable(tour, dateStr),
      capacityByClass: getCapacityForDate(tour, dateStr),
    })
  }
  return result
}

const TODAY = new Date()
const TODAY_STR = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}-${String(TODAY.getDate()).padStart(2, '0')}`

/** İlk satışa açık tarihin yıl ve ayı (bugünden itibaren, en fazla 24 ay taranır). */
export function getFirstAvailableYearMonth(tour: TourForBooking): { year: number; month: number } {
  let y = TODAY.getFullYear()
  let m = TODAY.getMonth() + 1
  for (let i = 0; i < 24; i++) {
    const days = buildCalendarDaysForMonth(tour, y, m)
    const hasAvailable = days.some(
      (d) => d.isAvailable && d.date >= TODAY_STR
    )
    if (hasAvailable) return { year: y, month: m }
    if (m === 12) {
      m = 1
      y += 1
    } else {
      m += 1
    }
  }
  return { year: TODAY.getFullYear(), month: TODAY.getMonth() + 1 }
}
