import { NextRequest, NextResponse } from 'next/server'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import sharp from 'sharp'
import { renderOgImage } from '@/lib/og/ogImage'

export const runtime = 'nodejs'

/** Metinler sınırlanır: görsel taşmasın ve uç nokta keyfi uzun yazı üretmesin. */
function clip(v: string | null, max: number): string {
  return (v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

/**
 * GET /api/og?title=…&kicker=…&locale=tr — markalı paylaşım görseli (JPEG).
 * URL'yi lib/seo/ogImageUrl.ts üretir; aynı URL CDN'de uzun süre önbelleklenir.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const title = clip(sp.get('title'), 110)
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
  const rawLocale = sp.get('locale') ?? 'tr'
  const locale: SiteLocale = isSiteLocale(rawLocale) ? rawLocale : 'tr'
  try {
    const img = await renderOgImage({ title, kicker: clip(sp.get('kicker'), 40) || undefined, locale })
    // Fotoğraflı PNG ~1,3 MB oluyor; WhatsApp önizlemeleri ~300 KB üstünü
    // göstermeyebiliyor. JPEG'e çevirince ~100–150 KB.
    const png = Buffer.from(await img.arrayBuffer())
    const jpg = await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer()
    return new NextResponse(new Uint8Array(jpg), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400',
      },
    })
  } catch (e) {
    console.error('[og] render failed', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'render failed' }, { status: 500 })
  }
}
