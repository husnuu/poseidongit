import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { rateLimitResponse } from '@/lib/rateLimit'
import { getBaseUrl } from '@/lib/seo'
import { validateBookingAccessToken } from '@/lib/bookingAccessToken'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getVoucherUrl(bookingId: string, token: string): string {
  const base = getBaseUrl().replace(/\/$/, '')
  return `${base}/api/voucher/access?bookingId=${encodeURIComponent(bookingId)}&token=${encodeURIComponent(token)}`
}

/** GET /api/qr?bookingId=xxx&token=xxx — bilet doğrulama QR kodu PNG döndürür. Token gerekli. */
export async function GET(request: NextRequest) {
  try {
    const limited = await rateLimitResponse(request, 'qr')
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')?.trim()
    const token = searchParams.get('token')?.trim()

    if (!bookingId || !token) {
      return NextResponse.json(
        { error: 'bookingId ve token gerekli' },
        { status: 400 }
      )
    }

    const valid = await validateBookingAccessToken(bookingId, token)
    if (!valid) {
      return NextResponse.json({ error: 'Forbidden. Valid token required.' }, { status: 403 })
    }

    const voucherUrl = getVoucherUrl(bookingId, token)
    const buffer = await QRCode.toBuffer(voucherUrl, {
      type: 'png',
      width: 240,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (e) {
    console.error('[qr] Error:', e)
    return NextResponse.json(
      { error: 'QR oluşturulamadı' },
      { status: 500 }
    )
  }
}
