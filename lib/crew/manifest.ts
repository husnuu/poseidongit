/**
 * Ekip uygulaması (/ekip) — bugünün seferleri ve yolcu manifestosu.
 * "Tekne" ayrı bir varlık olarak modellenmediği için her tur+tarih+saat kombinasyonu
 * kendi seferi (trip) olarak ele alınır; tur adı aynı zamanda tekne/sefer adı gibi gösterilir.
 */
import { supabase } from '@/lib/supabase'
import { normalizeMealPreferenceColumn, type SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { normalizeAdditionalTravelersFromStorage } from '@/lib/bookingAdditionalTravelers'

const ACTIVE_STATUSES = ['paid', 'confirmed']

export interface CrewTripSummary {
  tripKey: string
  tourId: string
  tourTitle: string
  date: string
  time: string | null
  bookingsCount: number
  guestsTotal: number
  boardedCount: number
  departed: boolean
}

export interface CrewManifestGuest {
  name: string
  mealLabel?: string
}

export interface CrewManifestBooking {
  bookingId: string
  reference: string
  guestCount: number
  boarded: boolean
  noShow: boolean
  guests: CrewManifestGuest[]
}

export interface CrewManifest {
  tripKey: string
  tourId: string
  tourTitle: string
  date: string
  time: string | null
  bookingsCount: number
  guestsTotal: number
  boardedCount: number
  noShowCount: number
  mealCounts: { label: string; count: number }[]
  bookings: CrewManifestBooking[]
}

export function buildTripKey(tourId: string, date: string, time: string | null): string {
  return `${tourId}__${date}__${time ?? ''}`
}

export function parseTripKey(tripKey: string): { tourId: string; date: string; time: string | null } {
  const [tourId, date, time] = tripKey.split('__')
  return { tourId: tourId ?? '', date: date ?? '', time: time || null }
}

function tripDateTime(date: string, time: string | null): Date | null {
  if (!date) return null
  const t = time?.trim() || '00:00'
  const d = new Date(`${date}T${t.length === 5 ? `${t}:00` : t}`)
  return Number.isNaN(d.getTime()) ? null : d
}

function guestsForRow(row: Pick<SupabaseBookingRow, 'adult_count' | 'child_count' | 'infant_count'>): number {
  return Number(row.adult_count ?? 0) + Number(row.child_count ?? 0) + Number(row.infant_count ?? 0)
}

type TripRow = Pick<
  SupabaseBookingRow,
  'tour_id' | 'tour_title' | 'date' | 'time' | 'adult_count' | 'child_count' | 'infant_count' | 'checked_in_at' | 'status'
>

export async function getTripsForDate(dateStr: string): Promise<CrewTripSummary[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('tour_id, tour_title, date, time, adult_count, child_count, infant_count, checked_in_at, status')
    .eq('date', dateStr)
    .in('status', ACTIVE_STATUSES)

  if (error || !data) return []

  const rows = data as TripRow[]
  const byTrip = new Map<string, CrewTripSummary>()

  for (const row of rows) {
    const tourId = String(row.tour_id ?? '').trim()
    if (!tourId) continue
    const time = row.time != null ? String(row.time).trim() || null : null
    const key = buildTripKey(tourId, dateStr, time)
    const guests = guestsForRow(row)
    const boarded = row.checked_in_at != null

    const existing = byTrip.get(key)
    if (existing) {
      existing.bookingsCount += 1
      existing.guestsTotal += guests
      if (boarded) existing.boardedCount += guests
    } else {
      byTrip.set(key, {
        tripKey: key,
        tourId,
        tourTitle: String(row.tour_title ?? '—'),
        date: dateStr,
        time,
        bookingsCount: 1,
        guestsTotal: guests,
        boardedCount: boarded ? guests : 0,
        departed: false,
      })
    }
  }

  const now = Date.now()
  const trips = Array.from(byTrip.values()).map((t) => {
    const dt = tripDateTime(t.date, t.time)
    return { ...t, departed: dt != null && dt.getTime() <= now }
  })

  trips.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
  return trips
}

export async function getManifestForTrip(
  tourId: string,
  dateStr: string,
  time: string | null
): Promise<CrewManifest | null> {
  let query = supabase
    .from('bookings')
    .select('*')
    .eq('tour_id', tourId)
    .eq('date', dateStr)
    .in('status', ACTIVE_STATUSES)

  query = time ? query.eq('time', time) : query.is('time', null)

  const { data, error } = await query
  if (error || !data) return null

  const rows = data as SupabaseBookingRow[]
  if (rows.length === 0) return null

  const dt = tripDateTime(dateStr, time)
  const departed = dt != null && dt.getTime() <= Date.now()

  const mealTally = new Map<string, number>()
  const bookings: CrewManifestBooking[] = []
  let guestsTotal = 0
  let boardedCount = 0
  let noShowCount = 0

  for (const row of rows) {
    const guestCount = guestsForRow(row)
    guestsTotal += guestCount
    const boarded = row.checked_in_at != null
    if (boarded) boardedCount += guestCount
    const noShow = !boarded && departed
    if (noShow) noShowCount += 1

    const mealPreference = normalizeMealPreferenceColumn(row.meal_preference)
    const additionalTravelers = normalizeAdditionalTravelersFromStorage(row.additional_travelers)
    const primaryName =
      [row.customer_first_name, row.customer_last_name].filter(Boolean).join(' ').trim() || '—'

    const guests: CrewManifestGuest[] = [{ name: primaryName, mealLabel: mealPreference?.label }]
    for (const t of additionalTravelers) {
      guests.push({
        name: [t.firstName, t.lastName].filter(Boolean).join(' ').trim() || '—',
        mealLabel: t.mealPreference?.label,
      })
    }
    for (const g of guests) {
      if (g.mealLabel) mealTally.set(g.mealLabel, (mealTally.get(g.mealLabel) ?? 0) + 1)
    }
    // Bebekler misafir listesinde ayrı satır olarak tutulmuyor; sayıya dahil ama isimsiz.
    const infantCount = Number(row.infant_count ?? 0)

    bookings.push({
      bookingId: row.id,
      reference: (typeof row.reference === 'string' && row.reference.trim()) || row.id.slice(0, 8).toUpperCase(),
      guestCount,
      boarded,
      noShow,
      guests,
    })
    void infantCount
  }

  bookings.sort((a, b) => a.reference.localeCompare(b.reference))

  return {
    tripKey: buildTripKey(tourId, dateStr, time),
    tourId,
    tourTitle: String(rows[0].tour_title ?? '—'),
    date: dateStr,
    time,
    bookingsCount: bookings.length,
    guestsTotal,
    boardedCount,
    noShowCount,
    mealCounts: Array.from(mealTally.entries()).map(([label, count]) => ({ label, count })),
    bookings,
  }
}
