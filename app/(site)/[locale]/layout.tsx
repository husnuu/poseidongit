import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import { WishlistProvider } from '@/lib/wishlist/WishlistContext'

export default async function LocaleSiteLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isSiteLocale(raw)) notFound()
  const locale = raw as SiteLocale

  return (
    <WishlistProvider>
      <Header locale={locale} />
      {children}
      <Footer locale={locale} />
    </WishlistProvider>
  )
}
