/**
 * POST /api/booking/cancel — Rezervasyon iptali (bookingId + email ile).
 * Rate limiting: see docs/RATE_LIMITING_SUGGESTIONS.md (e.g. 10 req/min per IP).
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Rezervasyonu iptal eder; e-posta eşleşir ve tura 24 saatten fazla varsa. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
    }
    const bookingId = typeof body.bookingId === 'string' ? body.bookingId.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!bookingId || !email) {
      return NextResponse.json(
        { error: 'bookingId ve email gerekli' },
        { status: 400 }
      )
    }

    const { data: bookingRow, error: fetchError } = await supabase
      .from('bookings')
      .select('id, status, date, time, customer_email')
      .eq('id', bookingId)
      .single()
    if (fetchError || !bookingRow) {
      return NextResponse.json(
        { error: 'Rezervasyon bulunamadı' },
        { status: 404 }
      )
    }

    const data = bookingRow as SupabaseBookingRow
    if (data.status === 'cancelled') {
      return NextResponse.json({
        ok: true,
        message: 'Rezervasyon zaten iptal edilmiş.',
      })
    }

    const bookingEmail = String(data.customer_email ?? '').trim().toLowerCase()
    if (bookingEmail !== email) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi bu rezervasyona ait değil' },
        { status: 403 }
      )
    }

    const dateStr = String(data.date ?? '')
    const timeStr = data.time != null ? String(data.time) : ''
    const tourDateTime = dateStr && timeStr
      ? new Date(`${dateStr}T${timeStr}:00`)
      : dateStr
      ? new Date(`${dateStr}T12:00:00`)
      : null
    const hoursUntilTour = tourDateTime
      ? (tourDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
      : null

    if (typeof hoursUntilTour !== 'number' || hoursUntilTour <= 24) {
      return NextResponse.json(
        {
          error:
            'Tura 24 saatten az kaldığı için iptal yapılamaz. Lütfen bizimle iletişime geçin.',
        },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
    if (updateError) {
      throw new Error(`Supabase booking cancel failed: ${updateError.message}`)
    }

    return NextResponse.json({
      ok: true,
      message: 'Rezervasyonunuz iptal edildi.',
    })
  } catch (e) {
    console.error('[booking cancel]', e)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}
