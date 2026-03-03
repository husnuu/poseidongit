import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebaseAdmin'
import { client } from '@/lib/sanity'
import { tourForAvailabilityQuery } from '@/lib/queries'
import { computeCapacityForDate, type TourCapacitySource } from '@/lib/availabilityCapacity'
import type { Availability } from '@/types/availability'

const COLLECTION = 'bookings'

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

    const bookedByClass: Record<string, number> = {}
    snapshot.docs.forEach((doc) => {
      const d = doc.data()
      const classId = (d.classId as string) ?? ''
      const classKey = normalizeClassKey(classId)
      const counts = (d.counts ?? { adult: 0, child: 0, infant: 0 }) as {
        adult?: number
        child?: number
        infant?: number
      }
      const pax = (counts.adult ?? 0) + (counts.child ?? 0) + (counts.infant ?? 0)
      if (pax <= 0) return
      bookedByClass[classKey] = (bookedByClass[classKey] ?? 0) + pax
    })

    const classes: Availability['classes'] = {}
    const allClassKeys = new Set([...Object.keys(capacityByClass), ...Object.keys(bookedByClass)])
    if (allClassKeys.size === 0) {
      for (const k of ['eco', 'premium', 'first']) {
        const capacity = capacityByClass[k] ?? 0
        const booked = bookedByClass[k] ?? 0
        classes[k] = {
          capacity,
          booked,
          remaining: Math.max(0, capacity - booked),
        }
      }
    } else {
      for (const classKey of allClassKeys) {
        const capacity = capacityByClass[classKey] ?? 0
        const booked = bookedByClass[classKey] ?? 0
        classes[classKey] = {
          capacity,
          booked,
          remaining: Math.max(0, capacity - booked),
        }
      }
    }

    const body: Availability & { _debug?: { firestoreTourId: string; docsFound: number; bookedByClass: Record<string, number> } } = {
      tourId: firestoreTourId,
      date: dateParam,
      classes,
    }
    if (process.env.NODE_ENV === 'development') {
      body._debug = {
        firestoreTourId,
        docsFound: snapshot.size,
        bookedByClass: { ...bookedByClass },
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

    snapshot.docs.forEach((doc) => {
      const d = doc.data()
      const status = d.status as string | undefined
      if (!ACTIVE_STATUSES.includes(status as (typeof ACTIVE_STATUSES)[number])) return
      const date = normalizeDate(d.date)
      if (!date || !DATE_REGEX.test(date) || !datesSet.has(date)) return
      const classId = (d.classId as string) ?? ''
      const counts = (d.counts ?? { adult: 0, child: 0, infant: 0 }) as {
        adult?: number
        child?: number
        infant?: number
      }
      const pax = (counts.adult ?? 0) + (counts.child ?? 0) + (counts.infant ?? 0)
      if (pax <= 0) return
      const classKey = normalizeClassKey(classId)
      if (!used[date]) used[date] = {}
      used[date][classKey] = (used[date][classKey] ?? 0) + pax
    })
  }

  return NextResponse.json(
    { used },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  )
}
