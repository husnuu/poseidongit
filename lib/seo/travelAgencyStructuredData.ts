/**
 * Google Rich Results — TravelAgency JSON-LD (sabit metinler + görsel yedekleri).
 * Düzenlemek için bu dosyayı kullanın.
 */

import { absoluteUrl, getBaseUrl } from '@/lib/seo'

/** Sanity’den gelen mutlak URL’ler (opsiyonel) */
export type TravelAgencyStructuredDataImageOverrides = {
  logoUrl?: string | null
  imageUrls?: string[]
}

/** * İşletme görünen adı (sabit) 
 * HTML kaynağındaki "Poseidon" vurgusu ile eşitlendi.
 */
const BUSINESS_NAME = 'Çeşme Yachting'

/** Kısa alternatif ad / domain etiketi */
const BUSINESS_ALTERNATE_NAME = 'cesmetekneturu.net'

/** Online bilet vurgusu eklendi */
const DESCRIPTION =
  "Çeşme'nin en kapsamlı online tekne turu rezervasyonu ve güvenli bilet satış platformu. Poseidon ile Ege koylarını keşfedin."

const TELEPHONE = '+90-532-153-28-14'
const EMAIL = 'turkeycesme@hotmail.com'

/** * Adres bilgisi HTML footer ile birebir eşitlendi.
 */
const ADDRESS = {
  streetAddress: '16 Eylül Mahallesi 3053 Sokak, Hürriyet Caddesi, Yat Limanı',
  addressLocality: 'Çeşme',
  addressRegion: 'İzmir',
  postalCode: '35930',
} as const

/** Koordinatlar Çeşme Marina merkezine göre optimize edildi */
const GEO = { latitude: 38.3237, longitude: 26.3030 } as const

/** WhatsApp ReserveAction — E.164 ülke kodu ile, + olmadan */
const WHATSAPP_E164 = '905321532814'

/** Yedek görseller - public klasöründe varsa doldurun */
const FALLBACK_LOGO_PUBLIC_PATH = '/favicon.png' 
const FALLBACK_IMAGE_PUBLIC_PATHS = ['/og-image.png'] as const 

/** Sosyal medya ve gerçek Google Maps linkin eklendi */
const SAME_AS = [
  'https://www.instagram.com/cesmeyacht',
  'https://www.google.com/maps?vet=10CAAQoqAOahcKEwjgvpavhOmTAxUAAAAAHQAAAAAQDw..i&rlz=1C5MACD_enTR1078TR1079&pvq=Cg0vZy8xMXR0OGdoYmN3IiUKH1lhdCBLaXJhbGFtYSAtIMOHZcWfbWUgWWFjaHRpbmcQAhgD&lqi=CifDh2XFn21lIFlhdCBLaXJhbGFtYSAtIMOHZcWfbWUgWWFjaHRpbmdI-9Keh-W5gIAIWjsQARACEAMQBBgAGAMYBCIlw6dlxZ9tZSB5YXQga2lyYWxhbWEgw6dlxZ9tZSB5YWNodGluZyoECAIQAZIBDWNydWlzZV9hZ2VuY3k&fvr=1&cs=0&um=1&ie=UTF-8&fb=1&gl=tr&sa=X&ftid=0x14bb7b510f49d5f7:0x599400a4bd3f5d0b', // Senin paylaştığın gerçek Google linki
] as const

const PRICE_RANGE = '1500-45000' // Günlük turlardan özel yat kiralamaya kadar olan geniş skala
const PAYMENT_ACCEPTED = 'Cash, Credit Card, Bank Transfer, Online Payment'

/** * KRİTİK GÜNCELLEME: HTML kaynağında görünen 2017 yorum sayısı eklendi.
 * Google botu sayfadaki "2017 değerlendirme" yazısı ile bu kodu eşleştirecek.
 */
const AGGREGATE_RATING = {
  ratingValue: '4.8',
  reviewCount: '2017', 
  bestRating: '5',
} as const

/** Hizmet isimleri SEO ve "Online Bilet" odaklı güncellendi */
const SERVICE_OFFERS: ReadonlyArray<{ name: string; path: string }> = [
  { name: "Çeşme Daily Boat Tour - Online Ticket Booking", path: '/tur/cesme-tekne-turu' },
  { name: 'Private Yacht Charter Çeşme - Instant Booking', path: '/yat-kiralama/' },
]

const WEEKDAYS = [
  'https://schema.org/Monday',
  'https://schema.org/Tuesday',
  'https://schema.org/Wednesday',
  'https://schema.org/Thursday',
  'https://schema.org/Friday',
  'https://schema.org/Saturday',
  'https://schema.org/Sunday',
] as const

export function buildTravelAgencyStructuredData(
  imageOverrides?: TravelAgencyStructuredDataImageOverrides
): Record<string, unknown> {
  const base = getBaseUrl()
  const id = `${base}/#business`
  const waUrl = `https://wa.me/${WHATSAPP_E164}`

  const fromSanity = imageOverrides?.imageUrls?.filter((u): u is string => Boolean(u?.trim())) ?? []
  const images =
    fromSanity.length > 0
      ? fromSanity
      : FALLBACK_IMAGE_PUBLIC_PATHS.map((p) => absoluteUrl(p))

  const logoOverride = imageOverrides?.logoUrl?.trim() ?? ''
  const logo =
    logoOverride ||
    (FALLBACK_LOGO_PUBLIC_PATH ? absoluteUrl(FALLBACK_LOGO_PUBLIC_PATH) : '')

  const itemListElement = SERVICE_OFFERS.map((item, i) => ({
    '@type': 'Offer',
    position: i + 1,
    itemOffered: {
      '@type': 'Service',
      name: item.name,
      url: absoluteUrl(item.path),
    },
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': id,
    name: BUSINESS_NAME,
    alternateName: BUSINESS_ALTERNATE_NAME,
    url: base,
    ...(images.length > 0 ? { image: images } : {}),
    ...(logo ? { logo } : {}),
    description: DESCRIPTION,
    telephone: TELEPHONE,
    email: EMAIL,
    address: {
      '@type': 'PostalAddress',
      streetAddress: ADDRESS.streetAddress,
      addressLocality: ADDRESS.addressLocality,
      addressRegion: ADDRESS.addressRegion,
      postalCode: ADDRESS.postalCode,
      addressCountry: 'TR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: GEO.latitude,
      longitude: GEO.longitude,
    },
    areaServed: [
      { '@type': 'City', name: 'Çeşme' },
      { '@type': 'City', name: 'Alaçatı' },
      { '@type': 'AdministrativeArea', name: 'İzmir' },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [...WEEKDAYS],
        opens: '00:00',
        closes: '23:59',
      },
    ],
    priceRange: PRICE_RANGE,
    currenciesAccepted: 'TRY',
    paymentAccepted: PAYMENT_ACCEPTED,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: AGGREGATE_RATING.ratingValue,
      reviewCount: AGGREGATE_RATING.reviewCount,
      bestRating: AGGREGATE_RATING.bestRating,
    },
    sameAs: [...SAME_AS],
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: waUrl,
        actionPlatform: [
          'https://schema.org/DesktopWebPlatform',
          'https://schema.org/MobileWebPlatform',
        ],
      },
      result: {
        '@type': 'Reservation',
        name: 'Çeşme Tekne Turu Rezervasyonu',
      },
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Çeşme Tekne Turu Hizmetleri',
      itemListElement,
    },
  }
}