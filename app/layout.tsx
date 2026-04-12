import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import ChunkLoadErrorHandler from '@/components/ChunkLoadErrorHandler'
import CookieConsentBannerRoot from '@/components/CookieConsentBannerRoot'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import NoScriptSeoFallback from '@/components/seo/NoScriptSeoFallback'
import { htmlLangForLocale, isSiteLocale } from '@/lib/i18n/config'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-inter',
})
import { getBaseUrl, getSiteName } from '@/lib/seo'
import { client, urlFor } from '@/lib/sanity'
import { siteSettingsQuery } from '@/lib/queries'

const baseUrl = getBaseUrl()
const metadataBase =
  baseUrl && baseUrl.startsWith('http')
    ? new URL(baseUrl)
    : undefined

const FALLBACK_TITLE = 'Tekne Turu ve Rezervasyon'
const FALLBACK_DESCRIPTION = 'Tekne turu ve koy turları. Rezervasyon ve özel turlar.'

export async function generateMetadata(): Promise<Metadata> {
  const siteName = getSiteName()
  let defaultTitle = FALLBACK_TITLE
  let defaultDescription = FALLBACK_DESCRIPTION
  let faviconUrl: string | undefined
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
      faviconUrl = urlFor(settings.favicon.asset).width(32).height(32).url()
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
    ...(faviconUrl && {
      icons: {
        icon: faviconUrl,
        apple: faviconUrl,
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
  const h = await headers()
  const loc = h.get('x-site-locale')
  const htmlLang =
    loc && isSiteLocale(loc) ? htmlLangForLocale(loc) : 'tr'

  return (
    <html lang={htmlLang} className={inter.variable}>
      <body
        className={`${inter.className} min-h-screen overflow-x-hidden bg-zinc-50 text-zinc-900 antialiased`}
      >
        <Suspense fallback={null}>{children}</Suspense>
        <ChunkLoadErrorHandler />
        <GoogleAnalytics />
        <Suspense fallback={null}>
          <CookieConsentBannerRoot />
        </Suspense>
        <NoScriptSeoFallback />
      </body>
    </html>
  )
}
