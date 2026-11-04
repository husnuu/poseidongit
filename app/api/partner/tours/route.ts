import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { getPartnerFromSession } from '@/lib/partner/session'
import { isPrivateTour } from '@/lib/sanity/privateTour'
import { applySinglePriceMode } from '@/lib/sanity/singlePrice'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type TourRow = {
  _id: string
  title?: string | null
  privateTour?: boolean | null
  privateTourPrice?: number | null
  singlePrice?: boolean | null
  cashPaymentEnabled?: boolean | null
  ticketClasses?: { key?: string | null; label?: string | null }[] | null
}

/** Resepsiyon satış formu için tur + sınıf listesi. Fiyat sunucuda hesaplanır. */
export async function GET() {
  if (!(await getPartnerFromSession())) {
    return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
  }
  try {
    const rows = await client.fetch<TourRow[]>(
      `*[_type == "tour" && defined(slug.current) && !(_id in path("drafts.**"))] | order(title asc) {
        _id, title, privateTour, privateTourPrice, singlePrice, cashPaymentEnabled, ticketClasses[]{ key, label }
      }`
    )
    return NextResponse.json({
      tours: (rows ?? []).map((row) => {
        const tour = applySinglePriceMode(row)
        const priv = isPrivateTour(row)
        return {
          id: tour._id,
          title: tour.title ?? '',
          kind: priv ? 'private' : tour.cashPaymentEnabled ? 'cash' : 'online',
          // First Class loca seçimi gerektirir: müşteri bu sınıfı mini sayfadan alır.
          classes: priv
            ? []
            : (tour.ticketClasses ?? [])
                .filter((c) => c.key && !c.key.toLowerCase().startsWith('first'))
                .map((c) => ({ key: c.key as string, label: c.label || (c.key as string) })),
        }
      }),
    })
  } catch (e) {
    console.error('GET /api/partner/tours', e)
    return NextResponse.json({ error: 'Turlar yüklenemedi' }, { status: 500 })
  }
}
