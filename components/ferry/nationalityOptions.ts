import { getCountries } from 'react-phone-number-input/input'
import trLabels from 'react-phone-number-input/locale/tr.json'
import enLabels from 'react-phone-number-input/locale/en.json'
import deLabels from 'react-phone-number-input/locale/de.json'
import ruLabels from 'react-phone-number-input/locale/ru.json'
import type { SiteLocale } from '@/lib/i18n/config'

export interface NationalityOption {
  code: string
  label: string
  flag: string
}

const LABELS_BY_LOCALE: Record<SiteLocale, Record<string, string>> = {
  tr: trLabels as Record<string, string>,
  en: enLabels as Record<string, string>,
  de: deLabels as Record<string, string>,
  ru: ruLabels as Record<string, string>,
}

/** ISO 3166-1 alpha-2 kodundan bayrak emojisi üretir (örn. "TR" → 🇹🇷). */
function flagEmoji(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return ''
  const A = 0x1f1e6
  return String.fromCodePoint(...[...code].map((c) => A + c.charCodeAt(0) - 65))
}

const ALL_CODES = getCountries()
const DEFAULT_CODE = 'TR'

/** Dünyadaki tüm ülkeler (react-phone-number-input'un desteklediği 245 ISO kodu),
    bayrak emojisiyle birlikte, dile göre yerelleştirilmiş isimlerle — Türkiye en başta. */
export function getNationalityOptions(locale: SiteLocale = 'tr'): NationalityOption[] {
  const labels = LABELS_BY_LOCALE[locale] ?? LABELS_BY_LOCALE.tr
  const collator = new Intl.Collator(locale === 'tr' ? 'tr' : locale)
  const options = ALL_CODES.filter((code) => code !== DEFAULT_CODE).map((code) => ({
    code,
    label: labels[code] ?? code,
    flag: flagEmoji(code),
  }))
  options.sort((a, b) => collator.compare(a.label, b.label))
  const defaultLabel = labels[DEFAULT_CODE] ?? 'Türkiye'
  return [{ code: DEFAULT_CODE, label: defaultLabel, flag: flagEmoji(DEFAULT_CODE) }, ...options]
}

/** Bir ülke koduna karşılık gelen (dile göre yerelleştirilmiş) etiketi döndürür. */
export function getNationalityLabel(code: string, locale: SiteLocale = 'tr'): string {
  const labels = LABELS_BY_LOCALE[locale] ?? LABELS_BY_LOCALE.tr
  return labels[code] ?? code
}
