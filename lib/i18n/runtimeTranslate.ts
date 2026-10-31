import { unstable_cache } from 'next/cache'
import type { SiteLocale } from './config'
import { DE_TRANSLATION_MEMORY, EN_TRANSLATION_MEMORY } from './translationMemory'

/**
 * Anlık (runtime) makine çevirisi — Sanity'e hiçbir çeviri yazılmaz.
 * DEEPL_API_KEY tanımlıysa DeepL (yüksek kalite) kullanılır; yoksa anahtar
 * gerektirmeyen MyMemory'ye düşer (düşük/orta kalite, ücretsiz, günlük kotalı).
 * Başarılı çeviriler Next.js veri önbelleğinde (unstable_cache, CACHE_TTL_SECONDS)
 * saklanır; Vercel'de tüm sunucu örnekleri ve deploy'lar bu önbelleği paylaşır,
 * böylece aynı metin bir kez çevrildikten sonra tekrar API'ye gitmez — hız ve
 * maliyet için kritik.
 */

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 gün

const DEEPL_TARGET_LANG: Record<SiteLocale, string> = { tr: 'TR', en: 'EN-GB', de: 'DE', ru: 'RU' }
const MYMEMORY_TARGET_LANG: Record<SiteLocale, string> = { tr: 'tr', en: 'en', de: 'de', ru: 'ru' }

/**
 * MyMemory anonim kotası günde ~5.000 kelime; istekte bir iletişim e-postası
 * (`de=` parametresi) gönderilirse kota günde ~50.000 kelimeye çıkıyor (MyMemory'nin
 * kendi belgelediği, kayıt gerektirmeyen bir davranış). Kullanıcının kişisel e-postası
 * DEĞİL, sitenin zaten herkese açık destek adresi kullanılır (diğer yerlerde de
 * SUPPORT_EMAIL fallback'i olarak kullanılıyor, bkz. lib/email.ts).
 */
const MYMEMORY_CONTACT_EMAIL = process.env.SUPPORT_EMAIL?.trim() || 'turkeycesme@hotmail.com'

/**
 * Marka/şirket adları gibi asla çevrilmemesi gereken özel isimler.
 * Örn. "Hantal Turizm" gibi bir acente adının içindeki "Hantal" kelimesi,
 * sıradan Türkçe bir sıfat olduğu için makine çevirisi yanlışlıkla
 * "Bulky Tourism" gibi bir şeye çevirebilir — bu listedeki terimler
 * çeviriye gönderilmeden önce korumaya alınır, çeviri sonrası aynen geri konur.
 */
const PROTECTED_TERMS = [
  'Hantal Turizm',
  // Tek başına soyadı da ("Hantal ailesi") sıfat sanılıp "sperrige Familie" diye çevriliyordu.
  'Hantal',
  'Hüsnü',
  'Poseidon',
  // Yer adları — çeviri motoru bunları sıradan Türkçe kelime sanıp yanlış çevirebilir
  // (örn. "Çeşme" = fountain/well demek, ama burada bir ilçe adı).
  'Çeşme',
  'İzmir',
  'Alaçatı',
  'Ilıca',
  'Boyalık',
  'Dalyan',
]

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function protectTerms(text: string): { protectedText: string; restore: (s: string) => string } {
  // Büyük/küçük harf farkını yok say (ör. CMS'te "HANTAL Turizm" olabilir) ama
  // metindeki GERÇEK yazımı koru — geri koyarken orijinal harfleri kullan.
  const foundOriginals: string[] = []
  let protectedText = text
  PROTECTED_TERMS.forEach((term) => {
    const re = new RegExp(escapeRegExp(term), 'gi')
    protectedText = protectedText.replace(re, (match) => {
      const token = `XPROTECTEDTERM${foundOriginals.length}X`
      foundOriginals.push(match)
      return token
    })
  })
  if (foundOriginals.length === 0) {
    return { protectedText: text, restore: (s) => s }
  }
  const restore = (s: string): string => {
    let out = s
    foundOriginals.forEach((original, i) => {
      const token = `XPROTECTEDTERM${i}X`
      out = out.split(token).join(original)
    })
    return out
  }
  return { protectedText, restore }
}

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
  const translated = json?.translations?.[0]?.text?.trim()
  // Boş yanıt önbelleğe "çeviri" diye girmesin.
  if (!translated) throw new Error('DeepL boş yanıt')
  return translated
}

