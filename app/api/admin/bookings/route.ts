import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebaseAdmin'
import type { BookingStatus } from '@/lib/firestore/bookingTypes'
import { sendBookingPaidEmails } from '@/lib/email'

const COLLECTION = 'bookings'
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

function getAuthToken(request: Request): string | null {
  const auth = request.headers.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7).trim()
}

export async function GET(request: NextRequest) {
  const token = getAuthToken(request)
  const adminToken = process.env.ADMIN_TOKEN
  if (!adminToken || token !== adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')?.trim() ?? null
    const dateTo = searchParams.get('dateTo')?.trim() ?? null
    const classIdFilter = searchParams.get('classId')?.trim() ?? null
    const classNameFilter = searchParams.get('className')?.trim() ?? null
    const hasFilters = !!(dateFrom || dateTo || classIdFilter || classNameFilter)
    const baseLimit = hasFilters ? Math.min(MAX_LIMIT, 200) : DEFAULT_LIMIT
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get('limit') ?? String(baseLimit), 10)),
      MAX_LIMIT
    )
    const startAfterId = searchParams.get('startAfter') ?? null
    const statusFilter = searchParams.get('status') as BookingStatus | null

    const db = getFirestore()
    let query = db.collection(COLLECTION).orderBy('createdAt', 'desc').limit(limit)
    if (startAfterId) {
      const snap = await db.collection(COLLECTION).doc(startAfterId).get()
      if (snap.exists) {
        query = query.startAfter(snap)
      }
    }
    const snapshot = await query.get()
    type DocRow = { id: string; status?: string; date?: string; classId?: string; className?: string; createdAt: string | null; [k: string]: unknown }
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
    const nextStartAfter =
      snapshot.docs.length === limit && snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1].id
        : null
    return NextResponse.json({
      bookings: list,
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
  const adminToken = process.env.ADMIN_TOKEN
  if (!adminToken || token !== adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 })
    }
    const bookingId = typeof body.bookingId === 'string' ? body.bookingId.trim() : ''
    const status = body.status as BookingStatus | undefined
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId gerekli' }, { status: 400 })
    }
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'status gerekli ve pending, paid veya cancelled olmalı' },
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
    await ref.update({ status })

    if (status === 'paid') {
      const customer = (data.customer ?? {}) as Record<string, unknown>
      const counts = (data.counts ?? { adult: 0, child: 0, infant: 0 }) as {
        adult: number
        child: number
        infant: number
      }
      await sendBookingPaidEmails({
        bookingId,
        tourTitle: String(data.tourTitle ?? ''),
        date: String(data.date ?? ''),
        time: data.time != null ? String(data.time) : undefined,
        className: String(data.className ?? ''),
        counts,
        totalPrice: Number(data.totalPrice ?? 0),
        currency: String(data.currency ?? 'TRY'),
        customer: {
          firstName: String(customer.firstName ?? ''),
          lastName: String(customer.lastName ?? ''),
          email: String(customer.email ?? ''),
          phone: String(customer.phone ?? ''),
          note: customer.note != null ? String(customer.note) : undefined,
        },
      })
    }

    return NextResponse.json({ ok: true, bookingId, status })
  } catch (e) {
    console.error('PATCH /api/admin/bookings error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
