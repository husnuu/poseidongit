import { NextResponse } from 'next/server'
import { authorizeAdmin } from '@/lib/adminAuthServer'
import { getOutboundHttpsProxyUrl, testProxyIP } from '@/lib/proxyClient'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Fixie / çıkış IP testi.
 * - Geliştirme: tarayıcıdan GET yeterli
 * - Production: Bearer ADMIN_TOKEN (+ gerekirse X-Admin-Email) VEYA
 *   FIXIE_IP_DEBUG_SECRET tanımlıysa: ?secret=aynı_değer (tarayıcı; URL loglanabilir, test sonrası secret’ı silin)
 */
export async function GET(request: Request) {
  const dev = process.env.NODE_ENV === 'development'
  if (!dev) {
    const adminOk = await authorizeAdmin(request)
    const debugSecret = process.env.FIXIE_IP_DEBUG_SECRET?.trim()
    const provided = new URL(request.url).searchParams.get('secret')?.trim()
    const secretOk = Boolean(
      debugSecret && provided && debugSecret.length > 0 && debugSecret === provided
    )
    if (!adminOk && !secretOk) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const outboundProxyConfigured = Boolean(getOutboundHttpsProxyUrl())

  try {
    const { ip } = await testProxyIP()
    return NextResponse.json({
      ip,
      outboundProxyConfigured,
      fixieUrlConfigured: outboundProxyConfigured,
      message: outboundProxyConfigured
        ? 'Bu IP FIXIE_URL (Fixie) üzerinden çıkıyorsa bankanın whitelist sabit IP’leri ile eşleşmeli.'
        : 'FIXIE_URL tanımlı değil; gördüğünüz IP makineniz / hosting çıkış IP’sidir.',
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Bilinmeyen hata'
    return NextResponse.json(
      {
        error: 'ipify veya proxy bağlantısı başarısız',
        detail: msg,
        outboundProxyConfigured,
        fixieUrlConfigured: outboundProxyConfigured,
      },
      { status: 502 }
    )
  }
}
