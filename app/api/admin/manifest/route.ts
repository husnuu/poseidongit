import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin } from '@/lib/adminAuthServer'
import { computeDepositAmounts, type TourDepositConfig } from '@/lib/bookingDepositAmount'
import { mapBookingRowToApi, type SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { client } from '@/lib/sanity'
import { supabase } from '@/lib/supabase'
import type { AdminBookingRow } from '@/types/adminBookings'
import { sortManifestRowsAlphabetically } from '@/lib/manifestSort'

function normalizeClassKey(classId: string): string {
  const k = (classId ?? '').toLowerCase().trim()
  if (k === 'eco' || k.startsWith('eco')) return 'eco'
  if (k === 'premium' || k.startsWith('prem')) return 'premium'
  if (k === 'first' || k.startsWith('first')) return 'first'
  return k
}

async function getTourDepositMap(tourIds: string[]): Promise<Record<string, TourDepositConfig | null>> {
  const unique = [...new Set(tourIds)].filter(Boolean).slice(0, 80)
  if (unique.length === 0) return {}
  const tours = await client.fetch<{ _id: string; deposit?: TourDepositConfig }[]>(
    `*[_type == "tour" && _id in $ids]{ _id, deposit }`,
    { ids: unique }
  )
  const map: Record<string, TourDepositConfig | null> = {}
  for (const tour of tours ?? []) {
    if (tour._id) map[tour._id] = tour.deposit ?? null
  }
  return map
}

function resolvePaymentAmounts(
  totalPrice: number,
  paidNowRaw: number | null | undefined,
  deposit?: TourDepositConfig | null
): { paidNow: number; remainingAmount: number } {
  if (paidNowRaw != null && !Number.isNaN(Number(paidNowRaw)) && Number(paidNowRaw) >= 0) {
    const paidNow = Math.min(Number(paidNowRaw), totalPrice)
    return { paidNow, remainingAmount: Math.max(0, totalPrice - paidNow) }
  }
  return computeDepositAmounts(totalPrice, deposit)
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
      .eq('status', 'paid')
      .order('created_at', { ascending: true })
      .limit(500)

    if (error) throw new Error(error.message)

    let list = ((rows ?? []) as SupabaseBookingRow[]).map(
      (row) => mapBookingRowToApi(row) as unknown as AdminBookingRow
    )

    if (classIdFilter) {
      list = list.filter((b) => normalizeClassKey(b.classId) === normalizeClassKey(classIdFilter))
    }

    const depositMap = await getTourDepositMap(list.map((b) => b.tourId))

    const bookings = sortManifestRowsAlphabetically(
      list.map((b) => {
        const locas = b.firstClassLocas?.length
          ? b.firstClassLocas
          : b.firstClassLoca
            ? [b.firstClassLoca]
            : []
        const totalPrice = Number(b.totalPrice ?? 0)
        const paidNowFromRow = (b as AdminBookingRow & { paidNow?: number }).paidNow
        const { paidNow, remainingAmount } = resolvePaymentAmounts(
          totalPrice,
          paidNowFromRow,
          depositMap[b.tourId]
        )
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
          totalPrice,
          paidNow,
          remainingAmount,
          currency: b.currency || 'TRY',
          source: 'booking' as const,
        }
      })
    )

    return NextResponse.json({ bookings, count: bookings.length })
  } catch (e) {
    console.error('GET /api/admin/manifest error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
