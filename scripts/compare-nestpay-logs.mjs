#!/usr/bin/env node
/**
 * Result ve callback debug loglarını karşılaştırır.
 * Kullanım:
 *   node scripts/compare-nestpay-logs.mjs <oid-prefix>
 *   node scripts/compare-nestpay-logs.mjs d8a0b5d9
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const prefix = process.argv[2]
if (!prefix) {
  console.error('Kullanım: node scripts/compare-nestpay-logs.mjs <oid-prefix>')
  process.exit(1)
}

const logsDir = join(process.cwd(), 'logs')
const files = readdirSync(logsDir).filter((f) => f.startsWith(`nestpay-debug-${prefix}`))

const resultFile = files.find((f) => f.includes('-result.json'))
const callbackFile = files.find((f) => f.includes('-callback.json'))

if (!resultFile || !callbackFile) {
  console.error('Dosyalar bulunamadı:', files)
  process.exit(1)
}

const result = JSON.parse(readFileSync(join(logsDir, resultFile), 'utf8'))
const callback = JSON.parse(readFileSync(join(logsDir, callbackFile), 'utf8'))

console.log('\n=== RESULT ===')
console.log('Hash match:', result.hashMatch)
console.log('Alan sayısı:', result.fieldCount)
console.log('Included key sayısı:', result.includedKeys.length)

console.log('\n=== CALLBACK ===')
console.log('Hash match:', callback.hashMatch)
console.log('Alan sayısı:', callback.fieldCount)
console.log('Included key sayısı:', callback.includedKeys.length)

const resultKeys = new Set(result.params ? Object.keys(result.params).map(k => k.toLowerCase()) : result.includedKeys.map(k => k.toLowerCase()))
const callbackKeys = new Set(callback.params ? Object.keys(callback.params).map(k => k.toLowerCase()) : callback.includedKeys.map(k => k.toLowerCase()))

const onlyInCallback = [...callbackKeys].filter(k => !resultKeys.has(k))
const onlyInResult = [...resultKeys].filter(k => !callbackKeys.has(k))

console.log('\n🔴 Sadece CALLBACK\'te olan alanlar:', onlyInCallback.sort())
console.log('🟡 Sadece RESULT\'ta olan alanlar:', onlyInResult.sort())

const rParams = result.params ?? {}
const cParams = callback.params ?? {}
const differentValues = []
for (const k of resultKeys) {
  if (!callbackKeys.has(k)) continue
  const rKey = Object.keys(rParams).find(x => x.toLowerCase() === k)
  const cKey = Object.keys(cParams).find(x => x.toLowerCase() === k)
  const rv = rKey ? rParams[rKey] : ''
  const cv = cKey ? cParams[cKey] : ''
  if (rv !== cv) differentValues.push({ key: k, result: rv?.slice(0, 100), callback: cv?.slice(0, 100) })
}

if (differentValues.length > 0) {
  console.log('\n🔵 Farklı değere sahip alanlar:')
  for (const d of differentValues) {
    console.log(`  ${d.key}:`)
    console.log(`    result  : ${d.result}`)
    console.log(`    callback: ${d.callback}`)
  }
}

console.log('\n=== PLAINTEXT KARŞILAŞTIRMA ===')
console.log('Result plaintext uzunluğu  :', result.computedPlaintext?.length)
console.log('Callback plaintext uzunluğu:', callback.computedPlaintext?.length)
console.log('Aynı mı:', result.computedPlaintext === callback.computedPlaintext)

console.log('\n=== HASH KARŞILAŞTIRMA ===')
console.log('Result computed hash  :', result.computedHash)
console.log('Callback computed hash:', callback.computedHash)
console.log('Bank hash (result)    :', result.bankHash)
console.log('Bank hash (callback)  :', callback.bankHash)
console.log('Banka hash\'leri aynı mı:', result.bankHash === callback.bankHash)
