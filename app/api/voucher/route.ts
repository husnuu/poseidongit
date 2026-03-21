import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebaseAdmin'
import { validateBookingAccessToken } from '@/lib/bookingAccessToken'
import { generateVoucherPdf } from '@/lib/voucher/generateVoucherPdf'
import { buildVoucherDataFromBookingSnapshot } from '@/lib/voucher/buildVoucherDataFromBookingSnapshot'

const COLLECTION = 'bookings'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const bookingId = searchParams.get('bookingId')?.trim()
    let token = searchParams.get('token')?.trim() ?? ''
    // URL'de + bazen boşluğa dönüşebilir
    if (token && token.includes(' ')) {
      token = token.replace(/ /g, '+')
    }
    // Query'de token yoksa (örn. /api/voucher/access yönlendirmesinden sonra) cookie'den al
    if (!token) {
      const cookieBookingId = request.cookies.get('voucher_booking_id')?.value?.trim()
      const cookieToken = request.cookies.get('voucher_token')?.value?.trim()
      if (cookieBookingId === bookingId && cookieToken) {
        token = cookieToken.includes(' ') ? cookieToken.replace(/ /g, '+') : cookieToken
      }
    }
    const download = searchParams.get('download') === '1'

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Eksik rezervasyon numarası. Lütfen e-postanızdaki veya rezervasyon sayfasındaki linki kullanın.' },
        { status: 400 }
      )
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Bilet linki geçersiz veya süresi dolmuş. Lütfen e-postanızdaki "Biletimi Görüntüle" linkini veya Rezervasyonumu Yönet sayfasını kullanın.' },
        { status: 403 }
      )
    }

    const valid = await validateBookingAccessToken(bookingId, token)
    if (!valid) {
      return NextResponse.json(
        { error: 'Bilet linki geçersiz veya süresi dolmuş. Lütfen e-postanızdaki linki veya Rezervasyonumu Yönet sayfasını kullanın.' },
        { status: 403 }
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

    const voucherData = await buildVoucherDataFromBookingSnapshot(snap, token)
    if (!voucherData) {
      return NextResponse.json(
        { error: 'Bilet verisi oluşturulamadı. accessToken eksik olabilir.' },
        { status: 500 }
      )
    }
    const pdfBytes = await generateVoucherPdf(voucherData)

    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Bilet'
    const filename = `${siteName}-Bilet-${voucherData.referenceNumber}.pdf`
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')

    const res = new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': download
          ? `attachment; filename="${safeFilename}"`
          : `inline; filename="${safeFilename}"`,
        'Cache-Control': 'private, no-cache',
      },
    })
    // Cookie ile geldiyse tek kullanımlık olsun diye sil
    res.cookies.set('voucher_token', '', { path: '/api/voucher', maxAge: 0 })
    res.cookies.set('voucher_booking_id', '', { path: '/api/voucher', maxAge: 0 })
    return res
  } catch (e) {
    console.error('[voucher] Error:', e)
    const message = e instanceof Error ? e.message : 'Failed to generate voucher'
    return NextResponse.json(
      { error: 'Voucher generation failed', details: message },
      { status: 500 }
    )
  }
}
