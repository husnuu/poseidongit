import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import ChunkLoadErrorHandler from '@/components/ChunkLoadErrorHandler'
import { getBaseUrl } from '@/lib/seo'

const baseUrl = getBaseUrl()
const metadataBase =
  baseUrl && baseUrl.startsWith('http')
    ? new URL(baseUrl)
    : undefined

export const metadata: Metadata = {
  ...(metadataBase && { metadataBase }),
  title: {
    default: 'Çeşme Tekne Turu | Çeşme Poseidon – Adalar ve Koylar',
    template: '%s | Çeşme Poseidon',
  },
  description:
    'Çeşme tekne turu ve koy turları. Adalar ve koylar tekne turu rezervasyonu, özel turlar. Çeşme Poseidon ile güvenli ve keyifli deneyim.',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Çeşme Poseidon',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <Suspense fallback={null}>{children}</Suspense>
        <ChunkLoadErrorHandler />
      </body>
    </html>
  )
}
