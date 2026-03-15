import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { tourClassesForAdminQuery } from '@/lib/queries'

import { getAuthToken, getAdminEmail, requireAdminOrAgent } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = getAuthToken(request)
  const email = getAdminEmail(request)
  if (!requireAdminOrAgent(token, email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tourId = request.nextUrl.searchParams.get('tourId')?.trim()
  if (!tourId) {
    return NextResponse.json({ error: 'tourId gerekli' }, { status: 400 })
  }
  try {
    const tour = await client.fetch<{
      _id: string
      title: string
      ticketClasses?: Array<{ key: string; label?: string }>
    } | null>(tourClassesForAdminQuery, { tourId })
    if (!tour) {
      return NextResponse.json({ error: 'Tur bulunamadı' }, { status: 404 })
    }
    const classes = (tour.ticketClasses ?? []).map((c) => ({
      id: c.key,
      label: c.label || c.key,
    }))
    return NextResponse.json({
      tourId: tour._id,
      tourTitle: tour.title,
      classes,
    })
  } catch (e) {
    console.error('GET /api/admin/tour-classes error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
