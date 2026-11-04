/**
 * POST /api/partner/bookings — resepsiyon satışı: partner panelinden rezervasyon başlatılır,
 * misafire ödeme linki gider. Tutar her zaman sunucuda hesaplanır.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { client } from '@/lib/sanity'
import { supabase } from '@/lib/supabase'
import { rateLimitResponse } from '@/lib/rateLimit'
import { computeBookingPrices } from '@/lib/booking/computeBookingPrices'
import { isDateBeforeEarliestBookable } from '@/lib/booking/bookingWindow'
import { computeBookableCapacityForDate, type TourCapacitySource } from '@/lib/availabilityCapacity'
import { BOOKING_STATUSES_COUNTING_TOWARD_CAPACITY, paxCountFromRow, type SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { generateBookingAccessToken } from '@/lib/bookingAccessToken'
import { sanitizeCustomerNote, sanitizePersonName, sanitizePhoneDisplay } from '@/lib/inputSanitize'
import { insertBookingWithColumnFallback } from '@/lib/supabaseInsertRetry'
import { PRIVATE_TOUR_CLASS_ID, PRIVATE_TOUR_CLASS_NAME } from '@/lib/sanity/privateTour'
import { partnerBookingFields } from '@/lib/partner/partners'
import { getPartnerFromSession } from '@/lib/partner/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CURRENCY = 'TRY'

const paxCount = z.coerce.number().int().min(0).max(200)

const bodySchema = z.object({
  tourId: z.string().trim().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  classKey: z.string().trim().max(100).optional(),
  counts: z
    .object({ adult: paxCount, child: paxCount, infant: paxCount })
    .refine((c) => c.adult + c.child + c.infant >= 1, { message: 'En az 1 kişi gerekli' }),
  customer: z.object({
    firstName: z.string().max(200).transform((s) => sanitizePersonName(s, 80)).refine(Boolean, { message: 'Ad gerekli' }),
    lastName: z.string().max(200).transform((s) => sanitizePersonName(s, 80)).refine(Boolean, { message: 'Soyad gerekli' }),
    email: z.string().trim().toLowerCase().max(254).email({ message: 'Geçerli e-posta gerekli' }),
    phone: z.string().max(100).transform((s) => sanitizePhoneDisplay(s, 48)).refine(Boolean, { message: 'Telefon gerekli' }),
    note: z.string().max(2000).optional().transform((s) => (s ? sanitizeCustomerNote(s, 2000) : undefined)),
  }),
  locale: z.enum(['tr', 'en', 'de', 'ru']).default('tr'),
})

type TourMeta = TourCapacitySource & {
  _id: string
  title?: string | null
  quickFacts?: { startTime?: string | null } | null
  ticketClasses?: { key?: string | null; label?: string | null }[] | null
}

function classCapacityKey(classKey: string): string {
  const k = classKey.toLowerCase()
  if (k.startsWith('prem')) return 'premium'
  if (k.startsWith('first')) return 'first'
  return 'eco'
}

async function remainingCapacity(tour: TourMeta, date: string, classKey: string): Promise<number> {
  const key = classCapacityKey(classKey)
  const capacity = computeBookableCapacityForDate(tour, date)[key] ?? 0
  const { data, error } = await supabase
    .from('bookings')
    .select('id, class_id, adult_count, child_count, infant_count')
    .eq('tour_id', tour._id)
    .eq('date', date)
    .in('status', BOOKING_STATUSES_COUNTING_TOWARD_CAPACITY)
  if (error) throw new Error(`Supabase capacity query failed: ${error.message}`)
  const booked = ((data ?? []) as SupabaseBookingRow[])
    .filter((row) => classCapacityKey(String(row.class_id ?? '')) === key)
    .reduce((sum, row) => sum + paxCountFromRow(row), 0)
  return Math.max(0, capacity - booked)
}

export async function POST(request: Request) {
  try {
    const limited = await rateLimitResponse(request, 'booking')
    if (limited) return limited
    const partner = await getPartnerFromSession()
    if (!partner) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Geçersiz istek' }, { status: 400 })
    }
    const { tourId, date, classKey, counts, customer, locale } = parsed.data

    if (isDateBeforeEarliestBookable(date)) {
      return NextResponse.json({ error: 'Seçilen tarih için rezervasyon alınmıyor.' }, { status: 400 })
    }

    const tour = await client.fetch<TourMeta | null>(
      `*[_type == "tour" && _id == $id][0]{
        _id, title, quickFacts{ startTime }, ticketClasses[]{ key, label },
        baseCapacity{ ecoCapacity, premiumCapacity, firstCapacity },
        availabilityOverrides[]{ date, eco, premium, first }
      }`,
      { id: tourId }
    )
    if (!tour) return NextResponse.json({ error: 'Tur bulunamadı' }, { status: 404 })

    const price = await computeBookingPrices(tour._id, date, classKey ?? '', counts, [], {}, {})
    if (price.totalPrice <= 0) {
      return NextResponse.json({ error: 'Bu seçim için fiyat hesaplanamadı. Sınıf ve tarihi kontrol edin.' }, { status: 400 })
    }

    const resolvedClass = price.privateTour
      ? { key: PRIVATE_TOUR_CLASS_ID, label: PRIVATE_TOUR_CLASS_NAME }
      : (price.singleClass ??
        (() => {
          const match = tour.ticketClasses?.find((c) => c.key === classKey)
          return match?.key ? { key: match.key, label: match.label || match.key } : null
        })())
    if (!resolvedClass) return NextResponse.json({ error: 'Bilet sınıfı seçin.' }, { status: 400 })
    if (classCapacityKey(resolvedClass.key) === 'first' && !price.privateTour) {
      return NextResponse.json(
        { error: 'First Class loca seçimi gerektirir; misafir bu sınıfı QR/bağlantı sayfanızdan alabilir.' },
        { status: 400 }
      )
    }

    const totalPax = counts.adult + counts.child + counts.infant
    if (!price.privateTour) {
      const remaining = await remainingCapacity(tour, date, resolvedClass.key)
      if (totalPax > remaining) {
        return NextResponse.json({ error: `Bu tarihte kalan kapasite ${remaining} kişi.` }, { status: 409 })
      }
    }

    const accessToken = generateBookingAccessToken()
    const tourTitle = tour.title ?? ''
    const time = tour.quickFacts?.startTime?.trim() || undefined
    const paidNow = price.privateTour || price.cashPaymentEnabled ? 0 : price.depositAmount
    const { id: bookingId } = await insertBookingWithColumnFallback(
      async (payload) => {
        const { data, error } = await supabase.from('bookings').insert(payload).select('id').single()
        return { data, error }
      },
      {
        created_at: new Date().toISOString(),
        status: 'pending',
        tour_id: tour._id,
        tour_title: tourTitle,
        date,
        ...(time && { time }),
        class_id: resolvedClass.key,
        class_name: resolvedClass.label,
        unit_price: price.unitPrice,
        total_price: price.totalPrice,
        ...(paidNow > 0 || price.privateTour || price.cashPaymentEnabled ? { paid_now: paidNow } : {}),
        currency: CURRENCY,
        customer_first_name: customer.firstName,
        customer_last_name: customer.lastName,
        customer_email: customer.email,
        customer_phone: customer.phone,
        ...(customer.note && { customer_note: customer.note }),
        adult_count: counts.adult,
        child_count: counts.child,
        infant_count: counts.infant,
        // Admin listesinde "Acente" kaynağıyla görünür; source sütunu enum olabildiği için yeni değer eklenmez.
        source: 'manual',
        manual_source: 'agency',
        admin_note: `Partner resepsiyon satışı: ${partner.name}`,
        access_token: accessToken,
        ui_locale: locale,
        ...partnerBookingFields(partner.id, partner.commissionRate, 'reception'),
      }
    )

    const emailCustomer = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      ...(customer.note && { note: customer.note }),
    }
    const email = await import('@/lib/email')

    if (price.privateTour) {
      await email
        .sendPrivateTourRequestEmails({
          bookingId,
          tourTitle,
          date,
          ...(time && { time }),
          counts,
          groupPrice: price.totalPrice,
          currency: CURRENCY,
          customer: emailCustomer,
          siteLocale: locale,
        })
        .catch((e) => console.error('[partner/bookings] özel tur e-postası', e))
      return NextResponse.json({ ok: true, kind: 'private', bookingId, totalPrice: price.totalPrice })
    }

    if (price.cashPaymentEnabled) {
      await email
        .sendBookingEmails({
          bookingId,
          accessToken,
          tourId: tour._id,
          tourTitle,
          date,
          ...(time && { time }),
          className: resolvedClass.label,
          counts,
          totalPrice: price.totalPrice,
          currency: CURRENCY,
          paidNow: 0,
          customer: emailCustomer,
          siteLocale: locale,
        })
        .catch((e) => console.error('[partner/bookings] nakit rezervasyon e-postası', e))
      return NextResponse.json({ ok: true, kind: 'cash', bookingId, totalPrice: price.totalPrice })
    }

    const amountDue = paidNow > 0 ? Math.min(price.totalPrice, paidNow) : price.totalPrice
    const sent = await email.sendPaymentLinkEmail({
      bookingId,
      accessToken,
      tourTitle,
      date,
      time: time ?? null,
      amountDue,
      currency: CURRENCY,
      customer: { firstName: customer.firstName, lastName: customer.lastName, email: customer.email },
      siteLocale: locale,
    })
    return NextResponse.json({
      ok: true,
      kind: 'online',
      bookingId,
      totalPrice: price.totalPrice,
      amountDue,
      paymentUrl: sent.url,
      emailSent: sent.ok,
    })
  } catch (e) {
    console.error('POST /api/partner/bookings', e)
    return NextResponse.json({ error: 'Rezervasyon oluşturulamadı. Lütfen tekrar deneyin.' }, { status: 500 })
  }
}
