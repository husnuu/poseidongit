import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { authorizeAdmin } from '@/lib/adminAuthServer'
import { getBaseUrl } from '@/lib/seo'
import { supabase } from '@/lib/supabase'
import { todayStrIstanbul } from '@/lib/istanbulTime'
import { summarizePartner, toBookingView } from '@/lib/partner/commission'
import { partnerColumns, updatePartnerSchema } from '@/lib/partner/adminSchema'
import {
  fetchPartnerBookings,
  fetchPartnerPayouts,
  getPartnerAccountById,
  partnerSetupErrorMessage,
} from '@/lib/partner/partners'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteContext) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  }
  try {
    const { id } = await params
    const partner = await getPartnerAccountById(id)
    if (!partner) return NextResponse.json({ error: 'Partner bulunamadı' }, { status: 404 })
    const [rows, payouts] = await Promise.all([fetchPartnerBookings(id), fetchPartnerPayouts(id)])
    const today = todayStrIstanbul()
    return NextResponse.json({
      baseUrl: getBaseUrl(),
      partner,
      summary: summarizePartner(rows, payouts, today),
      bookings: rows.map((row) => toBookingView(row, today)),
    })
  } catch (e) {
    console.error('GET /api/admin/partners/[id]', e)
    return NextResponse.json({ error: partnerSetupErrorMessage(e) }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  }
  const parsed = updatePartnerSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Geçersiz istek' }, { status: 400 })
  }
  try {
    const { id } = await params
    const { password, ...fields } = parsed.data
    const updates = partnerColumns(fields)
    if (password) {
      updates.password_hash = await bcrypt.hash(password, 10)
      updates.password_changed_at = new Date().toISOString()
    }
    const { data, error } = await supabase.from('partners').update(updates).eq('id', id).select('id').maybeSingle()
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Bu e-posta başka bir partnerde kayıtlı.' }, { status: 409 })
    }
    if (error) throw new Error(error.message)
    if (!data) return NextResponse.json({ error: 'Partner bulunamadı' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PATCH /api/admin/partners/[id]', e)
    return NextResponse.json({ error: partnerSetupErrorMessage(e) }, { status: 500 })
  }
}
