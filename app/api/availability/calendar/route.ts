/**
 * GET /api/availability/calendar?tourId=xxx&month=YYYY-MM
 * Rezervasyonumu Yönet sayfasında First Class müşteriler için takvim verisi.
 * Her gün için first class kapasite, dolu, kalan ve dolu loca listesi döner.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebaseAdmin'
import { client } from '@/lib/sanity'
import { tourForAvailabilityQuery } from '@/lib/queries'
import type { TourCapacitySource } from '@/lib/availabilityCapacity'

const COLLECTION = 'bookings'
const ACTIVE_STATUSES = ['pending', 'paid', 'confirmed']
const LOCA_REGEX = /^L(10|[1-9])$/
/** First Class: tüm turlar ortak L1–L10 havuzu (availability API ile aynı mantık). */
const TOTAL_FIRST_CLASS_LOCAS = 10
const FIRST_CLASS_CAPACITY_TOTAL = TOTAL_FIRST_CLASS_LOCAS * 2

function collectFirstClassLocas(d: Record<string, unknown>): string[] {
  const out: string[] = []
  if (Array.isArray(d.firstClassLocas)) {
    for (const x of d.firstClassLocas) {
      const s = typeof x === 'string' ? x.trim().toUpperCase() : ''
      if (s && LOCA_REGEX.test(s) && !out.includes(s)) out.push(s)
    }
  }
  if (out.length === 0 && typeof d.firstClassLoca === 'string') {
    const s = d.firstClassLoca.trim().toUpperCase()
    if (s && LOCA_REGEX.test(s)) out.push(s)
  }
  return out
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

    const firestoreTourId = (sanityTour._id ?? tourId).replace(/^drafts\./, '')
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

    const db = getFirestore()
    /**
     * First Class localar ve kontenjan turdan bağımsız ortak havuzdur (tüm turlar).
     * Sadece bu turun rezervasyonlarına bakmak, diğer turlarda dolu loca’ları gizler.
     */
    const globalFirstSnapshot = await db
      .collection(COLLECTION)
      .where('classId', '==', 'first')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get()

    const firstLocasByDate: Record<string, string[]> = {}
    const firstPaxByDate: Record<string, number> = {}

    for (const doc of globalFirstSnapshot.docs) {
      const d = doc.data() as Record<string, unknown>
      const status = d.status as string
      if (!ACTIVE_STATUSES.includes(status)) continue
      const date = (d.date as string)?.slice(0, 10)
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
      const counts = (d.counts ?? { adult: 0, child: 0, infant: 0 }) as Record<string, unknown>
      const pax = Math.max(0, Number(counts?.adult) || 0) + Math.max(0, Number(counts?.child) || 0) + Math.max(0, Number(counts?.infant) || 0)
      if (pax > 0) {
        firstPaxByDate[date] = (firstPaxByDate[date] ?? 0) + pax
      }
      const locas = collectFirstClassLocas(d)
      if (!firstLocasByDate[date]) firstLocasByDate[date] = []
      const skipLocas = excludeBookingId !== '' && doc.id === excludeBookingId
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
      { tourId: firestoreTourId, month: monthParam, days },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (e) {
    console.error('[availability/calendar]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
