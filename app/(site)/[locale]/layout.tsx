import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { ChromeGate, HtmlLangSync } from '@/components/layout/LocaleChrome'
import NoScriptSeoFallback from '@/components/seo/NoScriptSeoFallback'
import { htmlLangForLocale, isSiteLocale, SITE_LOCALES, type SiteLocale } from '@/lib/i18n/config'
import { WishlistProvider } from '@/lib/wishlist/WishlistContext'

/**
 * Site sayfaları önbellekten (ISR) sunulur: ziyaretçi her zaman hazır HTML'i
 * alır, içerik en geç 10 dakikada bir arka planda yenilenir (Sanity webhook'u
 * kuruluysa yayımlanınca hemen). Eskiden bu layout `headers()` okuduğu için
 * tüm sayfalar her istekte sıfırdan render ediliyor ve yabancı dillerde her
 * seferinde çeviri yapılıyordu — yavaşlığın asıl nedeni buydu. Daha kısa süre
 * isteyen sayfalar (menü, yardım merkezi) kendi `revalidate` değerini korur.
 */
export const revalidate = 600

/** Dört dilin sayfaları build sırasında önceden üretilir — ilk ziyaretçi de beklemez. */
export function generateStaticParams() {
  return SITE_LOCALES.map((locale) => ({ locale }))
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
  const lang = htmlLangForLocale(locale)

  return (
    <WishlistProvider>
      <HtmlLangSync lang={lang} />
      {/* display:contents — yerleşimi etkilemeden içeriğin dilini sunucu HTML'inde belirtir. */}
      <div lang={lang} className="contents">
        <a href="#main-content" className="skip-link">
          {SKIP_LINK_LABEL[locale]}
        </a>
        {/* Rezervasyon yönetimi gibi sade sayfalarda menüler gizlenir. */}
        <ChromeGate>
          <Header locale={locale} />
        </ChromeGate>
        {/* Sayfaların çoğu kendi <main> öğesini tanımlıyor; burada ikinci bir
            <main> açmak yerine atlama linkinin hedeflediği bir odak noktası
            veriyoruz (tabIndex=-1: programatik olarak odaklanabilir ama Tab
            sırasına girmez). */}
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <ChromeGate>
          <Footer locale={locale} />
        </ChromeGate>
        <NoScriptSeoFallback locale={locale} />
      </div>
    </WishlistProvider>
  )
}
