/**
 * POST /api/booking/cancel — Rezervasyon iptali (bookingId + email ile).
 * Ödeme online (NestPay) ise otomatik iade denemesi yapar.
 */
import { NextRequest, NextResponse } from 'next/server'
import { rateLimitResponse } from '@/lib/rateLimit'
import { supabase } from '@/lib/supabase'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { smartRefund, parseProcReturnCodeMessage } from '@/lib/nestpay-refund'
import { sendBookingCancelledEmails } from '@/lib/email'

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

    if (!bookingId || !email) {
      return NextResponse.json(
        { error: 'bookingId ve email gerekli' },
        { status: 400 }
      )
    }

    const { data: bookingRow, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
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

    // Son iptal vakti: tur gününden bir önceki gün saat 11:00 TR saatiyle (UTC+3).
    const cancelDeadline = dateStr
      ? new Date(new Date(`${dateStr}T00:00:00+03:00`).getTime() - 13 * 60 * 60 * 1000)
      : null
    const cancellationAllowed = cancelDeadline != null && Date.now() < cancelDeadline.getTime()

    if (!cancellationAllowed) {
      return NextResponse.json(
        {
          error:
            'Tur gününden bir önceki gün saat 11:00\'den sonra iptal yapılamaz. Değişiklik için lütfen bizimle iletişime geçin.',
          hoursUntilTour: hoursUntilTour != null ? Math.round(hoursUntilTour) : null,
        },
        { status: 400 }
      )
    }

    const isPaidOnline =
      data.payment_status === 'paid' &&
      typeof data.nestpay_trans_id === 'string' &&
      data.nestpay_trans_id.trim().length > 0 &&
      data.refund_status == null

    let refundOk = false
    let refundStatus: string | null = null
    let refundTransId: string | null = null
    let refundErrMsg: string | null = null

    if (isPaidOnline) {
      // paid_now = bankaya ödenen gerçek tutar (kapora); total_price = tam tur fiyatı
      const amount =
        data.paid_now != null && Number(data.paid_now) > 0
          ? Number(data.paid_now)
          : Number(data.total_price ?? 0)
      const refundResult = await smartRefund({ orderId: bookingId, amount, paidAt: data.paid_at })

      refundOk = refundResult.ok
      refundTransId = refundResult.transId ?? null

      if (refundResult.ok) {
        refundStatus = 'refunded'
        refundErrMsg = null
      } else {
        // "Gün sonu bekleniyor" → pending (otomatik retry sabah çalışır)
        const isSettlementPending =
          refundResult.errMsg === 'GUN_SONU_BEKLENIYOR' ||
          (refundResult.errMsg ?? '').toLowerCase().includes('günson') ||
          (refundResult.errMsg ?? '').toLowerCase().includes('gün son') ||
          (refundResult.errMsg ?? '').toLowerCase().includes('gün sonuna') ||
          (refundResult.errMsg ?? '').toLowerCase().includes('settle') ||
          refundResult.procReturnCode === '99'
        refundStatus = isSettlementPending ? 'refund_pending' : 'refund_failed'
        refundErrMsg = parseProcReturnCodeMessage(refundResult.procReturnCode ?? '', refundResult.errMsg)
      }

      console.info('[booking/cancel] refund attempt', {
        bookingId,
        refundOk,
        refundType: refundResult.refundType,
        transId: refundTransId,
        procReturnCode: refundResult.procReturnCode,
      })
    }

    const updates: Record<string, unknown> = { status: 'cancelled' }
    if (isPaidOnline) {
      updates.refund_status = refundStatus
      updates.refunded_at = new Date().toISOString()
      updates.refund_trans_id = refundTransId
      updates.refund_error = refundErrMsg
      updates.refund_type = isPaidOnline ? 'credit' : null
      const paidAmount =
        data.paid_now != null && Number(data.paid_now) > 0
          ? Number(data.paid_now)
          : Number(data.total_price ?? 0)
      updates.refund_amount = isPaidOnline ? paidAmount : null
      updates.refunded_by = 'customer'
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)

    if (updateError) {
      throw new Error(`Supabase booking cancel failed: ${updateError.message}`)
    }

    // İptal bildirimi: müşteri + admin
    void sendBookingCancelledEmails({
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
      counts: {
        adult: Number(data.adult_count ?? 0),
        child: Number(data.child_count ?? 0),
        infant: Number(data.infant_count ?? 0),
      },
      totalPrice: Number(data.total_price ?? 0),
      currency: String(data.currency ?? 'TRY'),
      cancelledBy: 'customer',
      refundOk: isPaidOnline ? refundOk : undefined,
      refundStatus: isPaidOnline ? refundStatus : null,
      refundAmount: isPaidOnline && refundOk ? (data.paid_now != null && Number(data.paid_now) > 0 ? Number(data.paid_now) : Number(data.total_price ?? 0)) : null,
      refundErrMsg: isPaidOnline && !refundOk ? refundErrMsg : null,
    })

    if (isPaidOnline && refundOk) {
      return NextResponse.json({
        ok: true,
        message: 'Rezervasyonunuz iptal edildi. Ödemeniz en kısa sürede kartınıza iade edilecektir.',
        refundOk: true,
        refundStatus: 'refunded',
        refundTransId,
      })
    }

    if (isPaidOnline && refundStatus === 'refund_pending') {
      return NextResponse.json({
        ok: true,
        message: 'Rezervasyonunuz iptal edildi. Ödemeniz otomatik olarak işleme alınmıştır ve en geç 1–3 iş günü içinde kartınıza iade edilecektir.',
        refundOk: false,
        refundStatus: 'refund_pending',
      })
    }

    if (isPaidOnline && !refundOk) {
      if (refundErrMsg?.includes('1 yıldan eski')) {
        return NextResponse.json({
          ok: true,
          message:
            'Rezervasyonunuz iptal edildi. Ödemeniz 1 yıldan eski olduğu için otomatik iade yapılamadı. Lütfen banka şubeniyle iletişime geçin.',
          refundOk: false,
          refundStatus: 'refund_failed',
          refundErrMsg,
        })
      }
      return NextResponse.json({
        ok: true,
        message:
          'Rezervasyonunuz iptal edildi. Ödeme iadesi işlemi başlatılamadı — destek ekibimiz sizinle iletişime geçecektir.',
        refundOk: false,
        refundStatus: 'refund_failed',
        refundErrMsg,
      })
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
