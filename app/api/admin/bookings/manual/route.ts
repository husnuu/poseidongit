import { NextRequest, NextResponse } from 'next/server'
import { generateBookingAccessToken } from '@/lib/bookingAccessToken'
import { client } from '@/lib/sanity'
import { tourImageAndPickupQuery, siteSettingsQuery } from '@/lib/queries'
import { computeCapacityForDate, type TourCapacitySource } from '@/lib/availabilityCapacity'
import { sendBookingPaidEmails, sendManualBookingAdminNotification } from '@/lib/email'
import { getBaseUrl } from '@/lib/seo'
import { urlFor } from '@/lib/sanity'
import { getAuthToken, getAdminEmail } from '@/lib/adminAuth'
import { authorizeAdminOrAgent } from '@/lib/adminAuthServer'
import { resolveMealPreferenceCountsForBooking, resolveMealPreferenceForBooking } from '@/lib/bookingMealPreference'
import { supabase } from '@/lib/supabase'
import { paxCountFromRow, BOOKING_STATUSES_COUNTING_TOWARD_CAPACITY, type SupabaseBookingRow } from '@/lib/bookingsSupabase'
import {
  sanitizeAdminNote,
  sanitizePersonName,
  sanitizePhoneDisplay,
  sanitizeTourSlugOrId,
  sanitizeTourTitleText,
} from '@/lib/inputSanitize'

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

const LOCA_REGEX = /^L(10|[1-9])$/

