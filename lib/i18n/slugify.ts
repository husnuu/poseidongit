/**
 * Başlıktan URL slug'ı üretir: küçük harf, Latin harfler, kelimeler arası tire.
 * Türkçe (ç ğ ı İ ö ş ü), Almanca (ä ö ü ß) ve Rusça (Kiril) harfler Latin
 * karşılıklarına çevrilir. Hem sitede hem `scripts/generate-locale-slugs.mjs`
 * içinde kullanılır — bu yüzden `@/` takma adı ve harici paket içermez.
 */

/** Rusça → Latin (yaygın, okunabilir transliterasyon: "Морская прогулка" → "morskaya-progulka"). */
const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

const TURKISH: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' }

/** Almancada ä/ö/ü geleneksel olarak ae/oe/ue yazılır (Türkçede o/u). */
const GERMAN: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }

const DEFAULT_MAX_LENGTH = 60

export function slugify(text: string, locale = 'en', maxLength = DEFAULT_MAX_LENGTH): string {
  const lower = text.toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US')
  let out = ''
  for (const ch of lower) {
    if (locale === 'de' && GERMAN[ch] !== undefined) out += GERMAN[ch]
    else if (TURKISH[ch] !== undefined) out += TURKISH[ch]
    else if (CYRILLIC[ch] !== undefined) out += CYRILLIC[ch]
    else if (ch === 'ß') out += 'ss'
    else out += ch
  }
  const slug = out
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (slug.length <= maxLength) return slug
  // Kelimenin ortasından kesme: son tireye kadar kısalt.
  const cut = slug.slice(0, maxLength + 1)
  const lastDash = cut.lastIndexOf('-')
  return (lastDash > 20 ? cut.slice(0, lastDash) : slug.slice(0, maxLength)).replace(/-+$/g, '')
}
