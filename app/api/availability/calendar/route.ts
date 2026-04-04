/**
 * GET /api/availability/calendar?tourId=xxx&month=YYYY-MM
 * Rezervasyonumu Yönet sayfasında First Class müşteriler için takvim verisi.
 * Her gün için first class kapasite, dolu, kalan ve dolu loca listesi döner.
 */
import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { tourForAvailabilityQuery } from '@/lib/queries'
import type { TourCapacitySource } from '@/lib/availabilityCapacity'
import { supabase } from '@/lib/supabase'
import { firstClassLocasFromRow, paxCountFromRow, type SupabaseBookingRow } from '@/lib/bookingsSupabase'

const ACTIVE_STATUSES = ['pending', 'paid', 'confirmed']
const LOCA_REGEX = /^L(10|[1-9])$/
/** First Class: tüm turlar ortak L1–L10 havuzu (availability API ile aynı mantık). */
const TOTAL_FIRST_CLASS_LOCAS = 10
const FIRST_CLASS_CAPACITY_TOTAL = TOTAL_FIRST_CLASS_LOCAS * 2

function collectFirstClassLocas(row: Partial<SupabaseBookingRow>): string[] {
  return firstClassLocasFromRow(row).filter((x) => LOCA_REGEX.test(x))
}

export type CalendarDayAvailability = {
  date: string
  firstCapacity: number
  firstBooked: number
  /** Kalan kişi kontenjanı (First Class toplam 20). */
  firstRemaining: number
  /** Müsait loca adedi (L1–L10; excludeBookingId ile sizinkiler düşülür). */
  firstRemainingLocas: number
  /** Dolu loca kabini sayısı (benzersiz L*). */
  firstBookedLocaCount: number
  firstClassLocasReserved: string[]
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tourId = searchParams.get('tourId')?.trim()
    const monthParam = searchParams.get('month')?.trim()
    /** Rezervasyonumu yönet: kendi loca’ları “dolu” sayılmasın (loca değiştirirken). */
    const excludeBookingId = searchParams.get('excludeBookingId')?.trim() || ''

    if (!tourId || !monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
      return NextResponse.json(
        { error: 'tourId ve month (YYYY-MM) gerekli' },
        { status: 400 }
      )
    }

    const [year, month] = monthParam.split('-').map(Number)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()

    const sanityTour = await client.fetch<(TourCapacitySource & { _id?: string }) | null>(
      tourForAvailabilityQuery,
      { tourId }
    )
    if (!sanityTour) {
      return NextResponse.json({ error: 'Tur bulunamadı' }, { status: 404 })
    }

    const normalizedTourId = (sanityTour._id ?? tourId).replace(/^drafts\./, '')
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

    const { data: globalFirstRows, error: globalFirstError } = await supabase
      .from('bookings')
      .select('id,date,status,class_id,adult_count,child_count,infant_count,first_class_locas,first_class_loca')
      .eq('class_id', 'first')
      .gte('date', startDate)
      .lte('date', endDate)
      .in('status', ACTIVE_STATUSES)
    if (globalFirstError) {
      throw new Error(`Supabase availability calendar query failed: ${globalFirstError.message}`)
    }
    const firstRows = ((globalFirstRows ?? []) as SupabaseBookingRow[])

    const firstLocasByDate: Record<string, string[]> = {}
    const firstPaxByDate: Record<string, number> = {}

    for (const row of firstRows) {
      const date = String(row.date ?? '').slice(0, 10)
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
      const pax = paxCountFromRow(row)
      if (pax > 0) {
        firstPaxByDate[date] = (firstPaxByDate[date] ?? 0) + pax
      }
      const locas = collectFirstClassLocas(row)
      if (!firstLocasByDate[date]) firstLocasByDate[date] = []
      const skipLocas = excludeBookingId !== '' && row.id === excludeBookingId
      if (!skipLocas) {
        for (const loca of locas) {
          if (loca && !firstLocasByDate[date].includes(loca)) firstLocasByDate[date].push(loca)
        }
      }
    }

    const days: CalendarDayAvailability[] = []
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const firstClassLocasReserved = (firstLocasByDate[dateStr] ?? []).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      )
      const reservedLocaCount = firstClassLocasReserved.length
      const firstRemainingLocas = Math.max(0, TOTAL_FIRST_CLASS_LOCAS - reservedLocaCount)
      const firstBookedLocaCount = reservedLocaCount
      const remainingByLocas = Math.max(0, firstRemainingLocas * 2)
      const remainingByPax = Math.max(0, FIRST_CLASS_CAPACITY_TOTAL - (firstPaxByDate[dateStr] ?? 0))
      /** Kişi sayısı ve dolu loca listesi birlikte; daha sıkı olanı kullan (tüm turlar dahil). */
      const firstRemaining = Math.min(remainingByLocas, remainingByPax)
      const firstCapacity = FIRST_CLASS_CAPACITY_TOTAL
      const firstBooked = firstCapacity - firstRemaining
      days.push({
        date: dateStr,
        firstCapacity,
        firstBooked,
        firstRemaining,
        firstRemainingLocas,
        firstBookedLocaCount,
        firstClassLocasReserved,
      })
    }

    return NextResponse.json(
      { tourId: normalizedTourId, month: monthParam, days },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (e) {
    console.error('[availability/calendar]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
