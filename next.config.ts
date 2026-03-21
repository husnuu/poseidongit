import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, './'),
  experimental: {
    webpackMemoryOptimizations: true,
  },
  serverExternalPackages: [
    '@sanity/client',
    '@sanity/image-url',
    'firebase-admin',
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
  webpack: (config) => config,
}

export default nextConfig
