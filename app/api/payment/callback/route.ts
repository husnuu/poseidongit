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
  emitPaytenReturnDiagnostics,
  getNestpayConfig,
  isNestpayPaymentSuccessful,
  isPaymentDebugLoggingEnabled,
  verifyNestpayCallbackHash,
} from '@/lib/services/paymentService'

function shouldLogPaytenCallbackRawBody(): boolean {
  const r = process.env.PAYMENT_LOG_CALLBACK_RAW
  return isPaymentDebugLoggingEnabled() || r === '1' || r === 'true'
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
  try {
    console.info('[payten][callback] POST — NestPay sunucu bildirimi')

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
      console.error('[payten][callback] Gövde çözülemedi veya boş; yine de OK dönülüyor (banka tekrarını sınırlamak için).')
      return plainOk()
    }

    emitPaytenReturnDiagnostics('callback', payload)

    const normalized = normalizeCaseInsensitivePaymentFields(payload)
    console.info('[payten][callback] normalize edilmiş çekirdek alanlar:', {
      Response: normalized.Response,
      ProcReturnCode: normalized.ProcReturnCode,
      mdStatus: normalized.mdStatus,
      oid: normalized.oid ? `${normalized.oid.slice(0, 8)}…` : '',
      ReturnOid: normalized.ReturnOid ? `${normalized.ReturnOid.slice(0, 8)}…` : '',
    })

    const resolvedBookingId = await resolveSupabaseBookingIdFromPaytenOrderFields(
      normalized.oid,
      normalized.ReturnOid
    )
    if (!resolvedBookingId) {
      console.warn('[payment:callback] oid/ReturnOid rezervasyona çözülemedi', {
        oid: normalized.oid ? `${normalized.oid.slice(0, 24)}…` : '',
        returnOid: normalized.ReturnOid ? `${normalized.ReturnOid.slice(0, 24)}…` : '',
      })
      return plainOk()
    }

    const currentStatus = await getBookingStatusById(resolvedBookingId)
    if (!currentStatus) {
      console.error('[payment:callback] Bilinmeyen rezervasyon', { resolvedBookingId })
      return plainOk()
    }

    const terminalPaid = currentStatus === 'paid' || currentStatus === 'confirmed'
    if (terminalPaid) {
      console.info('[payment:callback] Yinelenen callback — rezervasyon zaten ödendi/onaylı; işlem yapılmadı', {
        bookingId: resolvedBookingId,
        currentStatus,
      })
      return plainOk()
    }

    const hashOk = verifyNestpayCallbackHash(payload, config.storeKey)
    console.info('[payment:callback] NestPay HASH doğrulama sonucı:', hashOk ? 'MATCH' : 'MISMATCH')

    const paymentApproved = isNestpayPaymentSuccessful(
      normalized.Response,
      normalized.ProcReturnCode,
      normalized.mdStatus
    )
    console.info('[payment:callback] Ödeme üçlü kararı (Response/Proc/mdStatus):', paymentApproved ? 'approved' : 'failed')

    if (!hashOk) {
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

    const oidRaw = normalized.oid
    const returnOidRaw = normalized.ReturnOid
    if (oidRaw && returnOidRaw) {
      const a = oidRaw.replace(/-/g, '').toLowerCase()
      const b = returnOidRaw.replace(/-/g, '').toLowerCase()
      if (a !== b) {
        console.error('[payment:callback] ReturnOid oid ile eşleşmiyor (HASH geçerli olsa bile işlem yok)', {
          oid: oidRaw,
          returnOid: returnOidRaw,
        })
        return plainOk()
      }
    }

    if (paymentApproved) {
      if (currentStatus !== 'pending') {
        console.warn('[payment:callback] Onaylı callback yok sayıldı: rezervasyon pending değil', {
          bookingId: resolvedBookingId,
          currentStatus,
        })
        return plainOk()
      }
      const hasCapacity = await checkCapacityAvailability(resolvedBookingId)
      if (hasCapacity) {
        const paidAtIso = new Date().toISOString()
        await markBookingPaid(resolvedBookingId, {
          authCode: normalized.AuthCode,
          hostRefNum: normalized.HostRefNum,
          transId: normalized.TransId,
          paidAtIso,
          rawCallback: payload,
        })
        console.info('[payment:callback] Rezervasyon ödendi olarak kaydedildi', { bookingId: resolvedBookingId })
      } else {
        await markBookingOverbooked(resolvedBookingId)
        await triggerRefundForOverbookedBooking(resolvedBookingId)
        console.warn('[payment:callback] Kapasite yok — overbooked + iade tetikleme', {
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
        console.info('[payment:callback] Rezervasyon ödeme başarısız olarak işaretlendi', {
          bookingId: resolvedBookingId,
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
