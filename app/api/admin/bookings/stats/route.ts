import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { paxCountFromRow, type SupabaseBookingRow } from '@/lib/bookingsSupabase'

const ACTIVE_STATUSES = ['pending', 'paid', 'confirmed']

import { authorizeAdmin } from '@/lib/adminAuthServer'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const today = new Date().toISOString().slice(0, 10)
    const [totalCountResult, todayCountResult, manualCountResult, revenueRowsResult, todayRowsResult] = await Promise.all([
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('date', today),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('source', 'manual'),
      supabase.from('bookings').select('status, total_price').in('status', ['pending', 'paid', 'confirmed']),
      supabase
        .from('bookings')
        .select('status, adult_count, child_count, infant_count')
        .eq('date', today)
        .in('status', ACTIVE_STATUSES),
    ])
    if (totalCountResult.error) throw new Error(`Supabase total count failed: ${totalCountResult.error.message}`)
    if (todayCountResult.error) throw new Error(`Supabase today count failed: ${todayCountResult.error.message}`)
    if (manualCountResult.error) throw new Error(`Supabase manual count failed: ${manualCountResult.error.message}`)
    if (revenueRowsResult.error) throw new Error(`Supabase revenue query failed: ${revenueRowsResult.error.message}`)
    if (todayRowsResult.error) throw new Error(`Supabase occupancy query failed: ${todayRowsResult.error.message}`)

    const totalBookings = totalCountResult.count ?? 0
    const todayBookings = todayCountResult.count ?? 0
    const manualBookings = manualCountResult.count ?? 0
    const onlineBookings = Math.max(0, totalBookings - manualBookings)

    let totalRevenue = 0
    ;((revenueRowsResult.data ?? []) as SupabaseBookingRow[]).forEach((row) => {
      if (row.status === 'cancelled') return
      totalRevenue += Number(row.total_price ?? 0)
    })

    let todayOccupancy = 0
    ;((todayRowsResult.data ?? []) as SupabaseBookingRow[]).forEach((row) => {
      todayOccupancy += paxCountFromRow(row)
    })

    return NextResponse.json({
      totalBookings,
      todayBookings,
      totalRevenue,
      todayOccupancy,
      currency: 'TRY',
      onlineBookings,
      manualBookings,
    })
  } catch (e) {
    console.error('GET /api/admin/bookings/stats error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
