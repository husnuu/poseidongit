import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { rateLimitResponse } from '@/lib/rateLimit'
import { getBaseUrl } from '@/lib/seo'
import { PARTNER_SLUG_REGEX } from '@/lib/partner/partners'
import { partnerShareUrl } from '@/lib/partner/links'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Mini sayfanın QR kodu (PNG). Yalnızca herkese açık adresi kodlar; baskıya uygun boyutta. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const limited = await rateLimitResponse(request, 'qr')
  if (limited) return limited

  const { slug } = await params
  if (!PARTNER_SLUG_REGEX.test(slug)) {
    return NextResponse.json({ error: 'Geçersiz partner' }, { status: 400 })
  }
  const buffer = await QRCode.toBuffer(partnerShareUrl(getBaseUrl(), slug, 'qr'), {
    type: 'png',
    width: 1024,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#131719', light: '#ffffff' },
  })
  const download = request.nextUrl.searchParams.get('download') === '1'
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
      ...(download && { 'Content-Disposition': `attachment; filename="poseidon-qr-${slug}.png"` }),
    },
  })
}
