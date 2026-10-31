#!/usr/bin/env node
/**
 * Tur, koy, blog ve feribot sayfaları için EN/DE/RU URL slug'larını otomatik üretir
 * ve lib/i18n/generated/localeSlugs.json dosyasına yazar (npm prebuild ile her
 * build'den önce çalışır; elle de çalıştırılabilir: node scripts/generate-locale-slugs.mjs).
 *
 * Kurallar:
 * - Sanity'de o dil için elle slug girilmişse belge atlanır (Sanity slug'ı geçerli).
 *   Önceden otomatik slug'ı varsa "retired" altına taşınır → eski adres yönlenir.
 *   Elle slug'lar "manual" altına da yazılır (her build'de baştan) — yalnızca
 *   Türkçe adresle gelenleri middleware'de 301 ile yönlendirmek için.
 * - Var olan otomatik slug'lar asla değiştirilmez (yayındaki adresler kırılmasın).
 * - Yeni belge: o dildeki elle girilmiş başlık, yoksa Türkçe başlığın makine çevirisi
 *   (DEEPL_API_KEY varsa DeepL, yoksa MyMemory) → slugify.
 * - Ağ/çeviri hatasında build bozulmaz: o belge Türkçe slug'la kalır, sonraki build dener.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { slugify } from '../lib/i18n/slugify.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'lib/i18n/generated/localeSlugs.json')
const LOCALES = ['en', 'de', 'ru']
const TIMEOUT_MS = 12_000

/** Yerelde .env.local'ı oku (Vercel'de değişkenler zaten ortamda). */
for (const file of ['.env.local', '.env']) {
  const p = join(ROOT, file)
  if (!existsSync(p)) continue
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const PROJECT = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '7q8277he'
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01'
const DEEPL_KEY = process.env.DEEPL_API_KEY?.trim()
const CONTACT_EMAIL = process.env.SUPPORT_EMAIL?.trim() || 'turkeycesme@hotmail.com'

/** Kanonik URL segmenti → Sanity belge tipi. */
const TYPES = { tur: 'tour', koylar: 'cove', blog: 'blog', feribot: 'ferryRoute' }

/** Çeviride bozulmaması gereken özel isimler (runtimeTranslate.ts ile aynı mantık). */
const PROTECTED = ['Hantal Turizm', 'Hantal', 'Hüsnü', 'Poseidon', 'Çeşme', 'İzmir', 'Alaçatı', 'Ilıca', 'Boyalık', 'Dalyan']

function withTimeout(ms) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  return { signal: ctrl.signal, done: () => clearTimeout(t) }
}

async function sanityQuery(query) {
  const url = `https://${PROJECT}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(query)}`
  const { signal, done } = withTimeout(TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`Sanity HTTP ${res.status}`)
    return (await res.json()).result
  } finally {
    done()
  }
}

/** "EŞEK ADASI" → "Eşek Adası" (tamamı büyük harfli başlıklar makine çevirisinde bozuluyor). */
function normalizeCase(title) {
  const letters = title.replace(/[^\p{L}]/gu, '')
  if (!letters || letters !== letters.toLocaleUpperCase('tr-TR')) return title
  return title
    .toLocaleLowerCase('tr-TR')
    .replace(/(^|[\s(–-])(\p{L})/gu, (_, pre, ch) => pre + ch.toLocaleUpperCase('tr-TR'))
}

function protect(text) {
  const found = []
  let out = text
  for (const term of PROTECTED) {
    out = out.replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), (m) => {
      found.push(m)
      return `XPROTECTEDTERM${found.length - 1}X`
    })
  }
  return { text: out, restore: (s) => found.reduce((acc, orig, i) => acc.split(`XPROTECTEDTERM${i}X`).join(orig), s) }
}