/**
 * MyMemory anonim kullanımda kısa sürede ÇOK istek atılırsa 429 (Too Many Requests)
 * döner. Bir sayfada onlarca/yüzlerce alan çevrilebildiğinden, isteği TAMAMEN
 * tek sıraya koymak (bir bitmeden diğeri başlamaz) sayfayı çok yavaşlatıyordu —
 * yüzlerce alan × ~350ms sırayla beklemek onlarca saniye sürüyordu. Bunun yerine
 * küçük bir EŞ ZAMANLILIK HAVUZU kullanıyoruz: aynı anda en fazla birkaç istek
 * ağa gider, geri kalanı sıraya girer. Bu, MyMemory'yi anlık patlatmadan
 * (rate-limit'e takılmadan) sayfa yüklemesini kat kat hızlandırır.
 */
const MYMEMORY_MAX_CONCURRENT = 4
let myMemoryActiveCount = 0
const myMemoryWaitQueue: Array<() => void> = []

function acquireMyMemorySlot(): Promise<void> {
  if (myMemoryActiveCount < MYMEMORY_MAX_CONCURRENT) {
    myMemoryActiveCount++
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    myMemoryWaitQueue.push(() => {
      myMemoryActiveCount++
      resolve()
    })
  })
}

function releaseMyMemorySlot(): void {
  myMemoryActiveCount--
  const next = myMemoryWaitQueue.shift()
  if (next) next()
}

async function runSerialized<T>(task: () => Promise<T>): Promise<T> {
  await acquireMyMemorySlot()
  try {
    return await task()
  } finally {
    releaseMyMemorySlot()
  }
}

/**
 * MyMemory günlük kotası tamamen bittiğinde HTTP 429 ile birlikte gövdede
 * "YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY" uyarısı döner — bu,
 * birkaç saniye sonra tekrar denenecek geçici bir rate-limit değil, SAATLER
 * sürecek bir durumdur (MyMemory günde bir kez sıfırlanıyor). Bunu bir kez
 * tespit edince süreç genelinde uzun bir süre hiç istek atmayı bırakıyoruz.
 */
let myMemoryQuotaExhaustedUntil = 0
const MYMEMORY_QUOTA_BACKOFF_MS = 6 * 60 * 60 * 1000 // 6 saat (günlük kota saatler sürer, dakikalarla değil)

/** Ağa hiç gidilmeden (kota zaten bilindiği için) anında düşülen hata — kuyruk bekleme süresi eklemez. */
class MyMemoryQuotaKnownExhaustedError extends Error {
  constructor() {
    super('MyMemory 429 (kota biliniyor — ağa gidilmedi)')
    this.name = 'MyMemoryQuotaKnownExhaustedError'
  }
}

