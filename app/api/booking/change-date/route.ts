import { NextRequest, NextResponse } from 'next/server'
import * as admin from 'firebase-admin'
import type { DocumentData, UpdateData } from 'firebase-admin/firestore'
import { getFirestore } from '@/lib/firebaseAdmin'
import { client } from '@/lib/sanity'
import { tourForAvailabilityQuery } from '@/lib/queries'
import { computeCapacityForDate, type TourCapacitySource } from '@/lib/availabilityCapacity'

const COLLECTION = 'bookings'
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

    const db = getFirestore()
    const ref = db.collection(COLLECTION).doc(bookingId)
    const snap = await ref.get()

    if (!snap.exists) {
      return NextResponse.json({ error: 'Rezervasyon bulunamadı' }, { status: 404 })
    }

    const data = snap.data()!
    if (data.status === 'cancelled') {
      return NextResponse.json(
        { error: 'İptal edilmiş rezervasyonun tarihi değiştirilemez.' },
        { status: 400 }
      )
    }

    const customer = (data.customer ?? {}) as Record<string, string>
    const bookingEmail = String(customer.email ?? '').trim().toLowerCase()
    if (bookingEmail !== email) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi bu rezervasyona ait değil' },
        { status: 403 }
      )
    }

    const tourId = String(data.tourId ?? '')
    const classId = String(data.classId ?? '')
    const counts = (data.counts ?? { adult: 0, child: 0, infant: 0 }) as {
      adult?: number
      child?: number
      infant?: number
    }
    const totalPax = (counts.adult ?? 0) + (counts.child ?? 0) + (counts.infant ?? 0)
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
      const globalFirstSnap = await db
        .collection(COLLECTION)
        .where('date', '==', newDate)
        .where('classId', '==', 'first')
        .where('status', 'in', ACTIVE_STATUSES)
        .get()

      let globalBookedPax = 0
      const reservedOnNewDate: string[] = []
      for (const doc of globalFirstSnap.docs) {
        if (doc.id === bookingId) continue
        const d = doc.data()
        const c = (d.counts ?? {}) as Record<string, unknown>
        globalBookedPax +=
          Math.max(0, Number(c?.adult) || 0) +
          Math.max(0, Number(c?.child) || 0) +
          Math.max(0, Number(c?.infant) || 0)
        const arr = Array.isArray(d.firstClassLocas)
          ? (d.firstClassLocas as string[])
              .map((x) => String(x).trim().toUpperCase())
              .filter((x) => LOCA_REGEX.test(x))
          : []
        const single = typeof d.firstClassLoca === 'string' ? d.firstClassLoca.trim().toUpperCase() : ''
        if (arr.length) arr.forEach((l) => reservedOnNewDate.includes(l) || reservedOnNewDate.push(l))
        else if (single && LOCA_REGEX.test(single) && !reservedOnNewDate.includes(single)) reservedOnNewDate.push(single)
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
      const snapshot = await db
        .collection(COLLECTION)
        .where('tourId', '==', sanityTour._id ?? tourId)
        .where('date', '==', newDate)
        .where('status', 'in', ACTIVE_STATUSES)
        .get()

      let bookedForClass = 0
      for (const doc of snapshot.docs) {
        if (doc.id === bookingId) continue
        const d = doc.data()
        const cid = normalizeClassKey(String(d.classId ?? ''))
        if (cid !== classKey) continue
        const c = (d.counts ?? {}) as Record<string, unknown>
        bookedForClass += Math.max(0, Number(c?.adult) || 0) + Math.max(0, Number(c?.child) || 0) + Math.max(0, Number(c?.infant) || 0)
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

    const updatePayload: UpdateData<DocumentData> = { date: newDate }
    if (finalFirstClassLocas && finalFirstClassLocas.length > 0) {
      updatePayload.firstClassLocas = finalFirstClassLocas
      /** Eski tek-alan (firstClassLoca) kalsın; doluluk hesapları çift sayabilir. Tam sil. */
      updatePayload.firstClassLoca = admin.firestore.FieldValue.delete()
    }
    await ref.update(updatePayload)

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
