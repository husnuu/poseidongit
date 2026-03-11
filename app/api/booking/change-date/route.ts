import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebaseAdmin'
import { client } from '@/lib/sanity'
import { tourForAvailabilityQuery } from '@/lib/queries'
import { computeCapacityForDate, type TourCapacitySource } from '@/lib/availabilityCapacity'

const COLLECTION = 'bookings'
const ACTIVE_STATUSES = ['pending', 'paid', 'confirmed']
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

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

    const snapshot = await db
      .collection(COLLECTION)
      .where('tourId', '==', sanityTour._id ?? tourId)
      .where('date', '==', newDate)
      .where('status', 'in', ACTIVE_STATUSES)
      .get()

    let bookedForClass = 0
    snapshot.docs.forEach((doc) => {
      if (doc.id === bookingId) return
      const d = doc.data()
      const cid = normalizeClassKey(String(d.classId ?? ''))
      if (cid !== classKey) return
      const c = (d.counts ?? {}) as { adult?: number; child?: number; infant?: number }
      bookedForClass += (c.adult ?? 0) + (c.child ?? 0) + (c.infant ?? 0)
    })

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

    await ref.update({ date: newDate })

    return NextResponse.json({
      ok: true,
      message: 'Rezervasyon tarihiniz güncellendi.',
      date: newDate,
    })
  } catch (e) {
    console.error('[booking change-date]', e)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}