async function translate(text, locale) {
  const { text: protectedText, restore } = protect(text)
  const { signal, done } = withTimeout(TIMEOUT_MS)
  try {
    if (DEEPL_KEY) {
      const base = DEEPL_KEY.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com'
      const res = await fetch(`${base}/v2/translate`, {
        method: 'POST',
        signal,
        headers: { Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ text: protectedText, source_lang: 'TR', target_lang: locale === 'en' ? 'EN-GB' : locale.toUpperCase() }),
      })
      if (!res.ok) throw new Error(`DeepL HTTP ${res.status}`)
      const out = (await res.json())?.translations?.[0]?.text?.trim()
      if (!out) throw new Error('DeepL boş yanıt')
      return restore(out)
    }
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(protectedText)}&langpair=tr|${locale}&de=${encodeURIComponent(CONTACT_EMAIL)}`
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`)
    const json = await res.json()
    const out = json?.responseData?.translatedText?.trim()
    if (Number(json?.responseStatus ?? 200) !== 200 || !out || /^MYMEMORY WARNING/i.test(out)) {
      throw new Error(`MyMemory ${json?.responseStatus ?? 'boş yanıt'}`)
    }
    return restore(out)
  } finally {
    done()
  }
}

function loadExisting() {
  try {
    const parsed = JSON.parse(readFileSync(OUT, 'utf8'))
    return { auto: parsed.auto ?? {}, retired: parsed.retired ?? {}, manual: {} }
  } catch {
    return { auto: {}, retired: {}, manual: {} }
  }
}

/** Anahtarları sıralı yaz — git diff'leri okunur kalsın. */
function sortDeep(v) {
  if (Array.isArray(v) || v === null || typeof v !== 'object') return v
  return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortDeep(v[k])]))
}

async function main() {
  const map = loadExisting()
  const before = JSON.stringify(sortDeep(map))
  const added = []
  const failed = []

  for (const [segment, type] of Object.entries(TYPES)) {
    const docs = await sanityQuery(
      `*[_type == "${type}" && defined(slug.current) && !(_id in path("drafts.**"))]{
        "slug": slug.current, title,
        "t": { ${LOCALES.map((l) => `"${l}": { "title": translations.${l}.title, "slug": translations.${l}.slug.current }`).join(', ')} }
      }`
    )
    const auto = (map.auto[segment] ??= {})
    for (const doc of docs ?? []) {
      for (const locale of LOCALES) {
        const manualSlug = doc.t?.[locale]?.slug?.trim()
        const existing = auto[doc.slug]?.[locale]
        if (manualSlug) {
          if (manualSlug !== doc.slug) (((map.manual[segment] ??= {})[doc.slug] ??= {})[locale] = manualSlug)
          // Elle slug girildi: otomatik olanı emekliye ayır (eski linkler yönlensin).
          if (existing) {
            ;((map.retired[segment] ??= {})[locale] ??= {})[existing] = doc.slug
            delete auto[doc.slug][locale]
            if (!Object.keys(auto[doc.slug]).length) delete auto[doc.slug]
          }
          continue
        }
        if (existing) continue
        const source = doc.t?.[locale]?.title?.trim() || doc.title?.trim()
        if (!source) continue
        let title
        try {
          title = doc.t?.[locale]?.title?.trim() || (await translate(normalizeCase(source), locale))
        } catch (err) {
          failed.push(`${segment}/${doc.slug} [${locale}]: ${err.message}`)
          continue
        }
        let slug = slugify(title, locale)
        if (!slug || slug === doc.slug) continue
        // Aynı dilde aynı segmentte çakışma olmasın.
        const taken = new Set(Object.values(auto).map((x) => x?.[locale]).filter(Boolean))
        for (let n = 2; taken.has(slug); n++) slug = `${slugify(title, locale, 56)}-${n}`
        ;(auto[doc.slug] ??= {})[locale] = slug
        added.push(`${segment}/${doc.slug} [${locale}] → ${slug}   (${title})`)
      }
    }
  }

  const after = JSON.stringify(sortDeep(map))
  if (after !== before) writeFileSync(OUT, JSON.stringify(sortDeep(map), null, 2) + '\n')
  console.log(`[locale-slugs] ${added.length} yeni slug${added.length ? ':\n  ' + added.join('\n  ') : ''}`)
  if (failed.length) console.warn(`[locale-slugs] çevrilemedi (Türkçe slug kullanılacak, sonraki build tekrar dener):\n  ${failed.join('\n  ')}`)
}

main().catch((err) => {
  // Build'i asla bozma — var olan dosya olduğu gibi kullanılır.
  console.warn(`[locale-slugs] atlandı: ${err?.message ?? err}`)
})
