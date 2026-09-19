/**
 * Adminlere her sabah gönderilen günlük yolcu listesi raporu.
 * O gün için aktif (paid/confirmed) rezervasyonları sefer (tur+saat) bazında gruplar;
 * sınıf bazlı doluluk (Sanity kapasitesi), yolcu listesi, yemek tercihleri,
 * müşteri notu ve seçilen ekstraları içerir.
 */
import { client } from '@/lib/sanity'
import { supabase } from '@/lib/supabase'
import { computeCapacityForDate, type TourCapacitySource } from '@/lib/availabilityCapacity'
import {
  normalizeMealPreferenceColumn,
  paxCountFromRow,
  selectedExtrasFromRow,
  BOOKING_STATUSES_COUNTING_TOWARD_CAPACITY,
  type SupabaseBookingRow,
} from '@/lib/bookingsSupabase'
import { normalizeAdditionalTravelersFromStorage } from '@/lib/bookingAdditionalTravelers'
import { buildTripKey } from '@/lib/crew/manifest'

const tourReportMetaQuery = `*[_type == "tour" && (_id == $id || slug.current == $id)][0]{
  title,
  baseCapacity{ ecoCapacity, premiumCapacity, firstCapacity },
  availabilityOverrides[]{ date, eco, premium, first, note }
}`

function normalizeClassKey(classId: string): 'eco' | 'premium' | 'first' {
  const k = (classId ?? '').toLowerCase().trim()
  if (k === 'premium' || k.startsWith('prem')) return 'premium'
  if (k === 'first' || k.startsWith('first')) return 'first'
  return 'eco'
}

export interface DailyManifestPassenger {
  name: string
  mealLabel?: string
}

export interface DailyManifestExtra {
  title: string
  quantity: number
}

export interface DailyManifestBooking {
  reference: string
  className: string
  guestCount: number
  passengers: DailyManifestPassenger[]
  customerNote?: string
  extras: DailyManifestExtra[]
}

export interface DailyManifestTrip {
  tourId: string
  tourTitle: string
  time: string | null
  totalCapacity: number
  totalBooked: number
  byClass: Record<'eco' | 'premium' | 'first', { capacity: number; booked: number }>
  bookings: DailyManifestBooking[]
}

export interface DailyManifestReport {
  date: string
  trips: DailyManifestTrip[]
}

export async function getDailyManifestReport(dateStr: string): Promise<DailyManifestReport> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('date', dateStr)
    .in('status', BOOKING_STATUSES_COUNTING_TOWARD_CAPACITY)
  if (error || !data) return { date: dateStr, trips: [] }

  const rows = data as SupabaseBookingRow[]
  if (rows.length === 0) return { date: dateStr, trips: [] }

  const byTrip = new Map<string, SupabaseBookingRow[]>()
  for (const row of rows) {
    const tourId = String(row.tour_id ?? '').trim()
    if (!tourId) continue
    const time = row.time != null ? String(row.time).trim() || null : null
    const key = buildTripKey(tourId, dateStr, time)
    const arr = byTrip.get(key)
    if (arr) arr.push(row)
    else byTrip.set(key, [row])
  }

  const uniqueTourIds = Array.from(new Set(rows.map((r) => String(r.tour_id ?? '').trim()).filter(Boolean)))
  const tourMetas = await Promise.all(
    uniqueTourIds.map((id) =>
      client
        .fetch<{ title?: string | null } & TourCapacitySource>(tourReportMetaQuery, { id })
        .catch(() => null)
    )
  )
  const metaByTourId = new Map(uniqueTourIds.map((id, i) => [id, tourMetas[i]]))

  const trips: DailyManifestTrip[] = []
  for (const [tripKey, tripRows] of byTrip.entries()) {
    const first = tripRows[0]
    const tourId = String(first.tour_id ?? '').trim()
    const time = first.time != null ? String(first.time).trim() || null : null
    const meta = metaByTourId.get(tourId)
    const capacityByClass = computeCapacityForDate(meta ?? null, dateStr)

    const byClass: DailyManifestTrip['byClass'] = {
      eco: { capacity: capacityByClass.eco ?? 0, booked: 0 },
      premium: { capacity: capacityByClass.premium ?? 0, booked: 0 },
      first: { capacity: capacityByClass.first ?? 0, booked: 0 },
    }

    const bookings: DailyManifestBooking[] = []
    let totalBooked = 0

    for (const row of tripRows) {
      const guestCount = paxCountFromRow(row)
      totalBooked += guestCount
      const classKey = normalizeClassKey(String(row.class_id ?? ''))
      byClass[classKey].booked += guestCount

      const mealPreference = normalizeMealPreferenceColumn(row.meal_preference)
      const additionalTravelers = normalizeAdditionalTravelersFromStorage(row.additional_travelers)
      const primaryName = [row.customer_first_name, row.customer_last_name].filter(Boolean).join(' ').trim() || '—'
      const passengers: DailyManifestPassenger[] = [{ name: primaryName, mealLabel: mealPreference?.label }]
      for (const t of additionalTravelers) {
        passengers.push({
          name: [t.firstName, t.lastName].filter(Boolean).join(' ').trim() || '—',
          mealLabel: t.mealPreference?.label,
        })
      }

      const extras: DailyManifestExtra[] = selectedExtrasFromRow(row).map((e) => ({
        title: e.title,
        quantity: e.quantity,
      }))

      bookings.push({
        reference: (typeof row.reference === 'string' && row.reference.trim()) || row.id.slice(0, 8).toUpperCase(),
        className: String(row.class_name ?? '').trim() || '—',
        guestCount,
        passengers,
        ...(row.customer_note?.trim() && { customerNote: row.customer_note.trim() }),
        extras,
      })
    }

    bookings.sort((a, b) => a.reference.localeCompare(b.reference))

    trips.push({
      tourId,
      tourTitle: meta?.title?.trim() || String(first.tour_title ?? '—'),
      time,
      totalCapacity: byClass.eco.capacity + byClass.premium.capacity + byClass.first.capacity,
      totalBooked,
      byClass,
      bookings,
    })

    void tripKey
  }

  trips.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '') || a.tourTitle.localeCompare(b.tourTitle))

  return { date: dateStr, trips }
}
