import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { PARTNER_SESSION_COOKIE, partnerSessionCookieOptions } from '@/lib/partner/session'

export const dynamic = 'force-dynamic'

export async function POST() {
  const jar = await cookies()
  jar.set(PARTNER_SESSION_COOKIE, '', partnerSessionCookieOptions(0))
  return NextResponse.json({ ok: true })
}
