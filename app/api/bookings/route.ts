/**
 * POST /api/bookings — Web rezervasyonu oluşturur.
 */
import { NextResponse } from 'next/server'
import { rateLimitResponse } from '@/lib/rateLimit'
import type { BookingCreatePayload } from '@/lib/firestore/bookingTypes'
import {
  additionalTravelerSlotCount,
  parseAdditionalTravelersFromBody,
} from '@/lib/bookingAdditionalTravelers'
import { generateBookingAccessToken } from '@/lib/bookingAccessToken'
import { client } from '@/lib/sanity'
import { tourForAvailabilityQuery } from '@/lib/queries'
import { tourForBookingBySanityIdQuery } from '@/lib/sanity/bookingQueries'
import { computePricingForSelection } from '@/lib/sanity/bookingPricing'
import type { TourForBooking } from '@/lib/sanity/bookingTypes'
import {
  resolveMealPreferenceForBooking,
  resolveAdditionalTravelerMealPreferencesForBooking,
} from '@/lib/bookingMealPreference'
import { supabase } from '@/lib/supabase'
import { DEFAULT_LOCALE, isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import {
  firstClassLocasFromRow,
  normalizeDateOnly,
  type SupabaseBookingRow,
} from '@/lib/bookingsSupabase'

const CURRENCY = 'TRY'
const ACTIVE_STATUSES = ['pending', 'paid', 'confirmed']
const TOTAL_FIRST_CLASS_LOCAS = 10
const LOCA_REGEX = /^L(10|[1-9])$/

/** Resolve tourId (Sanity _id or slug) to canonical Sanity _id. Supabase tarafında tek anahtar kullanılsın diye drafts. kaldırılıyor. */
async function resolveTourIdToSanityId(tourId: string): Promise<string> {
  const tour = await client.fetch<{ _id?: string } | null>(tourForAvailabilityQuery, { tourId })
  const raw = (tour?._id && String(tour._id).trim()) ? String(tour._id).trim() : tourId
  return raw.replace(/^drafts\./, '')
}

function normalizeBody(body: unknown): BookingCreatePayload | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const tourId = typeof b.tourId === 'string' ? b.tourId.trim() : ''
  const tourTitle = typeof b.tourTitle === 'string' ? b.tourTitle.trim() : ''
  const date = typeof b.date === 'string' ? b.date.trim() : ''
  const classId = typeof b.classId === 'string' ? b.classId.trim() : ''
  const className = typeof b.className === 'string' ? b.className.trim() : ''
  const counts = b.counts as Record<string, unknown> | undefined
  const customer = b.customer as Record<string, unknown> | undefined
  if (!tourId || !tourTitle || !date || !classId || !className || !counts || !customer) {
    return null
  }
  const adult = typeof counts.adult === 'number' ? counts.adult : 0
  const child = typeof counts.child === 'number' ? counts.child : 0
  const infant = typeof counts.infant === 'number' ? counts.infant : 0
  const firstName = typeof customer.firstName === 'string' ? customer.firstName.trim() : ''
  const lastName = typeof customer.lastName === 'string' ? customer.lastName.trim() : ''
  const email = typeof customer.email === 'string' ? customer.email.trim() : ''
  const phone = typeof customer.phone === 'string' ? customer.phone.trim() : ''
  const note = typeof customer.note === 'string' ? customer.note.trim() : undefined
  if (!firstName || !lastName || !email) return null
  const parsedExtras = parseAdditionalTravelersFromBody(b.additionalTravelers)
  if (parsedExtras === null) return null
  const extraN = additionalTravelerSlotCount({ adult, child, infant })
  if (extraN === 0) {
    if (parsedExtras.length > 0) return null
  } else {
    if (parsedExtras.length !== extraN) return null
    for (const t of parsedExtras) {
      if (!t.firstName.trim() || !t.lastName.trim()) return null
    }
  }
  const time = typeof b.time === 'string' ? b.time.trim() || undefined : undefined
  const meetingPoint = typeof b.meetingPoint === 'string' ? b.meetingPoint.trim() || undefined : undefined
  let firstClassLocas: string[] | undefined
  if (classId === 'first') {
    if (Array.isArray(b.firstClassLocas)) {
      firstClassLocas = (b.firstClassLocas as unknown[])
        .map((x) => (typeof x === 'string' ? x.trim().toUpperCase() : ''))
        .filter((x) => LOCA_REGEX.test(x))
      if (firstClassLocas.length === 0) firstClassLocas = undefined
    }
    if (!firstClassLocas && typeof b.firstClassLoca === 'string' && LOCA_REGEX.test(b.firstClassLoca.trim())) {
      firstClassLocas = [b.firstClassLoca.trim().toUpperCase()]
    }
  }
  const rawLoc = typeof b.locale === 'string' ? b.locale.trim().toLowerCase() : ''
  const uiLocale: SiteLocale = isSiteLocale(rawLoc) ? rawLoc : DEFAULT_LOCALE

  return {
    uiLocale,
    tourId,
    tourTitle,
    date,
    time,
    meetingPoint,
    counts: { adult, child, infant },
    classId,
    className,
    ...(firstClassLocas && firstClassLocas.length > 0 && { firstClassLocas }),
    customer: { firstName, lastName, email, phone, note },
    ...(extraN > 0 ? { additionalTravelers: parsedExtras } : {}),
  }
}

