import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import ChunkLoadErrorHandler from '@/components/ChunkLoadErrorHandler'
import CookieConsentBannerRoot from '@/components/CookieConsentBannerRoot'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import GoogleTagManager, { GoogleTagManagerNoScript } from '@/components/GoogleTagManager'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-inter',
})

/** Site geneli (müşteri tarafı) ana font — DIN Next LT Pro'nun yerini aldı.
 * DIN Next'in tersine gerçek 200-800 arası ayrı ağırlıklara sahip, bu yüzden
 * .siteFontScope'taki font-weight/text-stroke telafileri artık gerekmiyor. */
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
})
import { getBaseUrl, getSiteName } from '@/lib/seo'
import { client, urlFor } from '@/lib/sanity'
import { siteSettingsQuery } from '@/lib/queries'

function safeMetadataBase(url: string): URL | undefined {
  if (!url?.trim().startsWith('http')) return undefined
  try {
    return new URL(url.trim())
  } catch {
    return undefined
  }
}

const metadataBase = safeMetadataBase(getBaseUrl())

const FALLBACK_TITLE = 'Tekne Turu ve Rezervasyon'
const FALLBACK_DESCRIPTION = 'Tekne turu ve koy turları. Rezervasyon ve özel turlar.'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
}

export async function generateMetadata(): Promise<Metadata> {
  const siteName = getSiteName()
  let defaultTitle = FALLBACK_TITLE
  let defaultDescription = FALLBACK_DESCRIPTION
  let faviconAsset: { _ref?: string } | undefined
  try {
    const settings = await client.fetch<{
      siteName?: string | null
      seo?: { metaTitle?: string | null; metaDescription?: string | null } | null
      favicon?: { asset?: { _ref?: string } } | null
    } | null>(siteSettingsQuery)
    const titleFromSanity = settings?.seo?.metaTitle?.trim()
    const descFromSanity = settings?.seo?.metaDescription?.trim()
    if (titleFromSanity) defaultTitle = titleFromSanity
    else if (siteName) defaultTitle = `Tekne Turu | ${siteName}`
    if (descFromSanity) defaultDescription = descFromSanity
    if (settings?.favicon?.asset) {
      faviconAsset = settings.favicon.asset
    }
  } catch {
    if (siteName) defaultTitle = `Tekne Turu | ${siteName}`
  }
  return {
    ...(metadataBase && { metadataBase }),
    title: {
      default: defaultTitle,
      template: siteName ? `%s | ${siteName}` : '%s',
    },
    description: defaultDescription,
    ...(faviconAsset && {
      icons: {
        // Sanity'deki tek favicon görselinden gerçek boyutlar: sekme ikonu
        // için 32/16, Apple'ın 180×180 istediği touch icon için ayrı boyut
        // (eskiden apple icon da 32×32'ydi — iOS ana ekranında bulanık çıkar).
        icon: [
          { url: urlFor(faviconAsset).width(32).height(32).url(), sizes: '32x32', type: 'image/png' },
          { url: urlFor(faviconAsset).width(16).height(16).url(), sizes: '16x16', type: 'image/png' },
        ],
        apple: [
          { url: urlFor(faviconAsset).width(180).height(180).url(), sizes: '180x180', type: 'image/png' },
        ],
      },
    }),
    openGraph: {
      type: 'website',
      locale: 'tr_TR',
      ...(siteName && { siteName }),
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Kök layout istek başlığı OKUMAZ (headers() tüm siteyi dinamik yapıp önbelleği
  // kapatıyordu). Site sayfalarının dili [locale]/layout.tsx'te <div lang> +
  // HtmlLangSync ile, middleware'de Content-Language başlığıyla verilir.
  return (
    <html lang="tr" className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <head>
        <GoogleTagManager />
      </head>
      <body
        className={`${inter.className} min-h-screen min-h-[100dvh] overflow-x-hidden bg-zinc-50 text-zinc-900 antialiased`}
        suppressHydrationWarning
      >
        <GoogleTagManagerNoScript />
        <Suspense fallback={null}>{children}</Suspense>
        <ChunkLoadErrorHandler />
        <GoogleAnalytics />
        <Suspense fallback={null}>
          <CookieConsentBannerRoot />
        </Suspense>
      </body>
    </html>
  )
}
