import { NextResponse } from 'next/server'
import { rateLimitResponse } from '@/lib/rateLimit'
import { requireCrewSession } from '@/lib/crew/crewSession'
import { createOrAppendWalkInOrder, type BarOrderItem } from '@/lib/crew/barOrders'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function parseItems(raw: unknown): BarOrderItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null
  const out: BarOrderItem[] = []
  for (const x of raw) {
    if (!x || typeof x !== 'object') return null
    const o = x as Record<string, unknown>
    const title = typeof o.title === 'string' ? o.title.trim().slice(0, 120) : ''
    const price = Number(o.price)
    const qty = Number(o.qty)
    if (!title || !Number.isFinite(price) || price < 0 || !Number.isFinite(qty) || qty <= 0) return null
    out.push({ title, price, qty: Math.round(qty) })
  }
  return out
}

export async function POST(request: Request) {
  const limited = await rateLimitResponse(request, 'crewAction')
  if (limited) return limited
  if (!(await requireCrewSession(request))) {
    return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }
  const b = (body ?? {}) as Record<string, unknown>
  const tourId = typeof b.tourId === 'string' ? b.tourId.trim() : ''
  const tourTitle = typeof b.tourTitle === 'string' ? b.tourTitle.trim() : ''
  const tripDate = typeof b.tripDate === 'string' ? b.tripDate.trim() : ''
  const tripTime = typeof b.tripTime === 'string' && b.tripTime.trim() ? b.tripTime.trim() : null
  const guestLabel = typeof b.guestLabel === 'string' ? b.guestLabel.trim().slice(0, 120) : ''
  const items = parseItems(b.items)

  if (!tourId || !tourTitle || !tripDate || !items) {
    return NextResponse.json({ error: 'Eksik veya geçersiz sipariş bilgisi' }, { status: 400 })
  }

  const order = await createOrAppendWalkInOrder({
    tourId,
    tourTitle,
    tripDate,
    tripTime,
    guestLabel: guestLabel || 'Misafir',
    items,
  })
  if (!order) {
    return NextResponse.json({ error: 'Sipariş oluşturulamadı' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, order })
}
