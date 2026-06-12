import type { SiteLocale } from './config'
import { DEFAULT_LOCALE } from './config'

/**
 * Dosya sistemi / App Router segmentleri (Türkçe kök).
 * Gelen URL takma adları bunlara çözülür; giden linklerde tersine çevrilir.
 */
const CANONICAL_FIRST_SEGMENTS = new Set([
  'hakkimizda',
  'turlar',
  'koylar',
  'sik-sorulanlar',
  'yat-kiralama',
  'yat-kapora',
  'yardim-merkezi',
  'yasal',
  'rezervasyon',
  'bilet',
  'contact',
  'blog',
  'tur',
  'menu',
])

const EN_FIRST_IN: Record<string, string> = {
  about: 'hakkimizda',
  tour: 'tur',
  tours: 'turlar',
  faq: 'sik-sorulanlar',
  coves: 'koylar',
  'yacht-charter': 'yat-kiralama',
  'yacht-deposit': 'yat-kapora',
  'help-center': 'yardim-merkezi',
  legal: 'yasal',
  booking: 'rezervasyon',
  ticket: 'bilet',
  iletisim: 'contact',
}

const DE_FIRST_IN: Record<string, string> = {
  'uber-uns': 'hakkimizda',
  tour: 'tur',
  touren: 'turlar',
  faq: 'sik-sorulanlar',
  buchten: 'koylar',
  yachtcharter: 'yat-kiralama',
  hilfe: 'yardim-merkezi',
  rechtliches: 'yasal',
  buchung: 'rezervasyon',
  ticket: 'bilet',
  kontakt: 'contact',
}

/** Kök domain (locale yok) için İngilizce kısayollar → kanonik */
const TR_ROOT_ALIASES: Record<string, string> = {
  ...EN_FIRST_IN,
}

const EN_FIRST_OUT: Record<string, string> = Object.fromEntries(
  Object.entries(EN_FIRST_IN).map(([k, v]) => [v, k])
) as Record<string, string>

const DE_FIRST_OUT: Record<string, string> = Object.fromEntries(
  Object.entries(DE_FIRST_IN).map(([k, v]) => [v, k])
) as Record<string, string>

const HELP_SUB_IN_EN: Record<string, string> = { category: 'kategori' }
const HELP_SUB_IN_DE: Record<string, string> = { kategorie: 'kategori' }

const HELP_SUB_OUT_EN: Record<string, string> = { kategori: 'category' }
const HELP_SUB_OUT_DE: Record<string, string> = { kategori: 'kategorie' }

const REZ_SUB_IN_EN: Record<string, string> = { manage: 'yonet' }
const REZ_SUB_IN_DE: Record<string, string> = { verwalten: 'yonet' }

const REZ_SUB_OUT_EN: Record<string, string> = { yonet: 'manage' }
const REZ_SUB_OUT_DE: Record<string, string> = { yonet: 'verwalten' }

function normalizeFirstSegmentIn(locale: SiteLocale, seg: string): string {
  const key = seg.toLowerCase()
  if (key === 'iletisim') return 'contact'
  if (CANONICAL_FIRST_SEGMENTS.has(key)) return key
  if (locale === 'en') return EN_FIRST_IN[key] ?? seg
  if (locale === 'de') return DE_FIRST_IN[key] ?? seg
  return TR_ROOT_ALIASES[key] ?? seg
}

function normalizeHelpSubIn(locale: SiteLocale, seg: string): string {
  const key = seg.toLowerCase()
  if (key === 'kategori') return 'kategori'
  if (locale === 'en') return HELP_SUB_IN_EN[key] ?? seg
  if (locale === 'de') return HELP_SUB_IN_DE[key] ?? seg
  return seg
}

function normalizeRezSubIn(locale: SiteLocale, seg: string): string {
  const key = seg.toLowerCase()
  if (key === 'yonet') return 'yonet'
  if (locale === 'en') return REZ_SUB_IN_EN[key] ?? seg
  if (locale === 'de') return REZ_SUB_IN_DE[key] ?? seg
  return seg
}

function localizeFirstSegmentOut(locale: SiteLocale, seg: string): string {
  if (locale === 'en') return EN_FIRST_OUT[seg] ?? seg
  if (locale === 'de') return DE_FIRST_OUT[seg] ?? seg
  return seg
}

function localizeHelpSubOut(locale: SiteLocale, seg: string): string {
  if (seg !== 'kategori') return seg
  if (locale === 'en') return HELP_SUB_OUT_EN.kategori
  if (locale === 'de') return HELP_SUB_OUT_DE.kategori
  return seg
}

function localizeRezSubOut(locale: SiteLocale, seg: string): string {
  if (seg !== 'yonet') return seg
  if (locale === 'en') return REZ_SUB_OUT_EN.yonet
  if (locale === 'de') return REZ_SUB_OUT_DE.yonet
  return seg
}

/**
 * Adres çubuğu / middleware: locale çıkarılmış path → App Router’ın beklediği kanonik path.
 * Örn. en + `/about` → `/hakkimizda`, en + `/help-center/category/foo` → `/yardim-merkezi/kategori/foo`
 */
export function incomingPathToCanonicalRoute(locale: SiteLocale, pathWithoutLocale: string): string {
  if (!pathWithoutLocale || pathWithoutLocale === '/') return '/'
  const segments = pathWithoutLocale.split('/').filter(Boolean)
  const out: string[] = []
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    if (i === 0) {
      out.push(normalizeFirstSegmentIn(locale, seg))
      continue
    }
    const prevCanonical = out[i - 1]
    if (prevCanonical === 'yardim-merkezi' && i === 1) {
      out.push(normalizeHelpSubIn(locale, seg))
      continue
    }
    if (prevCanonical === 'rezervasyon' && i === 1) {
      out.push(normalizeRezSubIn(locale, seg))
      continue
    }
    out.push(seg)
  }
  return `/${out.join('/')}`
}

/**
 * Kanonik iç path (Sanity / kod) → o dildeki kamuya açık path (/en öneki hariç).
 * Örn. en + `/hakkimizda` → `/about`
 */
export function canonicalRouteToPublicPath(locale: SiteLocale, canonicalPath: string): string {
  if (locale === DEFAULT_LOCALE) {
    return canonicalPath === '' ? '/' : canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`
  }
  const raw = !canonicalPath || canonicalPath === '/' ? '/' : canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`
  if (raw === '/') return '/'
  const segments = raw.split('/').filter(Boolean)
  const out: string[] = []
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    if (i === 0) {
      out.push(localizeFirstSegmentOut(locale, seg))
      continue
    }
    const prevCanonical = segments[i - 1]
    if (prevCanonical === 'yardim-merkezi' && i === 1) {
      out.push(localizeHelpSubOut(locale, seg))
      continue
    }
    if (prevCanonical === 'rezervasyon' && i === 1) {
      out.push(localizeRezSubOut(locale, seg))
      continue
    }
    out.push(seg)
  }
  return `/${out.join('/')}`
}
