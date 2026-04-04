import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, './'),
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
