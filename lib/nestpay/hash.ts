/**
 * İşbankası NestPay — Hash Version 3
 *
 * Algoritma: Base64( SHA-512( plaintext ) )
 *
 * Plaintext oluşturma:
 *   1. Tüm parametre isimlerini case-insensitive alfabetik sırala (A→Z).
 *   2. Her değeri escape et: önce \ → \\, sonra | → \|
 *   3. Değerleri | ile birleştir.
 *   4. Sona |storeKey ekle (storeKey de escape edilir).
 *
 * İstek hash'i: encoding ve hash parametreleri hariç tutulur.
 * Yanıt hash'i: encoding, hash ve countdown hariç tutulur.
 *
 * Dikkat: boş değerli parametreler de platntexte dahil edilir (iki || yan yana olabilir).
 */

import { createHash, timingSafeEqual, randomBytes } from 'node:crypto'

function sha1Base64(plaintext: string): string {
  return createHash('sha1').update(plaintext, 'utf8').digest('base64')
}

// ─── Escape ────────────────────────────────────────────────────────────────────

/** Önce \ → \\, sonra | → \| (PHP str_replace sırası ile aynı). */
export function escapeValue(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/\|/g, '\\|')
}

// ─── Sıralama ──────────────────────────────────────────────────────────────────

/** Case-insensitive alfabetik karşılaştırıcı. */
export function caseInsensitiveSort(a: string, b: string): number {
  return a.localeCompare(b, 'en', { sensitivity: 'base' })
}

// ─── Yardımcı üreticiler ────────────────────────────────────────────────────────

/** 20 karakterlik kriptografik rastgele string (replay saldırısı önleme için rnd). */
export function generateRnd(): string {
  return randomBytes(20).toString('base64url').slice(0, 20)
}

/** Benzersiz sipariş numarası (UUID v4). */
export function generateOrderId(): string {
  return crypto.randomUUID()
}

// ─── SHA-512 + Base64 ──────────────────────────────────────────────────────────

function sha512Base64(plaintext: string): string {
  const hex = createHash('sha512').update(plaintext, 'utf8').digest('hex')
  return Buffer.from(hex, 'hex').toString('base64')
}

// ─── Plaintext builder ─────────────────────────────────────────────────────────

function buildPlaintext(
  params: Record<string, string>,
  storeKey: string,
  excludeKeys: Set<string>
): string {
  const keys = Object.keys(params).filter((k) => !excludeKeys.has(k.toLowerCase()))
  keys.sort(caseInsensitiveSort)
  const parts = keys.map((k) => escapeValue(params[k] ?? ''))
  parts.push(escapeValue(storeKey))
  return parts.join('|')
}

// ─── İstek hash'i ──────────────────────────────────────────────────────────────

const REQUEST_EXCLUDE = new Set(['encoding', 'hash'])

/**
 * Bankaya gönderilecek form için hash üretir.
 * encoding ve hash parametreleri hariç tutulur.
 */
export function generateRequestHash(params: Record<string, string>, storeKey: string): string {
  return sha512Base64(buildPlaintext(params, storeKey, REQUEST_EXCLUDE))
}

// ─── Yanıt hash doğrulama ──────────────────────────────────────────────────────

const RESPONSE_EXCLUDE = new Set(['encoding', 'hash', 'countdown'])

/**
 * Callback doğrulamasında banka/girogate tarafından HASH hesabından SONRA eklenen
 * alanlar. Bu alanlar orijinal hash'e dahil edilmediğinden doğrulama dışında tutulur.
 * Kaan Bayrakdar (İşbankası): "dinamik bir yapı kurgularsanız ek parametrelerde
 * sorun yaşamazsınız — test/prod ek parametre sayısı farklı olabilir."
 */
const CALLBACK_EXTRA_EXCLUDE = new Set([
  'girogateParamReqHash',   // girogate proxy hash'i
  'querycampainghash',      // kampanya hash'i
  'querydcchash',           // DCC hash'i
  'showdcchash',            // DCC görüntüleme hash'i
  'callbackCall',           // "bu bir callback" bayrağı
])

