import { NextResponse } from 'next/server'
import { getAuthToken, getAdminEmail, requireAdmin } from '@/lib/adminAuth'
import { testProxyIP } from '@/lib/proxyClient'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Fixie / çıkış IP testi.
 * - Geliştirme: tarayıcıdan GET yeterli (http://localhost:3002/api/debug/proxy-ip)
 * - Production: Authorization: Bearer <ADMIN_TOKEN> ve gerekirse X-Admin-Email
 */
export async function GET(request: Request) {
  const dev = process.env.NODE_ENV === 'development'
  if (!dev) {
    const token = getAuthToken(request)
    const email = getAdminEmail(request)
    if (!requireAdmin(token, email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const fixieUrlConfigured = Boolean(process.env.FIXIE_URL?.trim())

  try {
    const { ip } = await testProxyIP()
    return NextResponse.json({
      ip,
      fixieUrlConfigured,
      message: fixieUrlConfigured
        ? 'Bu IP Fixie panelinde gördüğünüz statik çıkış IP’si ile aynı olmalı.'
        : 'FIXIE_URL tanımlı değil; gördüğünüz IP makineniz / Vercel’in çıkış IP’sidir.',
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Bilinmeyen hata'
    return NextResponse.json(
      {
        error: 'ipify veya proxy bağlantısı başarısız',
        detail: msg,
        fixieUrlConfigured,
      },
      { status: 502 }
    )
  }
}
