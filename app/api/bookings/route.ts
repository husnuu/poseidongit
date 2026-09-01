/**
 * POST /api/bookings — Web rezervasyonu oluşturur.
 */
import { NextResponse } from 'next/server'
import { rateLimitResponse } from '@/lib/rateLimit'
import { isDateBeforeEarliestBookable } from '@/lib/booking/bookingWindow'
import { parseBookingWebPayload } from '@/lib/bookingWebPayload'
import { generateBookingAccessToken } from '@/lib/bookingAccessToken'
import { client } from '@/lib/sanity'
import { tourForAvailabilityQuery } from '@/lib/queries'
import { tourForBookingBySanityIdQuery } from '@/lib/sanity/bookingQueries'
import { computePricingForSelection } from '@/lib/sanity/bookingPricing'
import type { TourForBooking } from '@/lib/sanity/bookingTypes'
import { applyExtrasToPricing, resolveSelectedExtrasAgainstTour, type StoredSelectedExtra } from '@/lib/bookingExtras'
import { genderLabel } from '@/lib/bookingPassengerGender'
import { supabase } from '@/lib/supabase'
import {
  BOOKING_STATUSES_COUNTING_TOWARD_CAPACITY,
  firstClassLocasFromRow,
  normalizeDateOnly,
  type SupabaseBookingRow,
} from '@/lib/bookingsSupabase'

const CURRENCY = 'TRY'
const TOTAL_FIRST_CLASS_LOCAS = 10
const LOCA_REGEX = /^L(10|[1-9])$/

/** Resolve tourId (Sanity _id or slug) to canonical Sanity _id. Supabase tarafında tek anahtar kullanılsın diye drafts. kaldırılıyor. */
async function resolveTourIdToSanityId(tourId: string): Promise<string> {
  const tour = await client.fetch<{ _id?: string } | null>(tourForAvailabilityQuery, { tourId })
  const raw = (tour?._id && String(tour._id).trim()) ? String(tour._id).trim() : tourId
  return raw.replace(/^drafts\./, '')
}

function normalizeClassKey(classId: string): string {
  const k = classId.toLowerCase().trim()
  if (k === 'eco' || k.startsWith('eco')) return 'eco'
  if (k === 'premium' || k.startsWith('prem')) return 'premium'
  if (k === 'first' || k.startsWith('first')) return 'first'
  return k || 'eco'
}

function parseMissingColumnFromSupabaseError(message: string): string | null {
  const m = message.match(/Could not find the '([^']+)' column of 'bookings'/i)
  if (m?.[1]) return m[1]
  const m2 = message.match(/column\s+"([^"]+)"\s+of\s+relation\s+"bookings"\s+does not exist/i)
  return m2?.[1] ?? null
}

/** Sanity turu + tarih: sezon, özel gün sınıf/genel fiyatları (classPriceOverrides → priceOverrides) ile toplam. */
async function computePrices(
  tourId: string,
  date: string,
  classId: string,
  counts: { adult: number; child: number; infant: number },
  selectedExtras: Array<{ key: string; hotelName?: string; transferFromHotel?: boolean }>
): Promise<
  | {
      ok: true
      unitPrice: number
      totalPrice: number
      depositAmount: number
      cashPaymentEnabled: boolean
      storedExtras: StoredSelectedExtra[]
      extrasTotal: number
    }
  | { ok: false; error: string }
> {
  try {
    const tour = await client.fetch<TourForBooking | null>(tourForBookingBySanityIdQuery, {
      id: tourId,
    })
    const dateStr = date.slice(0, 10)
    const summary = computePricingForSelection(tour, dateStr, classId, {
      adult: counts.adult,
      child: counts.child,
      baby: counts.infant,
    })
    const extrasResolved = resolveSelectedExtrasAgainstTour(tour, selectedExtras, counts)
    if (!extrasResolved.ok) {
      return { ok: false, error: extrasResolved.error }
    }
    const totalPax = counts.adult + counts.child + counts.infant
    const cashPaymentEnabled = Boolean(tour?.cashPaymentEnabled)
    if (!summary || !tour || totalPax <= 0) {
      return {
        ok: true,
        unitPrice: 0,
        totalPrice: extrasResolved.extrasTotal,
        depositAmount: 0,
        cashPaymentEnabled,
        storedExtras: extrasResolved.stored,
        extrasTotal: extrasResolved.extrasTotal,
      }
    }
    const priced = applyExtrasToPricing(summary, extrasResolved.extrasTotal, tour)
    const tickets = priced.ticketsTotal ?? priced.total - extrasResolved.extrasTotal
    const unitPrice = Math.round(tickets / Math.max(1, totalPax))
    return {
      ok: true,
      unitPrice,
      totalPrice: priced.total,
      depositAmount: cashPaymentEnabled
        ? 0
        : Math.max(0, Math.min(priced.total, priced.depositAmount)),
      cashPaymentEnabled,
      storedExtras: extrasResolved.stored,
      extrasTotal: extrasResolved.extrasTotal,
    }
  } catch {
    return { ok: false, error: 'Fiyat hesaplanamadı. Lütfen tekrar deneyin.' }
  }
}

