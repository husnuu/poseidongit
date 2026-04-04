import { NextRequest, NextResponse } from 'next/server'
import type { BookingStatus } from '@/lib/firestore/bookingTypes'
import { generateBookingAccessToken } from '@/lib/bookingAccessToken'
import { client, urlFor } from '@/lib/sanity'
import { tourImageAndPickupQuery, siteSettingsQuery, tourCoversByIdsQuery } from '@/lib/queries'
import { sendBookingPaidEmails } from '@/lib/email'
import { getBaseUrl } from '@/lib/seo'
import { supabase } from '@/lib/supabase'
import { mapBookingRowToApi, type SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { normalizeAdditionalTravelersFromStorage } from '@/lib/bookingAdditionalTravelers'

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
    if (statusFilter && ['pending', 'paid', 'cancelled'].includes(statusFilter)) {
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

const VALID_STATUSES: BookingStatus[] = ['pending', 'paid', 'cancelled']

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
    const { error: updateError } = await supabase.from('bookings').update(updates).eq('id', bookingId)
    if (updateError) throw new Error(`Supabase booking update failed: ${updateError.message}`)

    if (status === 'paid') {
      const customer = {
        firstName: String(data.customer_first_name ?? ''),
        lastName: String(data.customer_last_name ?? ''),
        email: String(data.customer_email ?? ''),
        phone: String(data.customer_phone ?? ''),
        note: data.customer_note != null ? String(data.customer_note) : undefined,
      }
      const counts = {
        adult: Number(data.adult_count ?? 0),
        child: Number(data.child_count ?? 0),
        infant: Number(data.infant_count ?? 0),
      }
      const tourId = String(data.tour_id ?? '')
      let tourImageUrl: string | undefined
      let pickup: string | undefined
      let logoUrl: string | undefined
      let startTime: string | undefined
      let paidNow: number = Number(data.total_price ?? 0)
      if (tourId) {
        try {
          const tourMeta = await client.fetch<{
            mainImage?: { asset?: { _ref?: string } }
            quickFacts?: { meetingLocation?: string; startTime?: string }
            whereSection?: { meetingPointAddress?: string }
            deposit?: { enabled?: boolean; type?: string; value?: number }
          } | null>(tourImageAndPickupQuery, { tourId })
          if (tourMeta?.mainImage?.asset) {
            tourImageUrl = urlFor(tourMeta.mainImage.asset).width(600).height(240).url()
          }
          pickup =
            (data.meeting_point != null && String(data.meeting_point).trim()) ||
            tourMeta?.whereSection?.meetingPointAddress?.trim() ||
            tourMeta?.quickFacts?.meetingLocation?.trim() ||
            undefined
          startTime = tourMeta?.quickFacts?.startTime?.trim() || (data.time != null ? String(data.time) : undefined)
          const total = Number(data.total_price ?? 0)
          const dep = tourMeta?.deposit
          if (dep?.enabled && dep.value != null && total > 0) {
            paidNow = dep.type === 'percentage' ? Math.round((total * dep.value) / 100) : Math.round(dep.value)
          } else {
            paidNow = total
          }
        } catch {
          startTime = data.time != null ? String(data.time) : undefined
        }
      } else {
        startTime = data.time != null ? String(data.time) : undefined
      }
      try {
        const siteSettings = await client.fetch<{ logo?: { asset?: { _ref?: string } } } | null>(
          siteSettingsQuery
        )
        if (siteSettings?.logo?.asset) {
          logoUrl = urlFor(siteSettings.logo.asset).width(220).height(70).url()
        }
      } catch {
        // Logo opsiyonel
      }
      const siteBaseUrl = getBaseUrl().replace(/\/$/, '')
      let accessToken = typeof data.access_token === 'string' && data.access_token.trim() ? data.access_token.trim() : undefined
      // Eski rezervasyonlarda token yoksa şimdi üret ve kaydet; e-postada token'lı link gitsin
      if (!accessToken) {
        accessToken = generateBookingAccessToken()
        const { error: accessTokenError } = await supabase
          .from('bookings')
          .update({ access_token: accessToken, paid_now: paidNow })
          .eq('id', bookingId)
        if (accessTokenError) throw new Error(`Supabase access token update failed: ${accessTokenError.message}`)
      } else {
        const { error: paidNowError } = await supabase
          .from('bookings')
          .update({ paid_now: paidNow })
          .eq('id', bookingId)
        if (paidNowError) throw new Error(`Supabase paidNow update failed: ${paidNowError.message}`)
      }
      const rawMeal = (data.meal_preference ?? undefined) as { key?: unknown; label?: unknown } | undefined
      const mealPreference =
        rawMeal &&
        typeof rawMeal === 'object' &&
        typeof rawMeal.key === 'string' &&
        typeof rawMeal.label === 'string' &&
        rawMeal.key.trim() &&
        rawMeal.label.trim()
          ? { key: rawMeal.key.trim(), label: rawMeal.label.trim() }
          : undefined

      const additionalTravelers = normalizeAdditionalTravelersFromStorage(data.additional_travelers)

      await sendBookingPaidEmails({
        bookingId,
        accessToken,
        tourTitle: String(data.tour_title ?? ''),
        date: String(data.date ?? ''),
        time: startTime,
        status: String(data.status ?? ''),
        className: String(data.class_name ?? ''),
        firstClassLocas: Array.isArray(data.first_class_locas) && data.first_class_locas.length > 0
          ? data.first_class_locas.filter((x: unknown) => typeof x === 'string' && /^L(10|[1-9])$/.test(String(x).trim()))
          : undefined,
        firstClassLoca: Array.isArray(data.first_class_locas) && data.first_class_locas.length > 0
          ? undefined
          : (typeof data.first_class_loca === 'string' && /^L(10|[1-9])$/.test(data.first_class_loca.trim()) ? data.first_class_loca.trim() : undefined),
        counts,
        totalPrice: Number(data.total_price ?? 0),
        currency: String(data.currency ?? 'TRY'),
        paidNow,
        customer,
        tourImageUrl,
        pickup,
        logoUrl,
        siteBaseUrl,
        ...(mealPreference && { mealPreference }),
        ...(additionalTravelers.length > 0 && { additionalTravelers }),
      })
    }

    return NextResponse.json({ ok: true, bookingId, status })
  } catch (e) {
    console.error('PATCH /api/admin/bookings error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
