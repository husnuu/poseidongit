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
  buildCallbackExcludeSet,
} from '@/lib/nestpay/hash'
import {
  getBookingStatusById,
  markBookingPaid,
  markBookingFailed,
  markBookingPaymentCallbackSuspicious,
  isTourWebPaymentFlow,
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

  // Girogate proxy'nin dinamik kur dönüşümü (DCC) veya kampanya gibi özelliklerle hash
  // hesabına SONRADAN eklediği ek alanları (querydcchash, showdcchash, girogateParamReqHash
  // vb.) dışla — aksi halde yabancı kartlarda DCC devreye girdiğinde bu sayfaya (okUrl/failUrl)
  // gelen yanıtın hash'i, bu alanlar yüzünden YANLIŞLIKLA geçersiz sayılabilir. /api/payment/callback
  // ile aynı dışlama kümesi (bkz. lib/nestpay/hash.ts).
  const hashOk = verifyResponseHash(params, config.storeKey, buildCallbackExcludeSet())
  if (!hashOk) {
    console.warn('[payment/result] HASH doğrulama BAŞARISIZ — devam ediliyor (Girogate proxy)', {
      oid,
      response: params['Response'],
      procCode: params['ProcReturnCode'],
    })
    // Yeni 3D Pay (tur rezervasyonu) akışında HASH doğrulaması ZORUNLUDUR — doğrulanamayan
    // yanıt hiçbir şekilde güvenilmez, ödeme onaylanmaz/reddedilmez (durum pending kalır),
    // sadece inceleme için işaretlenir. Mevcut Hosting akışları (yat kaporası, ödeme linki)
    // NESTPAY_HASH_STRICT env değişkeni olmadan lenient davranışını aynen korur.
    const strictRequired = process.env.NESTPAY_HASH_STRICT === 'true' || (await isTourWebPaymentFlow(oid))
    if (strictRequired) {
      console.error('[payment/result] HASH doğrulanamadı — yanıt güvenilmez sayıldı, ödeme ONAYLANMADI', { oid })
      try {
        await markBookingPaymentCallbackSuspicious(oid, {
          rawCallback: params,
          detail: `[result] HASH mismatch — Response=${params['Response']} Proc=${params['ProcReturnCode']}`,
        })
      } catch (err) {
        console.error('[payment/result] Şüpheli işaret kaydedilemedi', { oid, err })
      }
      return NextResponse.redirect(new URL(`/payment/fail?oid=${encodeURIComponent(oid)}&reason=hash`, request.url))
    }
  }

  // ── Ödeme onay kontrolü ────────────────────────────────────────────────────
  // Response=Approved + ProcReturnCode=00 → banka ödemeyi onaylamış
  const approved = isPaymentApproved(params)

  // ── 3D doğrulama kontrolü ──────────────────────────────────────────────────
  // Ödeme onaylıysa mdStatus eksik/boş olsa bile geçer (banka zaten onayladı).
  // Ödeme onaylı DEĞİLSE mdStatus'a bakarak 3D doğrulama yapılır.
  const mdStatus = params['mdStatus'] ?? ''
  const accepted3D = approved || isMdStatusAuthenticated(mdStatus, config.acceptHalf3D)
  if (!approved && !accepted3D) {
    console.warn('[payment/result] 3D doğrulama kabul edilmedi', { oid, mdStatus })
    return NextResponse.redirect(new URL(`/payment/fail?oid=${encodeURIComponent(oid)}`, request.url))
  }

  if (approved) {
    try {
      const currentStatus = await getBookingStatusById(oid)
      const blockPaidTransition = new Set([
        'paid',
        'confirmed',
        'cancelled',
        'failed',
        'refunded',
        'overbooked',
      ])
      if (currentStatus && !blockPaidTransition.has(currentStatus)) {
        await markBookingPaid(oid, {
          authCode: params['AuthCode'] ?? '',
          hostRefNum: params['HostRefNum'] ?? '',
          transId: params['TransId'] ?? '',
          paidAtIso: new Date().toISOString(),
          rawCallback: params,
        })
        console.info('[payment/result] Rezervasyon ödendi olarak işaretlendi', { oid })
      } else {
        console.info('[payment/result] Ödeme onayı yok sayıldı (rezervasyon artık pending değil)', {
          oid,
          currentStatus,
        })
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
