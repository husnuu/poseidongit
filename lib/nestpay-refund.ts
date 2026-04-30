/**
 * İşbankası NestPay — İptal (Void) ve İade (Credit) API entegrasyonu.
 *
 * API Post Adresi: NESTPAY_API_URL (örn. https://istest.asseco-see.com.tr/fim/api)
 * ClientId       : NESTPAY_CLIENT_ID (Üye İşyeri / Mağaza Numarası)
 * Auth           : NESTPAY_API_USER + NESTPAY_API_PASSWORD
 */

import { XMLParser } from 'fast-xml-parser'

// ─── Config ───────────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const val = process.env[key]?.trim()
  if (!val) throw new Error(`${key} env var eksik`)
  return val
}

type RefundConfig = {
  apiUrl: string
  apiUser: string
  apiPassword: string
  clientId: string
}

function loadRefundConfig(): RefundConfig {
  const config: RefundConfig = {
    apiUrl: requireEnv('NESTPAY_API_URL'),
    apiUser: requireEnv('NESTPAY_API_USER'),
    apiPassword: requireEnv('NESTPAY_API_PASSWORD'),
    clientId: requireEnv('NESTPAY_CLIENT_ID'),
  }
  if (process.env.PAYMENT_DEBUG === '1') {
    console.info('[nestpay-refund] config', {
      apiUrl: config.apiUrl,
      apiUser: config.apiUser,
      clientId: config.clientId,
    })
  }
  return config
}

// ─── XML helpers ──────────────────────────────────────────────────────────────

/** 5 özel karakteri XML escape eder. */
function xmlEsc(v: string | number): string {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

type BuildParams = {
  type: 'Void' | 'Credit'
  orderId?: string
  transId?: string
  /** Sadece kısmi iade için gönderilir. Tam iade veya Void'de YOK. */
  total?: number
}

/** CC5Request XML body üretir. Currency alanı gönderilmez (banka orijinalden alır). */
function buildRequestXml(cfg: RefundConfig, params: BuildParams): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<CC5Request>',
    `  <Name>${xmlEsc(cfg.apiUser)}</Name>`,
    `  <Password>${xmlEsc(cfg.apiPassword)}</Password>`,
    `  <ClientId>${xmlEsc(cfg.clientId)}</ClientId>`,
    `  <Type>${params.type}</Type>`,
  ]

  if (params.orderId) lines.push(`  <OrderId>${xmlEsc(params.orderId)}</OrderId>`)
  if (params.transId) lines.push(`  <TransId>${xmlEsc(params.transId)}</TransId>`)

  // <Total> SADECE kısmi iade Credit'te gönderilir
  if (params.type === 'Credit' && params.total != null) {
    lines.push(`  <Total>${xmlEsc(params.total.toFixed(2))}</Total>`)
  }

  lines.push('</CC5Request>')
  return lines.join('\n')
}

// ─── Response parse ───────────────────────────────────────────────────────────

export type ParsedResponse = {
  orderId?: string
  response: string
  procReturnCode?: string
  authCode?: string
  hostRefNum?: string
  transId?: string
  errMsg?: string
}

const xmlParser = new XMLParser({ ignoreAttributes: false, parseTagValue: true })

function parseResponseXml(xml: string): ParsedResponse {
  try {
    const doc = xmlParser.parse(xml) as { CC5Response?: Record<string, unknown> }
    const r = doc?.CC5Response ?? {}
    const str = (k: string) => (r[k] != null ? String(r[k]).trim() : undefined)
    return {
      orderId: str('OrderId'),
      response: str('Response') ?? '',
      procReturnCode: str('ProcReturnCode'),
      authCode: str('AuthCode'),
      hostRefNum: str('HostRefNum'),
      transId: str('TransId'),
      errMsg: str('ErrMsg'),
    }
  } catch {
    // Regex fallback — parse tam başarısız olursa
    const get = (tag: string) => xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1]?.trim()
    return {
      orderId: get('OrderId'),
      response: get('Response') ?? '',
      procReturnCode: get('ProcReturnCode'),
      authCode: get('AuthCode'),
      hostRefNum: get('HostRefNum'),
      transId: get('TransId'),
      errMsg: get('ErrMsg'),
    }
  }
}

