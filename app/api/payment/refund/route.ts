/**
 * POST /api/payment/refund — Admin yetkili iade / iptal endpoint'i.
 *
 * Body: { bookingId: string, amount?: number, reason?: string }
 * - amount yoksa orijinal satış tutarı (tam iade).
 * - Sadece admin erişebilir.
 * - Aynı rezervasyon için tekrar çağrılmaz (idempotency).
 */
import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin } from '@/lib/adminAuthServer'
import { supabase } from '@/lib/supabase'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { smartRefund, parseProcReturnCodeMessage } from '@/lib/nestpay-refund'
import { getAdminEmail } from '@/lib/adminAuth'
import { extractAdminSessionTokenFromRequest, verifyAdminSessionToken } from '@/lib/adminSession'
import { sendRefundApprovedEmails } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function resolveAdminEmail(request: Request): Promise<string> {
  const raw = extractAdminSessionTokenFromRequest(request)
  if (raw) {
    const p = await verifyAdminSessionToken(raw)
    if (p?.email) return p.email as string
  }
  return getAdminEmail(request) ?? 'admin'
}

export async function POST(request: NextRequest) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
    }

    const bookingId = typeof body.bookingId === 'string' ? body.bookingId.trim() : ''
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId gerekli' }, { status: 400 })
    }

    const { data: snap, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (fetchError || !snap) {
      return NextResponse.json({ error: 'Rezervasyon bulunamadı' }, { status: 404 })
    }

    const booking = snap as SupabaseBookingRow

    if (booking.payment_status !== 'paid' || !booking.nestpay_trans_id) {
      return NextResponse.json(
        { error: 'Bu rezervasyon online ödemeli değil veya ödeme tamamlanmamış.' },
        { status: 400 }
      )
    }

    if (booking.refund_status === 'refunded' || booking.refund_status === 'partial_refunded') {
      return NextResponse.json(
        {
          error: 'Bu rezervasyon zaten iade edilmiş.',
          refundStatus: booking.refund_status,
          refundTransId: booking.refund_trans_id,
        },
        { status: 409 }
      )
    }

    // paid_now = bankaya ödenen gerçek tutar (kapora); total_price = tam tur fiyatı
    const originalAmount =
      booking.paid_now != null && Number(booking.paid_now) > 0
        ? Number(booking.paid_now)
        : Number(booking.total_price ?? 0)
    const refundAmountRaw = body.amount != null ? Number(body.amount) : originalAmount
    if (isNaN(refundAmountRaw) || refundAmountRaw <= 0) {
      return NextResponse.json({ error: 'Geçersiz iade tutarı' }, { status: 400 })
    }
    if (refundAmountRaw > originalAmount) {
      return NextResponse.json(
        { error: `İade tutarı (${refundAmountRaw}) orijinal satış tutarını (${originalAmount}) geçemez.` },
        { status: 400 }
      )
    }

    const adminEmail = await resolveAdminEmail(request)

    const result = await smartRefund({ orderId: bookingId, amount: refundAmountRaw, paidAt: booking.paid_at })

    const isPartial = refundAmountRaw < originalAmount
    const refundStatus = result.ok
      ? isPartial
        ? 'partial_refunded'
        : 'refunded'
      : 'refund_failed'

    const friendlyErr = result.ok
      ? null
      : parseProcReturnCodeMessage(result.procReturnCode ?? '', result.errMsg)

    const updates: Record<string, unknown> = {
      refund_status: refundStatus,
      refund_amount: refundAmountRaw,
      refunded_at: new Date().toISOString(),
      refund_trans_id: result.transId ?? null,
      refund_error: friendlyErr ?? null,
      refund_type: result.refundType ?? null,
      refund_reason: reason || booking.refund_reason || null,
      refunded_by: adminEmail,
    }
    if (result.ok) {
      updates.status = 'cancelled'
    }

    await supabase.from('bookings').update(updates).eq('id', bookingId)

    if (result.ok) {
      void sendRefundApprovedEmails({
        bookingId,
        tourTitle: String(booking.tour_title ?? ''),
        date: String(booking.date ?? ''),
        time: booking.time ?? null,
        customer: {
          firstName: String(booking.customer_first_name ?? ''),
          lastName: String(booking.customer_last_name ?? ''),
          email: String(booking.customer_email ?? ''),
        },
        amount: refundAmountRaw,
        currency: String(booking.currency ?? 'TRY'),
        refundType: (result.refundType ?? null) as 'void' | 'credit' | null,
      })
    }

    console.info('[payment/refund]', {
      bookingId,
      refundStatus,
      refundType: result.refundType,
      transId: result.transId,
      procReturnCode: result.procReturnCode,
      adminEmail,
      statusUpdated: result.ok,
    })

    return NextResponse.json({
      ok: result.ok,
      refundStatus,
      refundType: result.refundType,
      transId: result.transId,
      procReturnCode: result.procReturnCode,
      errMsg: friendlyErr ?? null,
      bookingStatus: result.ok ? 'cancelled' : booking.status ?? null,
    })
  } catch (e) {
    console.error('[payment/refund]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
