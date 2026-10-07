import type { SiteLocale } from './config'
import { translateText } from './runtimeTranslate'

/** Header / footer menü satırları (label + labelEn + labelDe) */
export function pickNavLabel(
  item: { label: string; labelEn?: string | null; labelDe?: string | null },
  locale: SiteLocale
): string {
  if (locale === 'en' && item.labelEn?.trim()) return item.labelEn.trim()
  if (locale === 'de' && item.labelDe?.trim()) return item.labelDe.trim()
  // 'ru' için henüz CMS'te ayrı bir alan yok — senkron, bilinen bir sözlükten
  // (NAV_LABEL_OVERRIDES) deniyoruz; tanınmayan etiketler Türkçe temel etikete düşer
  // (bozuk değil, sadece makine çevirisi senkron yapılamıyor; bkz. translateNavLabelText).
  if (locale === 'ru') {
    const override = NAV_LABEL_OVERRIDES[normalizeNavKey(item.label)]
    if (override) return override.ru
  }
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

/**
 * pickLocalizedString'in anlık-çeviri fallback'li hâli: editör en/de alanını
 * doldurmamışsa, Türkçe tabanı elle yazmak yerine makine çevirisiyle doldurur.
 */
export async function pickLocalizedStringTranslated(
  base: string | null | undefined,
  en: string | null | undefined,
  de: string | null | undefined,
  locale: SiteLocale,
  fallback = ''
): Promise<string> {
  if (locale === 'en' && en?.trim()) return en.trim()
  if (locale === 'de' && de?.trim()) return de.trim()
  const b = base?.trim()
  if (!b) return fallback
  if (locale === 'tr') return b
  return translateText(b, locale)
}

/**
 * Menü/nav gibi kısa, tekrar eden etiketler bağlamsız makine çevirisinde
 * yanlış anlama (örn. "Koylar" → "Fächer") riskine açık; bilinen etiketler
 * için elle doğrulanmış çeviri kullanılır, tanınmayanlar MT'ye düşer.
 */
const NAV_LABEL_OVERRIDES: Record<string, { en: string; de: string; ru: string }> = {
  'anasayfa': { en: 'Home', de: 'Startseite', ru: 'Главная' },
  'ana sayfa': { en: 'Home', de: 'Startseite', ru: 'Главная' },
  'turlar': { en: 'Tours', de: 'Touren', ru: 'Туры' },
  'tur': { en: 'Tour', de: 'Tour', ru: 'Тур' },
  'yatlar': { en: 'Yachts', de: 'Yachten', ru: 'Яхты' },
  'yat kiralama': { en: 'Yacht rental', de: 'Yachtcharter', ru: 'Аренда яхт' },
  'hakkımızda': { en: 'About us', de: 'Über uns', ru: 'О нас' },
  'koylar': { en: 'Bays', de: 'Buchten', ru: 'Бухты' },
  'sınıflar': { en: 'Classes', de: 'Klassen', ru: 'Классы' },
  'blog': { en: 'Blog', de: 'Blog', ru: 'Блог' },
  'menü': { en: 'Menu', de: 'Speisekarte', ru: 'Меню' },
  'yardım merkezi': { en: 'Help Center', de: 'Hilfezentrum', ru: 'Центр помощи' },
  'i̇letişim': { en: 'Contact', de: 'Kontakt', ru: 'Контакты' },
  'iletişim': { en: 'Contact', de: 'Kontakt', ru: 'Контакты' },
  'şartlar ve koşullar': { en: 'Terms and Conditions', de: 'Allgemeine Geschäftsbedingungen', ru: 'Условия использования' },
  'gizlilik politikası': { en: 'Privacy Policy', de: 'Datenschutzrichtlinie', ru: 'Политика конфиденциальности' },
  'iptal ve iade politikası': { en: 'Cancellation and Refund Policy', de: 'Storno- und Rückerstattungsrichtlinie', ru: 'Политика отмены и возврата' },
  'iptal ve i̇ade': { en: 'Cancellation and Refund', de: 'Storno und Rückerstattung', ru: 'Отмена и возврат' },
  'iptal ve iade': { en: 'Cancellation and Refund', de: 'Storno und Rückerstattung', ru: 'Отмена и возврат' },
  'güvenlik politikası': { en: 'Security Policy', de: 'Sicherheitsrichtlinie', ru: 'Политика безопасности' },
  'çerez politikası': { en: 'Cookie Policy', de: 'Cookie-Richtlinie', ru: 'Политика использования файлов cookie' },
  'mesafeli satış sözleşmesi': { en: 'Distance Sales Agreement', de: 'Fernabsatzvertrag', ru: 'Договор дистанционной продажи' },
}

function normalizeNavKey(label: string): string {
  return label.trim().toLocaleLowerCase('tr-TR')
}

/** Nav/footer etiketi çevirisi: önce elle doğrulanmış sözlük, yoksa anlık makine çevirisi. */
export async function translateNavLabelText(label: string | null | undefined, locale: SiteLocale): Promise<string> {
  const trimmed = label?.trim()
  if (!trimmed || locale === 'tr') return trimmed ?? ''
  const override = NAV_LABEL_OVERRIDES[normalizeNavKey(trimmed)]
  if (override) return locale === 'de' ? override.de : locale === 'ru' ? override.ru : override.en
  return translateText(trimmed, locale)
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
  ru: 'ru-RU',
}

/**
 * Header dil satırındaki dil koduna göre “yakında” metni (satır hangi dil ise o dilde).
 * Örn. Almanca satırda “Demnächst”, İngilizce satırda “Coming soon”.
 */
export function comingSoonLabelForLanguageCode(code: string): string {
  const k = code.trim().toLowerCase()
  if (k === 'tr') return 'Yakında'
  if (k === 'en') return 'Coming soon'
  if (k === 'de') return 'Demnächst'
  if (k === 'ru') return 'Скоро'
  return 'Coming soon'
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
    ru: {
      selectLanguage: 'Выбрать язык',
      mainNav: 'Главное меню',
      openMenu: 'Открыть меню',
      closeMenu: 'Закрыть меню',
      mobileMenu: 'Мобильное меню',
      home: 'Главная',
      announcement: 'Объявление сайта',
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
    ru: {
      home: 'Главная',
      reviews: (c) => `${c} отзывов`,
      craftedByPrefix: 'Создано',
      legalRegion: 'Правовая информация и оплата',
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
      { label: 'Yatlar', href: '/yat-kiralama' },
      { label: 'Koylar', href: '/koylar' },
      { label: 'Hakkımızda', href: '/hakkimizda' },
      { label: 'Blog', href: '/blog' },
      { label: 'İletişim', href: '/contact' },
    ],
    en: [
      { label: 'Tours', href: '/turlar' },
      { label: 'Yachts', href: '/yat-kiralama' },
      { label: 'Bays', href: '/koylar' },
      { label: 'About us', href: '/hakkimizda' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
    ],
    de: [
      { label: 'Touren', href: '/turlar' },
      { label: 'Yachten', href: '/yat-kiralama' },
      { label: 'Buchten', href: '/koylar' },
      { label: 'Über uns', href: '/hakkimizda' },
      { label: 'Blog', href: '/blog' },
      { label: 'Kontakt', href: '/contact' },
    ],
    ru: [
      { label: 'Туры', href: '/turlar' },
      { label: 'Яхты', href: '/yat-kiralama' },
      { label: 'Бухты', href: '/koylar' },
      { label: 'О нас', href: '/hakkimizda' },
      { label: 'Блог', href: '/blog' },
      { label: 'Контакты', href: '/contact' },
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
    ru: ['Награда 1', 'Награда 2', 'Награда 3', 'Награда 4'],
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
    ru: [
      { label: 'Условия использования', href: '/terms' },
      { label: 'Политика конфиденциальности', href: '/privacy' },
    ],
  }
  return m[locale]
}
