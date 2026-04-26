import { NextRequest, NextResponse } from 'next/server'
import type { BookingStatus } from '@/lib/firestore/bookingTypes'
import { generateBookingAccessToken } from '@/lib/bookingAccessToken'
import { client, urlFor } from '@/lib/sanity'
import { tourCoversByIdsQuery } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import { mapBookingRowToApi, type SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { runBookingPaidEmailSideEffects } from '@/lib/services/bookingPaidEmailSideEffects'
import { smartRefund, parseProcReturnCodeMessage } from '@/lib/nestpay-refund'
import { getAdminEmail } from '@/lib/adminAuth'
import { extractAdminSessionTokenFromRequest, verifyAdminSessionToken } from '@/lib/adminSession'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 500

import { authorizeAdmin } from '@/lib/adminAuthServer'

/** Resolve tour cover image URL from Sanity for given tour ids. */
async function getTourCoverMap(tourIds: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(tourIds)].filter(Boolean).slice(0, 80)
  if (unique.length === 0) return {}
  const tours = await client.fetch<{ _id: string; mainImage?: { asset?: { _ref?: string } } }[]>(
    tourCoversByIdsQuery,
    { ids: unique }
  )
  const map: Record<string, string> = {}
  for (const t of tours ?? []) {
    if (t._id && t.mainImage?.asset) {
      try {
        map[t._id] = urlFor(t.mainImage.asset).width(112).height(112).url()
      } catch {
        // skip
      }
    }
  }
  return map
}

