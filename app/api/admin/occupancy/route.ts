import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebaseAdmin'
import { client } from '@/lib/sanity'
import { tourForAvailabilityQuery } from '@/lib/queries'
import { computeCapacityForDate, type TourCapacitySource } from '@/lib/availabilityCapacity'
import { getAuthToken, getAdminEmail, requireAdmin } from '@/lib/adminAuth'

/**
 * Doluluk mantığı: Sanity’de her tur için sınıf kapasiteleri (eco/premium/first) var;
 * Firebase’den o tura ait rezervasyonları alıyoruz. Gün/sınıf bazında: capacity (Sanity) - booked (Firebase) = kalan.
 */
const COLLECTION = 'bookings'
const ACTIVE_STATUSES = ['pending', 'paid', 'confirmed']

function normalizeClassKey(classId: string): string {
  const k = (classId ?? '').toLowerCase().trim()
  if (k === 'eco' || k.startsWith('eco')) return 'eco'
  if (k === 'premium' || k.startsWith('prem')) return 'premium'
  if (k === 'first' || k.startsWith('first')) return 'first'
  return k || 'eco'
}

export const dynamic = 'force-dynamic'

export type DayOccupancy = {
  date: string
  capacity: number
  booked: number
  remaining: number
  percent: number
  byClass?: Record<string, { capacity: number; booked: number; remaining: number }>
}

export async function GET(request: NextRequest) {
  const token = getAuthToken(request)
  const email = getAdminEmail(request)
  if (!requireAdmin(token, email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const tourId = searchParams.get('tourId')?.trim()
    const classFilter = searchParams.get('classId')?.trim()?.toLowerCase() || 'all'
    const monthParam = searchParams.get('month')?.trim()

    if (!tourId) {
      return NextResponse.json({ error: 'tourId gerekli' }, { status: 400 })
    }

    const now = new Date()
    const year = monthParam ? parseInt(monthParam.slice(0, 4), 10) : now.getFullYear()
    const month = monthParam ? parseInt(monthParam.slice(5, 7), 10) : now.getMonth() + 1
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()

    let sanityTour = await client.fetch<(TourCapacitySource & { _id?: string }) | null>(
      tourForAvailabilityQuery,
      { tourId }
    )
    if (!sanityTour && tourId && !tourId.startsWith('drafts.')) {
      sanityTour = await client.fetch<(TourCapacitySource & { _id?: string }) | null>(
        tourForAvailabilityQuery,
        { tourId: `drafts.${tourId}` }
      )
    }
    if (!sanityTour) {
      return NextResponse.json({
        days: [],
        message: 'Tur bulunamadı. Sanity\'de bu turun yayında olduğundan ve baseCapacity (eco/premium/first) tanımlı olduğundan emin olun.',
      })
    }
    const firestoreTourId = sanityTour._id?.replace(/^drafts\./, '') ?? tourId?.replace(/^drafts\./, '') ?? tourId

    const db = getFirestore()
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

    const snapshot = await db
      .collection(COLLECTION)
      .where('tourId', '==', firestoreTourId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get()

    const bookedByDateAndClass: Record<string, Record<string, number>> = {}
    snapshot.docs.forEach((doc) => {
      const d = doc.data()
      const status = d.status as string
      if (!ACTIVE_STATUSES.includes(status)) return
      const date = (d.date as string)?.slice(0, 10)
      if (!date) return
      const classKey = normalizeClassKey((d.classId as string) ?? '')
      const counts = (d.counts ?? { adult: 0, child: 0, infant: 0 }) as {
        adult?: number
        child?: number
        infant?: number
      }
      const pax = (counts.adult ?? 0) + (counts.child ?? 0) + (counts.infant ?? 0)
      if (pax <= 0) return
      if (!bookedByDateAndClass[date]) bookedByDateAndClass[date] = {}
      bookedByDateAndClass[date][classKey] = (bookedByDateAndClass[date][classKey] ?? 0) + pax
    })

    const days: DayOccupancy[] = []
    const classKeys = ['eco', 'premium', 'first']

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const capacityByClass = computeCapacityForDate(sanityTour, dateStr)
      const bookedByClass = bookedByDateAndClass[dateStr] ?? {}

      let totalCapacity = 0
      let totalBooked = 0
      const byClass: Record<string, { capacity: number; booked: number; remaining: number }> = {}

      for (const k of classKeys) {
        const cap = capacityByClass[k] ?? 0
        const booked = bookedByClass[k] ?? 0
        totalCapacity += cap
        totalBooked += booked
        byClass[k] = {
          capacity: cap,
          booked,
          remaining: Math.max(0, cap - booked),
        }
      }

      if (classFilter !== 'all' && classFilter !== '') {
        const k = normalizeClassKey(classFilter)
        const single = byClass[k] ?? { capacity: 0, booked: 0, remaining: 0 }
        totalCapacity = single.capacity
        totalBooked = single.booked
      }

      const remaining = Math.max(0, totalCapacity - totalBooked)
      const percent = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0

      days.push({
        date: dateStr,
        capacity: totalCapacity,
        booked: totalBooked,
        remaining,
        percent,
        byClass,
      })
    }

    return NextResponse.json({
      tourId: firestoreTourId,
      month: `${year}-${String(month).padStart(2, '0')}`,
      classFilter: classFilter === 'all' ? null : classFilter,
      days,
    })
  } catch (e) {
    console.error('GET /api/admin/occupancy error:', e)
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: 'Sunucu hatası.', detail: message }, { status: 500 })
  }
}
