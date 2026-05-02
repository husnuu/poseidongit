import type { SiteLocale } from '@/lib/i18n/config'

export type HelpBannerStrings = {
  heading: string
  lead: string
  languagesLine: string
  phoneRegionLabel: string
  whatsappLabel: string
  emailLabel: string
}

const TR: HelpBannerStrings = {
  heading: 'Yardıma mı ihtiyacınız var?',
  lead: 'Ekibimiz, size yardımcı olmak için haftanın yedi günü hizmetinizde.',
  languagesLine: 'Desteklenen diller: Türkçe, İngilizce',
  phoneRegionLabel: 'Türkiye',
  whatsappLabel: 'WhatsApp',
  emailLabel: 'E-posta',
}

const EN: HelpBannerStrings = {
  heading: 'Need help?',
  lead: 'Our team is here for you seven days a week.',
  languagesLine: 'Supported languages: Turkish, English',
  phoneRegionLabel: 'Turkey',
  whatsappLabel: 'WhatsApp',
  emailLabel: 'Email',
}

const DE: HelpBannerStrings = {
  heading: 'Brauchen Sie Hilfe?',
  lead: 'Unser Team ist sieben Tage die Woche für Sie da.',
  languagesLine: 'Sprachen: Türkisch, Englisch',
  phoneRegionLabel: 'Türkei',
  whatsappLabel: 'WhatsApp',
  emailLabel: 'E-Mail',
}

export function getHelpBannerStrings(locale: SiteLocale): HelpBannerStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  return TR
}
