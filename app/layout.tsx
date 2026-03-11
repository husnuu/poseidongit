import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
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

function HeaderFallback() {
  return <header className="h-14 border-b border-zinc-200 bg-white" />
}

function FooterFallback() {
  return <footer className="h-24 border-t border-zinc-200 bg-zinc-50" />
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <Suspense fallback={<HeaderFallback />}>
          <Header />
        </Suspense>
        {children}
        <Suspense fallback={<FooterFallback />}>
          <Footer />
        </Suspense>
        <ChunkLoadErrorHandler />
      </body>
    </html>
  )
}
