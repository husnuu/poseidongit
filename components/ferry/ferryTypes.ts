import type { SiteLocale } from '@/lib/i18n/config'

export type FerryAgeTier = {
  key: string
  label: string
  minAge?: number | null
  maxAge?: number | null
  roundTripPrice: number
  oneWayDeparturePrice: number
  oneWayReturnPrice: number
  /** Aynı gün gidiş-dönüş farklı fiyatlıysa; yoksa gidiş-dönüş fiyatı kullanılır. */
  sameDayPrice?: number | null
}

export type FerryTripType = 'oneway' | 'sameday' | 'diffday'
export type FerryDirection = 'departure' | 'return'

export type FerryPaxFare = { adult: number; child: number; infant: number }
export type FerryVehicleFare = { car: number; motorbike: number }
export type FerryVehicleKey = keyof FerryVehicleFare
export type FerryVesselKind = 'catamaran' | 'carFerry'

/** Hattaki tek bir tekne ve fiyatları (€) — bkz. lib/ferry/turyolRoutes.ts. */
export type FerryVessel = {
  id: string
  name: string
  kind: FerryVesselKind | null
  fares: { oneWay: FerryPaxFare; roundTrip: FerryPaxFare; sameDay: FerryPaxFare }
  /** Yalnızca araç taşıyan teknelerde; araç başı fiyat. */
  vehicleFares?: { oneWay: FerryVehicleFare; roundTrip: FerryVehicleFare; sameDay: FerryVehicleFare } | null
}

export const FERRY_AGE_LABELS: Record<SiteLocale, Record<keyof FerryPaxFare, string>> = {
  tr: { adult: 'Yetişkin', child: 'Çocuk', infant: 'Bebek' },
  en: { adult: 'Adult', child: 'Child', infant: 'Infant' },
  de: { adult: 'Erwachsener', child: 'Kind', infant: 'Kleinkind' },
  ru: { adult: 'Взрослый', child: 'Ребёнок', infant: 'Младенец' },
}

export const FERRY_VEHICLE_LABELS: Record<SiteLocale, Record<FerryVehicleKey, string>> = {
  tr: { car: 'Otomobil', motorbike: 'Motosiklet' },
  en: { car: 'Car', motorbike: 'Motorbike' },
  de: { car: 'Pkw', motorbike: 'Motorrad' },
  ru: { car: 'Легковой автомобиль', motorbike: 'Мотоцикл' },
}

export const FERRY_VESSEL_KIND_LABELS: Record<SiteLocale, Record<FerryVesselKind, string>> = {
  tr: { catamaran: 'Katamaran', carFerry: 'Araçlı feribot' },
  en: { catamaran: 'Catamaran', carFerry: 'Car ferry' },
  de: { catamaran: 'Katamaran', carFerry: 'Autofähre' },
  ru: { catamaran: 'Катамаран', carFerry: 'Автомобильный паром' },
}

/** Yaş sınırları: yetişkin 12+, çocuk 6-11, bebek 0-5. */
const AGE_BANDS: { key: keyof FerryPaxFare; minAge: number; maxAge: number | null }[] = [
  { key: 'adult', minAge: 12, maxAge: null },
  { key: 'child', minAge: 6, maxAge: 11 },
  { key: 'infant', minAge: 0, maxAge: 5 },
]

/** Teknenin fiyatlarını rezervasyon sihirbazının yaş grubu biçimine çevirir. */
export function vesselAgeTiers(vessel: FerryVessel, locale: SiteLocale): FerryAgeTier[] {
  const labels = FERRY_AGE_LABELS[locale] ?? FERRY_AGE_LABELS.tr
  return AGE_BANDS.map(({ key, minAge, maxAge }) => ({
    key,
    label: labels[key],
    minAge,
    maxAge,
    roundTripPrice: vessel.fares.roundTrip[key],
    oneWayDeparturePrice: vessel.fares.oneWay[key],
    oneWayReturnPrice: vessel.fares.oneWay[key],
    sameDayPrice: vessel.fares.sameDay[key],
  }))
}

/** Yetişkin gidiş-dönüş fiyatı en düşük tekne (kart ve "kişi başı" göstergesi için). */
export function cheapestVessel(vessels: FerryVessel[]): FerryVessel | null {
  return vessels.reduce<FerryVessel | null>(
    (best, v) => (best == null || v.fares.roundTrip.adult < best.fares.roundTrip.adult ? v : best),
    null,
  )
}

export function vehicleFare(vessel: FerryVessel, tripType: FerryTripType, key: FerryVehicleKey): number | null {
  const fares = vessel.vehicleFares
  if (!fares) return null
  if (tripType === 'oneway') return fares.oneWay[key]
  return tripType === 'sameday' ? fares.sameDay[key] : fares.roundTrip[key]
}

/** Tüm yaş gruplarının, tüm sefer tiplerindeki en düşük fiyatı. */
export function cheapestFare(tiers: FerryAgeTier[]): number | null {
  if (!tiers.length) return null
  let min = Infinity
  for (const t of tiers) {
    min = Math.min(min, t.roundTripPrice, t.oneWayDeparturePrice, t.oneWayReturnPrice)
  }
  return Number.isFinite(min) ? min : null
}

function isAdultTier(t: FerryAgeTier): boolean {
  const key = (t.key || '').toLowerCase()
  const label = (t.label || '').toLowerCase()
  return (
    key === 'adult' ||
    label.includes('yetişkin') ||
    label.includes('adult') ||
    label.includes('erwachsen')
  )
}

/** "X ₺'dan başlayan" göstergesi — bebek/çocuk indirimli fiyatı yanıltıcı olmasın diye
    her zaman yetişkin fiyatına göre; spesifik olarak yetişkin GİDİŞ-DÖNÜŞ fiyatı. */
export function adultFromFare(tiers: FerryAgeTier[]): number | null {
  if (!tiers.length) return null
  const adult =
    tiers.find(isAdultTier) ??
    tiers.reduce<FerryAgeTier | null>(
      (max, t) => (max == null || (t.minAge ?? 0) > (max.minAge ?? 0) ? t : max),
      null,
    )
  if (!adult) return cheapestFare(tiers)
  return adult.roundTripPrice
}

export function fareForTier(
  tier: FerryAgeTier,
  tripType: FerryTripType,
  direction: FerryDirection,
): number {
  if (tripType === 'oneway') {
    return direction === 'departure' ? tier.oneWayDeparturePrice : tier.oneWayReturnPrice
  }
  if (tripType === 'sameday') return tier.sameDayPrice ?? tier.roundTripPrice
  return tier.roundTripPrice
}
