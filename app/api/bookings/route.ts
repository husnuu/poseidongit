import { NextResponse } from 'next/server'
import * as admin from 'firebase-admin'
import { getFirestore } from '@/lib/firebaseAdmin'
import type { BookingCreatePayload } from '@/lib/firestore/bookingTypes'
import { client } from '@/lib/sanity'
import { tourForAvailabilityQuery } from '@/lib/queries'

const COLLECTION = 'bookings'
const CURRENCY = 'TRY'

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
  const time = typeof b.time === 'string' ? b.time.trim() || undefined : undefined
  const meetingPoint = typeof b.meetingPoint === 'string' ? b.meetingPoint.trim() || undefined : undefined
  return {
    tourId,
    tourTitle,
    date,
    time,
    meetingPoint,
    counts: { adult, child, infant },
    classId,
    className,
    customer: { firstName, lastName, email, phone, note },
  }
}

/** Şimdilik: Sanity'den tur fiyatını al, yetişkin birim fiyat * toplam kişi ile toplam hesapla. tourId = Sanity _id (resolve edilmiş). */
async function computePrices(
  tourId: string,
  classId: string,
  counts: { adult: number; child: number; infant: number }
): Promise<{ unitPrice: number; totalPrice: number }> {
  try {
    const tour = await client.fetch<{
      ticketClasses?: Array<{
        key: string
        pricesByAge?: Array< { ageKey: string; price: number } >
      }>
    } | null>(
      `*[_type == "tour" && (_id == $id || slug.current == $id)][0]{ ticketClasses[]{ key, pricesByAge[]{ ageKey, price } } }`,
      { id: tourId }
    )
    const cls = tour?.ticketClasses?.find((c) => c.key === classId)
    const adultPrice = cls?.pricesByAge?.find((p) => p.ageKey === 'adult')?.price ?? 0
    const totalPax = counts.adult + counts.child + counts.infant
    const unitPrice = adultPrice
    const totalPrice = totalPax * unitPrice
    return { unitPrice, totalPrice }
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
      return NextResponse.json(
        { error: missing.length ? `Eksik veya geçersiz alan: ${missing.join(', ')}.` : 'Eksik veya geçersiz istek.' },
        { status: 400 }
      )
    }
    const firestoreTourId = await resolveTourIdToSanityId(payload.tourId)
    const { unitPrice, totalPrice } = await computePrices(
      firestoreTourId,
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
    const dateNorm = payload.date.slice(0, 10)
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
      unitPrice,
      totalPrice,
      currency: CURRENCY,
      customer,
      source: 'web',
    })

    // E-posta yalnızca ödeme onaylandığında (admin "paid" yaptığında) gönderilir.

    return NextResponse.json({
      bookingId: ref.id,
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
