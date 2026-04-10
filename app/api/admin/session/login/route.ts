import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { rateLimitResponse } from '@/lib/rateLimit'
import { verifyAdminLoginPanelToken } from '@/lib/adminLoginPanelToken'
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SEC,
  adminSessionCookieOptions,
  signAdminSessionToken,
} from '@/lib/adminSession'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const limited = await rateLimitResponse(request, 'adminLogin')
    if (limited) return limited

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
    }
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
    }
    const b = body as Record<string, unknown>
    const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : ''
    const password = typeof b.password === 'string' ? b.password : ''
    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre gerekli' }, { status: 400 })
    }

    if (!verifyAdminLoginPanelToken(b.panelToken)) {
      return NextResponse.json({ error: 'E-posta, şifre veya panel anahtarı hatalı' }, { status: 401 })
    }

    const { data: row, error } = await supabase
      .from('admin_users')
      .select('id, email, password_hash')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('admin login admin_users:', error.message)
      return NextResponse.json({ error: 'Giriş şu an yapılamıyor' }, { status: 500 })
    }
    const hash =
      row && typeof row.password_hash === 'string' ? row.password_hash : ''
    const id = row && typeof row.id === 'string' ? row.id : ''
    const rowEmail = row && typeof row.email === 'string' ? row.email.trim().toLowerCase() : email

    if (!id || !hash || !bcrypt.compareSync(password, hash)) {
      return NextResponse.json({ error: 'E-posta, şifre veya panel anahtarı hatalı' }, { status: 401 })
    }

    const token = await signAdminSessionToken({ sub: id, email: rowEmail })
    const jar = await cookies()
    jar.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions(ADMIN_SESSION_MAX_AGE_SEC))

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('ADMIN_JWT_SECRET')) {
      return NextResponse.json({ error: 'Sunucu yapılandırması eksik (ADMIN_JWT_SECRET)' }, { status: 500 })
    }
    console.error('POST /api/admin/session/login', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
