/**
 * İşbankası NestPay — İptal (Void) ve İade (Credit) API entegrasyonu.
 *
 * XML POST → https://entegrasyon.asseco-see.com.tr/fim/api (test)
 *           → https://spos.isbank.com.tr/fim/api          (prod)
 *
 * Env: NESTPAY_API_USER, NESTPAY_API_PASSWORD, NESTPAY_CLIENT_ID
 * Opsiyonel: NESTPAY_API_URL (otomatik algılanmazsa)
 */

export type NestpayApiResponse = {
  ok: boolean
  response?: string
  procReturnCode?: string
  transId?: string
  orderId?: string
  groupId?: string
  authCode?: string
  hostRefNum?: string
  errMsg?: string
  raw?: string
}

export type SmartRefundResult = NestpayApiResponse & {
  refundType?: 'void' | 'credit'
}

type RefundConfig = {
  apiUrl: string
  apiUser: string
  apiPassword: string
  clientId: string
}

function loadRefundConfig(): RefundConfig {
  const apiUser = process.env.NESTPAY_API_USER?.trim()
  const apiPassword = process.env.NESTPAY_API_PASSWORD?.trim()
  const clientId = process.env.NESTPAY_CLIENT_ID?.trim()

  if (!apiUser) throw new Error('NESTPAY_API_USER env var eksik')
  if (!apiPassword) throw new Error('NESTPAY_API_PASSWORD env var eksik')
  if (!clientId) throw new Error('NESTPAY_CLIENT_ID env var eksik')

  let apiUrl = process.env.NESTPAY_API_URL?.trim()
  if (!apiUrl) {
    const gatewayUrl = process.env.NESTPAY_GATEWAY_URL ?? ''
    if (gatewayUrl.includes('istest') || gatewayUrl.includes('asseco-see')) {
      apiUrl = 'https://entegrasyon.asseco-see.com.tr/fim/api'
    } else {
      apiUrl = 'https://spos.isbank.com.tr/fim/api'
    }
  }

  return { apiUrl, apiUser, apiPassword, clientId }
}

