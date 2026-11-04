import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { authorizeAdmin } from '@/lib/adminAuthServer'
import { getBaseUrl } from '@/lib/seo'
import { supabase } from '@/lib/supabase'
import { todayStrIstanbul } from '@/lib/istanbulTime'
import { summarizePartner } from '@/lib/partner/commission'
import { createPartnerSchema, partnerColumns } from '@/lib/partner/adminSchema'
import {
  fetchPartnerBookings,
  fetchPartnerPayouts,
  listPartnerAccounts,
  partnerSetupErrorMessage,
} from '@/lib/partner/partners'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Partner listesi ve performans karşılaştırması. */
export async function GET(request: Request) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  }
  try {
    const [partners, rows, payouts] = await Promise.all([
      listPartnerAccounts(),
      fetchPartnerBookings(),
      fetchPartnerPayouts(),
    ])
    const today = todayStrIstanbul()
    return NextResponse.json({
      baseUrl: getBaseUrl(),
      partners: partners.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        type: p.type,
        email: p.email,
        commissionRate: p.commissionRate,
        isActive: p.isActive,
        totals: summarizePartner(
          rows.filter((r) => r.partner_id === p.id),
          payouts.filter((x) => x.partner_id === p.id),
          today
        ).totals,
      })),
    })
  } catch (e) {
    console.error('GET /api/admin/partners', e)
    return NextResponse.json({ error: partnerSetupErrorMessage(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  }
  const parsed = createPartnerSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Geçersiz istek' }, { status: 400 })
  }
  try {
    const { slug, password, ...fields } = parsed.data
    const { data, error } = await supabase
      .from('partners')
      .insert({ ...partnerColumns(fields), slug, password_hash: await bcrypt.hash(password, 10) })
      .select('id')
      .single()
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Bu e-posta veya bağlantı adı zaten kullanılıyor.' }, { status: 409 })
    }
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, id: data.id })
  } catch (e) {
    console.error('POST /api/admin/partners', e)
    return NextResponse.json({ error: partnerSetupErrorMessage(e) }, { status: 500 })
  }
}
