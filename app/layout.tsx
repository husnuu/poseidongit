import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ChunkLoadErrorHandler from '@/components/ChunkLoadErrorHandler'

export const metadata: Metadata = {
  title: 'Poseidon Booking',
  description: 'Çeşme tekne turları ve rezervasyon',
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
