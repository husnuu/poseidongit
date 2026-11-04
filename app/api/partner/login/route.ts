import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { rateLimitResponse } from '@/lib/rateLimit'
import { partnerSetupErrorMessage } from '@/lib/partner/partners'
import {
  PARTNER_SESSION_COOKIE,
  PARTNER_SESSION_MAX_AGE_SEC,
  isPartnerSessionConfigured,
  partnerSessionCookieOptions,
  signPartnerSessionToken,
} from '@/lib/partner/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const INVALID = 'E-posta veya şifre hatalı.'
/** Kullanıcı yoksa da bcrypt çalışsın: yanıt süresi e-postanın kayıtlı olup olmadığını ele vermesin. */
const DUMMY_HASH = '$2b$10$0uR4NVZwd.n5rNWgyl313OkXH.9Q0OHOewGATXtkhlvuqb9v8e65y'

export async function POST(request: Request) {
  try {
    const limited = await rateLimitResponse(request, 'partnerLogin')
    if (limited) return limited
    if (!isPartnerSessionConfigured()) {
      return NextResponse.json({ error: 'Partner girişi sunucuda yapılandırılmamış (PARTNER_JWT_SECRET).' }, { status: 503 })
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre gerekli.' }, { status: 400 })
    }

    const { data: row, error } = await supabase
      .from('partners')
      .select('id, password_hash, is_active')
      .eq('email', email)
      .maybeSingle()
    if (error) throw new Error(error.message)

    const matches = await bcrypt.compare(password, row?.password_hash || DUMMY_HASH)
    if (!row || !matches) return NextResponse.json({ error: INVALID }, { status: 401 })
    if (!row.is_active) {
      return NextResponse.json({ error: 'Bu partner hesabı pasif. Lütfen Poseidon ile iletişime geçin.' }, { status: 403 })
    }

    const jar = await cookies()
    jar.set(
      PARTNER_SESSION_COOKIE,
      await signPartnerSessionToken(String(row.id)),
      partnerSessionCookieOptions(PARTNER_SESSION_MAX_AGE_SEC)
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('POST /api/partner/login', e)
    return NextResponse.json({ error: partnerSetupErrorMessage(e) }, { status: 500 })
  }
}
