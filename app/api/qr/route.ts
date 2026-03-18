import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { getBaseUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getVoucherUrl(bookingId: string): string {
  const base = getBaseUrl()
  return `${base.replace(/\/$/, '')}/api/voucher?bookingId=${encodeURIComponent(bookingId)}`
}

/** GET /api/qr?bookingId=xxx — bilet doğrulama QR kodu PNG döndürür. E-postada img src ile kullanılır. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')?.trim()

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId gerekli' },
        { status: 400 }
      )
    }

    const voucherUrl = getVoucherUrl(bookingId)
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
