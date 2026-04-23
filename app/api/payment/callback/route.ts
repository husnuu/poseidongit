import { normalizeCaseInsensitivePaymentFields } from '@/lib/nestpay/normalizeNestpayCallback'
import { resolveSupabaseBookingIdFromPaytenOrderFields } from '@/lib/payten/resolvePaytenBookingLookup'
import { parsePaytenPostToRecord } from '@/lib/payten/parsePaytenPostBody'
import {
  checkCapacityAvailability,
  getBookingStatusById,
  markBookingFailed,
  markBookingOverbooked,
  markBookingPaid,
  markBookingPaymentCallbackSuspicious,
  triggerRefundForOverbookedBooking,
} from '@/lib/services/bookingService'
import {
  diagnoseNestpayCallbackHashVerification,
  emitPaytenReturnDiagnostics,
  getNestpayConfig,
  getPaymentResult,
  isPaymentDebugLoggingEnabled,
} from '@/lib/services/paymentService'

function shouldLogPaytenCallbackRawBody(): boolean {
  const r = process.env.PAYMENT_LOG_CALLBACK_RAW
  return isPaymentDebugLoggingEnabled() || r === '1' || r === 'true'
}

/** Log için HASH tam değerini basmayız; uzunluk + kısa önek yeterli. */
function maskHashForCallbackLog(hash: string): string | Record<string, string | number> {
  const t = (hash ?? '').trim()
  if (!t) return '(empty)'
  if (t.length <= 24) return `${t.slice(0, 8)}…(${t.length} chars)`
  return { length: t.length, prefix: t.slice(0, 12), suffix: t.slice(-8) }
}

export const runtime = 'nodejs'

