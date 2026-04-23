import { randomBytes } from 'node:crypto'
import { getBaseUrl } from '@/lib/seo'
import {
  buildNestpayV3ResponseHashSignature,
  buildPaytenHashPlaintext,
  comparePaytenHashParamKeysAlphabetical,
  countNestpayV3ResponseHashSignableParams,
  generateHash,
  listPostKeysOutsideNestpayV3ResponseHashAllowlist,
  verifyNestpayResponseHash,
} from '@/lib/nestpay/hash'

const PAYTEN_ISLEM_TIPLERI = new Set(['Auth', 'PreAuth', 'PostAuth', 'Void', 'Credit'])

function normalizePaytenIslemTipi(raw: string): string {
  const key = raw.trim().toLowerCase()
  const map: Record<string, string> = {
    auth: 'Auth',
    preauth: 'PreAuth',
    postauth: 'PostAuth',
    void: 'Void',
    credit: 'Credit',
  }
  return map[key] ?? raw.trim()
}

export type NestpayConfig = {
  clientId: string
  storeKey: string
  gatewayUrl: string
  /** ISO 4217 numerik kod (ör. TRY = 949) */
  currencyNumeric: string
  /** Payten ödeme sayfası dili: tr | en */
  lang: 'tr' | 'en'
  /** Payten işlem tipi (satış için genelde Auth) — POST alanı `islemtipi`. */
  islemTipi: string
  /**
   * 3D Pay Hosting: uygulama `3d_pay_hosting` (küçük harf) gönderir; `NESTPAY_STORETYPE` ile override.
   */
  storeType: string
}

export type NestpayInitiateContext = {
  bookingId: string
  rnd: string
  okUrl: string
  failUrl: string
  callbackUrl: string
  amount: string
  /** Payten: okUrl / failUrl’e yönlendirme öncesi sayaç (saniye). Form alanı `refreshtime`. */
  refreshtime: string
}

export type PaymentResult = 'approved' | 'failed'

type CallbackResultInput = {
  response?: string
  procReturnCode?: string
  mdStatus?: string
}

/**
 * Payten HTTP örneği: `…/fim/Paytengate`. Banka sadece kök URL verdiyse bu path eklenir.
 * Eski dökümanlarda `est3Dgate` geçebilir — o zaman `NESTPAY_GATEWAY_URL` içinde tam path verin.
 */
const NESTPAY_GATEWAY_PATH = '/fim/Paytengate'
/** Postgres / Supabase varsayılan UUID formatı (sürüm bağımsız gevşek doğrulama). */
const BOOKING_ID_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Ödeme en son adım: istekte yalnızca mevcut `pending` rezervasyonun `bookingId` değeri gelir.
 * İsim, e-posta, tarih, misafir ve tutar Supabase kaydından okunur (istemci ile oynanamaz).
 */
export function parsePaymentInitiateBookingId(raw: unknown): { ok: true; bookingId: string } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Request body must be a JSON object.' }
  }

  const record = raw as Record<string, unknown>
  const bookingId = normalizeText(record.bookingId ?? record.booking_id)

  if (!bookingId) {
    return { ok: false, error: 'Missing bookingId. Create the booking first, then start payment.' }
  }

  if (!BOOKING_ID_UUID_REGEX.test(bookingId)) {
    return { ok: false, error: 'Invalid bookingId.' }
  }

  return { ok: true, bookingId }
}

