import { NextRequest, NextResponse } from 'next/server'
import * as admin from 'firebase-admin'
import { getFirestore } from '@/lib/firebaseAdmin'
import { client } from '@/lib/sanity'
import { tourImageAndPickupQuery, siteSettingsQuery } from '@/lib/queries'
import { computeCapacityForDate, type TourCapacitySource } from '@/lib/availabilityCapacity'
import { sendBookingPaidEmails } from '@/lib/email'
import { getBaseUrl } from '@/lib/seo'
import { urlFor } from '@/lib/sanity'
import { getAuthToken, getAdminEmail, requireAdminOrAgent } from '@/lib/adminAuth'

const COLLECTION = 'bookings'
const ACTIVE_STATUSES = ['pending', 'paid', 'confirmed']


function normalizeClassKey(classId: string): string {
  const k = (classId ?? '').toLowerCase().trim()
  if (k === 'eco' || k.startsWith('eco')) return 'eco'
  if (k === 'premium' || k.startsWith('prem')) return 'premium'
  if (k === 'first' || k.startsWith('first')) return 'first'
  return k || 'eco'
}

function generateBookingReference(): string {
  const t = Date.now().toString(36).toUpperCase()
  const r = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `MB-${t}-${r}`
}

const MANUAL_SOURCES = ['physical', 'office', 'phone', 'whatsapp', 'agency', 'other'] as const
type ManualSource = (typeof MANUAL_SOURCES)[number]

