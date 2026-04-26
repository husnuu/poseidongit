/**
 * POST /api/payment/result
 *
 * Banka, başarılı işlemde okUrl'e, başarısız işlemde failUrl'e tarayıcı üzerinden POST yapar.
 * Her iki URL de buraya yönlendirilir; Response/ProcReturnCode/mdStatus'a göre sonuç belirlenir.
 *
 * Akış:
 *  1. formData'yı parse et
 *  2. Hash'i doğrula (güvenlik kritik — atlanırsa sahte ödeme bildirimi kabul edilir)
 *  3. mdStatus + Response + ProcReturnCode kontrolü
 *  4. DB'yi güncelle (pending → paid/failed)
 *  5. Kullanıcıyı /payment/success veya /payment/fail sayfasına yönlendir
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  verifyResponseHash,
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

export async function POST(request: NextRequest) {
  let params: Record<string, string>
  try {
    const fd = await request.formData()
    params = parseFormData(fd)
  } catch (err) {
    console.error('[payment/result] formData parse hatası', err)
    return NextResponse.redirect(new URL('/payment/fail', request.url))
  }

  const oid = (params['oid'] ?? params['ReturnOid'] ?? '').trim()
  const debug = process.env.PAYMENT_DEBUG === '1' || process.env.NODE_ENV !== 'production'

  if (debug) {
    console.info('[payment/result] Banka yanıtı alındı', {
      oid,
      Response: params['Response'],
      ProcReturnCode: params['ProcReturnCode'],
      mdStatus: params['mdStatus'],
      ErrMsg: params['ErrMsg'],
    })
  }

  if (!oid) {
    console.warn('[payment/result] oid/ReturnOid yok — yönlendirme başarısız')
    return NextResponse.redirect(new URL('/payment/fail', request.url))
  }

  // ── Hash doğrulama (kritik güvenlik adımı) ──────────────────────────────────
  let config
  try {
    config = loadNestpayConfig()
  } catch (err) {
    console.error('[payment/result] Config hatası', err)
    return NextResponse.redirect(new URL(`/payment/fail?oid=${encodeURIComponent(oid)}`, request.url))
  }

  const hashOk = verifyResponseHash(params, config.storeKey)
  if (!hashOk) {
    console.error('[payment/result] HASH doğrulama BAŞARISIZ — sahte bildirim şüphesi', { oid })
    // Hash uyuşmuyorsa ödemi kabul etme; kullanıcıyı fail sayfasına gönder
    return NextResponse.redirect(new URL(`/payment/fail?oid=${encodeURIComponent(oid)}&reason=hash`, request.url))
  }

  // ── 3D doğrulama kontrolü ──────────────────────────────────────────────────
  const mdStatus = params['mdStatus'] ?? ''
  const accepted3D = isMdStatusAuthenticated(mdStatus, config.acceptHalf3D)
  if (!accepted3D) {
    console.warn('[payment/result] 3D doğrulama kabul edilmedi', { oid, mdStatus })
    try {
      await markBookingFailed(oid, {
        errMsg: `3D doğrulama başarısız (mdStatus=${mdStatus})`,
        rawCallback: params,
      })
    } catch (dbErr) {
      console.error('[payment/result] DB güncelleme hatası (3D fail)', dbErr)
    }
    return NextResponse.redirect(new URL(`/payment/fail?oid=${encodeURIComponent(oid)}`, request.url))
  }

  // ── Ödeme onay kontrolü ────────────────────────────────────────────────────
  const approved = isPaymentApproved(params)

  if (approved) {
    try {
      const currentStatus = await getBookingStatusById(oid)
      if (currentStatus !== 'paid' && currentStatus !== 'confirmed') {
        await markBookingPaid(oid, {
          authCode: params['AuthCode'] ?? '',
          hostRefNum: params['HostRefNum'] ?? '',
          transId: params['TransId'] ?? '',
          paidAtIso: new Date().toISOString(),
          rawCallback: params,
        })
        console.info('[payment/result] Rezervasyon ödendi olarak işaretlendi', { oid })
      } else {
        console.info('[payment/result] Rezervasyon zaten ödenmiş', { oid, currentStatus })
      }
    } catch (dbErr) {
      console.error('[payment/result] DB güncelleme hatası (paid)', { oid, dbErr })
    }
    return NextResponse.redirect(new URL(`/payment/success?oid=${encodeURIComponent(oid)}`, request.url))
  } else {
    const errMsg = params['ErrMsg'] ?? `Response=${params['Response']} Proc=${params['ProcReturnCode']}`
    try {
      const currentStatus = await getBookingStatusById(oid)
      if (currentStatus !== 'failed') {
        await markBookingFailed(oid, { errMsg, rawCallback: params })
        console.info('[payment/result] Rezervasyon başarısız olarak işaretlendi', { oid, errMsg })
      }
    } catch (dbErr) {
      console.error('[payment/result] DB güncelleme hatası (failed)', { oid, dbErr })
    }
    return NextResponse.redirect(new URL(`/payment/fail?oid=${encodeURIComponent(oid)}`, request.url))
  }
}

// GET: banka bazı durumlarda GET ile de gelir — aynı handler
export async function GET(request: NextRequest) {
  const oid = request.nextUrl.searchParams.get('oid') ?? ''
  if (oid) {
    return NextResponse.redirect(new URL(`/payment/fail?oid=${encodeURIComponent(oid)}`, request.url))
  }
  return NextResponse.redirect(new URL('/payment/fail', request.url))
}
