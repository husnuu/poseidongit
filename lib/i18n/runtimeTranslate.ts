import type { SiteLocale } from './config'

/**
 * Anlık (runtime) makine çevirisi — Sanity'e hiçbir çeviri yazılmaz.
 * DEEPL_API_KEY tanımlıysa DeepL (yüksek kalite) kullanılır; yoksa anahtar
 * gerektirmeyen MyMemory'ye düşer (düşük/orta kalite, ücretsiz, günlük kotalı).
 * Next.js'in fetch veri önbelleği (CACHE_TTL_SECONDS) sayesinde aynı metin
 * ikinci istekte tekrar API'ye gitmez — hız ve maliyet için kritik.
 */

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 gün

const DEEPL_TARGET_LANG: Record<SiteLocale, string> = { tr: 'TR', en: 'EN-GB', de: 'DE' }
const MYMEMORY_TARGET_LANG: Record<SiteLocale, string> = { tr: 'tr', en: 'en', de: 'de' }

/** MyMemory anonim kullanımda ~500 byte/istek sınırı var; uzun metinleri cümle sınırından böleriz. */
const MYMEMORY_CHUNK_MAX_CHARS = 450

function splitIntoChunks(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text]
  const sentences = text.split(/(?<=[.!?…])\s+/)
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      if (current) {
        chunks.push(current)
        current = ''
      }
      for (let i = 0; i < sentence.length; i += maxChars) {
        chunks.push(sentence.slice(i, i + maxChars))
      }
      continue
    }
    if ((current + ' ' + sentence).trim().length > maxChars) {
      if (current) chunks.push(current)
      current = sentence
    } else {
      current = (current + ' ' + sentence).trim()
    }
  }
  if (current) chunks.push(current)
  return chunks
}

async function translateWithDeepL(text: string, target: SiteLocale, apiKey: string): Promise<string> {
  const isFreeTier = apiKey.trim().endsWith(':fx')
  const base = isFreeTier ? 'https://api-free.deepl.com' : 'https://api.deepl.com'
  const res = await fetch(`${base}/v2/translate`, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      text,
      source_lang: 'TR',
      target_lang: DEEPL_TARGET_LANG[target],
    }),
    next: { revalidate: CACHE_TTL_SECONDS },
  })
  if (!res.ok) throw new Error(`DeepL ${res.status}`)
  const json = (await res.json()) as { translations?: { text?: string }[] }
  return json?.translations?.[0]?.text?.trim() || text
}

async function translateChunkWithMyMemory(chunk: string, target: SiteLocale): Promise<string> {
  const langpair = `tr|${MYMEMORY_TARGET_LANG[target]}`
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${langpair}`
  const res = await fetch(url, { next: { revalidate: CACHE_TTL_SECONDS } })
  if (!res.ok) throw new Error(`MyMemory ${res.status}`)
  const json = (await res.json()) as { responseData?: { translatedText?: string }; responseStatus?: number }
  const translated = json?.responseData?.translatedText
  return typeof translated === 'string' && translated.trim() ? translated : chunk
}

async function translateWithMyMemory(text: string, target: SiteLocale): Promise<string> {
  const chunks = splitIntoChunks(text, MYMEMORY_CHUNK_MAX_CHARS)
  const translated: string[] = []
  // MyMemory anonim kotası için ardışık (rate-limit dostu) çeviri.
  for (const chunk of chunks) {
    translated.push(await translateChunkWithMyMemory(chunk, target))
  }
  return translated.join(' ')
}

/** Tek bir metni hedef dile çevirir. target === 'tr' ise veya metin boşsa dokunmadan döner. */
export async function translateText(text: string | null | undefined, target: SiteLocale): Promise<string> {
  const trimmed = text?.trim()
  if (!trimmed || target === 'tr') return text ?? ''
  try {
    const apiKey = process.env.DEEPL_API_KEY?.trim()
    if (apiKey) return await translateWithDeepL(trimmed, target, apiKey)
    return await translateWithMyMemory(trimmed, target)
  } catch (err) {
    console.error('[runtimeTranslate] translateText failed, orijinal metin kullanılıyor:', err)
    return text ?? ''
  }
}

/** Bir string listesini (amenities, included vb.) paralel çevirir. */
export async function translateTextArray(
  items: (string | null | undefined)[] | null | undefined,
  target: SiteLocale
): Promise<string[]> {
  if (!items?.length || target === 'tr') return (items ?? []).filter((x): x is string => !!x)
  const results = await Promise.all(items.map((item) => translateText(item, target)))
  return results
}

/** Sanity PortableText blok dizisini, sadece metin span'lerini çevirerek döndürür (mark/stil korunur). */
export async function translatePortableTextBlocks<T extends { _type: string; children?: unknown[] }>(
  blocks: T[] | null | undefined,
  target: SiteLocale
): Promise<T[] | null | undefined> {
  if (!blocks?.length || target === 'tr') return blocks
  try {
    return await Promise.all(
      blocks.map(async (block) => {
        if (block._type !== 'block' || !Array.isArray(block.children)) return block
        const children = await Promise.all(
          block.children.map(async (child) => {
            const c = child as { _type?: string; text?: string }
            if (c._type !== 'span' || typeof c.text !== 'string' || !c.text.trim()) return child
            const translated = await translateText(c.text, target)
            return { ...c, text: translated }
          })
        )
        return { ...block, children }
      })
    )
  } catch (err) {
    console.error('[runtimeTranslate] translatePortableTextBlocks failed, orijinal içerik kullanılıyor:', err)
    return blocks
  }
}
