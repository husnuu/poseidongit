import type { SiteLocale } from './config'

/** Header / footer menü satırları (label + labelEn + labelDe) */
export function pickNavLabel(
  item: { label: string; labelEn?: string | null; labelDe?: string | null },
  locale: SiteLocale
): string {
  if (locale === 'en' && item.labelEn?.trim()) return item.labelEn.trim()
  if (locale === 'de' && item.labelDe?.trim()) return item.labelDe.trim()
  return item.label
}

/** Site ayarları CTA metni */
export function pickCtaText(
  cta: { text?: string | null; textEn?: string | null; textDe?: string | null } | null | undefined,
  locale: SiteLocale
): string {
  if (!cta) return ''
  if (locale === 'en' && cta.textEn?.trim()) return cta.textEn.trim()
  if (locale === 'de' && cta.textDe?.trim()) return cta.textDe.trim()
  return cta.text?.trim() ?? ''
}

/** Tek alan: Türkçe + İngilizce + Almanca (CMS) */
export function pickLocalizedString(
  base: string | null | undefined,
  en: string | null | undefined,
  de: string | null | undefined,
  locale: SiteLocale,
  fallback = ''
): string {
  const b = base?.trim() || fallback
  if (locale === 'en' && en?.trim()) return en.trim()
  if (locale === 'de' && de?.trim()) return de.trim()
  return b
}

export function pickOptionalLinkLabel(
  item: { label?: string | null; labelEn?: string | null; labelDe?: string | null },
  locale: SiteLocale
): string {
  const base = item.label?.trim() ?? ''
  if (locale === 'en' && item.labelEn?.trim()) return item.labelEn.trim()
  if (locale === 'de' && item.labelDe?.trim()) return item.labelDe.trim()
  return base
}

export const NUMBER_LOCALE: Record<SiteLocale, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  de: 'de-DE',
}

export function headerAria(locale: SiteLocale) {
  const m: Record<
    SiteLocale,
    {
      selectLanguage: string
      mainNav: string
      openMenu: string
      closeMenu: string
      mobileMenu: string
      home: string
      announcement: string
    }
  > = {
    tr: {
      selectLanguage: 'Dil seçin',
      mainNav: 'Ana menü',
      openMenu: 'Menüyü aç',
      closeMenu: 'Menüyü kapat',
      mobileMenu: 'Mobil menü',
      home: 'Ana sayfa',
      announcement: 'Site duyurusu',
    },
    en: {
      selectLanguage: 'Choose language',
      mainNav: 'Main menu',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      mobileMenu: 'Mobile menu',
      home: 'Home',
      announcement: 'Site announcement',
    },
    de: {
      selectLanguage: 'Sprache wählen',
      mainNav: 'Hauptmenü',
      openMenu: 'Menü öffnen',
      closeMenu: 'Menü schließen',
      mobileMenu: 'Mobiles Menü',
      home: 'Startseite',
      announcement: 'Site-Hinweis',
    },
  }
  return m[locale]
}

export function footerUi(locale: SiteLocale) {
  const m: Record<
    SiteLocale,
    {
      home: string
      reviews: (formattedCount: string) => string
      craftedByPrefix: string
      legalRegion: string
    }
  > = {
    tr: {
      home: 'Ana sayfa',
      reviews: (c) => `${c} yorum`,
      craftedByPrefix: 'Crafted by',
      legalRegion: 'Yasal bilgi ve ödeme',
    },
    en: {
      home: 'Home',
      reviews: (c) => `${c} reviews`,
      craftedByPrefix: 'Crafted by',
      legalRegion: 'Legal and payment information',
    },
    de: {
      home: 'Startseite',
      reviews: (c) => `${c} Bewertungen`,
      craftedByPrefix: 'Umgesetzt von',
      legalRegion: 'Rechtliches und Zahlung',
    },
  }
  return m[locale]
}

export function exploreLinksFallback(
  locale: SiteLocale
): Array<{ label: string; href: string; openInNewTab?: boolean }> {
  const m: Record<SiteLocale, Array<{ label: string; href: string; openInNewTab?: boolean }>> = {
    tr: [
      { label: 'Turlar', href: '/turlar' },
      { label: 'Koylar', href: '/koylar' },
      { label: 'Hakkımızda', href: '/hakkimizda' },
      { label: 'Blog', href: '/blog' },
      { label: 'İletişim', href: '/contact' },
    ],
    en: [
      { label: 'Tours', href: '/turlar' },
      { label: 'Bays', href: '/koylar' },
      { label: 'About us', href: '/hakkimizda' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
    ],
    de: [
      { label: 'Touren', href: '/turlar' },
      { label: 'Buchten', href: '/koylar' },
      { label: 'Über uns', href: '/hakkimizda' },
      { label: 'Blog', href: '/blog' },
      { label: 'Kontakt', href: '/contact' },
    ],
  }
  return m[locale]
}

/** Sanity rozet yokken kullanılan yerel ödül görselleri için alt metinler */
export function awardFallbackAlts(locale: SiteLocale): string[] {
  const m: Record<SiteLocale, string[]> = {
    tr: ['Ödül 1', 'Ödül 2', 'Ödül 3', 'Ödül 4'],
    en: ['Award 1', 'Award 2', 'Award 3', 'Award 4'],
    de: ['Auszeichnung 1', 'Auszeichnung 2', 'Auszeichnung 3', 'Auszeichnung 4'],
  }
  return m[locale]
}

export function legalLinksFallback(locale: SiteLocale): Array<{ label: string; href: string }> {
  const m: Record<SiteLocale, Array<{ label: string; href: string }>> = {
    tr: [
      { label: 'Şartlar ve koşullar', href: '/terms' },
      { label: 'Gizlilik politikası', href: '/privacy' },
    ],
    en: [
      { label: 'Terms and conditions', href: '/terms' },
      { label: 'Privacy policy', href: '/privacy' },
    ],
    de: [
      { label: 'Allgemeine Geschäftsbedingungen', href: '/terms' },
      { label: 'Datenschutz', href: '/privacy' },
    ],
  }
  return m[locale]
}
