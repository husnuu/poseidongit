import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import { WishlistProvider } from '@/lib/wishlist/WishlistContext'

/** Klavye/ekran okuyucu kullanıcıları için "içeriğe geç" linkinin metni. */
const SKIP_LINK_LABEL: Record<SiteLocale, string> = {
  tr: 'İçeriğe geç',
  en: 'Skip to content',
  de: 'Zum Inhalt springen',
}

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
      <a href="#main-content" className="skip-link">
        {SKIP_LINK_LABEL[locale]}
      </a>
      <Header locale={locale} />
      {/* Sayfaların çoğu kendi <main> öğesini tanımlıyor; burada ikinci bir
          <main> açmak yerine atlama linkinin hedeflediği bir odak noktası
          veriyoruz (tabIndex=-1: programatik olarak odaklanabilir ama Tab
          sırasına girmez). */}
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <Footer locale={locale} />
    </WishlistProvider>
  )
}
