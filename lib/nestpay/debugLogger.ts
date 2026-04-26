/**
 * NestPay hash debug logger.
 * PAYMENT_DEBUG=1 olduğunda logs/nestpay-debug-{oid}-{endpoint}.json dosyasına yazar.
 * Sadece geliştirme ve debug amacıyla kullanılır — üretimde kapatın.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { buildPlaintextForDebug, computeHashForDebug } from './hash'

export type NestpayDebugEntry = {
  timestamp: string
  endpoint: 'result' | 'callback'
  oid: string
  hashMatch: boolean
  fieldCount: number
  params: Record<string, string>
  excludedKeys: string[]
  includedKeys: string[]
  computedPlaintext: string
  computedHash: string
  bankHash: string
}

export function writeNestpayDebugLog(
  endpoint: 'result' | 'callback',
  oid: string,
  params: Record<string, string>,
  storeKey: string,
  hashMatch: boolean
): void {
  if (process.env.PAYMENT_DEBUG !== '1') return

  try {
    const { plaintext, includedKeys, excludedKeys, computedHash } = computeHashForDebug(params, storeKey)
    const bankHash = params['HASH'] ?? params['hash'] ?? ''

    const entry: NestpayDebugEntry = {
      timestamp: new Date().toISOString(),
      endpoint,
      oid,
      hashMatch,
      fieldCount: Object.keys(params).length,
      params,
      excludedKeys,
      includedKeys,
      computedPlaintext: plaintext,
      computedHash,
      bankHash,
    }

    const logsDir = join(process.cwd(), 'logs')
    mkdirSync(logsDir, { recursive: true })

    const filename = `nestpay-debug-${oid.slice(0, 8)}-${endpoint}.json`
    writeFileSync(join(logsDir, filename), JSON.stringify(entry, null, 2), 'utf8')

    console.info(`[nestpay:debug] Log yazıldı: logs/${filename}`)
  } catch (err) {
    console.warn('[nestpay:debug] Log yazma hatası:', err)
  }
}

/**
 * Result ve callback parametrelerini karşılaştırır.
 * Hangi alanlar callback'te var ama result'ta yok (veya tersi),
 * hangi alanların değerleri farklı olduğunu loglar.
 */
export function compareEndpointParams(
  resultParams: Record<string, string>,
  callbackParams: Record<string, string>,
  label = 'result vs callback'
): void {
  const resultKeys = new Set(Object.keys(resultParams).map((k) => k.toLowerCase()))
  const callbackKeys = new Set(Object.keys(callbackParams).map((k) => k.toLowerCase()))

  const onlyInCallback: string[] = []
  const onlyInResult: string[] = []
  const differentValues: Array<{ key: string; result: string; callback: string }> = []

  for (const k of callbackKeys) {
    if (!resultKeys.has(k)) onlyInCallback.push(k)
  }
  for (const k of resultKeys) {
    if (!callbackKeys.has(k)) onlyInResult.push(k)
  }

  for (const k of resultKeys) {
    if (!callbackKeys.has(k)) continue
    const rKey = Object.keys(resultParams).find((x) => x.toLowerCase() === k)!
    const cKey = Object.keys(callbackParams).find((x) => x.toLowerCase() === k)!
    const rv = resultParams[rKey] ?? ''
    const cv = callbackParams[cKey] ?? ''
    if (rv !== cv) {
      differentValues.push({ key: k, result: rv.slice(0, 80), callback: cv.slice(0, 80) })
    }
  }

  console.info(`[nestpay:compare] === ${label} ===`)
  console.info(`[nestpay:compare] Result alan sayısı: ${Object.keys(resultParams).length}`)
  console.info(`[nestpay:compare] Callback alan sayısı: ${Object.keys(callbackParams).length}`)

  if (onlyInCallback.length > 0) {
    console.info('[nestpay:compare] 🔴 Sadece callback\'te olan alanlar:', onlyInCallback.sort())
  }
  if (onlyInResult.length > 0) {
    console.info('[nestpay:compare] 🟡 Sadece result\'ta olan alanlar:', onlyInResult.sort())
  }
  if (differentValues.length > 0) {
    console.info('[nestpay:compare] 🔵 Farklı değere sahip alanlar:')
    for (const d of differentValues) {
      console.info(`   ${d.key}:`)
      console.info(`     result  : ${d.result}`)
      console.info(`     callback: ${d.callback}`)
    }
  }
  if (onlyInCallback.length === 0 && onlyInResult.length === 0 && differentValues.length === 0) {
    console.info('[nestpay:compare] ✅ Tüm alanlar aynı')
  }
}
