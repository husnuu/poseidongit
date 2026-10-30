/**
 * next/og (satori) ile PNG üreten yerler için ortak varlıklar: fontlar ve
 * uzak görseli data URL'e çevirme. Bilet görseli ve sosyal paylaşım (OG)
 * görselleri aynı fontları kullanır; fontlar süreç başına bir kez indirilir.
 */

/* Ana font: Plus Jakarta Sans tam TTF (Türkçe karakterler aynı dosyada —
   alt küme dosyaları karıştırılınca "ş" sonrası boşluk oluşuyordu).
   Yedek: Inter (Kiril alfabesi ve ₺ simgesi için). Sürümler sabitlendi. */
const JAKARTA = 'https://cdn.jsdelivr.net/gh/tokotype/PlusJakartaSans@2.7.1/fonts/ttf/PlusJakartaSans'
const INTER = 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.2.8/files/inter'

export type SatoriFont = { name: string; data: ArrayBuffer; weight: 500 | 700 | 800; style: 'normal' }

/** satori `fontFamily` değeri — tüm şablonlarda bunu kullanın. Inter alt
 * kümeleri ayrı adlarla yüklenir: aynı ad + ağırlıkta birden çok dosya olunca
 * satori ilkini seçiyor ve Kiril harfleri ince yedek fonta düşüyordu. */
export const SATORI_FONT_FAMILY = 'Jakarta, InterCyrillic, InterLatinExt, InterLatin'

let fontsPromise: Promise<SatoriFont[]> | null = null

async function fetchFont(url: string, name: string, weight: SatoriFont['weight']): Promise<SatoriFont> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`font ${url}: HTTP ${res.status}`)
  return { name, data: await res.arrayBuffer(), weight, style: 'normal' }
}

export function loadSatoriFonts(): Promise<SatoriFont[]> {
  if (!fontsPromise) {
    const jakarta: Array<[SatoriFont['weight'], string]> = [[500, 'Medium'], [700, 'Bold'], [800, 'ExtraBold']]
    const jobs: Promise<SatoriFont>[] = jakarta.map(([w, n]) => fetchFont(`${JAKARTA}-${n}.ttf`, 'Jakarta', w))
    for (const w of [500, 700, 800] as const) {
      for (const [sub, name] of [
        ['latin', 'InterLatin'],
        ['latin-ext', 'InterLatinExt'],
        ['cyrillic', 'InterCyrillic'],
      ] as const) {
        jobs.push(fetchFont(`${INTER}-${sub}-${w}-normal.woff`, name, w))
      }
    }
    fontsPromise = Promise.all(jobs).catch((e) => {
      fontsPromise = null
      throw e
    })
  }
  return fontsPromise
}

/** Uzak görseli satori'nin güvenle gömebileceği data URL'e çevirir; hata olursa null. */
export async function toDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const type = res.headers.get('content-type') || 'image/png'
    const buf = Buffer.from(await res.arrayBuffer())
    return `data:${type};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}
