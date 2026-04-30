/**
 * GET /api/payment/refund-retry
 *
 * Gün sonu tamamlandıktan sonra (sabah erken) çalıştırılır.
 * refund_status = 'refund_pending' olan tüm iptal edilmiş rezervasyonlar için
 * Credit (iade) denemesi yapar.
 *
 * Tetikleme yöntemleri:
 *   1. Vercel Cron: vercel.json → { "path": "/api/payment/refund-retry", "schedule": "0 2 * * *" }
 *   2. Manuel:      GET /api/payment/refund-retry?secret=REFUND_RETRY_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { refundPayment, parseProcReturnCodeMessage } from '@/lib/nestpay-refund'
import { sendBookingCancelledEmails } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

function checkSecret(request: NextRequest): boolean {
  const secret = process.env.REFUND_RETRY_SECRET?.trim()
  if (!secret) return true // secret tanımlı değilse herkese açık (Vercel Cron)
  const url = new URL(request.url)
  return url.searchParams.get('secret') === secret ||
    request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Bekleyen iadeleri bul (en fazla 50)
  const { data: rows, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', 'cancelled')
    .eq('refund_status', 'refund_pending')
    .not('nestpay_trans_id', 'is', null)
    .limit(50)

  if (error) {
    console.error('[refund-retry] Supabase sorgu hatası', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: 'Bekleyen iade yok.' })
  }

  console.info(`[refund-retry] ${rows.length} bekleyen iade bulundu`)

  const results: Array<{ bookingId: string; ok: boolean; errMsg?: string }> = []

  for (const row of rows as SupabaseBookingRow[]) {
    const bookingId = row.id
    const amount =
      row.paid_now != null && Number(row.paid_now) > 0
        ? Number(row.paid_now)
        : Number(row.total_price ?? 0)

    try {
      const result = await refundPayment({ orderId: bookingId, amount })

      if (result.ok) {
        // Başarılı → DB güncelle
        await supabase.from('bookings').update({
          refund_status: 'refunded',
          refund_trans_id: result.transId ?? null,
          refunded_at: new Date().toISOString(),
          refund_error: null,
          refund_type: 'credit',
        }).eq('id', bookingId)

        // Müşteriye bildirim maili
        void sendBookingCancelledEmails({
          bookingId,
          tourTitle: String(row.tour_title ?? ''),
          date: String(row.date ?? ''),
          time: row.time ?? null,
          customer: {
            firstName: String(row.customer_first_name ?? ''),
            lastName: String(row.customer_last_name ?? ''),
            email: String(row.customer_email ?? ''),
            phone: row.customer_phone ?? null,
          },
          counts: {
            adult: Number(row.adult_count ?? 0),
            child: Number(row.child_count ?? 0),
            infant: Number(row.infant_count ?? 0),
          },
          totalPrice: Number(row.total_price ?? 0),
          currency: String(row.currency ?? 'TRY'),
          cancelledBy: 'customer',
          refundOk: true,
          refundStatus: 'refunded',
          refundAmount: amount,
          refundErrMsg: null,
        })

        console.info(`[refund-retry] ✅ ${bookingId} iade başarılı`)
        results.push({ bookingId, ok: true })
      } else {
        const errMsg = parseProcReturnCodeMessage(result.procReturnCode ?? '', result.errMsg)

        // Hâlâ settle olmadıysa pending bırak, aksi halde failed yap
        const stillPending =
          (result.errMsg ?? '').toLowerCase().includes('günson') ||
          (result.errMsg ?? '').toLowerCase().includes('gün son') ||
          (result.errMsg ?? '').toLowerCase().includes('settle') ||
          result.procReturnCode === '99'

        await supabase.from('bookings').update({
          refund_status: stillPending ? 'refund_pending' : 'refund_failed',
          refund_error: errMsg,
        }).eq('id', bookingId)

        console.warn(`[refund-retry] ❌ ${bookingId} iade başarısız`, { errMsg, procReturnCode: result.procReturnCode })
        results.push({ bookingId, ok: false, errMsg })
      }
    } catch (e) {
      console.error(`[refund-retry] ${bookingId} işlem hatası`, e)
      results.push({ bookingId, ok: false, errMsg: String(e) })
    }
  }

  const successCount = results.filter((r) => r.ok).length
  const failCount    = results.length - successCount

  return NextResponse.json({
    ok: true,
    processed: results.length,
    success: successCount,
    failed: failCount,
    results,
  })
}