export function getNestpayConfig(): NestpayConfig {
  const clientId = normalizeText(process.env.NESTPAY_CLIENT_ID)
  const storeKey = normalizeText(process.env.NESTPAY_STORE_KEY)
  const rawGatewayUrl = normalizeText(process.env.NESTPAY_GATEWAY_URL)
  const currencyNumeric =
    normalizeText(process.env.NESTPAY_CURRENCY_NUMERIC) || normalizeText(process.env.NESTPAY_CURRENCY) || '949'
  const langRaw = (normalizeText(process.env.NESTPAY_LANG) || 'tr').toLowerCase()
  const lang: 'tr' | 'en' = langRaw === 'en' ? 'en' : 'tr'
  const islemTipiRaw =
    normalizeText(process.env.NESTPAY_ISLEM_TIPI) ||
    normalizeText(process.env.NESTPAY_TRANSACTION_TYPE) ||
    'Auth'
  const islemTipi = normalizePaytenIslemTipi(islemTipiRaw)
  const storeType = resolveNestpayStoreType()

  if (!clientId) {
    throw new Error('Missing NESTPAY_CLIENT_ID environment variable.')
  }
  if (!/^[A-Za-z0-9]{1,15}$/.test(clientId)) {
    throw new Error('NESTPAY_CLIENT_ID must be 1–15 alphanumeric characters (Payten üye iş yeri numarası).')
  }
  if (!storeKey) {
    throw new Error('Missing NESTPAY_STORE_KEY environment variable.')
  }
  if (!/^\d{3}$/.test(currencyNumeric)) {
    throw new Error('NESTPAY_CURRENCY_NUMERIC or NESTPAY_CURRENCY must be exactly 3 digits (e.g. 949 for TRY).')
  }
  if (!PAYTEN_ISLEM_TIPLERI.has(islemTipi)) {
    throw new Error(`NESTPAY_ISLEM_TIPI / NESTPAY_TRANSACTION_TYPE must be one of: ${[...PAYTEN_ISLEM_TIPLERI].join(', ')}.`)
  }
  if (!rawGatewayUrl || !/^https?:\/\//i.test(rawGatewayUrl)) {
    throw new Error('Missing or invalid NESTPAY_GATEWAY_URL environment variable.')
  }

  let gatewayUrl: string
  try {
    const parsed = new URL(rawGatewayUrl)
    if (!parsed.pathname || parsed.pathname === '/') {
      parsed.pathname = NESTPAY_GATEWAY_PATH
      parsed.search = ''
      parsed.hash = ''
    }
    gatewayUrl = parsed.toString()
  } catch {
    throw new Error('NESTPAY_GATEWAY_URL is not a valid URL.')
  }

  return { clientId, storeKey, gatewayUrl, currencyNumeric, lang, islemTipi, storeType }
}

/** Payten: rnd sabit uzunluk 20 karakter (hash için rastgele dize). */
function getRnd(): string {
  return randomBytes(10).toString('hex')
}

function formatAmount(totalPrice: number): string {
  return totalPrice.toFixed(2)
}

/**
 * 3D Pay Hosting: Asseco/Payten PHP örneklerinde `storetype` neredeyse daima **`3d_pay_hosting`** (küçük harf).
 * `3D_PAY_HOSTING` bırakılmış eski değerler aynı ürüne eşlenir. Yanlış tür, kart/3D sayfası yerine düz yanıt
 * veya farklı akış verir — **NESTPAY_STORETYPE** ve **NESTPAY_GATEWAY_URL** banka dökümanıyla aynı olmalı.
 */
function resolveNestpayStoreType(): string {
  const raw = normalizeText(process.env.NESTPAY_STORETYPE) || normalizeText(process.env.NESTPAY_STORE_TYPE)
  if (!raw) return '3d_pay_hosting'
  if (raw === '3D_PAY_HOSTING' || raw.toLowerCase() === '3d_pay_hosting') {
    return '3d_pay_hosting'
  }
  return raw
}

/** Payten form alanı `firmaadi` (opsiyonel; boş bırakılabilir; hash’e girer). */
function resolveNestpayFirmaAdi(): string {
  return (
    normalizeText(process.env.NESTPAY_FIRMA_ADI) ||
    normalizeText(process.env.NESTPAY_COMPANY_NAME) ||
    normalizeText(process.env.NEXT_PUBLIC_SITE_NAME)
  )
}

