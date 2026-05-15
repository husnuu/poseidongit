/**
 * POST /api/admin/agent/login
 * Biletçi paneli: AGENT_LOGIN_EMAIL + şifre → JWT (Bearer + X-Admin-Email ile API).
 */
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import bcrypt from 'bcryptjs'
import { rateLimitResponse } from '@/lib/rateLimit'
import { signAgentSessionToken } from '@/lib/agentSession'
import { isAgentEmailAllowed } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function timingSafeEqualPlain(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

function verifyAgentPassword(plain: string): boolean {
  const hash = process.env.AGENT_PASSWORD_HASH?.trim()
  if (hash && hash.startsWith('$2')) {
    try {
      return bcrypt.compareSync(plain, hash)
    } catch {
      return false
    }
  }
  const plainEnv = process.env.AGENT_LOGIN_PASSWORD
  if (typeof plainEnv === 'string' && plainEnv.length > 0) {
    return timingSafeEqualPlain(plain, plainEnv)
  }
  return false
}

export async function POST(request: NextRequest) {
  try {
    const limited = await rateLimitResponse(request, 'adminLogin')
    if (limited) return limited

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
    }
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
    }
    const rec = body as Record<string, unknown>
    const email = typeof rec.email === 'string' ? rec.email.trim().toLowerCase() : ''
    const password = typeof rec.password === 'string' ? rec.password : ''

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre gerekli.' }, { status: 400 })
    }

    const configuredEmail = process.env.AGENT_LOGIN_EMAIL?.trim().toLowerCase()
    if (!configuredEmail) {
      console.error('[agent/login] AGENT_LOGIN_EMAIL tanımlı değil')
      return NextResponse.json(
        { error: 'Biletçi girişi sunucuda yapılandırılmamış (AGENT_LOGIN_EMAIL).' },
        { status: 503 }
      )
    }

    if (!process.env.AGENT_JWT_SECRET?.trim() || process.env.AGENT_JWT_SECRET.trim().length < 24) {
      console.error('[agent/login] AGENT_JWT_SECRET eksik veya çok kısa')
      return NextResponse.json(
        { error: 'Biletçi oturumu sunucuda yapılandırılmamış (AGENT_JWT_SECRET).' },
        { status: 503 }
      )
    }

    if (email !== configuredEmail) {
      return NextResponse.json({ error: 'E-posta veya şifre hatalı.' }, { status: 401 })
    }

    if (!isAgentEmailAllowed(email)) {
      return NextResponse.json({ error: 'E-posta veya şifre hatalı.' }, { status: 401 })
    }

    const hasPw =
      (!!process.env.AGENT_PASSWORD_HASH?.trim() && process.env.AGENT_PASSWORD_HASH.trim().startsWith('$2')) ||
      !!process.env.AGENT_LOGIN_PASSWORD?.trim()
    if (!hasPw) {
      console.error('[agent/login] AGENT_PASSWORD_HASH veya AGENT_LOGIN_PASSWORD tanımlı değil')
      return NextResponse.json(
        { error: 'Biletçi şifresi sunucuda yapılandırılmamış (AGENT_PASSWORD_HASH veya AGENT_LOGIN_PASSWORD).' },
        { status: 503 }
      )
    }

    const okPass = verifyAgentPassword(password)
    if (!okPass) {
      return NextResponse.json({ error: 'E-posta veya şifre hatalı.' }, { status: 401 })
    }

    const token = await signAgentSessionToken(email)
    return NextResponse.json({ ok: true, token, email })
  } catch (e) {
    console.error('[agent/login]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
