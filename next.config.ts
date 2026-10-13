import type { NextConfig } from 'next'
import path from 'path'

/**
 * Site geneli güvenlik başlıkları — önceden hiç ayarlanmamıştı (Vercel/Next.js
 * bunları varsayılan olarak eklemiyor). Clickjacking, MIME-sniffing ve
 * referrer sızıntısına karşı düşük riskli, geriye dönük uyumlu bir taban.
 * Not: Content-Security-Policy kasıtlı olarak eklenmedi — GTM, Supabase,
 * Sanity CDN, Cloudflare Turnstile, Google Fonts gibi üçüncü taraf
 * kaynakların tam listesi çıkarılıp dikkatle test edilmeden eklenirse canlı
 * siteyi (özellikle analytics/CAPTCHA'yı) kolayca bozabilir.
 */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, './'),
  // "X-Powered-By: Next.js" başlığı — gerekli değil, gereksiz teknoloji
  // parmak izi bırakıyor.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  // Dev’de bazı ortamlarda chunk üretimini yavaşlatıp ChunkLoadError tetikleyebiliyor; kapalı.
  // experimental: { webpackMemoryOptimizations: true },
  serverExternalPackages: [
    '@sanity/client',
    '@sanity/image-url',
    '@opentelemetry/api',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/images/**',
      },
    ],
    // Modern formatlar (CWV/LCP için daha küçük dosya boyutu).
    formats: ['image/avif', 'image/webp'],
    // lib/sanityImage.ts (SANITY_IMAGE_QUALITY) + birkaç sayfada elle
    // kullanılan gerçek kalite değerleri — Next 16'da zorunlu olacak
    // allowlist (bkz. dev uyarısı: "quality is not configured").
    qualities: [75, 80, 85, 88, 90, 92],
  },
  // "Jest worker encountered child process exceptions" hatası için: build worker kapatılır,
  // derleme ana process'te yapılır (biraz daha yavaş ama worker çökmesi olmaz).
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Workaround for intermittent missing dev chunks (e.g. Cannot find module './1331.js').
      // Disabling filesystem cache in dev favors stability over rebuild speed.
      config.cache = false
    }
    if (!isServer && config.output && typeof config.output === 'object') {
      // Dev’de ilk route derlemesi yavaşsa varsayılan 120s ChunkLoadError verir; prod’da makul üst sınır.
      ;(config.output as { chunkLoadTimeout?: number }).chunkLoadTimeout = dev
        ? 600000
        : 180000
    }
    return config
  },
}

export default nextConfig