/** Payten `refreshtime`: 1–600 sn; varsayılan 10. `NESTPAY_REFRESHTIME` veya `options.refreshTimeSeconds`. */
function resolvePaytenRefreshtime(options?: { refreshTimeSeconds?: number }): string {
  if (options?.refreshTimeSeconds != null && Number.isFinite(options.refreshTimeSeconds)) {
    const n = Math.min(600, Math.max(1, Math.floor(options.refreshTimeSeconds)))
    return String(n)
  }
  const raw = normalizeText(process.env.NESTPAY_REFRESHTIME)
  if (raw && /^\d+$/.test(raw)) {
    const n = Math.min(600, Math.max(1, parseInt(raw, 10)))
    return String(n)
  }
  return '10'
}

/** Payten’den gelen metinleri HTML’de güvenli göstermek için (form + dönüş sayfaları). */
export function escapeHtmlForPaytenAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Payten okUrl/failUrl POST gövdesinde alan adı büyük/küçük harf farklı gelebilir.
 * Dokümanda örnek: Response " Approved " → trim ile normalize.
 */
export function readPaytenReturnField(formData: FormData, fieldName: string): string {
  const target = fieldName.toLowerCase()
  for (const [key, value] of formData.entries()) {
    if (key.toLowerCase() === target && typeof value === 'string') {
      return value.trim()
    }
  }
  return ''
}

/**
 * Tarayıcının bu API’ye ulaştığı public kök (Payten ok/fail/callback URL’leri).
 * `NEXT_PUBLIC_SITE_URL` ile localhost uyuşmazsa geçit isteği reddedilebilir veya yanlış domain’e dönersiniz.
 */
export function getPaymentPublicOrigin(request: Request): string {
  const hostPart =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host')?.trim() ||
    ''
  if (!hostPart) {
    return getBaseUrl()
  }
  let proto =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase() || ''
  if (!proto) {
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/i.test(hostPart)
    proto = isLocal ? 'http' : 'https'
  }
  return `${proto}://${hostPart}`.replace(/\/$/, '')
}

export function createPaymentContext(
  bookingOid: string,
  totalPrice: number,
  options?: { publicOrigin?: string; refreshTimeSeconds?: number }
): NestpayInitiateContext {
  const baseUrl = (options?.publicOrigin ?? getBaseUrl()).replace(/\/$/, '')
  /**
   * Payten: başarılı/başarısız işlemde müşteri okUrl / failUrl’e yönlendirilir; geçit parametreleri geri döner.
   * Rezervasyon durumu yalnızca callbackUrl ile güncellenir — bu sayfalar bilgilendirme amaçlıdır.
   */
  return {
    bookingId: bookingOid,
    rnd: getRnd(),
    okUrl: `${baseUrl}/odeme/basarili`,
    failUrl: `${baseUrl}/odeme/basarisiz`,
    callbackUrl: `${baseUrl}/api/payment/callback`,
    amount: formatAmount(totalPrice),
    refreshtime: resolvePaytenRefreshtime(options),
  }
}

export type NestpayFormBuildResult = {
  formParams: Record<string, string>
  /** NestPay Hash Ver3: alfabetik sıralı değer zinciri + storeKey (debug). */
  hashPlaintext: string
}

/**
 * NestPay Hash Ver3 (§2.1): Gönderilen **tüm** parametreler (hash/encoding hariç) alfabetik A→Z sırayla
 * değerleri `|` ile birleştirilir; `|` ve `\` kaçışlanır; sonda storeKey. Dökümandaki “Sample order” bu sıranın örneğidir.
 */
export function buildNestpayFormParams(config: NestpayConfig, context: NestpayInitiateContext): NestpayFormBuildResult {
  const formParams: Record<string, string> = {
    amount: context.amount,
    callbackUrl: context.callbackUrl,
    clientid: config.clientId,
    currency: config.currencyNumeric,
    failUrl: context.failUrl,
    hashAlgorithm: 'ver3',
    islemtipi: config.islemTipi,
    lang: config.lang,
    oid: context.bookingId,
    okUrl: context.okUrl,
    refreshtime: context.refreshtime,
    rnd: context.rnd,
    storetype: config.storeType,
  }

  const firmaadi = resolveNestpayFirmaAdi()
  if (firmaadi) {
    formParams.firmaadi = firmaadi
  }

  const hashPlaintext = buildPaytenHashPlaintext(formParams, config.storeKey)
  formParams.hash = generateHash(formParams, config.storeKey)
  return { formParams, hashPlaintext }
}

