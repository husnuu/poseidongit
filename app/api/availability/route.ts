import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebaseAdmin'
import { client } from '@/lib/sanity'
import { tourForAvailabilityQuery } from '@/lib/queries'
import { computeCapacityForDate, type TourCapacitySource } from '@/lib/availabilityCapacity'
import type { Availability } from '@/types/availability'

const COLLECTION = 'bookings'
const TOTAL_FIRST_CLASS_LOCAS = 10
const FIRST_CLASS_CAPACITY_TOTAL = TOTAL_FIRST_CLASS_LOCAS * 2

/** Statuses that count as "booked" (Firestore "in" query max 10). */
const ACTIVE_STATUSES = ['pending', 'paid', 'confirmed']

function normalizeDate(raw: unknown): string {
  if (typeof raw === 'string') return raw.slice(0, 10)
  if (raw != null && typeof (raw as { toDate?: () => Date }).toDate === 'function')
    return (raw as { toDate: () => Date }).toDate().toISOString().slice(0, 10)
  return ''
}

function normalizeClassKey(classId: string): string {
  const k = classId.toLowerCase().trim()
  if (k === 'eco' || k.startsWith('eco')) return 'eco'
  if (k === 'premium' || k.startsWith('prem')) return 'premium'
  if (k === 'first' || k.startsWith('first')) return 'first'
  return k || 'eco'
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

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
      { tourId: tourSlug && tourSlug !== tourId ? tourSlug : tourId }
    )
    if (!sanityTour) {
      return NextResponse.json(
        { error: 'Tur bulunamadı' },
        { status: 404 }
      )
    }
    const firestoreTourId = sanityTour._id ?? tourId

    const capacityByClass = computeCapacityForDate(sanityTour, dateParam)
    const db = getFirestore()

    const snapshot = await db
      .collection(COLLECTION)
      .where('tourId', '==', firestoreTourId)
      .where('date', '==', dateParam)
      .where('status', 'in', ACTIVE_STATUSES)
      .get()

    const firstClassGlobalSnapshot = await db
      .collection(COLLECTION)
      .where('date', '==', dateParam)
      .where('classId', '==', 'first')
      .where('status', 'in', ACTIVE_STATUSES)
      .get()

    const bookedByClass: Record<string, number> = {}
    const firstClassLocasReserved: string[] = []
    const locaRegex = /^L(10|[1-9])$/

    for (const doc of snapshot.docs) {
      try {
        const d = doc.data()
        const classId = (d.classId as string) ?? ''
        const classKey = normalizeClassKey(classId)
        const rawCounts = d.counts ?? { adult: 0, child: 0, infant: 0 }
        const counts = rawCounts as Record<string, unknown>
        const adult = Math.max(0, Number(counts?.adult) || 0)
        const child = Math.max(0, Number(counts?.child) || 0)
        const infant = Math.max(0, Number(counts?.infant) || 0)
        const pax = adult + child + infant
        if (pax <= 0) continue
        bookedByClass[classKey] = (bookedByClass[classKey] ?? 0) + pax
      } catch (err) {
        console.warn('availability: skip doc', doc.id, err)
      }
    }

    for (const doc of firstClassGlobalSnapshot.docs) {
      try {
        const d = doc.data()
        const fromArray = Array.isArray(d.firstClassLocas)
          ? (d.firstClassLocas as string[])
              .map((x) => (typeof x === 'string' ? x.trim().toUpperCase() : ''))
              .filter((x) => locaRegex.test(x))
          : []
        for (const loca of fromArray) {
          if (loca && !firstClassLocasReserved.includes(loca)) firstClassLocasReserved.push(loca)
        }
        if (fromArray.length === 0) {
          const raw = typeof d.firstClassLoca === 'string' ? d.firstClassLoca.trim() : ''
          const loca = raw ? raw.toUpperCase() : ''
          if (loca && locaRegex.test(loca) && !firstClassLocasReserved.includes(loca)) {
            firstClassLocasReserved.push(loca)
          }
        }
      } catch (err) {
        console.warn('availability first-class global: skip doc', doc.id, err)
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
      tourId: firestoreTourId,
      date: dateParam,
      classes,
      firstClassLocasReserved,
    }
    if (process.env.NODE_ENV === 'development') {
      body._debug = {
        firestoreTourId,
        docsFound: snapshot.size,
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
    { tourId: tourSlug && tourSlug !== tourId ? tourSlug : tourId }
  )
  const firestoreTourId = sanityTour?._id ?? tourId
  const idsToQuery = [firestoreTourId]
  if (tourId !== firestoreTourId) idsToQuery.push(tourId)
  if (tourSlug && tourSlug !== tourId && tourSlug !== firestoreTourId) idsToQuery.push(tourSlug)

  const db = getFirestore()
  const used: Record<string, Record<string, number>> = {}
  const datesSet = new Set(datesArr)

  for (const id of idsToQuery) {
    const snapshot = await db
      .collection(COLLECTION)
      .where('tourId', '==', id)
      .get()

    for (const doc of snapshot.docs) {
      try {
        const d = doc.data()
        const status = d.status as string | undefined
        if (!ACTIVE_STATUSES.includes(status as (typeof ACTIVE_STATUSES)[number])) continue
        const date = normalizeDate(d.date)
        if (!date || !DATE_REGEX.test(date) || !datesSet.has(date)) continue
        const classId = (d.classId as string) ?? ''
        const rawCounts = d.counts ?? { adult: 0, child: 0, infant: 0 }
        const counts = rawCounts as Record<string, unknown>
        const pax = Math.max(0, Number(counts?.adult) || 0) + Math.max(0, Number(counts?.child) || 0) + Math.max(0, Number(counts?.infant) || 0)
        if (pax <= 0) continue
        const classKey = normalizeClassKey(classId)
        if (!used[date]) used[date] = {}
        used[date][classKey] = (used[date][classKey] ?? 0) + pax
      } catch (err) {
        console.warn('availability multiple dates: skip doc', doc.id, err)
      }
    }
  }

  // First Class localar tüm turlar için ortaktır: aylık görünümde de global kullanımı yansıt.
  const firstClassGlobalSnapshot = await db
    .collection(COLLECTION)
    .where('classId', '==', 'first')
    .where('status', 'in', ACTIVE_STATUSES)
    .get()
  const globalLocasByDate: Record<string, string[]> = {}
  const locaRegex = /^L(10|[1-9])$/
  for (const doc of firstClassGlobalSnapshot.docs) {
    try {
      const d = doc.data()
      const date = normalizeDate(d.date)
      if (!date || !DATE_REGEX.test(date) || !datesSet.has(date)) continue
      if (!globalLocasByDate[date]) globalLocasByDate[date] = []
      const fromArray = Array.isArray(d.firstClassLocas)
        ? (d.firstClassLocas as string[])
            .map((x) => (typeof x === 'string' ? x.trim().toUpperCase() : ''))
            .filter((x) => locaRegex.test(x))
        : []
      for (const loca of fromArray) {
        if (loca && !globalLocasByDate[date].includes(loca)) globalLocasByDate[date].push(loca)
      }
      if (fromArray.length === 0) {
        const raw = typeof d.firstClassLoca === 'string' ? d.firstClassLoca.trim() : ''
        const loca = raw ? raw.toUpperCase() : ''
        if (loca && locaRegex.test(loca) && !globalLocasByDate[date].includes(loca)) {
          globalLocasByDate[date].push(loca)
        }
      }
    } catch (err) {
      console.warn('availability multiple dates first-class global: skip doc', doc.id, err)
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
