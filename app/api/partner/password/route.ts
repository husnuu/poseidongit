import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { rateLimitResponse } from '@/lib/rateLimit'
import {
  PARTNER_SESSION_COOKIE,
  PARTNER_SESSION_MAX_AGE_SEC,
  getPartnerFromSession,
  partnerSessionCookieOptions,
  signPartnerSessionToken,
} from '@/lib/partner/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const limited = await rateLimitResponse(request, 'partnerLogin')
  if (limited) return limited
  const partner = await getPartnerFromSession()
  if (!partner) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const current = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
  const next = typeof body?.newPassword === 'string' ? body.newPassword : ''
  if (next.length < 8) return NextResponse.json({ error: 'Yeni şifre en az 8 karakter olmalı.' }, { status: 400 })

  const { data, error } = await supabase.from('partners').select('password_hash').eq('id', partner.id).maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  if (!(await bcrypt.compare(current, String(data.password_hash)))) {
    return NextResponse.json({ error: 'Mevcut şifre hatalı.' }, { status: 401 })
  }

  // JWT iat saniye hassasiyetinde: yeni token'ın eski sayılmaması için önce tarih, sonra token.
  const { error: updateError } = await supabase
    .from('partners')
    .update({ password_hash: await bcrypt.hash(next, 10), password_changed_at: new Date().toISOString() })
    .eq('id', partner.id)
  if (updateError) return NextResponse.json({ error: 'Şifre güncellenemedi.' }, { status: 500 })

  const jar = await cookies()
  jar.set(
    PARTNER_SESSION_COOKIE,
    await signPartnerSessionToken(partner.id),
    partnerSessionCookieOptions(PARTNER_SESSION_MAX_AGE_SEC)
  )
  return NextResponse.json({ ok: true })
}
