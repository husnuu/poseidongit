import { NextRequest, NextResponse } from 'next/server'
import { wikimediaStaticMapUrl } from '@/lib/staticMap'

export const dynamic = 'force-dynamic'

/**
 * Toplanma noktası statik harita görseli proxy'si.
 * E-posta istemcileri (Gmail/Outlook) <img> için Wikimedia'yı doğrudan
 * hotlink edemez (User-Agent politikası); bu route sunucu tarafında
 * uygun User-Agent ile isteği yapıp PNG'yi döner.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const lat = Number(searchParams.get('lat'))
  const lng = Number(searchParams.get('lng'))
  const w = Math.min(Math.max(Number(searchParams.get('w')) || 600, 100), 1200)
  const h = Math.min(Math.max(Number(searchParams.get('h')) || 260, 100), 600)
  const z = Math.min(Math.max(Number(searchParams.get('z')) || 15, 3), 18)

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: 'Geçersiz koordinat' }, { status: 400 })
  }

  const upstreamUrl = wikimediaStaticMapUrl(lat, lng, { width: w, height: h, zoom: z })

  try {
    const ctrl = new AbortController()
    const kill = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(upstreamUrl, {
      signal: ctrl.signal,
      headers: {
        'User-Agent':
          `${process.env.NEXT_PUBLIC_SITE_NAME?.trim() || 'PoseidonBooking'}/1.0 (${process.env.SUPPORT_EMAIL?.trim() || 'turkeycesme@hotmail.com'})`,
      },
    }).finally(() => clearTimeout(kill))
    if (!res.ok) {
      return NextResponse.json({ error: 'Harita alınamadı' }, { status: 502 })
    }
    const bytes = await res.arrayBuffer()
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Harita alınamadı' }, { status: 502 })
  }
}
