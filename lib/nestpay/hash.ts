import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Payten / Nestpay Generic Ver3 (PHP GenericVer3Request/Response Hash Handler):
 * - Döküman: `encoding`, `hash`, `countdown` imzada yok (anahtar adı büyük/küçük harf duyarsız).
 * - Anahtar sırası: dökümandaki gibi **alfabetik (A→Z), İngilizce locale, harf büyüklüğü duyarsız** — `localeCompare('en', { sensitivity: 'base' })`.
 * - Değer kaçışı: önce `\` → `\\`, sonra `|` → `\|` (PHP `str_replace` sırası ile aynı).
 * - Birleştirme: kaçışlı değerler `|` ile birleştirilir, sona kaçışlı `storeKey` eklenir.
 * - Özet: `base64_encode(pack('H*', hash('sha512', $plaintext, false)))` — Node’da SHA512 hex → binary → Base64.
 *
 * Boş string değerli alanlar da imzaya dahildir; anahtar çıkarılmaz.
 *
 * **§2.2 Hash Ver.3 — isteğin yanıtında hash kontrolü (NestPay):** Geri dönüş, isteğe giden
 * imza yöntemiyle aynıdır; NestPay’in döndürdüğü tüm parametreler alfabetik sırada `|` ile birleşir,
 * sonda aynı ayraçla `storeKey` eklenir, SHA-512 + Base64 ile “HASH” karşılaştırılır.
 * **Önemli not (doküman):** “encoding”, “hash” ve “countdown” isimli parametreler hash
 * hesabına katılmaz. Anahtar eşleştirmesi büyük/küçük harf duyarsızdır (ör. `hash` = `HASH`).
 */
const EXCLUDED_HASH_KEYS = new Set(['hash', 'encoding', 'countdown'])

/** §2.2 — doküman: encoding, hash, countdown (imzada yok). */
const CALLBACK_HASH_DOC_EXCLUDE = new Set(['hash', 'encoding', 'countdown'])

/**
 * Payten dönüşünde imzada olmayan / banka içi alanlar (callback doğrulaması için çıkarılır).
 * `TDS2.*` ve `RREQEXTENSIONS` gibi büyük harfle gelen isimler `toLowerCase` ile eşlenir; `TDS2.*` öneki
 * ayrıca `tds2.*` altında dışlanır.
 *
 * Banka/gateway; HASH hesaplandıktan SONRA POST'a eklediği alanlar (imzaya dahil edilmez):
 * - *hash (checkIfMandatoryHash, girogateParamReqHash, showdcchash, querydcchash, querycampainghash, vb.)
 * - validation flag'leri (CheckIfMandatory, CheckIfMandatoryState, MandatoryFieldControl)
 * - UI / meta parametreler (pageparam, callbackCall, ErrCode)
 */
const CALLBACK_HASH_BANK_INTERNAL_EXCLUDE = new Set([
  // Hash alanları
  'signature',
  'digest',
  'showdcchash',
  'querycampainghash',
  'querydcchash',
  'girogateparamreqhash',
  'checkifmandatoryhash',
  'hashparams',
  'hashparamsval',
  // Banka validation / kontrol flag'leri
  'checkifmandatory',
  'checkifmandatorystate',
  'mandatoryfieldcontrol',
  // Gateway UI / meta alanları
  'pageparam',
  'callbackcall',
  'errcode',
  // RReq uzantıları
  'rrextensions',
])

function parseNestpayCallbackExtraExcludeFromEnv(): Set<string> {
  const raw = process.env.NESTPAY_CALLBACK_EXTRA_EXCLUDE ?? ''
  const s = new Set<string>()
  for (const part of raw.split(',')) {
    const t = part.trim().toLowerCase()
    if (t) s.add(t)
  }
  return s
}

function isKeyExcludedFromNestpayCallbackHash(
  key: string,
  envExtra: Set<string>
): boolean {
  const low = key.toLowerCase()
  if (CALLBACK_HASH_DOC_EXCLUDE.has(low)) return true
  if (CALLBACK_HASH_BANK_INTERNAL_EXCLUDE.has(low)) return true
  if (envExtra.has(low)) return true
  if (low.startsWith('tds2.')) return true
  return false
}

type CallbackPostHashParts = {
  includedKeys: string[]
  excludedKeys: string[]
  plaintext: string
}

/**
 * callbackUrl POST: §2.2 + banka tarafında imzaya dahil edilmeyen meta alanlar dışlandıktan sonra
 * aynı kaçış / storeKey / SHA-512 + Base64 kuralı.
 */
function buildNestpayCallbackPostHashPlaintextParts(
  record: Record<string, string>,
  storeKey: string
): CallbackPostHashParts {
  const envExtra = parseNestpayCallbackExtraExcludeFromEnv()
  const allKeys = Object.keys(record)
  const includedKeys = allKeys
    .filter((k) => !isKeyExcludedFromNestpayCallbackHash(k, envExtra))
    .sort(comparePaytenHashParamKeysAlphabetical)
  const excludedKeys = allKeys
    .filter((k) => isKeyExcludedFromNestpayCallbackHash(k, envExtra))
    .sort(comparePaytenHashParamKeysAlphabetical)
  const plaintext = [
    ...includedKeys.map((k) => escapePaytenHashValue(record[k] ?? '')),
    escapePaytenHashValue(storeKey),
  ].join('|')
  return { includedKeys, excludedKeys, plaintext }
}

export type NestpayCallbackPostHashBuild = {
  /** callback imzasında kullanılan POST anahtarları (doc + banka dışlama + env). */
  includedKeys: string[]
  excludedKeys: string[]
  plaintext: string
  expectedHashBase64: string
}

/**
 * NestPay → üye işyeri callback: doc §2.2 dışlama + banka imzasız meta + `TDS2.*` + `NESTPAY_CALLBACK_EXTRA_EXCLUDE`.
 * İstek (initiate) imzası `generateHash` / `buildPaytenHashPlaintext` ile ayrı kalır.
 */
export function buildNestpayCallbackPostHashSignature(
  record: Record<string, string>,
  storeKey: string
): NestpayCallbackPostHashBuild {
  const { includedKeys, excludedKeys, plaintext } = buildNestpayCallbackPostHashPlaintextParts(record, storeKey)
  const expectedHashBase64 = hashVer3PlaintextToBase64(plaintext)
  return { includedKeys, excludedKeys, plaintext, expectedHashBase64 }
}

/** Payten hash parametre adlarını alfabetik sıralar (döküman: A→Z, case-insensitive). */
export function comparePaytenHashParamKeysAlphabetical(a: string, b: string): number {
  return a.localeCompare(b, 'en', { sensitivity: 'base' })
}

/** PHP: str_replace("\\", "\\\\", $v); str_replace("|", "\\|", ...); */
export function escapePaytenHashValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|')
}

/** PHP `$hashval` ile aynı düz metin (storeKey dahil). */
export function buildPaytenHashPlaintext(params: Record<string, string>, storeKey: string): string {
  const sortedKeys = Object.keys(params)
    .filter((key) => !EXCLUDED_HASH_KEYS.has(key.toLowerCase()))
    .sort(comparePaytenHashParamKeysAlphabetical)

  return [...sortedKeys.map((key) => escapePaytenHashValue(params[key] ?? '')), escapePaytenHashValue(storeKey)].join('|')
}

export function generateHash(params: Record<string, string>, storeKey: string): string {
  const plaintext = buildPaytenHashPlaintext(params, storeKey)
  const hexDigest = createHash('sha512').update(plaintext, 'utf8').digest('hex')
  return Buffer.from(hexDigest, 'hex').toString('base64')
}

/** PHP: `base64_encode(pack('H*', hash('sha512', $plain, false))))` — tek düz metin (örn. HASHPARAMSVAL+storeKey). */
export function paytenHash512PlaintextUtf8(plaintext: string): string {
  const hexDigest = createHash('sha512').update(plaintext, 'utf8').digest('hex')
  return Buffer.from(hexDigest, 'hex').toString('base64')
}

/** Eski 3D hosting yanıtı: `base64_encode(pack('H*', sha1($hashparamsval.$storekey))))`. */
export function paytenHashSha1PlaintextUtf8(plaintext: string): string {
  const hexDigest = createHash('sha1').update(plaintext, 'utf8').digest('hex')
  return Buffer.from(hexDigest, 'hex').toString('base64')
}

/**
 * Yönlenme/callback cevabı: alan isimleri HASHPARAMS’teki sırada, Ver3 gibi
 * `|`-birleşim + kaçış; `storeKey` sonda aynı kuralla.
 */
export function buildPaytenVer3PlaintextFromOrderedFieldValues(
  fieldValues: string[],
  storeKey: string
): string {
  return [...fieldValues.map(escapePaytenHashValue), escapePaytenHashValue(storeKey)].join('|')
}

export function hashVer3PlaintextToBase64(plaintext: string): string {
  const hexDigest = createHash('sha512').update(plaintext, 'utf8').digest('hex')
  return Buffer.from(hexDigest, 'hex').toString('base64')
}

// ——— NestPay 3D Pay Hosting (Hash Ver3) — callback response: strict allowlist (bank / MPI fields only). ———

const EXACT_BLOCKED_RESPONSE_HASH_KEY = new Set(
  ['signature', 'digest', 'showdcchash', 'hash', 'encoding', 'countdown', 'hashparams', 'hashparamsval']
)

/**
 * 3D Pay Hosting sunucu yanıtında imzada kullanılabilecek alan adları (yalnızca bunlar, varsa).
 * İmza doğrulamada `HASH` parametresi zincire **dahil edilmez** (yalnızca karşılaştırma hedefi).
 * @see Payten / NestPay Generic Ver3 — yanıt imzası (dar izin listesi; tarayıcı dönüşü bilgi amaçlı).
 */
const NESTPAY_V3_RESPONSE_HASH_CANONICAL_NAMES: readonly string[] = [
  'AuthCode',
  'cavv',
  'cavvAlgorithm',
  'ClientIp',
  'eci',
  'ErrMsg',
  'EXTRA.TRXDATE',
  'HostRefNum',
  'iReqCode',
  'iReqDetail',
  'MaskedPan',
  'md',
  'mdStatus',
  'MdErrorMsg',
  'merchantID',
  'PAResSyntaxOK',
  'ParesVerified',
  'ProcReturnCode',
  'Response',
  'ReturnOid',
  'rnd',
  'sID',
  'TransId',
  'txstatus',
  'vendorCode',
  'Version',
  'xid',
]

type AliasEntry = { canonical: string; acceptKeys: readonly string[] }

const NESTPAY_V3_RESPONSE_KEY_ALIASES: readonly AliasEntry[] = [
  { canonical: 'EXTRA.TRXDATE', acceptKeys: ['EXTRA.TRXDATE', 'EXTRA_TRXDATE'] },
  { canonical: 'merchantID', acceptKeys: ['merchantID', 'MerchantID'] },
  { canonical: 'txstatus', acceptKeys: ['txstatus', 'TxStatus'] },
  { canonical: 'ParesVerified', acceptKeys: ['ParesVerified', 'paresVerified'] },
  { canonical: 'PAResSyntaxOK', acceptKeys: ['PAResSyntaxOK', 'paresSyntaxOK'] },
]

function nestpayResponseHashDebugEnabled(): boolean {
  const p = process.env.PAYMENT_DEBUG
  if (p === '1' || p === 'true') return true
  return process.env.NODE_ENV !== 'production'
}

function isBlockedResponseHashParamKey(key: string): boolean {
  const t = key.trim()
  if (!t) return true
  const low = t.toLowerCase()
  if (EXACT_BLOCKED_RESPONSE_HASH_KEY.has(low)) return true
  if (low.startsWith('query')) return true
  if (low.startsWith('dcc')) return true
  if (low.startsWith('tds2')) return true
  return false
}

function findRecordValueForKeyInsensitive(record: Record<string, string>, name: string): { rawKey: string; value: string } | null {
  const target = name.toLowerCase()
  for (const [k, v] of Object.entries(record)) {
    if (k.toLowerCase() === target) return { rawKey: k, value: v }
  }
  return null
}

function normalizeResponseHashValueText(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function getNestpayV3ResponseHashEntryForCanonical(
  record: Record<string, string>,
  canonical: string
): { rawKey: string; value: string } | null {
  for (const { canonical: c, acceptKeys } of NESTPAY_V3_RESPONSE_KEY_ALIASES) {
    if (c !== canonical) continue
    for (const k of acceptKeys) {
      const found = findRecordValueForKeyInsensitive(record, k)
      if (found && !isBlockedResponseHashParamKey(found.rawKey)) return { rawKey: found.rawKey, value: found.value }
    }
  }
  const found = findRecordValueForKeyInsensitive(record, canonical)
  if (found && !isBlockedResponseHashParamKey(found.rawKey)) return { rawKey: found.rawKey, value: found.value }
  return null
}

/**
 * Gelen yanıttan imzaya dâhil edilebilecek (izin listesinde, gerçekten gelmiş) alan sayısı.
 */
export function countNestpayV3ResponseHashSignableParams(record: Record<string, string>): number {
  const normalized: Record<string, string> = {}
  for (const [k, v] of Object.entries(record)) {
    if (k.toLowerCase() === 'hash') continue
    if (isBlockedResponseHashParamKey(k)) continue
    normalized[k] = normalizeResponseHashValueText(v)
  }
  let n = 0
  for (const canonical of NESTPAY_V3_RESPONSE_HASH_CANONICAL_NAMES) {
    if (getNestpayV3ResponseHashEntryForCanonical(normalized, canonical) !== null) n += 1
  }
  return n
}

function collectV3ResponseHashAllowlistedKeyLowerSet(): Set<string> {
  const s = new Set<string>()
  for (const c of NESTPAY_V3_RESPONSE_HASH_CANONICAL_NAMES) {
    s.add(c.toLowerCase())
  }
  for (const { acceptKeys } of NESTPAY_V3_RESPONSE_KEY_ALIASES) {
    for (const k of acceptKeys) {
      s.add(k.toLowerCase())
    }
  }
  return s
}

/**
 * İmza zincirine hiç girmediği için NestPay Ver3 yanıt doğrulamasında yok sayılan POST alanları
 * (ör. `oid`). Banka bu alanları imzaya dahil ediyorsa uygulama tarafında MISMATCH görülür.
 */
export function listPostKeysOutsideNestpayV3ResponseHashAllowlist(record: Record<string, string>): string[] {
  const allowed = collectV3ResponseHashAllowlistedKeyLowerSet()
  const extras: string[] = []
  const seen = new Set<string>()
  for (const k of Object.keys(record)) {
    const low = k.toLowerCase()
    if (low === 'hash') continue
    if (isBlockedResponseHashParamKey(k)) continue
    if (allowed.has(low)) continue
    if (!seen.has(k)) {
      seen.add(k)
      extras.push(k)
    }
  }
  return extras.sort(comparePaytenHashParamKeysAlphabetical)
}

export type NestpayV3ResponseHashBuild = {
  sortedKeys: string[]
  /** UTF-8; sonda storeKey — PAYMENT_DEBUG dışında loglamayın. */
  plaintext: string
  expectedHashBase64: string
}

/**
 * NestPay Generic Ver3 sunucu yanıtı: izin listesindeki alanlar + sonda storeKey ile SHA-512 → Base64.
 */
export function buildNestpayV3ResponseHashSignature(record: Record<string, string>, storeKey: string): NestpayV3ResponseHashBuild {
  const normalized: Record<string, string> = {}
  for (const [k, v] of Object.entries(record)) {
    if (k.toLowerCase() === 'hash') continue
    if (isBlockedResponseHashParamKey(k)) continue
    normalized[k] = normalizeResponseHashValueText(v)
  }

  const valueByCanonical = new Map<string, string>()

  for (const canonical of NESTPAY_V3_RESPONSE_HASH_CANONICAL_NAMES) {
    const e = getNestpayV3ResponseHashEntryForCanonical(normalized, canonical)
    if (e) valueByCanonical.set(canonical, e.value)
  }

  const sortedKeys = [...valueByCanonical.keys()].sort(comparePaytenHashParamKeysAlphabetical)
  const valueParts = sortedKeys.map((k) => escapePaytenHashValue(valueByCanonical.get(k) ?? ''))
  const plaintext = [...valueParts, escapePaytenHashValue(storeKey)].join('|')
  const expectedHashBase64 = hashVer3PlaintextToBase64(plaintext)
  return { sortedKeys, plaintext, expectedHashBase64 }
}

function secureB64StringEquals(a: string, b: string): boolean {
  const l = Buffer.from(a, 'utf8')
  const r = Buffer.from(b, 'utf8')
  if (l.length !== r.length) return false
  return timingSafeEqual(l, r)
}

/** Callback tam alan imzası: `buildNestpayCallbackPostHashPlaintextParts` + banka HASH ile zamanlamaya dayanıklı karşılaştırma. */
export function verifyNestpayCallbackPostHash(
  record: Record<string, string>,
  storeKey: string,
  incomingHashCandidate: string
): boolean {
  const { includedKeys, excludedKeys, plaintext } = buildNestpayCallbackPostHashPlaintextParts(record, storeKey)
  const expected = hashVer3PlaintextToBase64(plaintext)
  const ok = secureB64StringEquals(expected, incomingHashCandidate.trim())

  const isDebug =
    process.env.PAYMENT_DEBUG === '1' ||
    process.env.PAYMENT_DEBUG === 'true' ||
    process.env.NODE_ENV !== 'production'

  console.info('[nestpay:hash][callback] verify', {
    includedKeyCount: includedKeys.length,
    excludedKeyCount: excludedKeys.length,
    plaintextUtf8Length: Buffer.byteLength(plaintext, 'utf8'),
    result: ok ? 'MATCH' : 'MISMATCH',
    ...(isDebug ? { sortedKeys: includedKeys, excludedKeys } : {}),
  })

  if (isDebug && !ok) {
    // Her key ve kaçışlı değeri ayrı ayrı logla — hangi değerlerin platntexte girdiğini görmek için.
    const parts = includedKeys.map((k) => ({
      key: k,
      rawLen: (record[k] ?? '').length,
      escapedVal: escapePaytenHashValue(record[k] ?? ''),
    }))
    console.info('[nestpay:hash][callback] MISMATCH — key/value detayı:', parts)
    console.info('[nestpay:hash][callback] MISMATCH — tam plaintext:', plaintext)
  }

  return ok
}

/**
 * NestPay Hash Ver3 — yalnız ca izin listesindeki 3D hosting / MPI alanlarını (varsa) alır; bilinmeyen
 * dönüş alanlarını dışlar. Değerler kaçırılır, adlar (case-insensitive) alfabetik, SHA-512 → Base64.
 * `record` içinde `HASH` ile gelen değerle (normalize edilerek) karşılaştırır.
 */
export type VerifyNestpayResponseHashOptions = {
  /** Dışarıda normalize (padding / URL-safe) aday stringleri denemek için; verilmezse `record` içindeki HASH kullanılır. */
  incomingHashCandidate?: string
  /** `verifyNestpayBrowserReturnHashAllowlist` vb. birden çok aday dener; her denemede log basmamak için `true` verin. */
  quiet?: boolean
}

export function verifyNestpayResponseHash(
  record: Record<string, string>,
  storeKey: string,
  options?: VerifyNestpayResponseHashOptions
): boolean {
  const hashKey = Object.keys(record).find((k) => k.toLowerCase() === 'hash')
  const incomingRaw = (
    options?.incomingHashCandidate !== undefined ? options.incomingHashCandidate : (hashKey ? (record[hashKey] ?? '') : '')
  ).trim()
  if (!incomingRaw) {
    if (!options?.quiet && nestpayResponseHashDebugEnabled()) {
      console.warn('[nestpay:hash] verifyNestpayResponseHash: incoming HASH yok veya boş')
    }
    return false
  }

  const { sortedKeys, plaintext, expectedHashBase64: expectedHash } = buildNestpayV3ResponseHashSignature(record, storeKey)
  const ok = secureB64StringEquals(expectedHash, incomingRaw)

  if (!options?.quiet) {
    if (nestpayResponseHashDebugEnabled()) {
      console.log('[nestpay:hash] verifyNestpayResponseHash sorted keys (allowlist, present):', JSON.stringify(sortedKeys))
      console.log('[nestpay:hash] verifyNestpayResponseHash plaintext (UTF-8, değerler+storeKey):', plaintext)
      console.log('[nestpay:hash] verifyNestpayResponseHash generated (SHA-512 → Base64):', expectedHash)
      console.log('[nestpay:hash] verifyNestpayResponseHash incoming HASH (adaya göre):', incomingRaw)
      console.log('[nestpay:hash] verifyNestpayResponseHash result:', ok ? 'MATCH' : 'MISMATCH')
    } else if (!ok) {
      console.warn('[nestpay:hash] verifyNestpayResponseHash MISMATCH (ayrıntı: PAYMENT_DEBUG=1 veya !production, quiet=kapalı)')
    }
  }

  return ok
}