/**
 * NESTPAY_CALLBACK_EXTRA_EXCLUDE env değişkeninden dinamik dışlama listesi üretir.
 * Virgülle ayrılmış alan adları (büyük/küçük harf yoksayılır).
 */
function getEnvCallbackExclude(): Set<string> {
  const raw = process.env.NESTPAY_CALLBACK_EXTRA_EXCLUDE ?? ''
  const extra = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return new Set(extra)
}

/**
 * Callback hash doğrulaması için tam dışlama kümesi:
 *   RESPONSE_EXCLUDE  +  CALLBACK_EXTRA_EXCLUDE  +  NESTPAY_CALLBACK_EXTRA_EXCLUDE (env)
 */
export function buildCallbackExcludeSet(): Set<string> {
  const envExclude = getEnvCallbackExclude()
  return new Set([
    ...RESPONSE_EXCLUDE,
    ...[...CALLBACK_EXTRA_EXCLUDE].map((k) => k.toLowerCase()),
    ...envExclude,
  ])
}

/**
 * Debug amaçlı: plaintext, dahil/hariç alanlar ve hesaplanan hash'i döner.
 * Sadece PAYMENT_DEBUG=1 modunda çağrılmalıdır.
 */
export function buildPlaintextForDebug(
  params: Record<string, string>,
  storeKey: string
): { plaintext: string; includedKeys: string[]; excludedKeys: string[] } {
  const includedKeys = Object.keys(params)
    .filter((k) => !RESPONSE_EXCLUDE.has(k.toLowerCase()))
    .sort(caseInsensitiveSort)
  const excludedKeys = Object.keys(params).filter((k) => RESPONSE_EXCLUDE.has(k.toLowerCase()))
  const plaintext = buildPlaintext(params, storeKey, RESPONSE_EXCLUDE)
  return { plaintext, includedKeys, excludedKeys }
}

export function computeHashForDebug(
  params: Record<string, string>,
  storeKey: string
): { plaintext: string; includedKeys: string[]; excludedKeys: string[]; computedHash: string } {
  const { plaintext, includedKeys, excludedKeys } = buildPlaintextForDebug(params, storeKey)
  return { plaintext, includedKeys, excludedKeys, computedHash: sha512Base64(plaintext) }
}

/**
 * Timing-safe base64 string karşılaştırması.
 * Farklı uzunluklarda false döner.
 */
function safeB64Equals(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'base64')
    const bb = Buffer.from(b, 'base64')
    if (ba.length !== bb.length) return false
    return timingSafeEqual(ba, bb)
  } catch {
  return false
  }
}

/**
 * Hash Ver3 (SHA-512, tüm alanlar hariç encoding/hash/countdown, alfabetik sıralı).
 * Döküman §2.2: Tüm parametreler alphabetik, '|' ile birleştirilir, sonda storeKey.
 */
function verifyHashVer3(params: Record<string, string>, storeKey: string, incoming: string): boolean {
  const computed = sha512Base64(buildPlaintext(params, storeKey, RESPONSE_EXCLUDE))
  return safeB64Equals(computed, incoming)
}

function verifyHashVer3WithExclude(
  params: Record<string, string>,
  storeKey: string,
  incoming: string,
  excludeSet: Set<string>
): boolean {
  const computed = sha512Base64(buildPlaintext(params, storeKey, excludeSet))
  return safeB64Equals(computed, incoming)
}

/**
 * Eski NestPay SHA1 callback hash doğrulaması.
 * Belirli sıra: clientid + oid + amount + okUrl + failUrl + islemtipi + taksit + rnd + storeKey
 * Parametre adları büyük/küçük harf duyarsız aranır.
 */
function verifyHashSha1Legacy(params: Record<string, string>, storeKey: string, incoming: string): boolean {
  const get = (...names: string[]): string => {
    for (const name of names) {
      const key = Object.keys(params).find((k) => k.toLowerCase() === name.toLowerCase())
      if (key !== undefined) return params[key] ?? ''
    }
    return ''
  }

  const plain =
    get('clientid') +
    get('oid', 'ReturnOid') +
    get('amount') +
    get('okUrl', 'okurl') +
    get('failUrl', 'failurl') +
    get('islemtipi', 'trantype', 'TranType') +
    get('taksit', 'Instalment', 'instalment') +
    get('rnd') +
    storeKey

  const computed = sha1Base64(plain)
  return safeB64Equals(computed, incoming)
}

