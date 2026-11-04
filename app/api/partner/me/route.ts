import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/seo'
import { todayStrIstanbul } from '@/lib/istanbulTime'
import { summarizePartner, toBookingView } from '@/lib/partner/commission'
import { fetchPartnerBookings, fetchPartnerPayouts, partnerSetupErrorMessage } from '@/lib/partner/partners'
import { getPartnerFromSession } from '@/lib/partner/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Partner panelinin tüm verisi. Misafir iletişim bilgileri yanıtta yer almaz. */
export async function GET() {
  try {
    const partner = await getPartnerFromSession()
    if (!partner) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

    const today = todayStrIstanbul()
    const [rows, payouts] = await Promise.all([
      fetchPartnerBookings(partner.id),
      fetchPartnerPayouts(partner.id),
    ])
    return NextResponse.json({
      partner: {
        slug: partner.slug,
        name: partner.name,
        email: partner.email,
        commissionRate: partner.commissionRate,
        logoData: partner.logoData,
      },
      baseUrl: getBaseUrl(),
      summary: summarizePartner(rows, payouts, today),
      bookings: rows.map((row) => toBookingView(row, today)),
    })
  } catch (e) {
    console.error('GET /api/partner/me', e)
    return NextResponse.json({ error: partnerSetupErrorMessage(e) }, { status: 500 })
  }
}
