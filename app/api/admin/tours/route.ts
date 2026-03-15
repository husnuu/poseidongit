import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { toursListForAdminQuery } from '@/lib/queries'

import { getAuthToken, getAdminEmail, requireAdminOrAgent } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const token = getAuthToken(request)
  const email = getAdminEmail(request)
  if (!requireAdminOrAgent(token, email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const tours = await client.fetch<{ _id: string; title: string; slug: string | null }[]>(
      toursListForAdminQuery
    )
    const list = (tours ?? []).map((t) => ({
      id: t._id,
      title: t.title ?? '',
      slug: t.slug ?? null,
    }))
    return NextResponse.json({ tours: list })
  } catch (e) {
    console.error('GET /api/admin/tours error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
