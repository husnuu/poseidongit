import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { tourForAvailabilityQuery } from '@/lib/queries'
import { computeCapacityForDate, type TourCapacitySource } from '@/lib/availabilityCapacity'
import { authorizeAdmin } from '@/lib/adminAuthServer'
import { supabase } from '@/lib/supabase'
import { firstClassLocasFromRow, paxCountFromRow, BOOKING_STATUSES_COUNTING_TOWARD_CAPACITY, type SupabaseBookingRow } from '@/lib/bookingsSupabase'

function normalizeClassKey(classId: string): string {
  const k = (classId ?? '').toLowerCase().trim()
  if (k === 'eco' || k.startsWith('eco')) return 'eco'
  if (k === 'premium' || k.startsWith('prem')) return 'premium'
  if (k === 'first' || k.startsWith('first')) return 'first'
  return k || 'eco'
}

export const dynamic = 'force-dynamic'

const LOCA_REGEX = /^L(10|[1-9])$/

function collectFirstClassLocas(row: Partial<SupabaseBookingRow>): string[] {
  return firstClassLocasFromRow(row).filter((x) => LOCA_REGEX.test(x))
}

function canonicalTourId(id: string | null | undefined): string {
  return String(id ?? '').trim().replace(/^drafts\./, '')
}

export type DayOccupancy = {
  date: string
  capacity: number
  booked: number
  remaining: number
  percent: number
  byClass?: Record<string, { capacity: number; booked: number; remaining: number }>
  /** First Class: o gün dolu loca numaraları (L1–L10). */
  firstClassLocasBooked?: string[]
}

export async function GET(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
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
    const normalizedTourId = canonicalTourId(sanityTour._id ?? tourId)
    const acceptedTourIds = [...new Set([
      canonicalTourId(tourId),
      canonicalTourId(sanityTour._id),
      String(tourId ?? '').trim(),
      String(sanityTour._id ?? '').trim(),
      `drafts.${canonicalTourId(tourId)}`,
      `drafts.${canonicalTourId(sanityTour._id)}`,
    ].filter(Boolean))]
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

    const { data: monthRows, error: monthRowsError } = await supabase
      .from('bookings')
      .select('id,tour_id,date,status,class_id,adult_count,child_count,infant_count,first_class_locas,first_class_loca')
      .gte('date', startDate)
      .lte('date', endDate)
      .in('status', BOOKING_STATUSES_COUNTING_TOWARD_CAPACITY)
    if (monthRowsError) {
      throw new Error(`Supabase occupancy list failed: ${monthRowsError.message}`)
    }
    const monthList = ((monthRows ?? []) as SupabaseBookingRow[])

    const bookedByDateAndClass: Record<string, Record<string, number>> = {}
    const firstClassLocasByDate: Record<string, string[]> = {}
    for (const row of monthList) {
      try {
        const rowTourId = canonicalTourId(row.tour_id)
        if (!acceptedTourIds.includes(rowTourId) && !acceptedTourIds.includes(String(row.tour_id ?? '').trim())) continue
        const date = String(row.date ?? '').slice(0, 10)
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
        const classKey = normalizeClassKey(String(row.class_id ?? ''))
        const pax = paxCountFromRow(row)
        if (pax <= 0) continue
        if (!bookedByDateAndClass[date]) bookedByDateAndClass[date] = {}
        bookedByDateAndClass[date][classKey] = (bookedByDateAndClass[date][classKey] ?? 0) + pax
      } catch (err) {
        console.warn('occupancy: skip row', row.id, err)
      }
    }

    // First Class localar turdan bağımsız ortak havuzdur: tüm turlardan global topla.
    for (const row of monthList) {
      try {
        if (normalizeClassKey(String(row.class_id ?? '')) !== 'first') continue
        const date = String(row.date ?? '').slice(0, 10)
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
        const locas = collectFirstClassLocas(row)
        if (!firstClassLocasByDate[date]) firstClassLocasByDate[date] = []
        for (const loca of locas) {
          if (loca && !firstClassLocasByDate[date].includes(loca)) firstClassLocasByDate[date].push(loca)
        }
      } catch (err) {
        console.warn('occupancy first-class global: skip row', row.id, err)
      }
    }

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
      const firstClassLocasBooked = firstClassLocasByDate[dateStr]
        ? [...firstClassLocasByDate[dateStr]].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        : undefined

      days.push({
        date: dateStr,
        capacity: totalCapacity,
        booked: totalBooked,
        remaining,
        percent,
        byClass,
        ...(firstClassLocasBooked && firstClassLocasBooked.length > 0 && { firstClassLocasBooked }),
      })
    }

    return NextResponse.json({
      tourId: normalizedTourId,
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
