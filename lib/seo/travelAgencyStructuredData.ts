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

/** Sayfada GERÇEKTEN gösterilen puan/yorum sayısı — Google’ın structured-data
 * kurallarına göre şema, sayfanın görünür içeriğiyle eşleşmeli. Verilmezse
 * aşağıdaki sabit (AGGREGATE_RATING) yedek olarak kullanılır. */
export type TravelAgencyAggregateRatingOverride = {
  ratingValue: number
  reviewCount: number
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

/** Sitede (footer, WhatsApp butonu) ve Gizlilik Politikası'ndaki veri sorumlusu
 * bilgisinde görünen numara — şema görünen içerikle aynı olmalı (eskiden burada
 * sitede hiç geçmeyen +90 532 153 28 14 vardı). */
const TELEPHONE = '+90-533-417-36-56'
const EMAIL = 'turkeycesme@hotmail.com'

/** * Adres bilgisi HTML footer ile birebir eşitlendi.
 * Export edildi: lib/email.ts'deki e-posta şablonları da aynı gerçek adresi
 * toplanma noktası olarak kullanır (uydurma adres yok, tek kaynak burası).
 */
export const ADDRESS = {
  streetAddress: '16 Eylül Mahallesi 3053 Sokak, Hürriyet Caddesi, Yat Limanı',
  addressLocality: 'Çeşme',
  addressRegion: 'İzmir',
  postalCode: '35930',
} as const

/** Tek satırlık, e-posta/toplanma noktası gibi yerlerde kullanılacak biçim. */
export const FULL_ADDRESS_LINE = `${ADDRESS.streetAddress}, ${ADDRESS.addressLocality}/${ADDRESS.addressRegion}`

/** Koordinatlar Çeşme Marina merkezine göre optimize edildi */
const GEO = { latitude: 38.3237, longitude: 26.3030 } as const

/** WhatsApp ReserveAction — E.164 ülke kodu ile, + olmadan */
const WHATSAPP_E164 = '905334173656'

/** Yedek görseller — `public/` klasöründe böyle dosyalar YOK (bkz. SEO
 * denetimi: bu sabitler canlıda kırık `/favicon.png` ve `/og-image.png`
 * bağlantıları üretiyordu). Sanity'den görsel gelmiyorsa `logo`/`image`
 * alanları aşağıda zaten koşullu olarak atlanıyor — var olmayan bir dosyayı
 * işaret etmektense alanı tamamen boş bırakmak Google için daha doğru. */
const FALLBACK_LOGO_PUBLIC_PATH: string | null = null
const FALLBACK_IMAGE_PUBLIC_PATHS: readonly string[] = []

/** Sabit profiller. Footer'daki sosyal medya hesapları (Sanity → siteFooter.social)
 * çalışma zamanında eklenir — bkz. lib/seo/businessProfiles.ts. Google Haritalar
 * kaydı, uzun arama sonucu adresi yerine kalıcı CID adresiyle (aynı işletme:
 * ftid 0x14bb7b510f49d5f7:0x599400a4bd3f5d0b). */
const SAME_AS = [
  'https://www.instagram.com/cesmeyacht',
  'https://www.google.com/maps?cid=6454784873478446347',
] as const

/** sameAs için tek biçim: sorgu/izleme parametresi ve sondaki "/" atılır, tekrarlar elenir. */
export function mergeSameAs(...lists: ReadonlyArray<ReadonlyArray<string | null | undefined>>): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const list of lists) {
    for (const raw of list) {
      const t = raw?.trim()
      if (!t || !/^https?:\/\//i.test(t)) continue
      let normalized = t
      try {
        const u = new URL(t)
        // Google Haritalar'da kimlik sorguda (cid) — orada parametre korunur.
        const keepQuery = u.hostname.includes('google.') && u.searchParams.has('cid')
        normalized = `${u.protocol}//${u.hostname}${u.pathname.replace(/\/+$/, '')}${keepQuery ? `?cid=${u.searchParams.get('cid')}` : ''}`
      } catch {
        continue
      }
      const key = normalized.toLowerCase().replace(/^https?:\/\/(www\.)?/, '')
      if (seen.has(key)) continue
      seen.add(key)
      out.push(normalized)
    }
  }
  return out
}

const PRICE_RANGE = '1500-2500' // Günlük turlardan özel yat kiralamaya kadar olan geniş skala
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
  { name: 'Private Yacht Charter Çeşme - Instant Booking', path: '/yat-kiralama' },
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

/** Çalışma zamanında Sanity'den gelen ek bilgiler. */
export type TravelAgencyStructuredDataExtras = {
  /** Footer'daki sosyal medya profilleri (görünen bağlantılar). */
  sameAs?: ReadonlyArray<string | null | undefined>
  /** Gerçek tur/yat fiyatlarından hesaplanan aralık (örn. "1.500–60.000 TRY"). */
  priceRange?: string | null
}

export function buildTravelAgencyStructuredData(
  imageOverrides?: TravelAgencyStructuredDataImageOverrides,
  aggregateRatingOverride?: TravelAgencyAggregateRatingOverride | null,
  extras?: TravelAgencyStructuredDataExtras
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
    priceRange: extras?.priceRange?.trim() || PRICE_RANGE,
    currenciesAccepted: 'TRY',
    paymentAccepted: PAYMENT_ACCEPTED,
    aggregateRating:
      aggregateRatingOverride && aggregateRatingOverride.reviewCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: aggregateRatingOverride.ratingValue.toFixed(1),
            reviewCount: String(aggregateRatingOverride.reviewCount),
            bestRating: AGGREGATE_RATING.bestRating,
          }
        : {
            '@type': 'AggregateRating',
            ratingValue: AGGREGATE_RATING.ratingValue,
            reviewCount: AGGREGATE_RATING.reviewCount,
            bestRating: AGGREGATE_RATING.bestRating,
          },
    sameAs: mergeSameAs(extras?.sameAs ?? [], SAME_AS),
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
/**
 * İletişim sayfası için işletmenin iletişim kimliği — ana sayfadaki
 * TravelAgency ile aynı @id ve aynı gerçek bilgiler (tek kaynak bu dosya).
 */
export function buildBusinessContactStructuredData(extras?: Pick<TravelAgencyStructuredDataExtras, 'sameAs'>): Record<string, unknown> {
  const base = getBaseUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${base}/#business`,
    name: BUSINESS_NAME,
    alternateName: BUSINESS_ALTERNATE_NAME,
    url: base,
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
    geo: { '@type': 'GeoCoordinates', latitude: GEO.latitude, longitude: GEO.longitude },
    contactPoint: [
      { '@type': 'ContactPoint', telephone: TELEPHONE, email: EMAIL, contactType: 'customer service' },
      { '@type': 'ContactPoint', telephone: TELEPHONE, contactType: 'reservations', url: `https://wa.me/${WHATSAPP_E164}` },
    ],
    sameAs: mergeSameAs(extras?.sameAs ?? [], SAME_AS),
  }
}

/** llms.txt gibi düz metin özetler için işletme bilgileri (tek kaynak). */
export const BUSINESS_FACTS = {
  name: BUSINESS_NAME,
  telephone: TELEPHONE,
  email: EMAIL,
  whatsappUrl: `https://wa.me/${WHATSAPP_E164}`,
  address: FULL_ADDRESS_LINE,
  sameAs: mergeSameAs(SAME_AS),
} as const
