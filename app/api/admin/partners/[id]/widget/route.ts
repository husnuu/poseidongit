import { NextResponse } from 'next/server'
import { authorizeAdmin } from '@/lib/adminAuthServer'
import { normalizeWidgetDomain } from '@/lib/embed/frameAncestors'
import { getPartnerAccountById, getPartnerWidgetDomains, setPartnerWidgetDomains } from '@/lib/partner/partners'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

/** Widget'ın açılabileceği alan adları (boş liste → her sitede açılır). */
export async function GET(request: Request, { params }: RouteContext) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  }
  const { id } = await params
  return NextResponse.json(await getPartnerWidgetDomains(id))
}

export async function PUT(request: Request, { params }: RouteContext) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  }
  try {
    const { id } = await params
    const body = (await request.json().catch(() => null)) as { domains?: unknown } | null
    const entries = typeof body?.domains === 'string' ? body.domains.split(/[\s,]+/).filter(Boolean) : []
    const invalid = entries.filter((e) => !normalizeWidgetDomain(e))
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Geçersiz alan adı: ${invalid.slice(0, 3).join(', ')}` }, { status: 400 })
    }
    const domains = [...new Set(entries.map((e) => normalizeWidgetDomain(e)!))]
    if (domains.length > 20) {
      return NextResponse.json({ error: 'En fazla 20 alan adı girilebilir.' }, { status: 400 })
    }
    if (!(await getPartnerAccountById(id))) {
      return NextResponse.json({ error: 'Partner bulunamadı' }, { status: 404 })
    }
    await setPartnerWidgetDomains(id, domains)
    return NextResponse.json({ domains, configured: true })
  } catch (e) {
    console.error('PUT /api/admin/partners/[id]/widget', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Kaydedilemedi' }, { status: 500 })
  }
}