// ─── HTTP POST ────────────────────────────────────────────────────────────────

export type RefundResult = {
  ok: boolean
  transId?: string
  orderId?: string
  authCode?: string
  hostRefNum?: string
  procReturnCode?: string
  errMsg?: string
  raw?: string
}

async function postToNestpay(
  cfg: RefundConfig,
  xmlBody: string
): Promise<RefundResult> {
  if (process.env.PAYMENT_DEBUG === '1') {
    console.info('[nestpay-refund] → POST', cfg.apiUrl)
    console.info('[nestpay-refund] → XML\n', xmlBody)
  }

  const res = await fetch(cfg.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=UTF-8' },
    body: xmlBody,
  })

  const raw = await res.text()

  if (process.env.PAYMENT_DEBUG === '1') {
    console.info('[nestpay-refund] ← HTTP', res.status)
    console.info('[nestpay-refund] ← XML\n', raw)
  }

  const parsed = parseResponseXml(raw)
  const ok = parsed.response === 'Approved' && parsed.procReturnCode === '00'

  return {
    ok,
    transId: parsed.transId,
    orderId: parsed.orderId,
    authCode: parsed.authCode,
    hostRefNum: parsed.hostRefNum,
    procReturnCode: parsed.procReturnCode,
    errMsg: parsed.errMsg,
    raw,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * İptal (Void) — aynı gün, gün sonu öncesi.
 * orderId veya transId'den en az biri gerekli.
 */
export async function voidPayment(opts: {
  orderId?: string
  transId?: string
}): Promise<RefundResult> {
  const cfg = loadRefundConfig()
  const xml = buildRequestXml(cfg, { type: 'Void', ...opts })
  return postToNestpay(cfg, xml)
}

/**
 * İade (Credit) — gün sonu sonrası.
 * amount verilmezse tam iade (Total alanı gönderilmez).
 * amount verilirse kısmi iade (Total alanı gönderilir).
 */
export async function refundPayment(opts: {
  orderId: string
  amount?: number
}): Promise<RefundResult> {
  const cfg = loadRefundConfig()
  const xml = buildRequestXml(cfg, {
    type: 'Credit',
    orderId: opts.orderId,
    total: opts.amount,          // undefined ise XML'e eklenmez → tam iade
  })
  return postToNestpay(cfg, xml)
}

/**
 * Akıllı iade: önce Void dener; 1 yıldan eski veya Void başarısız olursa Credit.
 */
export type SmartRefundResult = RefundResult & { refundType: 'void' | 'credit' }

export async function smartRefund(opts: {
  orderId: string
  amount?: number
  paidAt?: string | null
}): Promise<SmartRefundResult> {
  const { orderId, amount, paidAt } = opts

  // 1 yıldan eski işlem kontrolü
  if (paidAt) {
    const paidDate = new Date(paidAt)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    if (paidDate < oneYearAgo) {
      return {
        ok: false,
        procReturnCode: 'PL408',
        errMsg: 'İşlem 1 yıldan eski, otomatik iade yapılamıyor. Manuel iade için bankayla iletişime geçin.',
        refundType: 'credit',
      }
    }
  }

  // ─── Yöntem seçimi: Void mu Credit mi? ───────────────────────────────────────
  //
  //  Void  → aynı gün, gün sonu öncesi. Banka havuzundan siler, limit anında döner.
  //  Credit → gün sonu geçmiş (muhasebeleşmiş). 3-10 iş günü sürer.
  //
  //  paidAt bilinmiyorsa Void'i dene — işlem günün içindeyse çalışır,
  //  değilse banka zaten "uygun işlem yok" diyerek reddeder, o zaman Credit'e geçeriz.

  function toTrDateStr(d: Date): string {
    return d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' })
  }

  const nowTr   = toTrDateStr(new Date())
  const paidTr  = paidAt ? toTrDateStr(new Date(paidAt)) : null
  // paidAt yoksa "bugün olabilir" diye Void dene (güvenli: banka reddederse Credit'e geçeriz)
  const tryVoidFirst = paidTr === null || paidTr === nowTr

  if (tryVoidFirst) {
    console.info('[nestpay-refund] Void deneniyor', { orderId, paidTr, nowTr })
    const voidResult = await voidPayment({ orderId })

    if (voidResult.ok) {
      console.info('[nestpay-refund] ✅ Void başarılı')
      return { ...voidResult, refundType: 'void' }
    }

    const voidErr = (voidResult.errMsg ?? '').toLowerCase()
    console.warn('[nestpay-refund] Void başarısız', {
      errMsg: voidResult.errMsg,
      procReturnCode: voidResult.procReturnCode,
    })

    // Gün sonu bekleniyorsa → Credit de çalışmaz, pending kuyruğuna al
    const isSettlementPending =
      voidErr.includes('günson') ||
      voidErr.includes('gün son') ||
      voidErr.includes('gun son') ||
      voidErr.includes('settle') ||
      voidErr.includes('sipariş günsonuna') ||
      voidErr.includes('günsonu') ||
      voidResult.procReturnCode === '99'

    if (isSettlementPending) {
      console.info('[nestpay-refund] Gün sonu bekleniyor → pending kuyruğu')
      return {
        ok: false,
        procReturnCode: voidResult.procReturnCode,
        errMsg: 'GUN_SONU_BEKLENIYOR',  // cancel route bunu pending olarak işaretler
        refundType: 'void',
      }
    }

    // Void "uygun işlem yok" dedi ama gün sonu değil → işlem muhasebeleşmiş, Credit dene
    const isAlreadySettled =
      voidErr.includes('no suitable') ||
      voidErr.includes('iade edilmeye uygun') ||
      voidErr.includes('suitable transaction') ||
      voidErr.includes('bulunamad')

    if (isAlreadySettled) {
      console.info('[nestpay-refund] Void: işlem zaten muhasebeleşmiş → Credit deneniyor')
      // Credit'e düş (aşağıda)
    } else if (paidTr === nowTr) {
      // Aynı gün ama Void başka sebeple başarısız → yine de Credit dene
      console.info('[nestpay-refund] Aynı gün Void başarısız (diğer hata) → Credit deneniyor')
    }
    // paidAt bilinmiyordu ve Void başarısız → Credit dene
  }

  // Credit: gün sonu geçmiş işlemler için
  console.info('[nestpay-refund] Credit deneniyor', { orderId, amount })
  const creditResult = await refundPayment({ orderId, amount })
  return { ...creditResult, refundType: 'credit' }
}

// ─── Hata kodu çevirici ───────────────────────────────────────────────────────

export function parseProcReturnCodeMessage(code: string, errMsg?: string): string {
  const messages: Record<string, string> = {
    '00': 'İşlem başarılı',
    PL009: 'İade tutarı orijinal satış tutarını geçemez',
    PL408: 'İşlem 1 yıldan eski, otomatik iade yapılamıyor. Banka şubesiyle iletişime geçin.',
    PL845: 'İade için banka onayı alınamadı',
    PL846: 'Günlük iade limiti aşıldı. İşbankası mutabakat birimini arayın: 02124730606',
    PL848: 'İşlem 1 yıldan eski, müşteriyi banka şubesine yönlendirin.',
  }

  if (code in messages) return messages[code]

  const lower = (errMsg ?? '').toLowerCase()
  if (lower.includes('insuffic') && lower.includes('perm')) {
    return 'API yetkisi yetersiz. Banka tarafında IP whitelist kontrolü gerekebilir.'
  }
  if (lower.includes('currency mismatch')) {
    return 'Para birimi uyumsuzluğu. Currency alanı gönderilmiş olabilir.'
  }
  if (lower.includes('iade edilmeye uygun') || lower.includes('no suitable')) {
    return 'Bu işlem için iade yapılamıyor (uygun işlem kaydı bulunamadı).'
  }
  if (lower.includes('günson') || lower.includes('gun son') || lower.includes('gün son') || lower.includes('gunsonuna')) {
    return 'İşlem henüz gün sonuna girmemiş. Lütfen ertesi gün tekrar deneyin.'
  }

  return errMsg?.trim() || `Bilinmeyen hata kodu: ${code}`
}