/** Form alanlarını alfabetik sıraya diz (hash en sonda). */
function orderPaytenFormEntries(params: Record<string, string>): Array<[string, string]> {
  const entries = Object.entries(params)
  const hashIndex = entries.findIndex(([k]) => k.toLowerCase() === 'hash')
  const rest: Array<[string, string]> = []
  let hashEntry: [string, string] | undefined
  for (let i = 0; i < entries.length; i += 1) {
    if (i === hashIndex) {
      hashEntry = entries[i]
    } else {
      rest.push(entries[i]!)
    }
  }
  rest.sort(([a], [b]) => comparePaytenHashParamKeysAlphabetical(a, b))
  return hashEntry ? [...rest, hashEntry] : rest
}

export function renderAutoSubmitPaymentForm(actionUrl: string, params: Record<string, string>): string {
  const hiddenInputs = orderPaytenFormEntries(params)
    .map(
      ([key, value]) =>
        `<input type="hidden" name="${escapeHtmlForPaytenAttribute(key)}" value="${escapeHtmlForPaytenAttribute(value)}" />`
    )
    .join('\n        ')

  return `<!DOCTYPE html>
<html lang="tr">
  <head>
    <title>Ödeme geçidine yönlendiriliyor</title>
    <meta http-equiv="Content-Language" content="tr" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body onload="(function(){var f=document.getElementById('pay_form');if(f)f.submit();})();">
    <form name="pay_form" id="pay_form" method="post" action="${escapeHtmlForPaytenAttribute(actionUrl)}">
        ${hiddenInputs}
    </form>
    <noscript><p>Lütfen formu gönderin.</p></noscript>
  </body>
</html>`
}

function pushUnique(out: string[], seen: Set<string>, value: string | undefined) {
  if (typeof value !== 'string') return
  const t = value.trim()
  if (!t || seen.has(t)) return
  seen.add(t)
  out.push(t)
}

/** .env’de BOM / görünmez boşluk; bazı geçitler URL-safe base64. */
function nestpayStoreKeyCandidates(normalizedStoreKey: string): string[] {
  const seen = new Set<string>()
  const list: string[] = []
  const raw = process.env.NESTPAY_STORE_KEY
  pushUnique(list, seen, normalizedStoreKey)
  if (typeof raw === 'string') {
    pushUnique(list, seen, raw)
    pushUnique(list, seen, raw.replace(/\u200b|\u200c|\u200d|\ufeff/g, ''))
  }
  return list
}

function padBase64Url(s: string): string {
  const t = s.trim()
  const m = t.length % 4
  if (m === 0) return t
  return `${t}${'='.repeat(4 - m)}`
}

/** Gelen HASH: boşluk, URL-safe (- _), eksik padding. */
function nestpayIncomingHashCandidates(incoming: string): string[] {
  const seen = new Set<string>()
  const list: string[] = []
  const raw = incoming.trim().replace(/\s+/g, '')
  pushUnique(list, seen, raw)
  pushUnique(list, seen, padBase64Url(raw))
  if (raw.includes('-') && !raw.includes('+')) {
    const std = raw.replace(/-/g, '+').replace(/_/g, '/')
    pushUnique(list, seen, std)
    pushUnique(list, seen, padBase64Url(std))
  }
  return list
}

export function normalizeCallbackPayload(rawEntries: Iterable<[string, FormDataEntryValue]>): Record<string, string> {
  const output: Record<string, string> = {}
  for (const [key, value] of rawEntries) {
    output[key] = typeof value === 'string' ? value : ''
  }
  return output
}

