import { NextRequest, NextResponse } from 'next/server'
import { loadPendingBookingForPayment } from '@/lib/services/bookingService'
import {
  buildNestpayFormParams,
  createPaymentContext,
  getNestpayConfig,
  getPaymentPublicOrigin,
  isPaymentDebugLoggingEnabled,
  logPaymentInitiateDebug,
  parsePaymentInitiateBookingId,
  renderAutoSubmitPaymentForm,
} from '@/lib/services/paymentService'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    if (isPaymentDebugLoggingEnabled()) {
      console.info('[payment] POST /api/payment/initiate (route hit)')
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const parsed = parsePaymentInitiateBookingId(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    let snapshot
    try {
      snapshot = await loadPendingBookingForPayment(parsed.bookingId)
    } catch (loadError) {
      const msg = loadError instanceof Error ? loadError.message : String(loadError)
      if (msg.includes('Booking not found')) {
        return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
      }
      if (msg.includes('not awaiting payment')) {
        return NextResponse.json({ error: msg }, { status: 409 })
      }
      throw loadError
    }

    const config = getNestpayConfig()
    const publicOrigin = getPaymentPublicOrigin(request)
    const context = createPaymentContext(snapshot.id, snapshot.totalPrice, { publicOrigin })

    const { formParams, hashPlaintext } = buildNestpayFormParams(config, context)
    logPaymentInitiateDebug(formParams, config.storeKey, hashPlaintext)

    console.info('[payment] Initiated Nestpay transaction', {
      bookingId: context.bookingId,
      email: snapshot.email,
      amount: context.amount,
      gateway: config.gatewayUrl,
      storetype: config.storeType,
      publicOrigin,
    })

    if (process.env.NODE_ENV === 'development' && request.nextUrl.searchParams.get('debug') === '1') {
      return NextResponse.json({
        bookingId: snapshot.id,
        gatewayUrl: config.gatewayUrl,
        formParams,
        hashPlaintext,
      })
    }

    const html = renderAutoSubmitPaymentForm(config.gatewayUrl, formParams)
    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[payment] Failed to initiate payment', { message: err.message })
    const safeMessage = process.env.NODE_ENV === 'development' ? err.message : 'Could not initiate payment.'
    return NextResponse.json({ error: safeMessage }, { status: 500 })
  }
}
