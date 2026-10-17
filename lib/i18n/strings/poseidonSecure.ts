import type { SiteLocale } from '@/lib/i18n/config'

export type PoseidonSecureBadge = {
  icon: 'refund' | 'weather'
  label: string
  /** Kartın altındaki açıklama — metinler uydurulmadı, Hakkımızda
      sayfasındaki mevcut güven kartlarının (trustGridCancelBody /
      trustGridWeatherBody) birebir aynısı. */
  body: string
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
    {
      icon: 'refund',
      label: '24 Saate Kadar Şartsız İade',
      body: 'Tur saatinden 24 saat öncesine kadar yapılan iptallerde ücretiniz iade edilir.',
    },
    {
      icon: 'weather',
      label: 'Hava Durumu Garantisi',
      body: 'Hava koşulları nedeniyle tur yapılamazsa tam iade ya da ücretsiz tarih değişikliği sunuyoruz.',
    },
  ],
  description:
    'Yeni nesil tam donanımlı teknelerimizle size kusursuz bir deniz keyfi sunarız. Siz sadece rotanın tadını çıkarın; güvenliğiniz ve tüm haklarınız bizim güvencemizde.',
}

const EN: PoseidonSecureStrings = {
  ariaLabel: 'Poseidon Secure',
  badges: [
    {
      icon: 'refund',
      label: 'Up to 24-Hour Unconditional Refund',
      body: 'Cancellations made up to 24 hours before departure are fully refunded.',
    },
    {
      icon: 'weather',
      label: 'Weather Guarantee',
      body: 'If weather prevents the tour, we offer a full refund or a free date change.',
    },
  ],
  description:
    'On our next-generation fully equipped yachts, we offer a flawless sea experience — enjoy the route while your safety and rights stay fully protected.',
}

const DE: PoseidonSecureStrings = {
  ariaLabel: 'Poseidon Secure',
  badges: [
    {
      icon: 'refund',
      label: 'Bis zu 24 Std. Bedingungslose Rückerstattung',
      body: 'Bei Stornierungen bis 24 Stunden vor Abfahrt erstatten wir den vollen Betrag.',
    },
    {
      icon: 'weather',
      label: 'Wettergarantie',
      body: 'Kann die Tour wetterbedingt nicht stattfinden, erhalten Sie eine volle Rückerstattung oder einen kostenlosen Termintausch.',
    },
  ],
  description:
    'Auf unseren modernen, voll ausgestatteten Yachten genießen Sie ein rundum sorgenfreies Erlebnis auf See — konzentrieren Sie sich auf die Route, Ihre Sicherheit und Rechte sind geschützt.',
}

const RU: PoseidonSecureStrings = {
  ariaLabel: 'Poseidon Secure',
  badges: [
    {
      icon: 'refund',
      label: 'Безусловный возврат в течение 24 часов',
      body: 'При отмене не позднее чем за 24 часа до отправления сумма возвращается полностью.',
    },
    {
      icon: 'weather',
      label: 'Гарантия хорошей погоды',
      body: 'Если тур не может состояться из-за погоды, мы предлагаем полный возврат средств или бесплатный перенос даты.',
    },
  ],
  description:
    'На наших современных, полностью оснащённых яхтах мы дарим вам безупречный морской отдых — наслаждайтесь маршрутом, пока ваша безопасность и права находятся под нашей защитой.',
}

export function getPoseidonSecureStrings(locale: SiteLocale): PoseidonSecureStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  if (locale === 'ru') return RU
  return TR
}