/**
 * Ayrıntılı ödeme logları (HASH PLAINTEXT içinde store key görünür).
 * - `PAYMENT_DEBUG=1` veya `true` → her ortamda açık
 * - Aksi halde yalnızca `NODE_ENV !== 'production'` (yerel `next dev` / staging)
 */
export function isPaymentDebugLoggingEnabled(): boolean {
  const p = process.env.PAYMENT_DEBUG
  if (p === '1' || p === 'true') return true
  return process.env.NODE_ENV !== 'production'
}

/** Production’da bile terminalde görünür özet (`console.error`). Tam JSON için `.env` → `PAYMENT_DEBUG=1` veya `npm run dev`. */
export function emitPaytenReturnDiagnostics(routeLabel: string, record: Record<string, string>): void {
  const pick = (name: string) => {
    const key = Object.keys(record).find((k) => k.toLowerCase() === name.toLowerCase())
    return key ? normalizeText(record[key]) : ''
  }
  console.error(`[payten][${routeLabel}] POST alındı — alan sayısı=${Object.keys(record).length}`)
  console.error(
    `[payten][${routeLabel}] Response=${pick('Response')} | ProcReturnCode=${pick('ProcReturnCode')} | mdStatus=${pick('mdStatus')} | ErrMsg=${pick('ErrMsg')}`
  )
  if (isPaymentDebugLoggingEnabled()) {
    logPaytenInboundForm(routeLabel, record)
  }
}

/** Ödeme başlat: gönderilen form alanları, düz metin imza zinciri, hash (terminalden kopyalanabilir). */
export function logPaymentInitiateDebug(
  formParams: Record<string, string>,
  storeKey: string,
  hostingHashPlaintext?: string
): void {
  if (!isPaymentDebugLoggingEnabled()) return
  console.log('[payment:initiate] PAYMENT PARAMS:\n' + JSON.stringify(formParams, null, 2))
  if (hostingHashPlaintext !== undefined) {
    console.log('[payment:initiate] HASH PLAINTEXT (NestPay Ver3 §2.1, alfabetik):\n' + hostingHashPlaintext)
  } else {
    console.log('[payment:initiate] HASH PLAINTEXT (NestPay Ver3 §2.1, alfabetik):\n' + buildPaytenHashPlaintext(formParams, storeKey))
  }
  const hashParamKey = Object.keys(formParams).find((k) => k.toLowerCase() === 'hash')
  const hash = hashParamKey ? formParams[hashParamKey]! : generateHash(formParams, storeKey)
  console.log('[payment:initiate] GENERATED HASH:\n' + hash)
}

/** Banka → okUrl / failUrl / callback POST (tek obje + entries). */
/**
 * Callback’te HASH yoksa veya boşsa sunucu tarafı doğrulama yapılamaz.
 * (Tarayıcı dönüşünde hash eşleşmesi zorunlu değildir; bkz. `paytenBrowserReturnHtml`.)
 */
export function hasInsufficientParamsForNestpayHashVerification(payload: Record<string, string>): boolean {
  const hashKey = Object.keys(payload).find((k) => k.toLowerCase() === 'hash')
  if (!hashKey) return true
  return !normalizeText(payload[hashKey] ?? '')
}

export function logPaytenInboundForm(label: string, record: Record<string, string>): void {
  if (!isPaymentDebugLoggingEnabled()) return
  console.log(`[payment:${label}] BANK RESPONSE:\n` + JSON.stringify(record, null, 2))
  console.log(`[payment:${label}] BANK RESPONSE ENTRIES:\n` + JSON.stringify(Object.entries(record), null, 2))
}