function parseBody(body: unknown): {
  tourId: string
  tourTitle: string
  date: string
  classId: string
  className: string
  counts: { adult: number; child: number; infant: number }
  customer: { firstName: string; lastName: string; email: string; phone: string }
  unitPrice: number
  totalPrice: number
  currency: string
  status: 'pending' | 'paid' | 'cancelled'
  manualSource: ManualSource
  adminNote?: string
  forceCreate?: boolean
  sendVoucher?: boolean
  sendEmail?: boolean
} | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Geçersiz istek' }
  const b = body as Record<string, unknown>
  const tourId = typeof b.tourId === 'string' ? b.tourId.trim() : ''
  const tourTitle = typeof b.tourTitle === 'string' ? b.tourTitle.trim() : ''
  const date = typeof b.date === 'string' ? b.date.trim().slice(0, 10) : ''
  const classId = typeof b.classId === 'string' ? b.classId.trim() : ''
  const className = typeof b.className === 'string' ? b.className.trim() : ''
  const counts = b.counts as Record<string, unknown> | undefined
  const customer = b.customer as Record<string, unknown> | undefined
  if (!tourId || !date || !classId || !className || !counts || !customer) {
    return { error: 'Eksik alan: turId, date, classId, className, counts, customer gerekli' }
  }
  const adult = typeof counts.adult === 'number' ? counts.adult : Number(counts.adult) || 0
  const child = typeof counts.child === 'number' ? counts.child : Number(counts.child) || 0
  const infant = typeof counts.infant === 'number' ? counts.infant : Number(counts.infant) || 0
  if (adult < 0 || child < 0 || infant < 0) return { error: 'Kişi sayıları 0 veya pozitif olmalı' }
  if (adult + child + infant === 0) return { error: 'En az 1 kişi gerekli' }
  const firstName = typeof customer.firstName === 'string' ? customer.firstName.trim() : ''
  const lastName = typeof customer.lastName === 'string' ? customer.lastName.trim() : ''
  const phone = typeof customer.phone === 'string' ? customer.phone.trim() : ''
  const email = typeof customer.email === 'string' ? customer.email.trim() : ''
  if (!firstName || !lastName || !phone) {
    return { error: 'Müşteri ad, soyad ve telefon zorunludur' }
  }
  const rawUnit = b.unitPrice != null && b.unitPrice !== '' ? Number(b.unitPrice) : NaN
  const rawTotal = b.totalPrice != null && b.totalPrice !== '' ? Number(b.totalPrice) : NaN
  const unitPrice = Number.isNaN(rawUnit) || rawUnit < 0 ? 0 : rawUnit
  const totalPrice = Number.isNaN(rawTotal) || rawTotal < 0 ? 0 : rawTotal
  const currency = typeof b.currency === 'string' ? b.currency.trim() || 'TRY' : 'TRY'
  const status = b.status === 'paid' || b.status === 'pending' || b.status === 'cancelled' ? b.status : 'pending'
  const manualSourceRaw = typeof b.manualSource === 'string' ? b.manualSource.trim().toLowerCase() : ''
  const manualSource: ManualSource = MANUAL_SOURCES.includes(manualSourceRaw as ManualSource)
    ? (manualSourceRaw as ManualSource)
    : 'other'
  const adminNote = typeof b.adminNote === 'string' ? b.adminNote.trim() || undefined : undefined
  const forceCreate = b.forceCreate === true
  const sendVoucher = b.sendVoucher === true
  const sendEmail = b.sendEmail === true
  const title = tourTitle || ''
  if (!title) return { error: 'Tur adı (tourTitle) gerekli' }
  return {
    tourId,
    tourTitle: title,
    date,
    classId,
    className,
    counts: { adult, child, infant },
    customer: { firstName, lastName, email: email || '', phone },
    unitPrice,
    totalPrice,
    currency,
    status,
    manualSource,
    adminNote,
    forceCreate,
    sendVoucher,
    sendEmail,
  }
}

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const token = getAuthToken(request)
  const email = getAdminEmail(request)
  if (!requireAdminOrAgent(token, email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }
  const parsed = parseBody(body)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const {
    tourId,
    tourTitle,
    date,
    classId,
    className,
    counts,
    customer,
    unitPrice,
    totalPrice,
    currency,
    status,
    manualSource,
    adminNote,
    forceCreate,
    sendEmail,
  } = parsed

  const totalPax = counts.adult + counts.child + counts.infant

  const sanityTour = await client.fetch<
    (TourCapacitySource & { _id?: string }) | null
  >(
    `*[_type == "tour" && (_id == $tourId || slug.current == $tourId)][0] {
      _id,
      baseCapacity{ ecoCapacity, premiumCapacity, firstCapacity },
      availabilityOverrides[]{ date, eco, premium, first, note }
    }`,
    { tourId }
  )
  if (!sanityTour) {
    return NextResponse.json({ error: 'Tur bulunamadı' }, { status: 404 })
  }
  const firestoreTourId = sanityTour._id ?? tourId

  const capacityByClass = computeCapacityForDate(sanityTour, date)
  const db = getFirestore()
  const snapshot = await db
    .collection(COLLECTION)
    .where('tourId', '==', firestoreTourId)
    .where('date', '==', date)
    .where('status', 'in', ACTIVE_STATUSES)
    .get()

  const bookedByClass: Record<string, number> = {}
  snapshot.docs.forEach((doc) => {
    const d = doc.data()
    const ckey = normalizeClassKey((d.classId as string) ?? '')
    const c = (d.counts ?? {}) as { adult?: number; child?: number; infant?: number }
    const pax = (c.adult ?? 0) + (c.child ?? 0) + (c.infant ?? 0)
    if (pax > 0) bookedByClass[ckey] = (bookedByClass[ckey] ?? 0) + pax
  })

  const classKey = normalizeClassKey(classId)
  const capacity = capacityByClass[classKey] ?? 0
  const booked = bookedByClass[classKey] ?? 0
  const remaining = Math.max(0, capacity - booked)

  if (totalPax > remaining && !forceCreate) {
    return NextResponse.json(
      {
        error: 'capacity_exceeded',
        message: `Kalan kapasite ${remaining} kişi. ${totalPax} kişi eklenemez.`,
        capacity,
        booked,
        remaining,
      },
      { status: 400 }
    )
  }

  const reference = generateBookingReference()
  const ref = await db.collection(COLLECTION).add({
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status,
    tourId: firestoreTourId,
    tourTitle,
    date,
    counts,
    classId,
    className,
    unitPrice,
    totalPrice,
    currency,
    customer: {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email || '',
      phone: customer.phone,
    },
    source: 'manual',
    manualSource,
    createdByAdmin: true,
    ...(adminNote != null && adminNote !== '' && { adminNote }),
    reference,
  })

  if (status === 'paid' && sendEmail && customer.email && totalPrice > 0) {
    let tourImageUrl: string | undefined
    let pickup: string | undefined
    let logoUrl: string | undefined
    let startTime: string | undefined
    try {
      const tourMeta = await client.fetch<{
        mainImage?: { asset?: { _ref?: string } }
        quickFacts?: { meetingLocation?: string; startTime?: string }
        whereSection?: { meetingPointAddress?: string }
      } | null>(tourImageAndPickupQuery, { tourId: firestoreTourId })
      if (tourMeta?.mainImage?.asset) {
        tourImageUrl = urlFor(tourMeta.mainImage.asset).width(600).height(240).url()
      }
      pickup =
        tourMeta?.whereSection?.meetingPointAddress?.trim() ||
        tourMeta?.quickFacts?.meetingLocation?.trim() ||
        undefined
      startTime = tourMeta?.quickFacts?.startTime?.trim() || undefined
    } catch {
      // ignore
    }
    try {
      const siteSettings = await client.fetch<{ logo?: { asset?: { _ref?: string } } } | null>(siteSettingsQuery)
      if (siteSettings?.logo?.asset) {
        logoUrl = urlFor(siteSettings.logo.asset).width(220).height(70).url()
      }
    } catch {
      // ignore
    }
    const siteBaseUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
      getBaseUrl()
    ).replace(/\/$/, '')
    await sendBookingPaidEmails({
      bookingId: ref.id,
      tourTitle,
      date,
      time: startTime,
      className,
      counts,
      totalPrice,
      currency,
      paidNow: totalPrice,
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      },
      tourImageUrl,
      pickup,
      logoUrl,
      siteBaseUrl,
    })
  }

  return NextResponse.json({
    ok: true,
    bookingId: ref.id,
    reference,
  })
}
