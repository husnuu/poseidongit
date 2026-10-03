/**
 * GET /api/availability/tour-calendar?tourId=xxx&month=YYYY-MM&classId=eco
 * Rezervasyon onay sayfasında "Tarihi Değiştir" için genel (First Class'a özel
 * olmayan) aylık takvim verisi — her gün için seçilen sınıfın müsaitliği.
 * /api/availability/calendar (sadece First Class) ile karıştırılmamalı.
 */
import { NextRequest, NextResponse } from 'next/server'
import { rateLimitResponse } from '@/lib/rateLimit'
import { client } from '@/lib/sanity'
import { computeBookableCapacityForDate, type TourCapacitySource } from '@/lib/availabilityCapacity'
import { isDateAvailable } from '@/lib/sanity/bookingPricing'
import type { AvailabilityConfig } from '@/lib/sanity/bookingTypes'
import { supabase } from '@/lib/supabase'
import { BOOKING_STATUSES_COUNTING_TOWARD_CAPACITY, paxCountFromRow, type SupabaseBookingRow } from '@/lib/bookingsSupabase'

export type TourCalendarDay = {
  date: string
  /** Takvim/sezon kuralına göre tur bu gün çalışıyor mu. */
  scheduleOpen: boolean
  /** Seçilen sınıf için kalan kişi kontenjanı. */
  remaining: number
  /** scheduleOpen && remaining > 0 */
  available: boolean
}

type TourRow = TourCapacitySource & { _id?: string; availability?: AvailabilityConfig | null }

const tourForGeneralCalendarQuery = `*[_type == "tour" && (
  _id == $tourId ||
  slug.current == $tourId ||
  translations.en.slug.current == $tourId ||
  translations.de.slug.current == $tourId
)][0]{
  _id,
  baseCapacity{ ecoCapacity, premiumCapacity, firstCapacity },
  availabilityOverrides[]{ date, eco, premium, first },
  availability{
    enabled,
    defaultAvailable,
    dateRanges[]{ start, end, available },
    specificDates[]{ date, enabled, defaultAvailable, available }
  }
}`

function normalizeClassKey(classId: string): 'eco' | 'premium' | 'first' {
  const k = classId.toLowerCase().trim()
  if (k === 'premium' || k.startsWith('prem')) return 'premium'
  if (k === 'first') return 'first'
  return 'eco'
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const limited = await rateLimitResponse(request, 'availability')
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const tourId = searchParams.get('tourId')?.trim()
    const monthParam = searchParams.get('month')?.trim()
    const classId = normalizeClassKey(searchParams.get('classId') ?? 'eco')
    const excludeBookingId = searchParams.get('excludeBookingId')?.trim() || ''

    if (!tourId || !monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
      return NextResponse.json({ error: 'tourId ve month (YYYY-MM) gerekli' }, { status: 400 })
    }

    const [year, month] = monthParam.split('-').map(Number)
    const daysInMonth = new Date(year, month, 0).getDate()

    const tour = await client.fetch<TourRow | null>(tourForGeneralCalendarQuery, { tourId })
    if (!tour) {
      return NextResponse.json({ error: 'Tur bulunamadı' }, { status: 404 })
    }
    const normalizedTourId = (tour._id ?? tourId).replace(/^drafts\./, '')

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

    const { data: rows, error: rowsError } = await supabase
      .from('bookings')
      .select('id,date,status,class_id,adult_count,child_count,infant_count,tour_id')
      .in('tour_id', [normalizedTourId, `drafts.${normalizedTourId}`, tourId])
      .gte('date', startDate)
      .lte('date', endDate)
      .in('status', BOOKING_STATUSES_COUNTING_TOWARD_CAPACITY)
    if (rowsError) {
      throw new Error(`Supabase tour-calendar query failed: ${rowsError.message}`)
    }

    const bookedByDate: Record<string, number> = {}
    for (const row of (rows ?? []) as SupabaseBookingRow[]) {
      if (excludeBookingId && row.id === excludeBookingId) continue
      if (normalizeClassKey(String(row.class_id ?? '')) !== classId) continue
      const date = String(row.date ?? '').slice(0, 10)
      if (!date) continue
      const pax = paxCountFromRow(row)
      if (pax > 0) bookedByDate[date] = (bookedByDate[date] ?? 0) + pax
    }

    const days: TourCalendarDay[] = []
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const scheduleOpen = isDateAvailable({ availability: tour.availability ?? undefined }, dateStr)
      const capacity = computeBookableCapacityForDate(tour, dateStr)[classId] ?? 0
      const booked = bookedByDate[dateStr] ?? 0
      const remaining = Math.max(0, capacity - booked)
      days.push({ date: dateStr, scheduleOpen, remaining, available: scheduleOpen && remaining > 0 })
    }

    return NextResponse.json(
      { tourId: normalizedTourId, month: monthParam, classId, days },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (e) {
    console.error('[availability/tour-calendar]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
