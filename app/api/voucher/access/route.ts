/**
 * Token ile bilet PDF erişimi: token doğrulanır, cookie'ye yazılır, /api/voucher'a yönlendirilir.
 * E-posta veya tarayıcı query parametrelerini sildiğinde cookie sayesinde PDF açılır.
 */
import { NextRequest, NextResponse } from 'next/server'
import { validateBookingAccessToken } from '@/lib/bookingAccessToken'
import { getEmailBaseUrl } from '@/lib/siteUrls'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const COOKIE_MAX_AGE = 120 // 2 dakika
const COOKIE_OPTS = {
  path: '/api/voucher',
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: COOKIE_MAX_AGE,
  secure: process.env.NODE_ENV === 'production',
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const bookingId = searchParams.get('bookingId')?.trim()
  let token = searchParams.get('token')?.trim() ?? ''
  const download = searchParams.get('download') === '1'

  if (token && token.includes(' ')) {
    token = token.replace(/ /g, '+')
  }

  if (!bookingId || !token) {
    return NextResponse.json(
      { error: 'Eksik rezervasyon veya token. Lütfen e-postanızdaki veya Rezervasyonumu Yönet sayfasındaki linki kullanın.' },
      { status: 400 }
    )
  }

  const valid = await validateBookingAccessToken(bookingId, token)
  if (!valid) {
    return NextResponse.json(
      { error: 'Bilet linki geçersiz veya süresi dolmuş. Lütfen e-postanızdaki linki veya Rezervasyonumu Yönet sayfasını kullanın.' },
      { status: 403 }
    )
  }

  const base = getEmailBaseUrl().replace(/\/$/, '')
  const voucherUrl = `${base}/api/voucher?bookingId=${encodeURIComponent(bookingId)}${download ? '&download=1' : ''}`

  const res = NextResponse.redirect(voucherUrl, 302)
  res.cookies.set('voucher_token', token, COOKIE_OPTS)
  res.cookies.set('voucher_booking_id', bookingId, COOKIE_OPTS)
  return res
}