async function fetchMyMemoryChunk(chunk: string, target: SiteLocale, attempt = 0): Promise<string> {
  if (Date.now() < myMemoryQuotaExhaustedUntil) {
    throw new MyMemoryQuotaKnownExhaustedError()
  }
  const langpair = `tr|${MYMEMORY_TARGET_LANG[target]}`
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${langpair}&de=${encodeURIComponent(MYMEMORY_CONTACT_EMAIL)}`
  const res = await fetch(url, { next: { revalidate: CACHE_TTL_SECONDS } })
  if (res.status === 429) {
    const bodyText = await res.text().catch(() => '')
    const isDailyQuota = /ALL AVAILABLE FREE TRANSLATIONS/i.test(bodyText)
    if (isDailyQuota) {
      myMemoryQuotaExhaustedUntil = Date.now() + MYMEMORY_QUOTA_BACKOFF_MS
      throw new Error('MyMemory 429 (günlük kota bitti)')
    }
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)))
      return fetchMyMemoryChunk(chunk, target, attempt + 1)
    }
    throw new Error('MyMemory 429')
  }
  if (!res.ok) throw new Error(`MyMemory ${res.status}`)
  const json = (await res.json()) as { responseData?: { translatedText?: string }; responseStatus?: number | string }
  const translated = json?.responseData?.translatedText
  // MyMemory kota uyarısını bazen HTTP 200 + gövdede responseStatus 429 ile, uyarı
  // metnini "çeviri" olarak döndürüyor — bu kalıcı önbelleğe asla girmemeli.
  if (Number(json?.responseStatus ?? 200) !== 200 || (typeof translated === 'string' && /^MYMEMORY WARNING/i.test(translated))) {
    throw new Error(`MyMemory ${json?.responseStatus ?? 'uyarı'}`)
  }
  return typeof translated === 'string' && translated.trim() ? translated : chunk
}

async function translateChunkWithMyMemory(chunk: string, target: SiteLocale): Promise<string> {
  // Kota tükenmişse kuyruğa hiç girmeden anında hata ver — gereksiz bekleme
  // eklenmesin (zaten ağa gitmiyoruz, aralık koymanın bir anlamı yok).
  if (Date.now() < myMemoryQuotaExhaustedUntil) {
    throw new MyMemoryQuotaKnownExhaustedError()
  }
  return runSerialized(() => fetchMyMemoryChunk(chunk, target))
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

/**
 * Süreç içi (in-memory) başarılı çeviri önbelleği. Next.js'in fetch veri
 * önbelleği `dynamic = 'force-dynamic'` olan sayfalarda güvenilir şekilde
 * devreye girmeyebiliyor — bu Map, aynı metin/dil ikilisi için ikinci
 * çağrının kesinlikle ağa gitmemesini garanti eder (sunucu süreci ayakta
 * olduğu sürece). Sadece BAŞARILI sonuçlar önbelleklenir; bir hata/kota
 * durumu önbelleklenmez, böylece kota açılınca otomatik iyileşir.
 */
const translationResultCache = new Map<string, string>()

/** Çeviri servisine giden asıl çağrı; başarısızsa hata fırlatır (önbelleğe girmez). */
function translateRemote(protectedText: string, target: SiteLocale): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY?.trim()
  return apiKey ? translateWithDeepL(protectedText, target, apiKey) : translateWithMyMemory(protectedText, target)
}

/**
 * Kalıcı, sunucu örnekleri arasında paylaşılan önbellek. Neden gerekli: sayfaların
 * çoğu `force-dynamic`; Next.js bu sayfalarda POST + Authorization başlıklı fetch'leri
 * (DeepL isteği tam olarak bu) otomatik olarak önbelleksiz yapıyor. Süreç içi Map de
 * her yeni Vercel örneğinde / deploy'da boş başladığı için yabancı dildeki her sayfanın
 * ilk açılışı yüzlerce metni baştan çeviriyordu (/ru ilk açılış ~20 sn).
 * Hata fırlatan çağrılar unstable_cache tarafından saklanmaz.
 */
const translateRemotePersistent = unstable_cache(translateRemote, ['runtime-translate-v1'], {
  revalidate: CACHE_TTL_SECONDS,
  tags: ['runtime-translate'],
})

/** Çeviri başarısız olduğunda sayfanın önbellek ömrü (saniye). */
const FAILED_TRANSLATION_PAGE_TTL_SECONDS = 60

/**
 * Sayfalar önbellekten (ISR, 10 dk) sunulduğu için, çeviri servisi o an hata
 * verirse Türkçe metinli sayfa 10 dakika boyunca yabancı dilde görünürdü.
 * Daha kısa `revalidate` ile çağrılan unstable_cache, render edilen sayfanın
 * ömrünü o değere indirir — böylece sayfa en geç 1 dakikada yeniden denenir.
 */
const markPageForQuickRefresh = unstable_cache(async () => true, ['translation-failed-page-ttl'], {
  revalidate: FAILED_TRANSLATION_PAGE_TTL_SECONDS,
})

async function shortenPageCacheAfterFailure(): Promise<void> {
  try {
    await markPageForQuickRefresh()
  } catch {
    /* istek bağlamı dışında (betikler) önemsiz */
  }
}

async function translateRemoteCached(protectedText: string, target: SiteLocale): Promise<string> {
  try {
    return await translateRemotePersistent(protectedText, target)
  } catch (err) {
    // Next istek bağlamı dışında (betikler vb.) veri önbelleği yok — doğrudan çevir.
    if (err instanceof Error && /incrementalCache missing/.test(err.message)) {
      return translateRemote(protectedText, target)
    }
    throw err
  }
}

/** Tek bir metni hedef dile çevirir. target === 'tr' ise veya metin boşsa dokunmadan döner. */
export async function translateText(text: string | null | undefined, target: SiteLocale): Promise<string> {
  const trimmed = text?.trim()
  if (!trimmed || target === 'tr') return text ?? ''
  // Elle yazılmış çeviri sözlüğü — bulunursa dış API'ye hiç gidilmez.
  if (target === 'de') {
    const memorized = DE_TRANSLATION_MEMORY[trimmed]
    if (memorized) return memorized
  }
  if (target === 'en') {
    const memorized = EN_TRANSLATION_MEMORY[trimmed]
    if (memorized) return memorized
  }
  const cacheKey = `${target}\u0000${trimmed}`
  const cached = translationResultCache.get(cacheKey)
  if (cached !== undefined) return cached
  const { protectedText, restore } = protectTerms(trimmed)
  try {
    const result = restore(await translateRemoteCached(protectedText, target))
    translationResultCache.set(cacheKey, result)
    return result
  } catch (err) {
    // MyMemory'nin günlük/kısa süreli kota sınırı (429) beklenen, zaten yeniden
    // denenmiş bir durum — bunu console.error olarak basmak Next.js dev overlay'inde
    // sanki sayfa çökmüş gibi görünmesine yol açıyor. Sadece uyarı olarak logla;
    // gerçek/beklenmeyen hatalar (ağ, 5xx vb.) yine error olarak kalsın.
    const isRateLimited = err instanceof Error && /\b429\b/.test(err.message)
    if (isRateLimited) {
      console.warn('[runtimeTranslate] MyMemory kota sınırına takıldı, orijinal metin kullanılıyor.')
    } else {
      console.error('[runtimeTranslate] translateText failed, orijinal metin kullanılıyor:', err)
    }
    await shortenPageCacheAfterFailure()
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

/**
 * Bir nesnenin belirtilen string alanlarını çevirir (whitelist) — icon/key/slug/href gibi
 * teknik alanlara asla dokunmaz, sadece açıkça verilen `fields` listesindekilere.
 */
export async function translateFields<T extends object>(
  obj: T | null | undefined,
  fields: (keyof T)[],
  target: SiteLocale
): Promise<T | null | undefined> {
  if (!obj || target === 'tr') return obj
  const rec = obj as Record<string, unknown>
  const entries = await Promise.all(
    fields.map(async (f) => {
      const v = rec[f as string]
      if (typeof v !== 'string' || !v.trim()) return [f as string, v] as const
      return [f as string, await translateText(v, target)] as const
    })
  )
  const patch = Object.fromEntries(entries)
  return { ...obj, ...patch }
}

/** translateFields'ın dizi (array) versiyonu — her eleman için aynı alan listesi çevrilir. */
export async function translateArrayFields<T extends object>(
  arr: T[] | null | undefined,
  fields: (keyof T)[],
  target: SiteLocale
): Promise<T[] | null | undefined> {
  if (!arr?.length || target === 'tr') return arr
  const results = await Promise.all(arr.map((item) => translateFields<T>(item, fields, target)))
  return results.filter((x): x is NonNullable<typeof x> => x != null) as T[]
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