export function verifyNestpayCallbackHash(payload: Record<string, string>, storeKey: string): boolean {
  const hashKey = Object.keys(payload).find((key) => key.toLowerCase() === 'hash')
  const incomingRaw = hashKey ? payload[hashKey]! : ''
  if (!normalizeText(incomingRaw)) return false

  const incomingCandidates = nestpayIncomingHashCandidates(incomingRaw)
  const storeCandidates = nestpayStoreKeyCandidates(storeKey)

  for (const sk of storeCandidates) {
    for (const inc of incomingCandidates) {
      if (verifyNestpayResponseHash(payload, sk, { incomingHashCandidate: inc, quiet: true })) return true
    }
  }

  if (isPaymentDebugLoggingEnabled() && storeCandidates.length > 0 && incomingCandidates.length > 0) {
    verifyNestpayResponseHash(payload, storeCandidates[0]!, { incomingHashCandidate: incomingCandidates[0]! })
  }
  if (isPaymentDebugLoggingEnabled()) {
    console.warn('[payment] HASH verify: callback — NestPay V3 yanıt (izin listesi) eşleşmedi', {
      storeKeyLengths: storeCandidates.map((s) => s.length),
      incomingHashLengths: incomingCandidates.map((s) => s.length),
    })
  }

  return false
}

export type NestpayCallbackHashDiagnosis = {
  hashVerified: boolean
  /**
   * HASH_MATCH: doğrulama geçti.
   * MISSING_HASH_PARAM / EMPTY_HASH_VALUE: imza doğrulanamaz → finalizasyon yapılmaz.
   * NESTPAY_V3_COMPUTED_MISMATCH: HASH var ama hiçbir storeKey/hash adayı eşleşmedi (yanlış store key, farklı imza algoritması veya izin listesi dışı imzalı alanlar).
   */
  primaryFailureCode:
    | 'HASH_MATCH'
    | 'MISSING_HASH_PARAM'
    | 'EMPTY_HASH_VALUE'
    | 'NESTPAY_V3_COMPUTED_MISMATCH'
  hashParamKey: string | null
  incomingHashLength: number
  incomingHashCandidateCount: number
  storeKeyCandidateCount: number
  primaryStoreKeyLength: number
  /** Yalnızca ilk storeKey + ilk incoming adayı ile `verifyNestpayResponseHash(quiet)` — tüm döngüyle aynı sonuç olmayabilir. */
  primaryStoreIncomingPairMatches: boolean
  sortedCanonicalKeysInSignature: string[]
  allowlistSignableParamCount: number
  postBodyFieldCount: number
  /** Banka POST’ta gönderir; NestPay Ver3 yanıt izin listemizde yoksa imza zincirine alınmazlar. */
  postKeysOutsideHashAllowlist: string[]
  expectedHashPrefix: string
  incomingPrimaryPrefix: string
  /** PAYMENT_DEBUG / non-production: imza düz metin uzunluğu (içinde storeKey vardır; tam metni loglamayın). */
  plaintextUtf8Length: number | null
}

/**
 * Callback’te HASH’in finalizasyonu engelleyip engellemediğini ayırt etmek için güvenli özet (storeKey içeriği loglanmaz).
 */
