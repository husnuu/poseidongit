import { createHash } from 'node:crypto'

/**
 * Payten / Nestpay Generic Ver3 (PHP GenericVer3Request/Response Hash Handler):
 * - `hash` ve `encoding` imzada yok (büyük/küçük harf duyarsız).
 * - Anahtar sırası: dökümandaki gibi **alfabetik (A→Z), İngilizce locale, harf büyüklüğü duyarsız** — `localeCompare('en', { sensitivity: 'base' })`.
 * - Değer kaçışı: önce `\` → `\\`, sonra `|` → `\|` (PHP `str_replace` sırası ile aynı).
 * - Birleştirme: kaçışlı değerler `|` ile birleştirilir, sona kaçışlı `storeKey` eklenir.
 * - Özet: `base64_encode(pack('H*', hash('sha512', $plaintext, false)))` — Node’da SHA512 hex → binary → Base64.
 *
 * Boş string değerli alanlar da imzaya dahildir; anahtar çıkarılmaz.
 *
 * NestPay Hash Ver3 yanıt doğrulama: `encoding`, `hash`, `countdown` imzada yok (döküman §2.2).
 */
const EXCLUDED_HASH_KEYS = new Set(['hash', 'encoding', 'countdown'])

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