function parseMealPreferenceKey(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const mp = (body as Record<string, unknown>).mealPreference
  if (!mp || typeof mp !== 'object') return undefined
  const k = (mp as Record<string, unknown>).key
  return typeof k === 'string' ? k.trim() || undefined : undefined
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
  counts: { adult: number; child: number; infant: number }
): Promise<{ unitPrice: number; totalPrice: number }> {
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
    const totalPax = counts.adult + counts.child + counts.infant
    if (!summary || totalPax <= 0) {
      return { unitPrice: 0, totalPrice: 0 }
    }
    const unitPrice = Math.round(summary.total / totalPax)
    return { unitPrice, totalPrice: summary.total }
  } catch {
    const totalPax = (counts.adult || 0) + (counts.child || 0) + (counts.infant || 0)
    return { unitPrice: 0, totalPrice: 0 }
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
    const payload = normalizeBody(body)
    if (!payload) {
      const b = body as Record<string, unknown>
      const missing: string[] = []
      if (!(typeof b?.tourId === 'string' && b.tourId.trim())) missing.push('tur')
      if (!(typeof b?.tourTitle === 'string' && b.tourTitle.trim())) missing.push('tur adı')
      if (!(typeof b?.date === 'string' && b.date.trim())) missing.push('tarih')
      if (!(typeof b?.classId === 'string' && b.classId.trim())) missing.push('sınıf')
      if (!(typeof b?.counts === 'object' && b.counts)) missing.push('kişi sayısı')
      const cust = b?.customer as Record<string, unknown> | undefined
      if (!cust) missing.push('müşteri bilgisi')
      else {
        if (!(typeof cust.firstName === 'string' && cust.firstName.trim())) missing.push('ad')
        if (!(typeof cust.lastName === 'string' && cust.lastName.trim())) missing.push('soyad')
        if (!(typeof cust.email === 'string' && cust.email.trim())) missing.push('e-posta')
      }
      const counts = b?.counts as Record<string, unknown> | undefined
      const ad = typeof counts?.adult === 'number' ? counts.adult : 0
      const ch = typeof counts?.child === 'number' ? counts.child : 0
      const inf = typeof counts?.infant === 'number' ? counts.infant : 0
      const needExtra = additionalTravelerSlotCount({ adult: ad, child: ch, infant: inf })
      const parsed = parseAdditionalTravelersFromBody(b?.additionalTravelers)
      if (parsed === null) missing.push('diğer yolcu listesi geçersiz')
      else if (needExtra > 0 && parsed.length !== needExtra) missing.push('tüm yolcuların ad-soyadı')
      else if (needExtra > 0 && parsed.some((t) => !t.firstName.trim() || !t.lastName.trim())) {
        missing.push('tüm yolcuların ad-soyadı')
      }
      return NextResponse.json(
        { error: missing.length ? `Eksik veya geçersiz alan: ${missing.join(', ')}.` : 'Eksik veya geçersiz istek.' },
        { status: 400 }
      )
    }
    const firestoreTourId = await resolveTourIdToSanityId(payload.tourId)
    const mealResolve = await resolveMealPreferenceForBooking(
      firestoreTourId,
      parseMealPreferenceKey(body)
    )
    if (!mealResolve.ok) {
      return NextResponse.json({ error: mealResolve.message }, { status: 400 })
    }
    const mealPreference = mealResolve.stored
    const extrasMealResolve = await resolveAdditionalTravelerMealPreferencesForBooking(
      firestoreTourId,
      payload.additionalTravelers ?? []
    )
    if (!extrasMealResolve.ok) {
      return NextResponse.json({ error: extrasMealResolve.message }, { status: 400 })
    }
    const additionalTravelersWithMeal = (payload.additionalTravelers ?? []).map((t, i) => ({
      firstName: t.firstName,
      lastName: t.lastName,
      ...(extrasMealResolve.stored[i] && { mealPreference: extrasMealResolve.stored[i] }),
    }))
    const { unitPrice, totalPrice } = await computePrices(
      firestoreTourId,
      payload.date,
      payload.classId,
      payload.counts
    )
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
        .in('status', ACTIVE_STATUSES)
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
      currency: CURRENCY,
      customer_first_name: customer.firstName,
      customer_last_name: customer.lastName,
      customer_email: customer.email,
      customer_phone: customer.phone,
      ...(customer.note ? { customer_note: customer.note } : {}),
      adult_count: payload.counts.adult,
      child_count: payload.counts.child,
      infant_count: payload.counts.infant,
      ...(additionalTravelersWithMeal.length > 0 && {
        additional_travelers: additionalTravelersWithMeal,
      }),
      ...(mealPreference && { meal_preference: mealPreference }),
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

    // E-posta yalnızca ödeme onaylandığında (admin "paid" yaptığında) gönderilir.

    return NextResponse.json({
      bookingId: insertedRow.id,
      accessToken,
      summary: {
        tourTitle: payload.tourTitle,
        date: payload.date,
        className: payload.className,
        totalPrice,
        currency: CURRENCY,
        status: 'pending',
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
