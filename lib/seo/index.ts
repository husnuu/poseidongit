/**
 * SEO yardımcıları: base URL, JSON-LD şemaları, meta builder.
 * Resmi site: https://cesmetekneturu.net (NEXT_PUBLIC_SITE_URL ile ayarlanır).
 */

const DEFAULT_SITE_NAME = 'Çeşme Poseidon'

/** Site base URL: ortam değişkenlerinden. Canlıda NEXT_PUBLIC_SITE_URL=https://cesmetekneturu.net kullanın. */
export function getBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  return raw.replace(/\/$/, '')
}

export function absoluteUrl(path: string): string {
  const base = getBaseUrl()
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

/** Organization JSON-LD */
export function buildOrganizationSchema(overrides?: {
  name?: string
  url?: string
  logo?: string
  sameAs?: string[]
}) {
  const base = getBaseUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: overrides?.name ?? DEFAULT_SITE_NAME,
    url: overrides?.url ?? base,
    logo: overrides?.logo ?? `${base}/logo.png`,
    sameAs: overrides?.sameAs ?? [],
  }
}

/** WebSite JSON-LD (ana sayfa) */
export function buildWebSiteSchema(overrides?: { name?: string; url?: string; description?: string }) {
  const base = getBaseUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: overrides?.name ?? DEFAULT_SITE_NAME,
    url: overrides?.url ?? base,
    description: overrides?.description ?? 'Çeşme tekne turları ve rezervasyon. Adalar ve koylar turu.',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${base}/turlar?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * BreadcrumbList JSON-LD — Google için doğru hiyerarşi (Ana Sayfa > Kategori > Sayfa).
 * url değerleri absolute yapılır; base yoksa relative kalır.
 */
export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): Record<string, unknown> {
  const base = getBaseUrl()
  const toAbsolute = (url: string) =>
    url.startsWith('http') ? url : base ? `${base.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}` : url
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: toAbsolute(item.url),
    })),
  }
}

/** FAQPage JSON-LD */
export function buildFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/** BlogPosting JSON-LD */
export function buildBlogPostingSchema(params: {
  title: string
  description?: string
  url: string
  image?: string
  datePublished?: string
  dateModified?: string
  author?: string
}): Record<string, unknown> {
  const base = getBaseUrl()
  const url = params.url.startsWith('http') ? params.url : absoluteUrl(params.url)
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: params.title,
    description: params.description ?? undefined,
    url,
    image: params.image ?? undefined,
    datePublished: params.datePublished ?? undefined,
    dateModified: params.dateModified ?? params.datePublished ?? undefined,
    author: params.author
      ? { '@type': 'Person', name: params.author }
      : { '@type': 'Organization', name: DEFAULT_SITE_NAME },
    publisher: {
      '@type': 'Organization',
      name: DEFAULT_SITE_NAME,
      url: base,
    },
  }
}

/**
 * Tur sayfası için Product JSON-LD — Google "Things to do" / deneyim ürünleri uyumlu.
 * Fiyat (offers), açıklama, puan ve organizasyon ile zengin sonuç desteği.
 */
export function buildTourSchema(params: {
  name: string
  description?: string
  url: string
  image?: string
  /** Başlangıç fiyatı (örn. en düşük sınıf yetişkin fiyatı). Sayı, nokta ondalık. */
  price?: number
  /** Para birimi (ISO 4217), örn. TRY */
  priceCurrency?: string
  /** Puan (örn. 1–5) */
  ratingValue?: number
  /** Değerlendirme sayısı */
  reviewCount?: number
}): Record<string, unknown> {
  const base = getBaseUrl()
  const url = params.url.startsWith('http') ? params.url : absoluteUrl(params.url)
  const priceCurrency = params.priceCurrency?.trim() || 'TRY'
  const out: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: params.name,
    description: params.description ?? undefined,
    url,
    image: params.image ?? undefined,
    brand: {
      '@type': 'Brand',
      name: DEFAULT_SITE_NAME,
    },
    offers:
      params.price != null && params.price > 0
        ? {
            '@type': 'Offer',
            price: String(params.price),
            priceCurrency,
            availability: 'https://schema.org/InStock',
            url,
          }
        : undefined,
  }
  if (params.ratingValue != null && params.reviewCount != null && params.reviewCount > 0) {
    out.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: String(params.ratingValue),
      bestRating: '5',
      reviewCount: String(params.reviewCount),
    }
  }
  return out
}

/** JSON-LD script tag içeriği */
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data)
}
