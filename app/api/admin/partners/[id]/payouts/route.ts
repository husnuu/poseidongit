import { NextResponse } from 'next/server'
import { authorizeAdmin } from '@/lib/adminAuthServer'
import { supabase } from '@/lib/supabase'
import { todayStrIstanbul } from '@/lib/istanbulTime'
import { summarizePartner } from '@/lib/partner/commission'
import { fetchPartnerBookings, fetchPartnerPayouts } from '@/lib/partner/partners'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

function periodFrom(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : null
}

/** Ayın komisyonunu "ödendi" işaretler. Tutar istemciden alınmaz: o anki hesaptan yazılır. */
export async function POST(request: Request, { params }: RouteContext) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  }
  const { id } = await params
  const body = (await request.json().catch(() => null)) as { period?: unknown } | null
  const period = periodFrom(body?.period)
  if (!period) return NextResponse.json({ error: 'Geçersiz ay' }, { status: 400 })

  const [rows, payouts] = await Promise.all([fetchPartnerBookings(id), fetchPartnerPayouts(id)])
  const month = summarizePartner(rows, payouts, todayStrIstanbul()).months.find((m) => m.period === period)
  if (!month || month.commission <= 0) {
    return NextResponse.json({ error: 'Bu ay için ödenecek komisyon yok.' }, { status: 400 })
  }
  const { error } = await supabase
    .from('partner_payouts')
    .upsert({ partner_id: id, period, amount: month.commission }, { onConflict: 'partner_id,period' })
  if (error) {
    console.error('POST payouts', error.message)
    return NextResponse.json({ error: 'Kaydedilemedi' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

/** Yanlış işaretlenen ödemeyi geri alır. */
export async function DELETE(request: Request, { params }: RouteContext) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  }
  const { id } = await params
  const period = periodFrom(new URL(request.url).searchParams.get('period'))
  if (!period) return NextResponse.json({ error: 'Geçersiz ay' }, { status: 400 })
  const { error } = await supabase.from('partner_payouts').delete().eq('partner_id', id).eq('period', period)
  if (error) {
    console.error('DELETE payouts', error.message)
    return NextResponse.json({ error: 'Silinemedi' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
