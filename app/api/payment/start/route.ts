/**
 * POST /api/payment/start
 *
 * Rezervasyon oluşturulduktan sonra NestPay ödeme formunu başlatır.
 * Body: { bookingId: string }
 * Yanıt: { action: string; fields: Record<string, string> }
 *
 * Güvenlik: tutar asla client'tan alınmaz — DB'den çekilir.
 */

import { NextRequest, NextResponse } from 'next/server'
import { loadPendingBookingForPayment } from '@/lib/services/bookingService'
import { buildPaymentFormFields, loadNestpayConfig } from '@/lib/nestpay/hash'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  }

  const { bookingId } = body as Record<string, unknown>

  if (typeof bookingId !== 'string' || !bookingId.trim()) {
    return NextResponse.json({ error: 'bookingId zorunludur.' }, { status: 400 })
  }

  const id = bookingId.trim()

  // Booking'i DB'den yükle — tutar sunucu tarafında hesaplanır
  let snapshot
  try {
    snapshot = await loadPendingBookingForPayment(id)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('not found') || msg.includes('bulunamadı')) {
      return NextResponse.json({ error: 'Rezervasyon bulunamadı.' }, { status: 404 })
    }
    if (msg.includes('not awaiting payment')) {
      return NextResponse.json({ error: 'Bu rezervasyon ödeme bekliyor durumunda değil.' }, { status: 409 })
    }
    console.error('[payment/start] Booking yükleme hatası', { bookingId: id, msg })
    return NextResponse.json({ error: 'Rezervasyon yüklenemedi.' }, { status: 500 })
  }

  try {
    const { client } = await import('@/lib/sanity')
    const { supabase } = await import('@/lib/supabase')
    const { data: bookingRow } = await supabase
      .from('bookings')
      .select('tour_id')
      .eq('id', id)
      .maybeSingle()
    const tourId = typeof bookingRow?.tour_id === 'string' ? bookingRow.tour_id.trim() : ''
    if (tourId) {
      const tourCash = await client.fetch<{ cashPaymentEnabled?: boolean } | null>(
        `*[_type == "tour" && (_id == $id || slug.current == $id)][0]{ cashPaymentEnabled }`,
        { id: tourId }
      )
      if (tourCash?.cashPaymentEnabled) {
        return NextResponse.json(
          { error: 'Bu tur için online ödeme kapalıdır. Ödeme kapıda nakit alınır.' },
          { status: 400 }
        )
      }
    }
  } catch {
    // Sanity kontrolü başarısızsa NestPay devam edebilir; nakit turlar API yanıtında cashPayment döner
  }

  let config
  try {
    config = loadNestpayConfig()
  } catch (err) {
    console.error('[payment/start] NestPay config hatası', err)
    return NextResponse.json({ error: 'Ödeme sistemi yapılandırılamadı.' }, { status: 500 })
  }

  const result = buildPaymentFormFields(
    {
      bookingId: snapshot.id,
      amount: snapshot.totalPrice,
      customerName: snapshot.name,
      customerEmail: snapshot.email,
    },
    config
  )

  console.info('[payment/start] Form alanları üretildi', {
    bookingId: snapshot.id,
    amount: snapshot.totalPrice,
    oid: result.fields.oid,
    gateway: config.gatewayUrl,
  })

  return NextResponse.json({ action: result.action, fields: result.fields })
}