/** XML özel karakterlerini kaçırır. */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildVoidXml(config: RefundConfig, oid: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>\n<CC5Request>\n  <Name>${xmlEscape(config.apiUser)}</Name>\n  <Password>${xmlEscape(config.apiPassword)}</Password>\n  <ClientId>${xmlEscape(config.clientId)}</ClientId>\n  <OrderId>${xmlEscape(oid)}</OrderId>\n  <Type>Void</Type>\n</CC5Request>`
}

function buildCreditXml(config: RefundConfig, oid: string, amount: number): string {
  return `<?xml version="1.0" encoding="utf-8"?>\n<CC5Request>\n  <Name>${xmlEscape(config.apiUser)}</Name>\n  <Password>${xmlEscape(config.apiPassword)}</Password>\n  <ClientId>${xmlEscape(config.clientId)}</ClientId>\n  <OrderId>${xmlEscape(oid)}</OrderId>\n  <Type>Credit</Type>\n  <Total>${xmlEscape(amount.toFixed(2))}</Total>\n</CC5Request>`
}

function parseXmlValue(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
  return m ? m[1].trim() : ''
}

export function parseXmlResponse(xml: string): NestpayApiResponse {
  const response = parseXmlValue(xml, 'Response')
  const procReturnCode = parseXmlValue(xml, 'ProcReturnCode')
  const errMsg = parseXmlValue(xml, 'ErrMsg')
  const transId = parseXmlValue(xml, 'TransId')
  const orderId = parseXmlValue(xml, 'OrderId')
  const groupId = parseXmlValue(xml, 'GroupId')
  const authCode = parseXmlValue(xml, 'AuthCode')
  const hostRefNum = parseXmlValue(xml, 'HostRefNum')

  const ok = response === 'Approved' && procReturnCode === '00'

  return { ok, response, procReturnCode, errMsg, transId, orderId, groupId, authCode, hostRefNum, raw: xml }
}

async function postXmlRequest(config: RefundConfig, xml: string): Promise<NestpayApiResponse> {
  const res = await fetch(config.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=UTF-8' },
    body: xml,
  })
  const responseXml = await res.text()
  return parseXmlResponse(responseXml)
}

/**
 * İptal (Void) — aynı gün ve gün sonu kapanmadan önce kullanılır.
 * Tutar gönderilmez; tüm satış iptal edilir.
 */
export async function voidPayment(oid: string): Promise<NestpayApiResponse> {
  const config = loadRefundConfig()
  const xml = buildVoidXml(config, oid)
  return postXmlRequest(config, xml)
}

/**
 * İade (Credit) — gün sonu kapandıktan sonra veya ertesi gün için kullanılır.
 * Kısmi iade destekler; Currency gönderilmez (banka orijinal işlemden alır).
 */
export async function refundPayment(oid: string, amount: number): Promise<NestpayApiResponse> {
  const config = loadRefundConfig()
  const xml = buildCreditXml(config, oid, amount)
  return postXmlRequest(config, xml)
}

/**
 * Akıllı iade: önce Void, başarısız olursa Credit dener.
 * paidAt aynı günse Void'le başlar; komisyon iadesi de yapılır.
 * 1 yıldan eski işlemlerde erken çıkar.
 */
export async function smartRefund(
  oid: string,
  amount: number,
  paidAt?: string | null
): Promise<SmartRefundResult> {
  if (paidAt) {
    const paidDate = new Date(paidAt)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    if (paidDate < oneYearAgo) {
      return {
        ok: false,
        procReturnCode: 'PL408',
        errMsg:
          'İşlem 1 yıldan eski, otomatik iade yapılamıyor. Manuel iade için bankayla iletişime geçin.',
        refundType: 'credit',
      }
    }
  }

  const isSameDay = paidAt
    ? new Date(paidAt).toDateString() === new Date().toDateString()
    : false

  if (isSameDay) {
    const voidResult = await voidPayment(oid)
    if (voidResult.ok) return { ...voidResult, refundType: 'void' }

    console.warn('[nestpay-refund] Void başarısız → Credit deneniyor:', voidResult.errMsg)
    const creditResult = await refundPayment(oid, amount)
    return { ...creditResult, refundType: 'credit' }
  }

  const creditResult = await refundPayment(oid, amount)
  return { ...creditResult, refundType: 'credit' }
}

/**
 * ProcReturnCode'u anlamlı Türkçe mesaja çevirir.
 * Yaygın İşbankası NestPay hata kodlarını kapsar.
 */
export function parseProcReturnCodeMessage(code: string, errMsg?: string): string {
  const messages: Record<string, string> = {
    '00': 'İşlem başarılı',
    PL009: 'İade tutarı orijinal satış tutarını geçemez',
    PL408:
      'İşlem 1 yıldan eski, otomatik iade yapılamıyor. Manuel iade için banka şubesine veya mutabakat birimine başvurun.',
    PL845: 'İade için banka onayı alınamadı',
    PL846:
      'Günlük iade limiti aşıldı. İşyeri bakiyesi yetersiz. İşbankası mutabakat birimini arayın: 02124730606',
    PL848:
      'İşlem 1 yıldan eski, otomatik iade yapılamıyor. Müşteriyi banka şubesine yönlendirin.',
  }

  if (code in messages) return messages[code]

  const lowerErr = (errMsg ?? '').toLowerCase()
  if (lowerErr.includes('insuffic') && lowerErr.includes('perm')) {
    return 'API kullanıcısının yetkisi yetersiz. Banka tarafında IP whitelist kontrolü gerekebilir.'
  }
  if (lowerErr.includes('currency mismatch')) {
    return 'Para birimi uyumsuzluğu. Currency alanı gönderilmiş olabilir.'
  }
  if (lowerErr.includes('iade edilmeye uygun') || lowerErr.includes('no suitable')) {
    return 'Bu işlem için iade yapılamıyor (gün sonu kapandı veya uygun kayıt bulunamadı).'
  }

  return errMsg?.trim() || `Bilinmeyen hata kodu: ${code}`
}
