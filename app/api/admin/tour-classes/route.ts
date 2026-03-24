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
      mealMenu?: {
        enabled?: boolean
        sectionTitle?: string
        description?: string
        options?: Array<{ key?: string; label?: string }>
      }
    } | null>(tourClassesForAdminQuery, { tourId })
    if (!tour) {
      return NextResponse.json({ error: 'Tur bulunamadı' }, { status: 404 })
    }
    const classes = (tour.ticketClasses ?? []).map((c) => ({
      id: c.key,
      label: c.label || c.key,
    }))
    const mealOpts = (tour.mealMenu?.options ?? []).filter((o) => o.key?.trim() && o.label?.trim())
    const mealMenu =
      tour.mealMenu?.enabled && mealOpts.length > 0
        ? {
            enabled: true,
            sectionTitle: tour.mealMenu.sectionTitle?.trim() || 'Yemek tercihi',
            description: tour.mealMenu.description?.trim() || undefined,
            options: mealOpts.map((o) => ({ key: o.key!.trim(), label: o.label!.trim() })),
          }
        : { enabled: false as const, options: [] as { key: string; label: string }[] }

    return NextResponse.json({
      tourId: tour._id,
      tourTitle: tour.title,
      classes,
      mealMenu,
    })
  } catch (e) {
    console.error('GET /api/admin/tour-classes error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
