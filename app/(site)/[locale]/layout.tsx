import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import { WishlistProvider } from '@/lib/wishlist/WishlistContext'

/** Header/Footer'daki site menüleri olmadan, sade/odaklı gösterilmesi istenen sayfalar. */
function isChromelessPath(pathname: string): boolean {
  return pathname.includes('/rezervasyon/yonet')
}

/** Klavye/ekran okuyucu kullanıcıları için "içeriğe geç" linkinin metni. */
const SKIP_LINK_LABEL: Record<SiteLocale, string> = {
  tr: 'İçeriğe geç',
  en: 'Skip to content',
  de: 'Zum Inhalt springen',
  ru: 'Перейти к содержимому',
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

  let chromeless = false
  try {
    const h = await headers()
    const pathname = h.get('x-pathname') ?? ''
    chromeless = isChromelessPath(pathname)
  } catch {
    /* headers() bazı edge durumlarda patlayabilir; menüler normal şekilde gösterilsin */
  }

  return (
    <WishlistProvider>
      <a href="#main-content" className="skip-link">
        {SKIP_LINK_LABEL[locale]}
      </a>
      {!chromeless && <Header locale={locale} />}
      {/* Sayfaların çoğu kendi <main> öğesini tanımlıyor; burada ikinci bir
          <main> açmak yerine atlama linkinin hedeflediği bir odak noktası
          veriyoruz (tabIndex=-1: programatik olarak odaklanabilir ama Tab
          sırasına girmez). */}
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      {!chromeless && <Footer locale={locale} />}
    </WishlistProvider>
  )
}
