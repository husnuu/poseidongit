import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin } from '@/lib/adminAuthServer'
import { mapBookingRowToApi, type SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { supabase } from '@/lib/supabase'
import type { AdminBookingRow } from '@/types/adminBookings'

function normalizeClassKey(classId: string): string {
  const k = (classId ?? '').toLowerCase().trim()
  if (k === 'eco' || k.startsWith('eco')) return 'eco'
  if (k === 'premium' || k.startsWith('prem')) return 'premium'
  if (k === 'first' || k.startsWith('first')) return 'first'
  return k
}

export async function GET(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const date = request.nextUrl.searchParams.get('date')?.trim().slice(0, 10) ?? ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Geçerli bir tarih gerekli (YYYY-MM-DD)' }, { status: 400 })
  }

  const classIdFilter = request.nextUrl.searchParams.get('classId')?.trim().toLowerCase() ?? ''

  try {
    const { data: rows, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', date)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: true })
      .limit(500)

    if (error) throw new Error(error.message)

    let list = ((rows ?? []) as SupabaseBookingRow[]).map(
      (row) => mapBookingRowToApi(row) as unknown as AdminBookingRow
    )

    if (classIdFilter) {
      list = list.filter((b) => normalizeClassKey(b.classId) === normalizeClassKey(classIdFilter))
    }

    const bookings = list.map((b) => {
      const locas = b.firstClassLocas?.length
        ? b.firstClassLocas
        : b.firstClassLoca
          ? [b.firstClassLoca]
          : []
      return {
        id: b.id,
        date: b.date,
        classId: b.classId,
        className: b.className,
        firstName: b.customer.firstName,
        lastName: b.customer.lastName,
        adult: b.counts.adult,
        child: b.counts.child,
        infant: b.counts.infant,
        seatLabel: locas.length > 0 ? locas.join(', ') : '',
        tourTitle: b.tourTitle,
        source: 'booking' as const,
      }
    })

    return NextResponse.json({ bookings, count: bookings.length })
  } catch (e) {
    console.error('GET /api/admin/manifest error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