export async function GET(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')?.trim() ?? null
    const dateTo = searchParams.get('dateTo')?.trim() ?? null
    const classIdFilter = searchParams.get('classId')?.trim() ?? null
    const classNameFilter = searchParams.get('className')?.trim() ?? null
    const tourIdFilter = searchParams.get('tourId')?.trim() ?? null
    const hasFilters = !!(dateFrom || dateTo || classIdFilter || classNameFilter || tourIdFilter)
    const baseLimit = hasFilters ? Math.min(MAX_LIMIT, 500) : DEFAULT_LIMIT
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get('limit') ?? String(baseLimit), 10)),
      MAX_LIMIT
    )
    const startAfterId = searchParams.get('startAfter') ?? null
    const statusFilter = searchParams.get('status') as BookingStatus | null
    const sourceFilter = searchParams.get('source')?.trim()?.toLowerCase() ?? null

    let query = supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (startAfterId) {
      const { data: cursorRow, error: cursorError } = await supabase
        .from('bookings')
        .select('created_at')
        .eq('id', startAfterId)
        .single()
      if (!cursorError && cursorRow?.created_at) {
        query = query.lt('created_at', cursorRow.created_at)
      }
    }
    const { data: rows, error: listError } = await query
    if (listError) throw new Error(`Supabase bookings list failed: ${listError.message}`)
    const normalizedRows: SupabaseBookingRow[] = (rows ?? []) as SupabaseBookingRow[]

    // Legacy bookings may not have access_token; backfill so admin PDF links stay valid.
    for (const row of normalizedRows) {
      if (!row?.id) continue
      const hasToken = typeof row.access_token === 'string' && row.access_token.trim().length > 0
      if (hasToken) continue
      const accessToken = generateBookingAccessToken()
      const { error: tokenUpdateError } = await supabase
        .from('bookings')
        .update({ access_token: accessToken })
        .eq('id', row.id)
      if (!tokenUpdateError) {
        row.access_token = accessToken
      }
    }

    type DocRow = {
      id: string
      status?: string
      date?: string
      classId?: string
      className?: string
      createdAt: string | null
      tourId?: string
      source?: string
      manualSource?: string
      [k: string]: unknown
    }
    let list: DocRow[] = normalizedRows.map((row) => mapBookingRowToApi(row) as DocRow)
    if (statusFilter && ['pending', 'paid', 'failed', 'cancelled'].includes(statusFilter)) {
      list = list.filter((b) => b.status === statusFilter)
    }
    if (dateFrom) list = list.filter((b) => (b.date ?? '') >= dateFrom)
    if (dateTo) list = list.filter((b) => (b.date ?? '') <= dateTo)
    if (classIdFilter) list = list.filter((b) => b.classId === classIdFilter)
    if (classNameFilter) list = list.filter((b) => b.className === classNameFilter)
    if (tourIdFilter) list = list.filter((b) => (b.tourId ?? '') === tourIdFilter)
    if (sourceFilter) {
      if (sourceFilter === 'web') {
        list = list.filter((b) => (b.source ?? 'web') === 'web')
      } else if (sourceFilter === 'manual') {
        list = list.filter((b) => (b.source ?? '') === 'manual')
      } else if (['physical', 'office', 'phone', 'whatsapp', 'agency'].includes(sourceFilter)) {
        list = list.filter((b) => (b.manualSource ?? '') === sourceFilter)
      }
    }
    const tourIds = list.map((b) => (b.tourId as string) ?? '').filter(Boolean)
    const tourCoverMap = await getTourCoverMap(tourIds)
    const bookingsWithCovers = list.map((b) => ({
      ...b,
      tourCoverImageUrl: (b.tourId && tourCoverMap[b.tourId as string]) || null,
    }))
    const nextStartAfter = list.length === limit && list.length > 0 ? String(list[list.length - 1].id) : null
    return NextResponse.json({
      bookings: bookingsWithCovers,
      nextStartAfter,
      count: list.length,
    })
  } catch (e) {
    console.error('GET /api/admin/bookings error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

const VALID_STATUSES: BookingStatus[] = ['pending', 'paid', 'failed', 'cancelled']

async function resolveAdminEmailFromRequest(request: Request): Promise<string> {
  const raw = extractAdminSessionTokenFromRequest(request)
  if (raw) {
    const p = await verifyAdminSessionToken(raw)
    if (p?.email) return p.email as string
  }
  return getAdminEmail(request) ?? 'admin'
}

export async function PATCH(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 })
    }
    const bookingId = typeof body.bookingId === 'string' ? body.bookingId.trim() : ''
    const status = body.status as BookingStatus | undefined
    const adminNote = typeof body.adminNote === 'string' ? body.adminNote.trim() : undefined
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId gerekli' }, { status: 400 })
    }
    if (!status && adminNote === undefined) {
      return NextResponse.json(
        { error: 'status veya adminNote güncellemesi gerekli' },
        { status: 400 }
      )
    }
    const { data: snap, error: fetchError } = await supabase.from('bookings').select('*').eq('id', bookingId).single()
    if (fetchError || !snap) {
      return NextResponse.json({ error: 'Rezervasyon bulunamadı' }, { status: 404 })
    }
    const data = snap as SupabaseBookingRow
    const updates: Record<string, unknown> = {}
    if (status && VALID_STATUSES.includes(status)) updates.status = status
    if (adminNote !== undefined) updates.admin_note = adminNote === '' ? null : adminNote
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true, bookingId })
    }

    // Ödeme iadesi: admin iptal → online ödemeli rezervasyonlarda otomatik smartRefund
    let refundAttempted = false
    let refundOk = false
    let refundStatus: string | null = null
    let refundTransId: string | null = null
    let refundErrMsg: string | null = null
    let refundType: string | null = null

    const isNewCancellation =
      status === 'cancelled' &&
      data.status !== 'cancelled' &&
      data.payment_status === 'paid' &&
      typeof data.nestpay_trans_id === 'string' &&
      data.nestpay_trans_id.trim().length > 0 &&
      data.refund_status == null

    if (isNewCancellation) {
      refundAttempted = true
      const amount = Number(data.total_price ?? 0)
      const adminEmail = await resolveAdminEmailFromRequest(request)
      const result = await smartRefund({ orderId: bookingId, amount, paidAt: data.paid_at })

      refundOk = result.ok
      refundStatus = result.ok ? 'refunded' : 'refund_failed'
      refundTransId = result.transId ?? null
      refundType = result.refundType ?? null
      refundErrMsg = result.ok
        ? null
        : parseProcReturnCodeMessage(result.procReturnCode ?? '', result.errMsg)

      updates.refund_status = refundStatus
      updates.refunded_at = new Date().toISOString()
      updates.refund_trans_id = refundTransId
      updates.refund_error = refundErrMsg
      updates.refund_type = refundType
      updates.refund_amount = amount
      updates.refunded_by = adminEmail

      console.info('[admin/bookings PATCH] refund', {
        bookingId,
        refundOk,
        refundType,
        transId: refundTransId,
        procReturnCode: result.procReturnCode,
        adminEmail,
      })
    }

    const { error: updateError } = await supabase.from('bookings').update(updates).eq('id', bookingId)
    if (updateError) throw new Error(`Supabase booking update failed: ${updateError.message}`)

    if (status === 'paid') {
      await runBookingPaidEmailSideEffects(bookingId, data)
    }

    return NextResponse.json({
      ok: true,
      bookingId,
      status,
      refundAttempted,
      refundOk,
      refundStatus,
      refundTransId,
      refundErrMsg,
      refundType,
    })
  } catch (e) {
    console.error('PATCH /api/admin/bookings error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
