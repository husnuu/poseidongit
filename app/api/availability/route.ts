import { NextRequest, NextResponse } from 'next/server'
import { rateLimitResponse } from '@/lib/rateLimit'
import { client } from '@/lib/sanity'
import { tourForAvailabilityQuery } from '@/lib/queries'
import { computeCapacityForDate, type TourCapacitySource } from '@/lib/availabilityCapacity'
import type { Availability } from '@/types/availability'
import { supabase } from '@/lib/supabase'
import {
  BOOKING_STATUSES_COUNTING_TOWARD_CAPACITY,
  firstClassLocasFromRow,
  paxCountFromRow,
  type SupabaseBookingRow,
} from '@/lib/bookingsSupabase'

const TOTAL_FIRST_CLASS_LOCAS = 10
const FIRST_CLASS_CAPACITY_TOTAL = TOTAL_FIRST_CLASS_LOCAS * 2

function normalizeClassKey(classId: string): string {
  const k = classId.toLowerCase().trim()
  if (k === 'eco' || k.startsWith('eco')) return 'eco'
  if (k === 'premium' || k.startsWith('prem')) return 'premium'
  if (k === 'first' || k.startsWith('first')) return 'first'
  return k || 'eco'
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function canonicalTourId(id: string | null | undefined): string {
  return String(id ?? '').trim().replace(/^drafts\./, '')
}

function buildAcceptedTourIds(...ids: Array<string | null | undefined>): string[] {
  const out = new Set<string>()
  for (const raw of ids) {
    const original = String(raw ?? '').trim()
    const canonical = canonicalTourId(original)
    if (!canonical) continue
    out.add(canonical)
    out.add(`drafts.${canonical}`)
    if (original) out.add(original)
  }
  return [...out]
}

/** Response for legacy ?dates= (only used by date, no capacity). */
export type AvailabilityUsedResponse = {
  used: Record<string, Record<string, number>>
}

/**
 * GET /api/availability?tourId=xxx&date=YYYY-MM-DD
 *   → { date, tourId, classes: { [classId]: { capacity, booked, remaining } } }
 * GET /api/availability?tourId=xxx&dates=YYYY-MM-DD,...
 *   → { used: { [date]: { [classKey]: booked } } } (legacy, for calendar)
 * Optional: &tourSlug=yyy to resolve tour by slug.
 * No cache: rezervasyon sonrası güncel kontenjan görünsün.
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const limited = await rateLimitResponse(request, 'availability')
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const tourId = searchParams.get('tourId')?.trim()
    const dateParam = searchParams.get('date')?.trim()?.slice(0, 10)
    const datesParam = searchParams.get('dates')?.trim()
    const tourSlug = searchParams.get('tourSlug')?.trim()

    if (!tourId) {
      return NextResponse.json(
        { error: 'tourId gerekli' },
        { status: 400 }
      )
    }

    const datesArr = (datesParam ?? '')
      .split(',')
      .map((d) => d.trim().slice(0, 10))
      .filter((d) => DATE_REGEX.test(d))

    if (dateParam && DATE_REGEX.test(dateParam)) {
      return await handleSingleDate(tourId, dateParam, tourSlug ?? null)
    }
    if (datesArr.length > 0) {
      return await handleMultipleDates(tourId, datesArr, tourSlug ?? null)
    }

    return NextResponse.json(
      { error: 'date (YYYY-MM-DD) veya dates parametresi gerekli' },
      { status: 400 }
    )
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('GET /api/availability error:', err.message, err.stack)
    const isDev = process.env.NODE_ENV === 'development'
    const message = isDev
      ? `Hata: ${err.message}`
      : 'Sunucu hatası'
    return NextResponse.json(
      { error: message, ...(isDev && { _detail: err.stack }) },
      { status: 500 }
    )
  }
}

async function handleSingleDate(
  tourId: string,
  dateParam: string,
  tourSlug: string | null
): Promise<NextResponse<Availability | { error: string }>> {
  const sanityTour = await client.fetch<(TourCapacitySource & { _id?: string }) | null>(
      tourForAvailabilityQuery,
      { tourId }
    )
    if (!sanityTour) {
      return NextResponse.json(
        { error: 'Tur bulunamadı' },
        { status: 404 }
      )
    }
    const normalizedTourId = canonicalTourId(sanityTour._id ?? tourId)
    const acceptedTourIds = buildAcceptedTourIds(tourId, tourSlug, sanityTour._id, normalizedTourId)

    const capacityByClass = computeCapacityForDate(sanityTour, dateParam)
    const { data: snapshotRows, error: snapshotError } = await supabase
      .from('bookings')
      .select('id,tour_id,date,status,class_id,adult_count,child_count,infant_count')
      .in('tour_id', acceptedTourIds)
      .eq('date', dateParam)
      .in('status', BOOKING_STATUSES_COUNTING_TOWARD_CAPACITY)
    if (snapshotError) {
      throw new Error(`Supabase availability single-date query failed: ${snapshotError.message}`)
    }

    const { data: firstClassGlobalRows, error: firstClassGlobalError } = await supabase
      .from('bookings')
      .select('id,date,status,class_id,first_class_locas,first_class_loca')
      .eq('date', dateParam)
      .eq('class_id', 'first')
      .in('status', BOOKING_STATUSES_COUNTING_TOWARD_CAPACITY)
    if (firstClassGlobalError) {
      throw new Error(`Supabase availability first-class query failed: ${firstClassGlobalError.message}`)
    }

    const bookedByClass: Record<string, number> = {}
    const firstClassLocasReserved: string[] = []
    const locaRegex = /^L(10|[1-9])$/i

    for (const row of (snapshotRows ?? []) as SupabaseBookingRow[]) {
      try {
        const classKey = normalizeClassKey(String(row.class_id ?? ''))
        const pax = paxCountFromRow(row)
        if (pax <= 0) continue
        bookedByClass[classKey] = (bookedByClass[classKey] ?? 0) + pax
      } catch (err) {
        console.warn('availability: skip row', row.id, err)
      }
    }

    for (const row of (firstClassGlobalRows ?? []) as SupabaseBookingRow[]) {
      try {
        const fromArray = firstClassLocasFromRow(row)
          .map((x) => x.trim().toUpperCase())
          .filter((x) => locaRegex.test(x))
        for (const loca of fromArray) {
          if (loca && !firstClassLocasReserved.includes(loca)) firstClassLocasReserved.push(loca)
        }
      } catch (err) {
        console.warn('availability first-class global: skip row', row.id, err)
      }
    }

    const classKeysForResponse = ['eco', 'premium', 'first'] as const
    const classes: Availability['classes'] = {}
    for (const k of classKeysForResponse) {
      const capacity = capacityByClass[k] ?? 0
      const booked = bookedByClass[k] ?? 0
      classes[k] = {
        capacity,
        booked,
        remaining: Math.max(0, capacity - booked),
      }
    }
    const reservedLocaCount = firstClassLocasReserved.length
    const remainingFirstClassCapacity = Math.max(0, (TOTAL_FIRST_CLASS_LOCAS - reservedLocaCount) * 2)
    classes.first = {
      capacity: FIRST_CLASS_CAPACITY_TOTAL,
      booked: FIRST_CLASS_CAPACITY_TOTAL - remainingFirstClassCapacity,
      remaining: remainingFirstClassCapacity,
    }

    const body: Availability & { _debug?: { firestoreTourId: string; docsFound: number; bookedByClass: Record<string, number>; firstClassLocasReserved: string[] } } = {
      tourId: normalizedTourId,
      date: dateParam,
      classes,
      firstClassLocasReserved,
    }
    if (process.env.NODE_ENV === 'development') {
      body._debug = {
        firestoreTourId: normalizedTourId,
        docsFound: (snapshotRows ?? []).length,
        bookedByClass: { ...bookedByClass },
        firstClassLocasReserved: [...firstClassLocasReserved],
      }
    }

    return NextResponse.json(body, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
}

async function handleMultipleDates(
  tourId: string,
  datesArr: string[],
  tourSlug: string | null
): Promise<NextResponse<AvailabilityUsedResponse>> {
  const sanityTour = await client.fetch<(TourCapacitySource & { _id?: string }) | null>(
    tourForAvailabilityQuery,
    { tourId }
  )
  const normalizedTourId = canonicalTourId(sanityTour?._id ?? tourId)
  const idsToQuery = buildAcceptedTourIds(normalizedTourId, tourId, tourSlug, sanityTour?._id)
  const used: Record<string, Record<string, number>> = {}
  const datesSet = new Set(datesArr)

  const { data: rows, error: rowsError } = await supabase
    .from('bookings')
    .select('id,tour_id,date,status,class_id,adult_count,child_count,infant_count')
    .in('tour_id', idsToQuery)
    .in('date', datesArr)
    .in('status', BOOKING_STATUSES_COUNTING_TOWARD_CAPACITY)
  if (rowsError) {
    throw new Error(`Supabase availability multiple-dates query failed: ${rowsError.message}`)
  }

  for (const row of (rows ?? []) as SupabaseBookingRow[]) {
    try {
      const date = String(row.date ?? '').slice(0, 10)
      if (!date || !DATE_REGEX.test(date) || !datesSet.has(date)) continue
      const classKey = normalizeClassKey(String(row.class_id ?? ''))
      const pax = paxCountFromRow(row)
      if (pax <= 0) continue
      if (!used[date]) used[date] = {}
      used[date][classKey] = (used[date][classKey] ?? 0) + pax
    } catch (err) {
      console.warn('availability multiple dates: skip row', row.id, err)
    }
  }

  // First Class localar tüm turlar için ortaktır: aylık görünümde de global kullanımı yansıt.
  const { data: firstRows, error: firstRowsError } = await supabase
    .from('bookings')
    .select('id,date,status,class_id,first_class_locas,first_class_loca')
    .eq('class_id', 'first')
    .in('date', datesArr)
    .in('status', BOOKING_STATUSES_COUNTING_TOWARD_CAPACITY)
  if (firstRowsError) {
    throw new Error(`Supabase availability multiple-dates first-class query failed: ${firstRowsError.message}`)
  }
  const globalLocasByDate: Record<string, string[]> = {}
  const locaRegex = /^L(10|[1-9])$/
  for (const row of (firstRows ?? []) as SupabaseBookingRow[]) {
    try {
      const date = String(row.date ?? '').slice(0, 10)
      if (!date || !DATE_REGEX.test(date) || !datesSet.has(date)) continue
      if (!globalLocasByDate[date]) globalLocasByDate[date] = []
      const fromArray = firstClassLocasFromRow(row)
        .map((x) => x.trim().toUpperCase())
        .filter((x) => locaRegex.test(x))
      for (const loca of fromArray) {
        if (loca && !globalLocasByDate[date].includes(loca)) globalLocasByDate[date].push(loca)
      }
    } catch (err) {
      console.warn('availability multiple dates first-class global: skip row', row.id, err)
    }
  }
  for (const date of datesArr) {
    if (!used[date]) used[date] = {}
    const reservedLocaCount = globalLocasByDate[date]?.length ?? 0
    used[date].first = Math.max(0, FIRST_CLASS_CAPACITY_TOTAL - (TOTAL_FIRST_CLASS_LOCAS - reservedLocaCount) * 2)
  }

  return NextResponse.json(
    { used },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  )
}