function plainOk(): Response {
  return new Response('OK', {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

export async function POST(request: Request) {
  console.info('[payment:callback] CALLBACK HIT')
  try {
    const config = getNestpayConfig()

    if (shouldLogPaytenCallbackRawBody()) {
      try {
        const clone = request.clone()
        const raw = await clone.text()
        const max = 12_000
        console.info(
          '[payten][callback] RAW POST BODY:\n' +
            (raw.length > max ? `${raw.slice(0, max)}\n...[truncated ${raw.length} bytes]` : raw)
        )
      } catch (rawLogErr) {
        console.warn('[payten][callback] raw body log skipped', rawLogErr)
      }
    }

    const payload = await parsePaytenPostToRecord(request)
    if (!payload || Object.keys(payload).length === 0) {
      console.error(
        '[payment:callback] STAGE=EMPTY_BODY — Gövde çözülemedi veya boş (callback route’a ulaşıldı ama alan yok). OK dönülüyor.'
      )
      return plainOk()
    }

    emitPaytenReturnDiagnostics('callback', payload)

    const normalized = normalizeCaseInsensitivePaymentFields(payload)
    console.info('[payment:callback] normalized fields:', {
      Response: normalized.Response || '(empty)',
      ProcReturnCode: normalized.ProcReturnCode || '(empty)',
      mdStatus: normalized.mdStatus || '(empty)',
      oid: normalized.oid || '(empty)',
      ReturnOid: normalized.ReturnOid || '(empty)',
      HASH: maskHashForCallbackLog(normalized.HASH),
    })

    const successByFields = getPaymentResult({
      response: normalized.Response,
      procReturnCode: normalized.ProcReturnCode,
      mdStatus: normalized.mdStatus,
    })
    const paymentApproved = successByFields === 'approved'
    console.info('[payment:callback] successByFields result:', {
      paymentResult: successByFields,
      approvedByTriple: paymentApproved,
    })

    const oidNorm = normalized.oid.replace(/-/g, '').toLowerCase()
    const returnOidNorm = normalized.ReturnOid.replace(/-/g, '').toLowerCase()
    if (normalized.oid && normalized.ReturnOid && oidNorm !== returnOidNorm) {
      console.warn(
        '[payment:callback] oid ve ReturnOid ham metin olarak farklı; rezervasyon çözümü yine de oid veya ReturnOid ile yapılır (NestPay bazen farklı biçim gönderir).',
        { oid: normalized.oid, ReturnOid: normalized.ReturnOid }
      )
    }

    const resolvedBookingId = await resolveSupabaseBookingIdFromPaytenOrderFields(
      normalized.oid,
      normalized.ReturnOid
    )
    console.info('[payment:callback] booking lookup result:', {
      ok: Boolean(resolvedBookingId),
      resolvedBookingId: resolvedBookingId ?? null,
      lookedUpOid: Boolean(normalized.oid?.trim()),
      lookedUpReturnOid: Boolean(normalized.ReturnOid?.trim()),
    })

    if (!resolvedBookingId) {
      console.warn('[payment:callback] STAGE=BOOKING_LOOKUP_FAIL — FINALIZATION BLOCKED', {
        oid: normalized.oid || '',
        returnOid: normalized.ReturnOid || '',
      })
      return plainOk()
    }

    const currentStatus = await getBookingStatusById(resolvedBookingId)
    console.info('[payment:callback] current booking status from DB:', { resolvedBookingId, currentStatus })
    if (!currentStatus) {
      console.error('[payment:callback] STAGE=BOOKING_STATUS_READ_FAIL — Bilinmeyen rezervasyon', { resolvedBookingId })
      return plainOk()
    }

    const terminalPaid = currentStatus === 'paid' || currentStatus === 'confirmed'
    if (terminalPaid) {
      console.info('[payment:callback] booking update result:', {
        ok: true,
        skipped: true,
        reason: 'already_paid_or_confirmed',
        bookingId: resolvedBookingId,
        currentStatus,
      })
      return plainOk()
    }

    const hashDiag = diagnoseNestpayCallbackHashVerification(payload, config.storeKey)
    const hashVerified = hashDiag.hashVerified
    console.info('[payment:callback] hashVerified result:', hashVerified)
    if (isPaymentDebugLoggingEnabled() || process.env.PAYMENT_LOG_CALLBACK_RAW === '1' || process.env.PAYMENT_LOG_CALLBACK_RAW === 'true') {
      console.info('[payment:callback] HASH diagnostic detail:', JSON.stringify(hashDiag))
    }

    if (!hashVerified) {
      console.info('[payment:callback] booking update result:', {
        ok: false,
        skipped: true,
        reason: 'hash_verification_failed',
        bookingId: resolvedBookingId,
        primaryFailureCode: hashDiag.primaryFailureCode,
        paymentApprovedButBlocked: paymentApproved,
      })
      if (paymentApproved) {
        console.error('[payment:callback] STAGE=HASH_FAIL — FINALIZATION BLOCKED (üçlü onaylı ama imza eşleşmedi)', {
          bookingId: resolvedBookingId,
          primaryFailureCode: hashDiag.primaryFailureCode,
          postKeysOutsideHashAllowlist: hashDiag.postKeysOutsideHashAllowlist,
          primaryStoreIncomingPairMatches: hashDiag.primaryStoreIncomingPairMatches,
          sortedCanonicalKeysInSignature: hashDiag.sortedCanonicalKeysInSignature,
          allowlistSignableParamCount: hashDiag.allowlistSignableParamCount,
        })
      }
      if (paymentApproved && currentStatus === 'pending') {
        console.error('[payment:callback] ŞÜPHELİ: onay üçlüsü geldi ancak HASH doğrulanamadı; ödeme onaylanmadı', {
          bookingId: resolvedBookingId,
        })
        await markBookingPaymentCallbackSuspicious(resolvedBookingId, {
          rawCallback: payload,
          detail: 'NestPay callback HASH doğrulanamadı (onay üçlüsü ile birlikte).',
        })
      } else {
        console.warn('[payment:callback] HASH başarısız; rezervasyon durumu değiştirilmedi', {
          bookingId: resolvedBookingId,
          paymentApproved,
          currentStatus,
        })
      }
      return plainOk()
    }

    if (paymentApproved) {
      if (currentStatus !== 'pending') {
        console.info('[payment:callback] booking update result:', {
          ok: false,
          skipped: true,
          reason: 'booking_not_pending',
          bookingId: resolvedBookingId,
          currentStatus,
        })
        return plainOk()
      }
      const hasCapacity = await checkCapacityAvailability(resolvedBookingId)
      if (hasCapacity) {
        const paidAtIso = new Date().toISOString()
        try {
          const paidResult = await markBookingPaid(resolvedBookingId, {
            authCode: normalized.AuthCode,
            hostRefNum: normalized.HostRefNum,
            transId: normalized.TransId,
            paidAtIso,
            rawCallback: payload,
          })
          console.info('[payment:callback] booking update result:', {
            ok: true,
            skipped: false,
            bookingId: paidResult.id,
            newStatus: paidResult.status,
            paymentStatus: 'paid',
            authCode: normalized.AuthCode || null,
            hostRefNum: normalized.HostRefNum || null,
            transId: normalized.TransId || null,
            paidAt: paidAtIso,
          })
        } catch (markPaidErr) {
          const err = markPaidErr instanceof Error ? markPaidErr : new Error(String(markPaidErr))
          console.error('[payment:callback] booking update result:', {
            ok: false,
            skipped: false,
            stage: 'markBookingPaid_exception',
            bookingId: resolvedBookingId,
            message: err.message,
            stack: err.stack,
          })
        }
      } else {
        await markBookingOverbooked(resolvedBookingId)
        await triggerRefundForOverbookedBooking(resolvedBookingId)
        console.info('[payment:callback] booking update result:', {
          ok: true,
          skipped: false,
          reason: 'overbooked_no_capacity',
          bookingId: resolvedBookingId,
        })
      }
    } else {
      if (currentStatus === 'failed') {
        console.info('[payment:callback] Yinelenen başarısız callback — zaten failed', {
          bookingId: resolvedBookingId,
        })
        return plainOk()
      }
      if (currentStatus === 'pending') {
        await markBookingFailed(resolvedBookingId, {
          errMsg: normalized.ErrMsg || `Response=${normalized.Response} Proc=${normalized.ProcReturnCode} md=${normalized.mdStatus}`,
          rawCallback: payload,
        })
        console.info('[payment:callback] booking update result:', {
          ok: true,
          skipped: false,
          bookingId: resolvedBookingId,
          newStatus: 'failed',
          detail: 'markBookingFailed',
        })
      } else {
        console.warn('[payment:callback] Başarısız callback — durum değiştirilmedi', {
          bookingId: resolvedBookingId,
          currentStatus,
        })
      }
    }

    return plainOk()
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[payment:callback] İşlem hatası', { message: err.message, stack: err.stack })
    return new Response('ERROR', { status: 500 })
  }
}
