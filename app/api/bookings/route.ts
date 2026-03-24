/**
 * POST /api/bookings — Web rezervasyonu oluşturur.
 * Rate limiting: see docs/RATE_LIMITING_SUGGESTIONS.md (e.g. 10 req/min per IP).
 */
import { NextResponse } from 'next/server'
import * as admin from 'firebase-admin'
import { getFirestore } from '@/lib/firebaseAdmin'
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

const COLLECTION = 'bookings'
const CURRENCY = 'TRY'
const ACTIVE_STATUSES = ['pending', 'paid', 'confirmed']
const TOTAL_FIRST_CLASS_LOCAS = 10
const LOCA_REGEX = /^L(10|[1-9])$/

/** Resolve tourId (Sanity _id or slug) to canonical Sanity _id. Firestore’da hep aynı anahtar kullanılsın diye drafts. kaldırılıyor. */
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
  return {
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
    const db = getFirestore()
    const dateNorm = payload.date.slice(0, 10)
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
      const firstClassSnapshot = await db
        .collection(COLLECTION)
        .where('date', '==', dateNorm)
        .where('classId', '==', 'first')
        .where('status', 'in', ACTIVE_STATUSES)
        .get()
      const reservedLocas = new Set<string>()
      for (const doc of firstClassSnapshot.docs) {
        const locas = collectFirstClassLocas(doc.data() as Record<string, unknown>)
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
    // Firestore undefined kabul etmez; note yoksa alanı ekleme
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
    const ref = await db.collection(COLLECTION).add({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      tourId: firestoreTourId,
      tourTitle: payload.tourTitle,
      date: /^\d{4}-\d{2}-\d{2}$/.test(dateNorm) ? dateNorm : payload.date,
      ...(timeToSave && { time: timeToSave }),
      ...(payload.meetingPoint && { meetingPoint: payload.meetingPoint }),
      counts: payload.counts,
      classId: payload.classId,
      className: payload.className,
      ...(payload.firstClassLocas && payload.firstClassLocas.length > 0 && { firstClassLocas: payload.firstClassLocas }),
      unitPrice,
      totalPrice,
      currency: CURRENCY,
      customer,
      ...(payload.additionalTravelers &&
        payload.additionalTravelers.length > 0 && {
          additionalTravelers: additionalTravelersWithMeal,
        }),
      ...(mealPreference && { mealPreference }),
      source: 'web',
      accessToken,
    })

    // E-posta yalnızca ödeme onaylandığında (admin "paid" yaptığında) gönderilir.

    return NextResponse.json({
      bookingId: ref.id,
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
    const isFirebase =
      err.message.includes('Firebase') ||
      err.message.includes('credential') ||
      err.message.includes('private') ||
      err.message.includes('FIREBASE_')
    const message =
      process.env.NODE_ENV === 'development' ? err.message : isFirebase ? 'Ödeme servisi yapılandırma hatası.' : 'Sunucu hatası. Lütfen tekrar deneyin.'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
