/**
 * POST /api/payment/refund-request/reject — Admin: müşteri iade talebini reddet.
 *
 *  Body: { bookingId: string, reason?: string }
 *  - Sadece refund_status='requested' olan rezervasyonlar reddedilebilir.
 *  - DB: refund_status='request_rejected', refund_error=reason, refunded_by=admin.
 *  - Müşteriye ret e-postası gönderilir.
 */
import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin } from '@/lib/adminAuthServer'
import { supabase } from '@/lib/supabase'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { sendRefundRejectedEmails } from '@/lib/email'
import { getAdminEmail } from '@/lib/adminAuth'
import {
  extractAdminSessionTokenFromRequest,
  verifyAdminSessionToken,
} from '@/lib/adminSession'

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
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : ''
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId gerekli' }, { status: 400 })
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

    if (data.refund_status !== 'requested') {
      return NextResponse.json(
        {
          error: 'Sadece bekleyen iade talepleri reddedilebilir.',
          refundStatus: data.refund_status,
        },
        { status: 409 }
      )
    }

    const adminEmail = await resolveAdminEmail(request)

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        refund_status: 'request_rejected',
        refund_error: reason || 'Talep reddedildi.',
        refunded_at: new Date().toISOString(),
        refunded_by: adminEmail,
      })
      .eq('id', bookingId)

    if (updateError) {
      throw new Error(`Supabase reject update failed: ${updateError.message}`)
    }

    void sendRefundRejectedEmails({
      bookingId,
      tourTitle: String(data.tour_title ?? ''),
      date: String(data.date ?? ''),
      time: data.time ?? null,
      customer: {
        firstName: String(data.customer_first_name ?? ''),
        lastName: String(data.customer_last_name ?? ''),
        email: String(data.customer_email ?? ''),
      },
      amount: Number(data.refund_amount ?? 0),
      currency: String(data.currency ?? 'TRY'),
      reason: reason || null,
    })

    return NextResponse.json({
      ok: true,
      refundStatus: 'request_rejected',
      message: 'İade talebi reddedildi ve müşteriye bildirildi.',
    })
  } catch (e) {
    console.error('[payment/refund-request/reject]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
