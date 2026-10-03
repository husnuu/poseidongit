/**
 * POST /api/payment/callback
 *
 * Banka sunucu-sunucu (server-to-server) bildirim endpoint'i.
 * Tarayıcıdan bağımsız olarak banka arka planda bu URL'e POST yapar.
 * Banka "Approved" cevabı dönene kadar 5 dakika aralıklarla tekrar gönderebilir.
 *
 * Güvenlik:
 *  - Hash mutlaka doğrulanmalı
 *  - İdempotent olmalı (aynı oid için birden fazla başarılı bildirim gelirse DB'yi bozmamalı)
 *  - Her durumda 200 + "OK" dönmeli (banka tekrarı durdurmak için bunu bekler)
 */

import { type NextRequest, NextResponse } from 'next/server'
import {
  verifyCallbackHash,
  isMdStatusAuthenticated,
  isPaymentApproved,
  loadNestpayConfig,
} from '@/lib/nestpay/hash'
import {
  getBookingStatusById,
  markBookingPaid,
  markBookingFailed,
} from '@/lib/services/bookingService'

export const runtime = 'nodejs'

function parseFormData(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {}
  formData.forEach((value, key) => {
    if (typeof value === 'string') out[key] = value
  })
  return out
}

function ok(): NextResponse {
  return new NextResponse('OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

export async function POST(request: NextRequest) {
  const debug = process.env.PAYMENT_DEBUG === '1' || process.env.PAYMENT_LOG_CALLBACK_RAW === '1'

  let params: Record<string, string>
  try {
    const fd = await request.formData()
    params = parseFormData(fd)
  } catch (err) {
    console.error('[payment/callback] formData parse hatası', err)
    return ok()
  }

  const oid = (params['oid'] ?? params['ReturnOid'] ?? '').trim()

  if (debug) {
    console.info('[payment/callback] Bildirim alındı', {
      oid,
      Response: params['Response'],
      ProcReturnCode: params['ProcReturnCode'],
      mdStatus: params['mdStatus'],
      fieldCount: Object.keys(params).length,
    })
  }

  if (!oid) {
    console.warn('[payment/callback] oid eksik — işlem yapılmadı')
    return ok()
  }

  // ── Hash doğrulama ──────────────────────────────────────────────────────────
  let config
  try {
    config = loadNestpayConfig()
  } catch (err) {
    console.error('[payment/callback] Config hatası', err)
    return ok()
  }

  // verifyCallbackHash: RESPONSE_EXCLUDE + girogate ek alanları (girogateParamReqHash,
  // querycampainghash, querydcchash, showdcchash, callbackCall) + NESTPAY_CALLBACK_EXTRA_EXCLUDE env
  const hashOk = verifyCallbackHash(params, config.storeKey)
  if (!hashOk) {
    console.warn('[payment/callback] HASH doğrulama BAŞARISIZ', {
      oid,
      response: params['Response'],
      procCode: params['ProcReturnCode'],
      fieldCount: Object.keys(params).length,
    })
    if (process.env.NESTPAY_HASH_STRICT === 'true') {
      console.error('[payment/callback] NESTPAY_HASH_STRICT=true — işlem reddedildi', { oid })
      return ok()
    }
  }

  // ── İdempotent DB güncellemesi ──────────────────────────────────────────────
  let currentStatus: string | null
  try {
    currentStatus = await getBookingStatusById(oid)
  } catch (err) {
    console.error('[payment/callback] Booking durumu okunamadı', { oid, err })
    return ok()
  }

  if (!currentStatus) {
    console.warn('[payment/callback] Booking bulunamadı', { oid })
    return ok()
  }

  const terminalStates = new Set(['paid', 'confirmed', 'refunded', 'cancelled', 'failed', 'overbooked'])
  if (terminalStates.has(currentStatus) && isPaymentApproved(params)) {
    console.info('[payment/callback] Rezervasyon zaten terminal durumda — işlem yok', { oid, currentStatus })
    return ok()
  }

  // ── 3D + ödeme kontrolleri ──────────────────────────────────────────────────
  const mdStatus = params['mdStatus'] ?? ''
  const accepted3D = isMdStatusAuthenticated(mdStatus, config.acceptHalf3D)
  const approved = isPaymentApproved(params)

  if (approved && accepted3D) {
    if (currentStatus !== 'paid' && currentStatus !== 'confirmed') {
      try {
        await markBookingPaid(oid, {
          authCode: params['AuthCode'] ?? '',
          hostRefNum: params['HostRefNum'] ?? '',
          transId: params['TransId'] ?? '',
          paidAtIso: new Date().toISOString(),
          rawCallback: params,
        })
        console.info('[payment/callback] Rezervasyon ödendi olarak işaretlendi', { oid })
      } catch (err) {
        console.error('[payment/callback] DB güncelleme hatası (paid)', { oid, err })
      }
      }
    } else {
      if (currentStatus === 'pending') {
      const errMsg =
        params['ErrMsg'] ||
        `Response=${params['Response']} Proc=${params['ProcReturnCode']} mdStatus=${mdStatus}`
      try {
        await markBookingFailed(oid, { errMsg, rawCallback: params })
        console.info('[payment/callback] Rezervasyon başarısız olarak işaretlendi', { oid, errMsg })
      } catch (err) {
        console.error('[payment/callback] DB güncelleme hatası (failed)', { oid, err })
      }
    }
  }

  return ok()
}