/**
 * Banka yanıtındaki HASH'i doğrular.
 * Önce Hash Ver3 (SHA-512, tüm alanlar) denenir.
 * Başarısız olursa SHA1 legacy (belirli alan sırası) denenir.
 * extraExcludeSet: standart RESPONSE_EXCLUDE'a ek dışlama kümesi.
 */
export function verifyResponseHash(
  params: Record<string, string>,
  storeKey: string,
  extraExcludeSet?: Set<string>
): boolean {
  const incoming = (params['HASH'] ?? params['hash'] ?? '').trim()
  if (!incoming) return false

  const debug = process.env.PAYMENT_DEBUG === '1' || process.env.NODE_ENV !== 'production'

  const effectiveExclude = extraExcludeSet
    ? new Set([...RESPONSE_EXCLUDE, ...[...extraExcludeSet].map((k) => k.toLowerCase())])
    : RESPONSE_EXCLUDE

  const ver3Ok = verifyHashVer3WithExclude(params, storeKey, incoming, effectiveExclude)
  if (ver3Ok) {
    if (debug) console.info('[nestpay:hash] doğrulama: SHA-512 Ver3 ✓')
    return true
  }

  const sha1Ok = verifyHashSha1Legacy(params, storeKey, incoming)
  if (sha1Ok) {
    if (debug) console.info('[nestpay:hash] doğrulama: SHA1 legacy ✓')
    return true
  }

  if (debug) {
    const ver3Plain = buildPlaintext(params, storeKey, effectiveExclude)
    console.warn('[nestpay:hash] doğrulama BAŞARISIZ — her iki yöntem denendi', {
      incomingLen: incoming.length,
      ver3PlaintextLen: ver3Plain.length,
      fieldCount: Object.keys(params).length,
      excludedCount: effectiveExclude.size,
      storeKeyLen: storeKey.length,
    })
  }

  return false
}

/**
 * Callback'e özgü hash doğrulaması.
 * Banka HASH hesapladıktan SONRA eklediği alanları (girogateParamReqHash vb.)
 * ve NESTPAY_CALLBACK_EXTRA_EXCLUDE env değişkenini de dışlar.
 * Kaan Bayrakdar (İşbankası): "dinamik yapı kurgularsanız ek parametrelerde
 * sorun yaşamazsınız; test/prod ek parametre sayısı farklı olabilir."
 */
export function verifyCallbackHash(
  params: Record<string, string>,
  storeKey: string
): boolean {
  const excludeSet = buildCallbackExcludeSet()
  const debug = process.env.PAYMENT_DEBUG === '1' || process.env.NODE_ENV !== 'production'

  if (debug) {
    const extraExcluded = Object.keys(params).filter((k) =>
      excludeSet.has(k.toLowerCase()) && !RESPONSE_EXCLUDE.has(k.toLowerCase())
    )
    if (extraExcluded.length > 0) {
      console.info('[nestpay:hash] Callback dışlanan ek alanlar:', extraExcluded)
    }
  }

  return verifyResponseHash(params, storeKey, excludeSet)
}

// ─── İş kararı yardımcıları ────────────────────────────────────────────────────

/**
 * mdStatus kontrolü.
 * 1 = Full 3D (kart doğrulandı) — her zaman kabul.
 * 2, 3, 4 = Half 3D (kart 3D'ye kayıtlı değil) — acceptHalf3D true ise kabul.
 * 0, 5-8 = Doğrulama başarısız / sistem hatası — kabul edilmez.
 */
export function isMdStatusAuthenticated(
  mdStatus: string | undefined,
  acceptHalf3D = false
): boolean {
  const s = (mdStatus ?? '').trim()
  if (s === '1') return true
  if (acceptHalf3D && (s === '2' || s === '3' || s === '4')) return true
  return false
}

