import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebaseAdmin'
import type { BookingStatus } from '@/lib/firestore/bookingTypes'
import { generateBookingAccessToken } from '@/lib/bookingAccessToken'
import { client, urlFor } from '@/lib/sanity'
import { tourImageAndPickupQuery, siteSettingsQuery, tourCoversByIdsQuery } from '@/lib/queries'
import { sendBookingPaidEmails } from '@/lib/email'
import { getBaseUrl } from '@/lib/seo'

const COLLECTION = 'bookings'
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 500

import { getAuthToken, getAdminEmail, requireAdmin } from '@/lib/adminAuth'

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
  const token = getAuthToken(request)
  const email = getAdminEmail(request)
  if (!requireAdmin(token, email)) {
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

    const db = getFirestore()
    let query = db.collection(COLLECTION).orderBy('createdAt', 'desc').limit(limit)
    if (startAfterId) {
      const snap = await db.collection(COLLECTION).doc(startAfterId).get()
      if (snap.exists) {
        query = query.startAfter(snap)
      }
    }
    const snapshot = await query.get()
    type DocRow = { id: string; status?: string; date?: string; classId?: string; className?: string; createdAt: string | null; tourId?: string; [k: string]: unknown }
    let list: DocRow[] = snapshot.docs.map((doc) => {
      const d = doc.data()
      const createdAt = d.createdAt?.toDate?.()
      return {
        id: doc.id,
        ...d,
        createdAt: createdAt ? createdAt.toISOString() : null,
      } as DocRow
    })
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
    const nextStartAfter =
      snapshot.docs.length === limit && snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1].id
        : null
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
  const token = getAuthToken(request)
  const email = getAdminEmail(request)
  if (!requireAdmin(token, email)) {
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
    const db = getFirestore()
    const ref = db.collection(COLLECTION).doc(bookingId)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ error: 'Rezervasyon bulunamadı' }, { status: 404 })
    }
    const data = snap.data()!
    const updates: Record<string, unknown> = {}
    if (status && VALID_STATUSES.includes(status)) updates.status = status
    if (adminNote !== undefined) updates.adminNote = adminNote === '' ? null : adminNote
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true, bookingId })
    }
    await ref.update(updates)

    if (status === 'paid') {
      const customer = (data.customer ?? {}) as Record<string, unknown>
      const counts = (data.counts ?? { adult: 0, child: 0, infant: 0 }) as {
        adult: number
        child: number
        infant: number
      }
      const tourId = String(data.tourId ?? '')
      let tourImageUrl: string | undefined
      let pickup: string | undefined
      let logoUrl: string | undefined
      let startTime: string | undefined
      let paidNow: number = Number(data.totalPrice ?? 0)
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
            (data.meetingPoint != null && String(data.meetingPoint).trim()) ||
            tourMeta?.whereSection?.meetingPointAddress?.trim() ||
            tourMeta?.quickFacts?.meetingLocation?.trim() ||
            undefined
          startTime = tourMeta?.quickFacts?.startTime?.trim() || (data.time != null ? String(data.time) : undefined)
          const total = Number(data.totalPrice ?? 0)
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
      let accessToken = typeof data.accessToken === 'string' && data.accessToken.trim() ? data.accessToken.trim() : undefined
      // Eski rezervasyonlarda token yoksa şimdi üret ve kaydet; e-postada token'lı link gitsin
      if (!accessToken) {
        accessToken = generateBookingAccessToken()
        await ref.update({ accessToken, paidNow })
      } else {
        await ref.update({ paidNow })
      }
      const rawMeal = data.mealPreference as { key?: unknown; label?: unknown } | undefined
      const mealPreference =
        rawMeal &&
        typeof rawMeal === 'object' &&
        typeof rawMeal.key === 'string' &&
        typeof rawMeal.label === 'string' &&
        rawMeal.key.trim() &&
        rawMeal.label.trim()
          ? { key: rawMeal.key.trim(), label: rawMeal.label.trim() }
          : undefined

      await sendBookingPaidEmails({
        bookingId,
        accessToken,
        tourTitle: String(data.tourTitle ?? ''),
        date: String(data.date ?? ''),
        time: startTime,
        status: String(data.status ?? ''),
        className: String(data.className ?? ''),
        firstClassLocas: Array.isArray(data.firstClassLocas) && data.firstClassLocas.length > 0
          ? data.firstClassLocas.filter((x: unknown) => typeof x === 'string' && /^L(10|[1-9])$/.test(String(x).trim()))
          : undefined,
        firstClassLoca: Array.isArray(data.firstClassLocas) && data.firstClassLocas.length > 0
          ? undefined
          : (typeof data.firstClassLoca === 'string' && /^L(10|[1-9])$/.test(data.firstClassLoca.trim()) ? data.firstClassLoca.trim() : undefined),
        counts,
        totalPrice: Number(data.totalPrice ?? 0),
        currency: String(data.currency ?? 'TRY'),
        paidNow,
        customer: {
          firstName: String(customer.firstName ?? ''),
          lastName: String(customer.lastName ?? ''),
          email: String(customer.email ?? ''),
          phone: String(customer.phone ?? ''),
          note: customer.note != null ? String(customer.note) : undefined,
        },
        tourImageUrl,
        pickup,
        logoUrl,
        siteBaseUrl,
        ...(mealPreference && { mealPreference }),
      })
    }

    return NextResponse.json({ ok: true, bookingId, status })
  } catch (e) {
    console.error('PATCH /api/admin/bookings error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
