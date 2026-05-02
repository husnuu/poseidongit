/**
 * POST /api/booking/refund-request — Müşteri "İade Talebi Gönder" akışı.
 *
 *  - Payten / NestPay API'sini ÇAĞIRMAZ. Sadece DB'ye talep işaretler.
 *  - Tur kalkışına 24 saatten az kaldıysa reddedilir (eligibility helper).
 *  - Online ödenen, henüz iade işlemi başlamamış rezervasyonlar için geçerlidir.
 *  - Admin paneli tarafında onaylanınca asıl iade `/api/payment/refund` çağrısıyla yapılır.
 *
 *  Body: { bookingId: string, email: string, amount?: number, reason?: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { rateLimitResponse } from '@/lib/rateLimit'
import { supabase } from '@/lib/supabase'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { sendRefundRequestReceivedEmails } from '@/lib/email'
import {
  computeRefundEligibility,
  refundEligibilityMessage,
} from '@/lib/bookings/refundEligibility'
import { getBaseUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const limited = await rateLimitResponse(request, 'bookingAction')
    if (limited) return limited

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
    }

    const bookingId = typeof body.bookingId === 'string' ? body.bookingId.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : ''

    if (!bookingId || !email) {
      return NextResponse.json({ error: 'bookingId ve email gerekli' }, { status: 400 })
    }

    const { data: row, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (fetchError || !row) {
      return NextResponse.json({ error: 'Rezervasyon bulunamadı' }, { status: 404 })
    }

    const data = row as SupabaseBookingRow

    const bookingEmail = String(data.customer_email ?? '').trim().toLowerCase()
    if (bookingEmail !== email) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi bu rezervasyona ait değil' },
        { status: 403 }
      )
    }

    if (data.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Bu rezervasyon zaten iptal edilmiş.' },
        { status: 400 }
      )
    }

    const isPaidOnline =
      data.payment_status === 'paid' &&
      typeof data.nestpay_trans_id === 'string' &&
      data.nestpay_trans_id.trim().length > 0
    if (!isPaidOnline) {
      return NextResponse.json(
        { error: 'Bu rezervasyon online ödemeli değil; iade talebi gönderilemez.' },
        { status: 400 }
      )
    }

    if (data.refund_status) {
      return NextResponse.json(
        {
          error:
            data.refund_status === 'requested'
              ? 'İade talebiniz daha önce alınmış, yöneticilerimiz değerlendiriyor.'
              : 'Bu rezervasyon için bir iade işlemi zaten başlamış.',
          refundStatus: data.refund_status,
        },
        { status: 409 }
      )
    }

    const eligibility = computeRefundEligibility(data.date, data.time)
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: refundEligibilityMessage(eligibility) ?? 'İade talebi gönderilemez.',
          hoursUntilTour: eligibility.hoursUntilTour,
        },
        { status: 400 }
      )
    }

    const paidAmount =
      data.paid_now != null && Number(data.paid_now) > 0
        ? Number(data.paid_now)
        : Number(data.total_price ?? 0)
    const requestedAmount = body.amount != null ? Number(body.amount) : paidAmount
    if (Number.isNaN(requestedAmount) || requestedAmount <= 0) {
      return NextResponse.json({ error: 'Geçersiz iade tutarı' }, { status: 400 })
    }
    if (requestedAmount > paidAmount) {
      return NextResponse.json(
        {
          error: `Talep edilen tutar (${requestedAmount}) ödenen tutarı (${paidAmount}) geçemez.`,
        },
        { status: 400 }
      )
    }

    const nowIso = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        refund_status: 'requested',
        refund_amount: requestedAmount,
        refund_requested_at: nowIso,
        refund_reason: reason || null,
        refunded_by: 'customer',
      })
      .eq('id', bookingId)

    if (updateError) {
      throw new Error(`Supabase refund-request update failed: ${updateError.message}`)
    }

    const baseUrl = getBaseUrl().replace(/\/$/, '')
    const manageUrl = `${baseUrl}/admin/bookings`
    void sendRefundRequestReceivedEmails({
      bookingId,
      tourTitle: String(data.tour_title ?? ''),
      date: String(data.date ?? ''),
      time: data.time ?? null,
      customer: {
        firstName: String(data.customer_first_name ?? ''),
        lastName: String(data.customer_last_name ?? ''),
        email: String(data.customer_email ?? ''),
        phone: data.customer_phone ?? null,
      },
      amount: requestedAmount,
      currency: String(data.currency ?? 'TRY'),
      reason: reason || null,
      manageUrl,
    })

    return NextResponse.json({
      ok: true,
      message:
        'İade talebiniz yöneticilerimize iletildi, 24 saat içinde sonuçlanacaktır.',
      refundStatus: 'requested',
      refundAmount: requestedAmount,
    })
  } catch (e) {
    console.error('[booking/refund-request]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