function parseMissingColumnFromSupabaseError(message: string): string | null {
  const m = message.match(/Could not find the '([^']+)' column of 'bookings'/i)
  return m?.[1] ?? null
}

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
  sendEmailToAdmin?: boolean
  firstClassLocas?: string[]
  mealPreferenceKey?: string
  mealPreferenceCounts?: Record<string, number>
} | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Geçersiz istek' }
  const b = body as Record<string, unknown>
  const tourId = typeof b.tourId === 'string' ? sanitizeTourSlugOrId(b.tourId, 200) : ''
  const tourTitle = typeof b.tourTitle === 'string' ? sanitizeTourTitleText(b.tourTitle, 300) : ''
  const date = typeof b.date === 'string' ? b.date.trim().slice(0, 10) : ''
  const classId = typeof b.classId === 'string' ? b.classId.trim() : ''
  const className =
    typeof b.className === 'string' ? sanitizeTourTitleText(b.className, 120) : ''
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
  const firstName =
    typeof customer.firstName === 'string' ? sanitizePersonName(customer.firstName, 80) : ''
  const lastName =
    typeof customer.lastName === 'string' ? sanitizePersonName(customer.lastName, 80) : ''
  const phone =
    typeof customer.phone === 'string' ? sanitizePhoneDisplay(customer.phone, 48) : ''
  const email =
    typeof customer.email === 'string' ? customer.email.trim().toLowerCase().slice(0, 254) : ''
  if (!firstName || !lastName) {
    return { error: 'Müşteri ad ve soyad zorunludur' }
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
  const adminNote =
    typeof b.adminNote === 'string' ? sanitizeAdminNote(b.adminNote, 4000) : undefined
  const forceCreate = b.forceCreate === true
  const sendVoucher = b.sendVoucher === true
  const sendEmail = b.sendEmail === true
  const sendEmailToAdmin = b.sendEmailToAdmin === true
  const title = tourTitle || ''
  if (!title) return { error: 'Tur adı (tourTitle) gerekli' }
  let firstClassLocas: string[] | undefined
  if (Array.isArray(b.firstClassLocas) && b.firstClassLocas.length > 0) {
    firstClassLocas = (b.firstClassLocas as unknown[])
      .filter((x): x is string => typeof x === 'string')
      .map((x) => x.trim().toUpperCase())
      .filter((x) => LOCA_REGEX.test(x))
    if (firstClassLocas.length === 0) firstClassLocas = undefined
  }
  let mealPreferenceKey: string | undefined
  let mealPreferenceCounts: Record<string, number> | undefined
  const mp = b.mealPreference
  if (mp && typeof mp === 'object') {
    const mk = (mp as Record<string, unknown>).key
    if (typeof mk === 'string') mealPreferenceKey = mk.trim() || undefined
    const mc = (mp as Record<string, unknown>).counts
    if (mc && typeof mc === 'object' && !Array.isArray(mc)) {
      const out: Record<string, number> = {}
      for (const [k, v] of Object.entries(mc as Record<string, unknown>)) {
        const key = typeof k === 'string' ? k.trim() : ''
        const count = Math.max(0, Number(v) || 0)
        if (key && count > 0) out[key] = count
      }
      if (Object.keys(out).length > 0) mealPreferenceCounts = out
    }
  }
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
    sendEmailToAdmin,
    firstClassLocas,
    mealPreferenceKey,
    mealPreferenceCounts,
  }
}

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!(await authorizeAdminOrAgent(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = getAuthToken(request)
  const email = getAdminEmail(request)
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
    sendEmailToAdmin,
    firstClassLocas: firstClassLocasParsed,
    mealPreferenceKey,
    mealPreferenceCounts,
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

  let mealPreference: { key: string; label: string } | undefined
  let mealPreferenceCountsStored: Array<{ key: string; label: string; count: number }> | undefined
  if (mealPreferenceCounts && Object.keys(mealPreferenceCounts).length > 0) {
    const mealCountsResolve = await resolveMealPreferenceCountsForBooking(
      firestoreTourId,
      mealPreferenceCounts,
      totalPax
    )
    if (!mealCountsResolve.ok) {
      return NextResponse.json({ error: mealCountsResolve.message }, { status: 400 })
    }
    mealPreference = mealCountsResolve.primary
    mealPreferenceCountsStored = mealCountsResolve.stored
  } else {
    const mealResolve = await resolveMealPreferenceForBooking(firestoreTourId, mealPreferenceKey)
    if (!mealResolve.ok) {
      return NextResponse.json({ error: mealResolve.message }, { status: 400 })
    }
    mealPreference = mealResolve.stored
  }

  const capacityByClass = computeCapacityForDate(sanityTour, date)
  const { data: snapshotRows, error: snapshotError } = await supabase
    .from('bookings')
    .select('id, class_id, adult_count, child_count, infant_count')
    .eq('tour_id', firestoreTourId)
    .eq('date', date)
    .in('status', BOOKING_STATUSES_COUNTING_TOWARD_CAPACITY)
  if (snapshotError) {
    throw new Error(`Supabase manual capacity query failed: ${snapshotError.message}`)
  }

  const bookedByClass: Record<string, number> = {}
  for (const row of (snapshotRows ?? []) as SupabaseBookingRow[]) {
    const ckey = normalizeClassKey((row.class_id as string) ?? '')
    const pax = paxCountFromRow(row)
    if (pax > 0) bookedByClass[ckey] = (bookedByClass[ckey] ?? 0) + pax
  }

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
  const accessToken = generateBookingAccessToken()
  let manualInsertPayload: Record<string, unknown> = {
    created_at: new Date().toISOString(),
    status,
    tour_id: firestoreTourId,
    tour_title: tourTitle,
    date,
    class_id: classId,
    class_name: className,
    unit_price: unitPrice,
    total_price: totalPrice,
    currency,
    customer_first_name: customer.firstName,
    customer_last_name: customer.lastName,
    customer_email: customer.email || '',
    customer_phone: customer.phone,
    adult_count: counts.adult,
    child_count: counts.child,
    infant_count: counts.infant,
    source: 'manual',
    manual_source: manualSource,
    created_by_admin: true,
    ...(adminNote != null && adminNote !== '' && { admin_note: adminNote }),
    reference,
    access_token: accessToken,
    ...(status === 'paid' && totalPrice > 0 && { paid_now: totalPrice }),
    ...(firstClassLocasParsed && firstClassLocasParsed.length > 0 && { first_class_locas: firstClassLocasParsed }),
    ...(mealPreference && {
      meal_preference: {
        ...mealPreference,
        ...(mealPreferenceCountsStored?.length ? { counts: mealPreferenceCountsStored } : {}),
      },
    }),
  }
  let insertedBooking: { id: string } | null = null
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await supabase
      .from('bookings')
      .insert(manualInsertPayload)
      .select('id')
      .single()
    if (!error && data?.id) {
      insertedBooking = data
      break
    }
    if (error) {
      const missingColumn = parseMissingColumnFromSupabaseError(error.message)
      if (missingColumn && Object.prototype.hasOwnProperty.call(manualInsertPayload, missingColumn)) {
        delete manualInsertPayload[missingColumn]
        continue
      }
    }
    throw new Error(`Supabase manual booking insert failed: ${error?.message ?? 'No id returned'}`)
  }
  if (!insertedBooking?.id) {
    throw new Error('Supabase manual booking insert failed: No id returned')
  }

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
    const siteBaseUrl = getBaseUrl().replace(/\/$/, '')
    const mealPreferenceForEmail =
      mealPreference && mealPreference.key && mealPreference.label
        ? {
            key: mealPreference.key,
            label: mealPreference.label,
            ...(mealPreferenceCountsStored?.length ? { counts: mealPreferenceCountsStored } : {}),
          }
        : undefined
    await sendBookingPaidEmails({
      bookingId: insertedBooking.id,
      accessToken,
      tourTitle,
      date,
      time: startTime,
      status,
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
      ...(firstClassLocasParsed && firstClassLocasParsed.length > 0 && { firstClassLocas: firstClassLocasParsed }),
      ...(mealPreferenceForEmail && { mealPreference: mealPreferenceForEmail }),
    })
  }

  if (sendEmailToAdmin) {
    const mealPreferenceForEmail =
      mealPreference && mealPreference.key && mealPreference.label
        ? {
            key: mealPreference.key,
            label: mealPreference.label,
            ...(mealPreferenceCountsStored?.length ? { counts: mealPreferenceCountsStored } : {}),
          }
        : undefined
    await sendManualBookingAdminNotification({
      bookingId: insertedBooking.id,
      tourTitle,
      date,
      className,
      counts,
      totalPrice,
      currency,
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email || '',
        phone: customer.phone,
      },
      ...(firstClassLocasParsed && firstClassLocasParsed.length > 0 && { firstClassLocas: firstClassLocasParsed }),
      ...(mealPreferenceForEmail && { mealPreference: mealPreferenceForEmail }),
    })
  }

  return NextResponse.json({
    ok: true,
    bookingId: insertedBooking.id,
    reference,
  })
}
