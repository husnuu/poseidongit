import { NextResponse } from 'next/server'
import { getIndexNowKey } from '@/lib/seo/indexNow'

/** IndexNow anahtar dosyası — arama motorları anahtarın bu siteye ait olduğunu buradan doğrular. */
export function GET() {
  const key = getIndexNowKey()
  if (!key) return new NextResponse('Not found', { status: 404 })
  return new NextResponse(key, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
