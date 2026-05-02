import type { SiteLocale } from '@/lib/i18n/config'

export type PoseidonSecureStrings = {
  ariaLabel: string
  beforeStrong: string
  strong: string
  afterStrong: string
}

const TR: PoseidonSecureStrings = {
  ariaLabel: 'Poseidon Secure',
  beforeStrong: 'Yeni nesil tam donanımlı teknelerimizde, ',
  strong: '24 saate kadar şartsız iade ve hava durumu garantisiyle',
  afterStrong:
    ' size kusursuz bir deniz keyfi sunar. Siz sadece rotanın tadını çıkarın; güvenliğiniz ve tüm haklarınız bizim güvencemizde.',
}

const EN: PoseidonSecureStrings = {
  ariaLabel: 'Poseidon Secure',
  beforeStrong: 'On our next-generation fully equipped yachts, ',
  strong: 'we offer up to 24 hours unconditional refund and a weather guarantee',
  afterStrong:
    ' — so you can enjoy the sea with confidence. Focus on the route — your safety and rights are fully protected.',
}

const DE: PoseidonSecureStrings = {
  ariaLabel: 'Poseidon Secure',
  beforeStrong: 'Auf unseren modernen, voll ausgestatteten Yachten ',
  strong: 'bieten wir bis zu 24 Stunden bedingungslose Rückerstattung und eine Wettergarantie',
  afterStrong:
    ' — für ein rundum sorgenfreies Erlebnis auf See. Genießen Sie die Route; Ihre Sicherheit und Rechte sind geschützt.',
}

export function getPoseidonSecureStrings(locale: SiteLocale): PoseidonSecureStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  return TR
}