export async function POST(request: Request) {
  try {
    const limited = await rateLimitResponse(request, 'booking')
    if (limited) return limited

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }
    const parsedBody = parseBookingWebPayload(body)
    if (!parsedBody.ok) {
      return NextResponse.json({ error: `${parsedBody.error}.` }, { status: 400 })
    }
    const payload = parsedBody.payload
    const firestoreTourId = await resolveTourIdToSanityId(payload.tourId)
    const additionalTravelersStored = (payload.additionalTravelers ?? []).map((t) => ({
      firstName: t.firstName,
      lastName: t.lastName,
      ...(t.gender && { gender: t.gender }),
    }))
    const priced = await computePrices(
      firestoreTourId,
      payload.date,
      payload.classId,
      payload.counts,
      payload.selectedExtras ?? []
    )
    if (!priced.ok) {
      return NextResponse.json({ error: priced.error }, { status: 400 })
    }
    const { unitPrice, totalPrice, depositAmount, cashPaymentEnabled, storedExtras, extrasTotal } = priced
    // Kalkış saati: istekte varsa onu kullan, yoksa turun quickFacts.startTime (voucher/bilet sayfasında gösterilir)
    let timeToSave: string | undefined = payload.time?.trim() || undefined
    if (!timeToSave) {
      const tourMeta = await client.fetch<{ startTime?: string } | null>(
        `*[_type == "tour" && (_id == $id || slug.current == $id)][0]{ "startTime": quickFacts.startTime }`,
        { id: firestoreTourId }
      )
      timeToSave = tourMeta?.startTime?.trim() || undefined
    }
    const dateNorm = normalizeDateOnly(payload.date)
    if (isDateBeforeEarliestBookable(dateNorm)) {
      return NextResponse.json(
        { error: 'Seçilen tarih için henüz rezervasyon alınmıyor.' },
        { status: 400 }
      )
    }
    const totalPax = payload.counts.adult + payload.counts.child + payload.counts.infant
    if (totalPax <= 0) {
      return NextResponse.json({ error: 'Kişi sayısı en az 1 olmalıdır.' }, { status: 400 })
    }
    if (normalizeClassKey(payload.classId) === 'first') {
      const requiredLocaCount = Math.ceil(totalPax / 2)
      const selectedLocas = Array.from(
        new Set(
          (payload.firstClassLocas ?? [])
            .map((x) => x.trim().toUpperCase())
            .filter((x) => LOCA_REGEX.test(x))
        )
      )
      if (selectedLocas.length !== requiredLocaCount) {
        return NextResponse.json(
          { error: `First Class için ${requiredLocaCount} adet loca seçmelisiniz.` },
          { status: 400 }
        )
      }
      if (selectedLocas.length > TOTAL_FIRST_CLASS_LOCAS) {
        return NextResponse.json(
          { error: `Maksimum ${TOTAL_FIRST_CLASS_LOCAS} loca seçilebilir.` },
          { status: 400 }
        )
      }
      const { data: firstClassRows, error: firstClassError } = await supabase
        .from('bookings')
        .select('id, first_class_locas, first_class_loca')
        .eq('date', dateNorm)
        .eq('class_id', 'first')
        .in('status', BOOKING_STATUSES_COUNTING_TOWARD_CAPACITY)
      if (firstClassError) {
        throw new Error(`Supabase first class availability query failed: ${firstClassError.message}`)
      }
      const reservedLocas = new Set<string>()
      for (const row of (firstClassRows ?? []) as SupabaseBookingRow[]) {
        const locas = firstClassLocasFromRow(row)
        for (const loca of locas) reservedLocas.add(loca)
      }
      const conflicts = selectedLocas.filter((loca) => reservedLocas.has(loca))
      if (conflicts.length > 0) {
        return NextResponse.json(
          { error: `Seçilen localar dolu: ${conflicts.join(', ')}` },
          { status: 409 }
        )
      }
      payload.firstClassLocas = selectedLocas
    }
    // Not alanı boşsa DB'ye yazma.
    const customer: Record<string, string> = {
      firstName: payload.customer.firstName,
      lastName: payload.customer.lastName,
      email: payload.customer.email,
      phone: payload.customer.phone ?? '',
    }
    if (payload.customer.note !== undefined && payload.customer.note !== '') {
      customer.note = payload.customer.note
    }
    const accessToken = generateBookingAccessToken()
    const insertPayload = {
      created_at: new Date().toISOString(),
      status: 'pending',
      tour_id: firestoreTourId,
      tour_title: payload.tourTitle,
      date: /^\d{4}-\d{2}-\d{2}$/.test(dateNorm) ? dateNorm : payload.date,
      ...(timeToSave && { time: timeToSave }),
      ...(payload.meetingPoint && { meeting_point: payload.meetingPoint }),
      class_id: payload.classId,
      class_name: payload.className,
      ...(payload.firstClassLocas && payload.firstClassLocas.length > 0 && { first_class_locas: payload.firstClassLocas }),
      unit_price: unitPrice,
      total_price: totalPrice,
      ...(cashPaymentEnabled
        ? { paid_now: 0 }
        : depositAmount > 0
          ? { paid_now: depositAmount }
          : {}),
      currency: CURRENCY,
      customer_first_name: customer.firstName,
      customer_last_name: customer.lastName,
      customer_email: customer.email,
      customer_phone: customer.phone,
      ...(customer.note ? { customer_note: customer.note } : {}),
      adult_count: payload.counts.adult,
      child_count: payload.counts.child,
      infant_count: payload.counts.infant,
      ...(additionalTravelersStored.length > 0 && {
        additional_travelers: additionalTravelersStored,
      }),
      ...(payload.customer.gender && { customer_gender: payload.customer.gender }),
      ...(payload.infantGenders && payload.infantGenders.length > 0 && {
        infant_genders: payload.infantGenders,
      }),
      ...(storedExtras.length > 0 && {
        selected_extras: storedExtras,
        extras_total: extrasTotal,
      }),
      passenger_genders: {
        customer: payload.customer.gender,
        customerLabel: payload.customer.gender ? genderLabel(payload.customer.gender, payload.uiLocale ?? 'tr') : undefined,
        additional: additionalTravelersStored.map((t) => t.gender).filter(Boolean),
        infants: payload.infantGenders ?? [],
      },
      source: 'web',
      access_token: accessToken,
      ui_locale: payload.uiLocale ?? 'tr',
    }
    let mutableInsertPayload: Record<string, unknown> = { ...insertPayload }
    let insertedRow: { id: string } | null = null
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const { data, error } = await supabase
        .from('bookings')
        .insert(mutableInsertPayload)
        .select('id')
        .single()
      if (!error && data?.id) {
        insertedRow = data
        break
      }
      if (error) {
        const missingColumn = parseMissingColumnFromSupabaseError(error.message)
        if (missingColumn && Object.prototype.hasOwnProperty.call(mutableInsertPayload, missingColumn)) {
          if (missingColumn === 'ui_locale') {
            console.error(
              '[bookings] ui_locale column missing on public.bookings — booking language is not stored; confirmation emails default to Turkish. Run: alter table public.bookings add column if not exists ui_locale text;'
            )
          }
          delete mutableInsertPayload[missingColumn]
          continue
        }
      }
      throw new Error(`Supabase booking insert failed: ${error?.message ?? 'No id returned'}`)
    }
    if (!insertedRow?.id) {
      throw new Error('Supabase booking insert failed: No id returned')
    }

    // Online kapora: e-posta ödeme sonrası. Nakit (kapıda): rezervasyon anında bildirim.
    if (cashPaymentEnabled) {
      try {
        const { sendBookingEmails } = await import('@/lib/email')
        await sendBookingEmails({
          bookingId: insertedRow.id,
          accessToken,
          tourId: firestoreTourId,
          tourTitle: payload.tourTitle,
          date: /^\d{4}-\d{2}-\d{2}$/.test(dateNorm) ? dateNorm : payload.date,
          ...(timeToSave && { time: timeToSave }),
          className: payload.className,
          ...(payload.firstClassLocas &&
            payload.firstClassLocas.length > 0 && { firstClassLocas: payload.firstClassLocas }),
          counts: payload.counts,
          totalPrice,
          currency: CURRENCY,
          paidNow: 0,
          customer: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone: customer.phone,
            ...(customer.note ? { note: customer.note } : {}),
          },
          ...(payload.meetingPoint && { pickup: payload.meetingPoint }),
          siteLocale: payload.uiLocale ?? 'tr',
          ...(storedExtras.length > 0 && { selectedExtras: storedExtras }),
        })
      } catch (emailErr) {
        console.error('[bookings] Nakit rezervasyon e-postası gönderilemedi:', emailErr)
      }
    }

    return NextResponse.json({
      bookingId: insertedRow.id,
      accessToken,
      cashPayment: cashPaymentEnabled,
      summary: {
        tourTitle: payload.tourTitle,
        date: payload.date,
        className: payload.className,
        totalPrice,
        currency: CURRENCY,
        status: 'pending',
        paidNow: cashPaymentEnabled ? 0 : depositAmount,
        remainingAmount: cashPaymentEnabled ? totalPrice : Math.max(0, totalPrice - depositAmount),
        cashPayment: cashPaymentEnabled,
      },
    })
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('POST /api/bookings error:', err.message, err.stack)
    const isInfra =
      err.message.includes('Supabase') ||
      err.message.includes('credential') ||
      err.message.includes('private') ||
      err.message.includes('SUPABASE_')
    const message =
      process.env.NODE_ENV === 'development' ? err.message : isInfra ? 'Rezervasyon servisi yapılandırma hatası.' : 'Sunucu hatası. Lütfen tekrar deneyin.'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
