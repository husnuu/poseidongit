import { headers } from 'next/headers'
import { htmlLangForLocale, isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { getSiteName } from '@/lib/seo'

type NoScriptCopy = {
  h2Site: string
  pIntro: string
  h2Tours: string
  pTours: string
  h2Yachts: string
  pYachts: string
  navLabel: string
  navHome: string
  navTours: string
  navYachts: string
  navBlog: string
  navContact: string
  navHelp: string
}

const COPY: Record<SiteLocale, NoScriptCopy> = {
  tr: {
    h2Site: 'Çeşme tekne turu ve yat kiralama',
    pIntro:
      'Adalar ve koylar tekne turları, günlük ve BBQ turları ile yat kiralama hizmeti sunuyoruz. Tarayıcınızda JavaScript kapalıysa aşağıdaki bağlantılar ve özet metinler siteyi anlamanıza yardımcı olur.',
    h2Tours: 'Tekne turları',
    pTours:
      'Çeşme ve çevresinde düzenlenen rehberli tekne turları; süre, kalkış noktası ve online rezervasyon için turlar sayfasına gidin.',
    h2Yachts: 'Yat kiralama ve tekneler',
    pYachts:
      'Günlük veya konaklamalı yat kiralama; tekne tipi, kapasite ve fiyat bilgisi için yat kiralama bölümünü inceleyin.',
    navLabel: 'Önemli sayfalar',
    navHome: 'Ana sayfa',
    navTours: 'Turlar',
    navYachts: 'Yat kiralama',
    navBlog: 'Blog',
    navContact: 'İletişim',
    navHelp: 'Yardım merkezi',
  },
  en: {
    h2Site: 'Çeşme boat tours and yacht charter',
    pIntro:
      'We offer island and cove boat tours, day trips, BBQ cruises, and yacht charter. If JavaScript is disabled, the summary below and these links help you and search engines understand our services.',
    h2Tours: 'Boat tours',
    pTours:
      'Guided boat tours in and around Çeşme; see our tours page for duration, meeting point, and online booking.',
    h2Yachts: 'Yacht charter',
    pYachts:
      'Day or overnight yacht charter; browse yacht types, capacity, and pricing in the yacht charter section.',
    navLabel: 'Key pages',
    navHome: 'Home',
    navTours: 'Tours',
    navYachts: 'Yacht charter',
    navBlog: 'Blog',
    navContact: 'Contact',
    navHelp: 'Help center',
  },
  de: {
    h2Site: 'Çeşme Bootstouren und Yachtcharter',
    pIntro:
      'Insel- und Buchtenfahrten, Tagestouren, BBQ-Törns und Yachtcharter. Ohne JavaScript helfen Ihnen die Zusammenfassung und Links unten — und Suchmaschinen erfassen unsere Angebote.',
    h2Tours: 'Bootstouren',
    pTours:
      'Geführte Bootstouren in und um Çeşme; Dauer, Treffpunkt und Online-Buchung auf der Tourseite.',
    h2Yachts: 'Yachtcharter',
    pYachts:
      'Tages- oder Übernachtungscharter; Yachttypen, Kapazität und Preise im Yachtcharter-Bereich.',
    navLabel: 'Wichtige Seiten',
    navHome: 'Startseite',
    navTours: 'Touren',
    navYachts: 'Yachtcharter',
    navBlog: 'Blog',
    navContact: 'Kontakt',
    navHelp: 'Hilfe-Center',
  },
}

export default async function NoScriptSeoFallback() {
  let locale: SiteLocale = 'tr'
  try {
    const h = await headers()
    const raw = h.get('x-site-locale')
    if (raw && isSiteLocale(raw)) locale = raw
  } catch {
    return null
  }
  const t = COPY[locale]
  const site = getSiteName().trim()
  const siteTitle = site ? `${t.h2Site} — ${site}` : t.h2Site

  const home = withLocalePath(locale, '/')
  const tours = withLocalePath(locale, '/turlar')
  const yachts = withLocalePath(locale, '/yat-kiralama')
  const blog = withLocalePath(locale, '/blog')
  const contact = withLocalePath(locale, '/contact')
  const help = withLocalePath(locale, '/yardim-merkezi')

  return (
    <noscript>
      <div
        lang={htmlLangForLocale(locale)}
        className="border-t border-zinc-200 bg-zinc-100 px-4 py-8 text-zinc-900"
      >
        <div className="mx-auto max-w-3xl space-y-4 text-sm leading-relaxed md:text-base">
          <h2 className="text-lg font-bold text-zinc-950 md:text-xl">{siteTitle}</h2>
          <p>{t.pIntro}</p>
          <h2 className="pt-2 text-base font-semibold text-zinc-950 md:text-lg">{t.h2Tours}</h2>
          <p>{t.pTours}</p>
          <h2 className="pt-2 text-base font-semibold text-zinc-950 md:text-lg">{t.h2Yachts}</h2>
          <p>{t.pYachts}</p>
          <nav className="pt-4" aria-label={t.navLabel}>
            <ul className="list-inside list-disc space-y-1 marker:text-[var(--primary)]">
              <li>
                <a href={home} className="text-[var(--primary)] underline underline-offset-2">
                  {t.navHome}
                </a>
              </li>
              <li>
                <a href={tours} className="text-[var(--primary)] underline underline-offset-2">
                  {t.navTours}
                </a>
              </li>
              <li>
                <a href={yachts} className="text-[var(--primary)] underline underline-offset-2">
                  {t.navYachts}
                </a>
              </li>
              <li>
                <a href={blog} className="text-[var(--primary)] underline underline-offset-2">
                  {t.navBlog}
                </a>
              </li>
              <li>
                <a href={contact} className="text-[var(--primary)] underline underline-offset-2">
                  {t.navContact}
                </a>
              </li>
              <li>
                <a href={help} className="text-[var(--primary)] underline underline-offset-2">
                  {t.navHelp}
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </noscript>
  )
}
