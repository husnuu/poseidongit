import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebaseAdmin'

const COLLECTION = 'bookings'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Rezervasyon detayını döndürür; sadece e-posta eşleşirse. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')?.trim()
    const email = searchParams.get('email')?.trim()?.toLowerCase()

    if (!bookingId || !email) {
      return NextResponse.json(
        { error: 'bookingId ve email gerekli' },
        { status: 400 }
      )
    }

    const db = getFirestore()
    const snap = await db.collection(COLLECTION).doc(bookingId).get()

    if (!snap.exists) {
      return NextResponse.json(
        { error: 'Rezervasyon bulunamadı' },
        { status: 404 }
      )
    }

    const data = snap.data()!
    const customer = (data.customer ?? {}) as Record<string, string>
    const bookingEmail = String(customer.email ?? '').trim().toLowerCase()

    if (bookingEmail !== email) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi bu rezervasyona ait değil' },
        { status: 403 }
      )
    }

    const status = data.status ?? 'pending'
    if (status === 'cancelled') {
      return NextResponse.json({
        booking: null,
        cancelled: true,
        message: 'Bu rezervasyon iptal edilmiştir.',
      })
    }

    const dateStr = String(data.date ?? '')
    const timeStr = data.time != null ? String(data.time) : ''
    const tourDateTime = dateStr && timeStr
      ? new Date(`${dateStr}T${timeStr}:00`)
      : dateStr
      ? new Date(`${dateStr}T12:00:00`)
      : null
    const now = new Date()
    const hoursUntilTour = tourDateTime
      ? (tourDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      : null
    const canCancel = typeof hoursUntilTour === 'number' && hoursUntilTour > 24

    const booking = {
      id: snap.id,
      status,
      tourTitle: data.tourTitle,
      date: dateStr,
      time: data.time ?? undefined,
      meetingPoint: data.meetingPoint ?? undefined,
      className: data.className,
      totalPrice: data.totalPrice,
      currency: data.currency ?? 'TRY',
      counts: data.counts ?? { adult: 0, child: 0, infant: 0 },
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
      },
      canCancel,
      hoursUntilTour: hoursUntilTour != null ? Math.round(hoursUntilTour) : null,
    }

    return NextResponse.json({ booking })
  } catch (e) {
    console.error('[booking GET]', e)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}
