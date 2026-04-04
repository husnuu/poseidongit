import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin } from '@/lib/adminAuthServer'

const FONT_URL =
  'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf'

export async function GET(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const res = await fetch(FONT_URL)
    if (!res.ok) throw new Error('Font fetch failed')
    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'font/ttf',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (e) {
    console.error('Font proxy error:', e)
    return new NextResponse('Font unavailable', { status: 502 })
  }
}