/**
 * Response === "Approved" VE ProcReturnCode === "00" ikisi birden true ise ödeme onaylıdır.
 * Bu iki koşulun birlikte sağlanması zorunludur.
 */
export function isPaymentApproved(params: Record<string, string>): boolean {
  const response = (params['Response'] ?? params['response'] ?? '').trim()
  const procCode = (params['ProcReturnCode'] ?? params['procreturncode'] ?? '').trim()
  return response === 'Approved' && procCode === '00'
}

// ─── Form alanları üretici ─────────────────────────────────────────────────────

export type NestpayFormInput = {
  /** Supabase booking UUID — oid olarak kullanılır. */
  bookingId: string
  /** Tahsil edilecek tutar (TRY). Ondalık nokta ile, örn. 300.00 */
  amount: number
  /** Müşteri adı soyadı (BillToName). */
  customerName?: string
  /** Müşteri e-posta (Email). */
  customerEmail?: string
  /** Sayfa dili. Varsayılan: tr */
  lang?: 'tr' | 'en'
}

export type NestpayFormConfig = {
  clientId: string
  storeKey: string
  gatewayUrl: string
  /** Sitenin kök URL'i, örn. https://cesmetekneturu.net */
  baseUrl: string
  currency?: string
  acceptHalf3D?: boolean
}

export type NestpayFormBuildResult = {
  /** Formun action URL'i (banka gateway). */
  action: string
  /** Bankaya POST edilecek tüm gizli form alanları (hash dahil). */
  fields: Record<string, string>
}

/**
 * Bankaya POST edilecek form alanlarını ve hash'i üretir.
 * Tutar sunucu tarafında DB'den alınmalı — asla frontend'den kabul etme.
 */
export function buildPaymentFormFields(
  input: NestpayFormInput,
  config: NestpayFormConfig
): NestpayFormBuildResult {
  const amountStr = input.amount.toFixed(2)
  const currency = config.currency ?? '949'

  const baseUrl = config.baseUrl.replace(/\/$/, '')

  const params: Record<string, string> = {
    clientid: config.clientId,
    storetype: '3d_pay_hosting',
    hashAlgorithm: 'ver3',
    islemtipi: 'Auth',
    amount: amountStr,
    currency,
    oid: input.bookingId,
    okUrl: `${baseUrl}/api/payment/result`,
    failUrl: `${baseUrl}/api/payment/result`,
    callbackUrl: `${baseUrl}/api/payment/callback`,
    lang: input.lang ?? 'tr',
    rnd: generateRnd(),
    refreshtime: '5',
    encoding: 'UTF-8',
  }

  if (input.customerName?.trim()) params.BillToName = input.customerName.trim()
  if (input.customerEmail?.trim()) params.Email = input.customerEmail.trim()

  params.hash = generateRequestHash(params, config.storeKey)

  return { action: config.gatewayUrl, fields: params }
}

// ─── Config yükleyici ──────────────────────────────────────────────────────────

/** Environment variable'lardan NestPay config'ini okur. Server-side only. */
export function loadNestpayConfig(): NestpayFormConfig {
  const clientId = process.env.NESTPAY_CLIENT_ID?.trim()
  const storeKey = process.env.NESTPAY_STORE_KEY?.trim()
  const gatewayUrl = process.env.NESTPAY_GATEWAY_URL?.trim()
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim()

  if (!clientId) throw new Error('NESTPAY_CLIENT_ID env var eksik')
  if (!storeKey) throw new Error('NESTPAY_STORE_KEY env var eksik')
  if (!gatewayUrl) throw new Error('NESTPAY_GATEWAY_URL env var eksik')
  if (!baseUrl) throw new Error('NEXT_PUBLIC_SITE_URL env var eksik')

  return {
    clientId,
    storeKey,
    gatewayUrl,
    baseUrl,
    currency: process.env.NESTPAY_CURRENCY?.trim() ?? '949',
    acceptHalf3D: process.env.NESTPAY_ACCEPT_HALF_3D === 'true',
  }
}