export function diagnoseNestpayCallbackHashVerification(
  payload: Record<string, string>,
  storeKey: string
): NestpayCallbackHashDiagnosis {
  const hashKey = Object.keys(payload).find((key) => key.toLowerCase() === 'hash')
  const incomingRaw = hashKey ? payload[hashKey]! : ''
  const incomingTrim = normalizeText(incomingRaw)
  const storeCandidates = nestpayStoreKeyCandidates(storeKey)
  const sk0 = storeCandidates[0] ?? ''
  const outside = listPostKeysOutsideNestpayV3ResponseHashAllowlist(payload)
  const signableCount = countNestpayV3ResponseHashSignableParams(payload)
  const postCount = Object.keys(payload).length

  if (!hashKey) {
    return {
      hashVerified: false,
      primaryFailureCode: 'MISSING_HASH_PARAM',
      hashParamKey: null,
      incomingHashLength: 0,
      incomingHashCandidateCount: 0,
      storeKeyCandidateCount: storeCandidates.length,
      primaryStoreKeyLength: sk0.length,
      primaryStoreIncomingPairMatches: false,
      sortedCanonicalKeysInSignature: sk0 ? buildNestpayV3ResponseHashSignature(payload, sk0).sortedKeys : [],
      allowlistSignableParamCount: signableCount,
      postBodyFieldCount: postCount,
      postKeysOutsideHashAllowlist: outside,
      expectedHashPrefix: '',
      incomingPrimaryPrefix: '',
      plaintextUtf8Length: null,
    }
  }

  if (!incomingTrim) {
    const builtEmpty = sk0 ? buildNestpayV3ResponseHashSignature(payload, sk0) : null
    return {
      hashVerified: false,
      primaryFailureCode: 'EMPTY_HASH_VALUE',
      hashParamKey: hashKey,
      incomingHashLength: 0,
      incomingHashCandidateCount: 0,
      storeKeyCandidateCount: storeCandidates.length,
      primaryStoreKeyLength: sk0.length,
      primaryStoreIncomingPairMatches: false,
      sortedCanonicalKeysInSignature: builtEmpty?.sortedKeys ?? [],
      allowlistSignableParamCount: signableCount,
      postBodyFieldCount: postCount,
      postKeysOutsideHashAllowlist: outside,
      expectedHashPrefix: builtEmpty?.expectedHashBase64.slice(0, 16) ?? '',
      incomingPrimaryPrefix: '',
      plaintextUtf8Length:
        builtEmpty && isPaymentDebugLoggingEnabled() ? builtEmpty.plaintext.length : null,
    }
  }

  const hashVerified = verifyNestpayCallbackHash(payload, storeKey)
  const incomingCandidates = nestpayIncomingHashCandidates(incomingRaw)
  const inc0 = incomingCandidates[0] ?? ''
  const built = sk0 ? buildNestpayV3ResponseHashSignature(payload, sk0) : null
  const primaryPair =
    sk0 && inc0 ? verifyNestpayResponseHash(payload, sk0, { incomingHashCandidate: inc0, quiet: true }) : false

  const primaryCode: NestpayCallbackHashDiagnosis['primaryFailureCode'] = hashVerified
    ? 'HASH_MATCH'
    : 'NESTPAY_V3_COMPUTED_MISMATCH'

  return {
    hashVerified,
    primaryFailureCode: primaryCode,
    hashParamKey: hashKey,
    incomingHashLength: incomingTrim.length,
    incomingHashCandidateCount: incomingCandidates.length,
    storeKeyCandidateCount: storeCandidates.length,
    primaryStoreKeyLength: sk0.length,
    primaryStoreIncomingPairMatches: primaryPair,
    sortedCanonicalKeysInSignature: built?.sortedKeys ?? [],
    allowlistSignableParamCount: signableCount,
    postBodyFieldCount: postCount,
    postKeysOutsideHashAllowlist: outside,
    expectedHashPrefix: built?.expectedHashBase64.slice(0, 16) ?? '',
    incomingPrimaryPrefix: inc0.slice(0, 16),
    plaintextUtf8Length: built && isPaymentDebugLoggingEnabled() ? built.plaintext.length : null,
  }
}

export function getPaymentResult(input: CallbackResultInput): PaymentResult {
  const response = normalizeText(input.response)
  const procReturnCode = normalizeText(input.procReturnCode)
  const mdStatus = normalizeText(input.mdStatus)

  if (response.toLowerCase() === 'approved' && procReturnCode === '00' && mdStatus === '1') {
    return 'approved'
  }
  return 'failed'
}

/** NestPay 3D Pay Hosting: işlem + MPI başarı üçlüsü (callback’te kesin onay için HASH ile birlikte kullanılır). */
export function isNestpayPaymentSuccessful(
  response: string,
  procReturnCode: string,
  mdStatus: string
): boolean {
  return getPaymentResult({ response, procReturnCode, mdStatus }) === 'approved'
}

export { verifyNestpayResponseHash }
