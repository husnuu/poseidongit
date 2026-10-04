import type { SiteLocale } from '@/lib/i18n/config'

export type PoseidonSecureBadge = {
  icon: 'refund' | 'weather'
  label: string
}

export type PoseidonSecureStrings = {
  ariaLabel: string
  /** Metnin içine gömülü olan iki garanti artık ayrı ikonlu rozetler olarak gösteriliyor. */
  badges: PoseidonSecureBadge[]
  description: string
}

const TR: PoseidonSecureStrings = {
  ariaLabel: 'Poseidon Secure',
  badges: [
    { icon: 'refund', label: '24 Saate Kadar Şartsız İade' },
    { icon: 'weather', label: 'Hava Durumu Garantisi' },
  ],
  description:
    'Yeni nesil tam donanımlı teknelerimizle size kusursuz bir deniz keyfi sunarız. Siz sadece rotanın tadını çıkarın; güvenliğiniz ve tüm haklarınız bizim güvencemizde.',
}

const EN: PoseidonSecureStrings = {
  ariaLabel: 'Poseidon Secure',
  badges: [
    { icon: 'refund', label: 'Up to 24-Hour Unconditional Refund' },
    { icon: 'weather', label: 'Weather Guarantee' },
  ],
  description:
    'On our next-generation fully equipped yachts, we offer a flawless sea experience — enjoy the route while your safety and rights stay fully protected.',
}

const DE: PoseidonSecureStrings = {
  ariaLabel: 'Poseidon Secure',
  badges: [
    { icon: 'refund', label: 'Bis zu 24 Std. Bedingungslose Rückerstattung' },
    { icon: 'weather', label: 'Wettergarantie' },
  ],
  description:
    'Auf unseren modernen, voll ausgestatteten Yachten genießen Sie ein rundum sorgenfreies Erlebnis auf See — konzentrieren Sie sich auf die Route, Ihre Sicherheit und Rechte sind geschützt.',
}

export function getPoseidonSecureStrings(locale: SiteLocale): PoseidonSecureStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  return TR
}
