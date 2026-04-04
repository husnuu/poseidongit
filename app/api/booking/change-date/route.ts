import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { tourForAvailabilityQuery } from '@/lib/queries'
import { computeCapacityForDate, type TourCapacitySource } from '@/lib/availabilityCapacity'
import { supabase } from '@/lib/supabase'
import { firstClassLocasFromRow, paxCountFromRow, type SupabaseBookingRow } from '@/lib/bookingsSupabase'

const ACTIVE_STATUSES = ['pending', 'paid', 'confirmed']
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const LOCA_REGEX = /^L(10|[1-9])$/
/** First Class: tüm turlar ortak havuz (availability / calendar ile uyumlu). */
const FIRST_CLASS_CAPACITY_TOTAL = 20

function normalizeClassKey(classId: string): string {
  const k = (classId ?? '').toLowerCase().trim()
  if (k === 'eco' || k.startsWith('eco')) return 'eco'
  if (k === 'premium' || k.startsWith('prem')) return 'premium'
  if (k === 'first' || k.startsWith('first')) return 'first'
  return k || 'eco'
}

/**
 * POST /api/booking/change-date
 * Body: { bookingId, email, newDate } (newDate YYYY-MM-DD)
 * Verifies email, checks availability for new date, updates booking date.
 * Rate limiting: see docs/RATE_LIMITING_SUGGESTIONS.md (e.g. 10 req/min per IP).
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
    }
    const bookingId = typeof body.bookingId === 'string' ? body.bookingId.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const newDate = typeof body.newDate === 'string' ? body.newDate.trim().slice(0, 10) : ''
    const rawLocas = body.firstClassLocas
    const firstClassLocasBody = Array.isArray(rawLocas)
      ? (rawLocas as unknown[]).map((x) => String(x).trim().toUpperCase()).filter((x) => LOCA_REGEX.test(x))
      : undefined

    if (!bookingId || !email || !newDate || !DATE_REGEX.test(newDate)) {
      return NextResponse.json(
        { error: 'bookingId, email ve geçerli newDate (YYYY-MM-DD) gerekli' },
        { status: 400 }
      )
    }

    const { data: currentBooking, error: currentBookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()
    if (currentBookingError || !currentBooking) {
      return NextResponse.json({ error: 'Rezervasyon bulunamadı' }, { status: 404 })
    }

    const data = currentBooking as SupabaseBookingRow
    if (data.status === 'cancelled') {
      return NextResponse.json(
        { error: 'İptal edilmiş rezervasyonun tarihi değiştirilemez.' },
        { status: 400 }
      )
    }

    const bookingEmail = String(data.customer_email ?? '').trim().toLowerCase()
    if (bookingEmail !== email) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi bu rezervasyona ait değil' },
        { status: 403 }
      )
    }

    const tourId = String(data.tour_id ?? '')
    const classId = String(data.class_id ?? '')
    const totalPax = paxCountFromRow(data)
    if (totalPax <= 0) {
      return NextResponse.json(
        { error: 'Rezervasyonda yolcu bilgisi bulunamadı.' },
        { status: 400 }
      )
    }

    const sanityTour = await client.fetch<(TourCapacitySource & { _id?: string }) | null>(
      tourForAvailabilityQuery,
      { tourId }
    )
    if (!sanityTour) {
      return NextResponse.json({ error: 'Tur bilgisi bulunamadı' }, { status: 404 })
    }

    const capacityByClass = computeCapacityForDate(sanityTour, newDate)
    const classKey = normalizeClassKey(classId)
    const capacity = capacityByClass[classKey] ?? 0

    const requiredFirstClassLocas = classKey === 'first' ? Math.ceil(totalPax / 2) : 0
    let finalFirstClassLocas: string[] | undefined

    if (classKey === 'first') {
      /**
       * First Class: tüm turlar ortak L1–L10; rezervasyonlar turId’ye göre değil global sorgulanır.
       */
      const { data: globalFirstRows, error: globalFirstError } = await supabase
        .from('bookings')
        .select('id, status, adult_count, child_count, infant_count, first_class_locas, first_class_loca')
        .eq('date', newDate)
        .eq('class_id', 'first')
        .in('status', ACTIVE_STATUSES)
      if (globalFirstError) {
        throw new Error(`Supabase first class query failed: ${globalFirstError.message}`)
      }

      let globalBookedPax = 0
      const reservedOnNewDate: string[] = []
      for (const row of (globalFirstRows ?? []) as SupabaseBookingRow[]) {
        if (row.id === bookingId) continue
        globalBookedPax += paxCountFromRow(row)
        const locas = firstClassLocasFromRow(row)
        for (const loca of locas) {
          if (!reservedOnNewDate.includes(loca)) reservedOnNewDate.push(loca)
        }
      }

      const remaining = Math.max(0, FIRST_CLASS_CAPACITY_TOTAL - globalBookedPax)
      if (remaining < totalPax) {
        return NextResponse.json(
          {
            error:
              'Seçilen tarihte yeterli kontenjan yok. Lütfen başka bir tarih seçin veya bizimle iletişime geçin.',
          },
          { status: 400 }
        )
      }

      if (requiredFirstClassLocas > 0) {
        if (firstClassLocasBody && firstClassLocasBody.length === requiredFirstClassLocas) {
          const alreadyTaken = firstClassLocasBody.filter((l) => reservedOnNewDate.includes(l))
          if (alreadyTaken.length > 0) {
            return NextResponse.json(
              { error: `Seçilen localar (${alreadyTaken.join(', ')}) bu tarihte dolu. Lütfen müsait loca seçin.` },
              { status: 400 }
            )
          }
          finalFirstClassLocas = firstClassLocasBody
        } else {
          return NextResponse.json(
            { error: `First Class için ${requiredFirstClassLocas} loca seçmeniz gerekiyor (${totalPax} kişi).` },
            { status: 400 }
          )
        }
      }
    } else {
      const { data: sameDayRows, error: sameDayError } = await supabase
        .from('bookings')
        .select('id, class_id, adult_count, child_count, infant_count')
        .eq('tour_id', sanityTour._id ?? tourId)
        .eq('date', newDate)
        .in('status', ACTIVE_STATUSES)
      if (sameDayError) {
        throw new Error(`Supabase same day booking query failed: ${sameDayError.message}`)
      }

      let bookedForClass = 0
      for (const row of (sameDayRows ?? []) as SupabaseBookingRow[]) {
        if (row.id === bookingId) continue
        const cid = normalizeClassKey(String(row.class_id ?? ''))
        if (cid !== classKey) continue
        bookedForClass += paxCountFromRow(row)
      }

      const remaining = Math.max(0, capacity - bookedForClass)
      if (remaining < totalPax) {
        return NextResponse.json(
          {
            error:
              'Seçilen tarihte yeterli kontenjan yok. Lütfen başka bir tarih seçin veya bizimle iletişime geçin.',
          },
          { status: 400 }
        )
      }
      finalFirstClassLocas = undefined
    }

    const updatePayload: Record<string, unknown> = { date: newDate }
    if (finalFirstClassLocas && finalFirstClassLocas.length > 0) {
      updatePayload.first_class_locas = finalFirstClassLocas
      /** Eski tek-alan (first_class_loca) kalsın; doluluk hesapları çift sayabilir. */
      updatePayload.first_class_loca = null
    }
    const { error: updateError } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', bookingId)
    if (updateError) {
      throw new Error(`Supabase booking change-date update failed: ${updateError.message}`)
    }

    return NextResponse.json({
      ok: true,
      message: 'Rezervasyon tarihiniz güncellendi.',
      date: newDate,
      ...(finalFirstClassLocas && finalFirstClassLocas.length > 0 && { firstClassLocas: finalFirstClassLocas }),
    })
  } catch (e) {
    console.error('[booking change-date]', e)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}
