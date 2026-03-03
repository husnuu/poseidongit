import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebaseAdmin'
import { generateVoucherPdf } from '@/lib/voucher/generateVoucherPdf'
import { bookingToVoucherData } from '@/lib/voucher/bookingToVoucher'

const COLLECTION = 'bookings'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getBookingUrl(bookingId: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  if (!base) return `https://example.com/rezervasyon?id=${bookingId}`
  return `${base.replace(/\/$/, '')}/rezervasyon?id=${bookingId}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')?.trim()

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing bookingId. Use /api/voucher?bookingId=...' },
        { status: 400 }
      )
    }

    const db = getFirestore()
    const snap = await db.collection(COLLECTION).doc(bookingId).get()

    if (!snap.exists) {
      return NextResponse.json(
        { error: 'Booking not found', bookingId },
        { status: 404 }
      )
    }

    const data = snap.data()!
    const booking = {
      id: snap.id,
      tourTitle: data.tourTitle,
      date: data.date,
      time: data.time,
      counts: data.counts,
      classId: data.classId,
      className: data.className,
      totalPrice: data.totalPrice,
      currency: data.currency,
      customer: data.customer,
    }

    const bookingUrl = getBookingUrl(bookingId)
    const voucherData = bookingToVoucherData(booking, bookingUrl)
    const pdfBytes = await generateVoucherPdf(voucherData)

    const filename = `Poseidon-Voucher-${voucherData.referenceNumber}.pdf`
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${safeFilename}"`,
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (e) {
    console.error('[voucher] Error:', e)
    const message = e instanceof Error ? e.message : 'Failed to generate voucher'
    return NextResponse.json(
      { error: 'Voucher generation failed', details: message },
      { status: 500 }
    )
  }
}
