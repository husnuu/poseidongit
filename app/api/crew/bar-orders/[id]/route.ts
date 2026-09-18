import { NextResponse } from 'next/server'
import { rateLimitResponse } from '@/lib/rateLimit'
import { requireCrewSession } from '@/lib/crew/crewSession'
import { markOrderPaid, updateOrderStatus } from '@/lib/crew/barOrders'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await rateLimitResponse(request, 'crewAction')
  if (limited) return limited
  if (!(await requireCrewSession(request))) {
    return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
  }

  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }
  const b = (body ?? {}) as Record<string, unknown>
  const action = b.action

  if (action === 'preparing' || action === 'served') {
    const order = await updateOrderStatus(id, action)
    if (!order) return NextResponse.json({ error: 'Güncellenemedi' }, { status: 500 })
    return NextResponse.json({ ok: true, order })
  }

  if (action === 'pay') {
    const method = b.method === 'cash' || b.method === 'card' ? b.method : null
    if (!method) return NextResponse.json({ error: 'Ödeme yöntemi gerekli' }, { status: 400 })
    const order = await markOrderPaid(id, method)
    if (!order) return NextResponse.json({ error: 'Güncellenemedi' }, { status: 500 })
    return NextResponse.json({ ok: true, order })
  }

  return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
}
