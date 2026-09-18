import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { rateLimitResponse } from '@/lib/rateLimit'
import {
  CREW_SESSION_COOKIE,
  CREW_SESSION_MAX_AGE_SEC,
  crewSessionCookieOptions,
  signCrewSessionToken,
} from '@/lib/crew/crewSession'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const limited = await rateLimitResponse(request, 'crewLogin')
    if (limited) return limited

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
    }
    const password = body && typeof body === 'object' ? (body as Record<string, unknown>).password : undefined
    const code = typeof password === 'string' ? password : ''

    const expected = process.env.CREW_ACCESS_CODE?.trim()
    if (!expected) {
      return NextResponse.json({ error: 'Sunucu yapılandırması eksik (CREW_ACCESS_CODE)' }, { status: 500 })
    }
    if (!code || code !== expected) {
      return NextResponse.json({ error: 'Erişim kodu hatalı' }, { status: 401 })
    }

    const token = await signCrewSessionToken()
    const jar = await cookies()
    jar.set(CREW_SESSION_COOKIE, token, crewSessionCookieOptions(CREW_SESSION_MAX_AGE_SEC))

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('CREW_JWT_SECRET')) {
      return NextResponse.json({ error: 'Sunucu yapılandırması eksik (CREW_JWT_SECRET)' }, { status: 500 })
    }
    console.error('POST /api/crew/login', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
