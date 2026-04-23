import { NextRequest, NextResponse } from 'next/server'
import {
  checkCapacityAvailability,
  getBookingStatusById,
  markBookingFailed,
  markBookingOverbooked,
  markBookingPaid,
  triggerRefundForOverbookedBooking,
} from '@/lib/services/bookingService'
import { parsePaytenPostToRecord } from '@/lib/payten/parsePaytenPostBody'
import {
  emitPaytenReturnDiagnostics,
  getNestpayConfig,
  getPaymentResult,
  hasInsufficientParamsForNestpayHashVerification,
  isPaymentDebugLoggingEnabled,
  verifyNestpayCallbackHash,
} from '@/lib/services/paymentService'

function shouldLogPaytenCallbackRawBody(): boolean {
  const r = process.env.PAYMENT_LOG_CALLBACK_RAW
  return isPaymentDebugLoggingEnabled() || r === '1' || r === 'true'
}

export const runtime = 'nodejs'

function getPayloadValue(payload: Record<string, string>, key: string): string | undefined {
  const matchedKey = Object.keys(payload).find((currentKey) => currentKey.toLowerCase() === key.toLowerCase())
  return matchedKey ? payload[matchedKey] : undefined
}

export async function POST(request: NextRequest) {
  try {
    console.error('[payten][callback] POST isteği geldi — NestPay sunucu bildirimi bu route’a ulaşıyor.')

    const config = getNestpayConfig()

    if (shouldLogPaytenCallbackRawBody()) {
      try {
        const clone = request.clone()
        const raw = await clone.text()
        const max = 12000
        console.error(
          '[payten][callback] RAW POST BODY:\n' +
            (raw.length > max ? `${raw.slice(0, max)}\n...[truncated ${raw.length} bytes]` : raw)
        )
      } catch (rawLogErr) {
        console.warn('[payten][callback] raw body log skipped', rawLogErr)
      }
    }

    const payload = await parsePaytenPostToRecord(request)
    if (!payload) {
      console.error('[payten][callback] Gövde çözülemedi (geçersiz veya boş POST).')
      return NextResponse.json({ error: 'Invalid form body.' }, { status: 400 })
    }

    emitPaytenReturnDiagnostics('callback', payload)

    const bookingId = (getPayloadValue(payload, 'ReturnOid') ?? getPayloadValue(payload, 'oid') ?? '').trim()
    if (!bookingId) {
      console.warn('[payment] Callback received without booking id (ReturnOid / oid)')
      return NextResponse.json({ error: 'Missing booking id (ReturnOid / oid).' }, { status: 400 })
    }

    const skipHashVerify = hasInsufficientParamsForNestpayHashVerification(payload)
    if (skipHashVerify) {
      console.info(
        '[payment] Callback: HASH doğrulaması atlandı — hash/encoding dışı parametre sayısı 3’ten az (banka tam set göndermemiş; erken red / tarayıcı dönüşü sık).'
      )
    }
    const isHashValid = skipHashVerify || verifyNestpayCallbackHash(payload, config.storeKey)
    if (!isHashValid) {
      console.error('[payment] Callback hash mismatch', { bookingId })
      return NextResponse.json({ error: 'Invalid callback hash.' }, { status: 400 })
    }

    const oidRaw = (getPayloadValue(payload, 'oid') ?? '').trim()
    const returnOidRaw = (getPayloadValue(payload, 'ReturnOid') ?? '').trim()
    if (oidRaw && returnOidRaw) {
      const a = oidRaw.replace(/-/g, '').toLowerCase()
      const b = returnOidRaw.replace(/-/g, '').toLowerCase()
      if (a !== b) {
        console.error('[payment] ReturnOid does not match oid', { oid: oidRaw, returnOid: returnOidRaw })
        return NextResponse.json({ error: 'ReturnOid does not match oid.' }, { status: 400 })
      }
    }

    const paymentResult = getPaymentResult({
      response: getPayloadValue(payload, 'Response'),
      procReturnCode: getPayloadValue(payload, 'ProcReturnCode'),
      mdStatus: getPayloadValue(payload, 'mdStatus'),
    })

    let status: 'paid' | 'failed' | 'overbooked' | 'unchanged' = 'failed'

    const currentStatus = await getBookingStatusById(bookingId)
    if (!currentStatus) {
      console.error('[payment] Callback for unknown booking', { bookingId })
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    }

    const terminalPaid = currentStatus === 'paid' || currentStatus === 'confirmed'

    if (paymentResult === 'approved') {
      if (terminalPaid) {
        status = 'unchanged'
        console.info('[payment] Duplicate approved callback ignored (already paid)', { bookingId })
      } else if (currentStatus !== 'pending') {
        status = 'unchanged'
        console.warn('[payment] Approved callback ignored: booking not pending', {
          bookingId,
          currentStatus,
        })
      } else {
        const hasCapacity = await checkCapacityAvailability(bookingId)
        if (hasCapacity) {
          await markBookingPaid(bookingId)
          status = 'paid'
          console.info('[payment] Booking marked paid after capacity check', { bookingId })
        } else {
          await markBookingOverbooked(bookingId)
          await triggerRefundForOverbookedBooking(bookingId)
          status = 'overbooked'
          console.warn('[payment] Booking overbooked after payment, refund triggered', { bookingId })
        }
      }
    } else {
      if (terminalPaid) {
        status = 'unchanged'
        console.warn('[payment] Failed callback ignored (booking already paid)', { bookingId })
      } else if (currentStatus === 'failed') {
        status = 'unchanged'
      } else if (currentStatus === 'pending') {
        await markBookingFailed(bookingId)
        status = 'failed'
        console.info('[payment] Booking marked failed', { bookingId })
      } else {
        status = 'unchanged'
        console.warn('[payment] Failed callback: no status change', { bookingId, currentStatus })
      }
    }

    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        ok: true,
        bookingId,
        status,
        paymentResult,
      })
    }

    return new Response('OK', {
      status: 200,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[payment] Callback processing failed', { message: err.message })
    const safeMessage = process.env.NODE_ENV === 'development' ? err.message : 'Callback processing failed.'
    return NextResponse.json({ error: safeMessage }, { status: 500 })
  }
}
