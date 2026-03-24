import { NextRequest, NextResponse } from 'next/server'
import * as admin from 'firebase-admin'
import { getFirestore } from '@/lib/firebaseAdmin'
import { getAuthToken, getAdminEmail, requireAdmin } from '@/lib/adminAuth'

const COLLECTION = 'yachtInquiries'
const DEFAULT_LIMIT = 200
const MAX_LIMIT = 500

function toIso(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    try {
      return ((value as { toDate: () => Date }).toDate()).toISOString()
    } catch {
      return null
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  const token = getAuthToken(request)
  const email = getAdminEmail(request)
  if (!requireAdmin(token, email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10)),
      MAX_LIMIT
    )
    const startAfterId = searchParams.get('startAfter')?.trim() ?? null

    const db = getFirestore()
    let query = db.collection(COLLECTION).orderBy('createdAt', 'desc').limit(limit)
    if (startAfterId) {
      const snap = await db.collection(COLLECTION).doc(startAfterId).get()
      if (snap.exists) query = query.startAfter(snap)
    }

    const snapshot = await query.get()
    const inquiries = snapshot.docs.map((doc) => {
      const d = doc.data() as Record<string, unknown>
      return {
        id: doc.id,
        yachtSlug: typeof d.yachtSlug === 'string' ? d.yachtSlug : '',
        yachtName: typeof d.yachtName === 'string' ? d.yachtName : '',
        location: typeof d.location === 'string' ? d.location : null,
        date: typeof d.date === 'string' ? d.date : null,
        guestCount: typeof d.guestCount === 'number' ? d.guestCount : null,
        firstName: typeof d.firstName === 'string' ? d.firstName : '',
        lastName: typeof d.lastName === 'string' ? d.lastName : '',
        email: typeof d.email === 'string' ? d.email : '',
        phone: typeof d.phone === 'string' ? d.phone : '',
        message: typeof d.message === 'string' ? d.message : '',
        priceFrom: typeof d.priceFrom === 'number' ? d.priceFrom : null,
        currency: typeof d.currency === 'string' ? d.currency : null,
        status: typeof d.status === 'string' ? d.status : 'new',
        source: typeof d.source === 'string' ? d.source : 'web',
        adminNote: typeof d.adminNote === 'string' ? d.adminNote : null,
        isRead: Boolean(d.isRead),
        contactedAt: toIso(d.contactedAt),
        readAt: toIso(d.readAt),
        createdAt: toIso(d.createdAt),
        updatedAt: toIso(d.updatedAt),
      }
    })

    const nextStartAfter =
      snapshot.docs.length === limit && snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1].id
        : null

    return NextResponse.json({ inquiries, nextStartAfter, count: inquiries.length })
  } catch (e) {
    console.error('GET /api/admin/yacht-inquiries error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const token = getAuthToken(request)
  const email = getAdminEmail(request)
  if (!requireAdmin(token, email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
    }

    const inquiryId = typeof body.inquiryId === 'string' ? body.inquiryId.trim() : ''
    const status = typeof body.status === 'string' ? body.status.trim() : null
    const adminNote = typeof body.adminNote === 'string' ? body.adminNote.trim() : undefined
    const markRead = typeof body.markRead === 'boolean' ? body.markRead : undefined

    if (!inquiryId) {
      return NextResponse.json({ error: 'inquiryId gerekli.' }, { status: 400 })
    }

    const db = getFirestore()
    const ref = db.collection(COLLECTION).doc(inquiryId)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    if (status) {
      updates.status = status
      if (status === 'contacted') {
        updates.contactedAt = admin.firestore.FieldValue.serverTimestamp()
      }
    }
    if (adminNote !== undefined) {
      updates.adminNote = adminNote === '' ? null : adminNote
    }
    if (markRead !== undefined) {
      updates.isRead = markRead
      updates.readAt = markRead ? admin.firestore.FieldValue.serverTimestamp() : null
    }

    await ref.update(updates)

    return NextResponse.json({ ok: true, inquiryId })
  } catch (e) {
    console.error('PATCH /api/admin/yacht-inquiries error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
