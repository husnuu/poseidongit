/**
 * GET /api/booking — Rezervasyon detayı (bookingId + email ile).
 */
import { NextRequest, NextResponse } from 'next/server'
import { rateLimitResponse } from '@/lib/rateLimit'
import { supabase } from '@/lib/supabase'
import {
  firstClassLocasFromRow,
  normalizeMealPreferenceColumn,
  type SupabaseBookingRow,
} from '@/lib/bookingsSupabase'
import { generateBookingAccessToken } from '@/lib/bookingAccessToken'
import { normalizeAdditionalTravelersFromStorage } from '@/lib/bookingAdditionalTravelers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Rezervasyon detayını döndürür; sadece e-posta eşleşirse. */
export async function GET(request: NextRequest) {
  try {
    const limited = await rateLimitResponse(request, 'bookingLookup')
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')?.trim()
    const email = searchParams.get('email')?.trim()?.toLowerCase()

    if (!bookingId || !email) {
      return NextResponse.json(
        { error: 'bookingId ve email gerekli' },
        { status: 400 }
      )
    }

    let data: SupabaseBookingRow | null = null
    const { data: byId, error: byIdError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle()
    if (byIdError) {
      throw new Error(`Supabase booking lookup by id failed: ${byIdError.message}`)
    }
    if (byId) {
      data = byId as SupabaseBookingRow
    } else {
      // Backward compatibility: some links may carry human reference instead of UUID id.
      const { data: byReference, error: byReferenceError } = await supabase
        .from('bookings')
        .select('*')
        .eq('reference', bookingId)
        .maybeSingle()
      if (byReferenceError) {
        throw new Error(`Supabase booking lookup by reference failed: ${byReferenceError.message}`)
      }
      data = (byReference as SupabaseBookingRow | null) ?? null
    }
    if (!data) {
      return NextResponse.json(
        { error: 'Rezervasyon bulunamadı' },
        { status: 404 }
      )
    }

    const row = data as SupabaseBookingRow
    const bookingEmail = String(row.customer_email ?? '').trim().toLowerCase()

    if (bookingEmail !== email) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi bu rezervasyona ait değil' },
        { status: 403 }
      )
    }

    const status = row.status ?? 'pending'
    if (status === 'cancelled') {
      return NextResponse.json({
        booking: null,
        cancelled: true,
        message: 'Bu rezervasyon iptal edilmiştir.',
      })
    }

    const dateStr = String(row.date ?? '')
    const timeStr = row.time != null ? String(row.time) : ''
    const tourDateTime = dateStr && timeStr
      ? new Date(`${dateStr}T${timeStr}:00`)
      : dateStr
      ? new Date(`${dateStr}T12:00:00`)
      : null
    const now = new Date()
    const hoursUntilTour = tourDateTime
      ? (tourDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      : null
    const canCancel = typeof hoursUntilTour === 'number' && hoursUntilTour > 24

    const classId = String(row.class_id ?? '')
    const firstClassLocas = firstClassLocasFromRow(row)
    let accessToken =
      typeof row.access_token === 'string' && row.access_token.trim()
        ? row.access_token.trim()
        : undefined
    // Legacy rows may miss token; generate one after email verification.
    if (!accessToken) {
      const newToken = generateBookingAccessToken()
      const { error: tokenUpdateError } = await supabase
        .from('bookings')
        .update({ access_token: newToken })
        .eq('id', row.id)
      if (!tokenUpdateError) accessToken = newToken
    }

    const additionalTravelers = normalizeAdditionalTravelersFromStorage(row.additional_travelers)
    const mealPreferenceNorm = normalizeMealPreferenceColumn(row.meal_preference)

    const booking = {
      id: row.id,
      status,
      tourId: String(row.tour_id ?? ''),
      tourTitle: row.tour_title ?? '',
      date: dateStr,
      time: row.time ?? undefined,
      meetingPoint: row.meeting_point ?? undefined,
      mealPreference: mealPreferenceNorm,
      classId,
      className: row.class_name ?? '',
      firstClassLocas: firstClassLocas?.length ? firstClassLocas : undefined,
      totalPrice: Number(row.total_price ?? 0),
      currency: row.currency ?? 'TRY',
      counts: {
        adult: Number(row.adult_count ?? 0),
        child: Number(row.child_count ?? 0),
        infant: Number(row.infant_count ?? 0),
      },
      customer: {
        firstName: row.customer_first_name ?? '',
        lastName: row.customer_last_name ?? '',
        email: row.customer_email ?? '',
      },
      ...(additionalTravelers.length > 0 && { additionalTravelers }),
      canCancel,
      hoursUntilTour: hoursUntilTour != null ? Math.round(hoursUntilTour) : null,
      /** Secure token for ticket/voucher links. */
      accessToken,
    }

    return NextResponse.json({ booking })
  } catch (e) {
    console.error('[booking GET]', e)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}
