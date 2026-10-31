'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { parseLocaleFromPathname, withLocalePath } from '@/lib/i18n/paths'
import type { SiteLocale } from '@/lib/i18n/config'

/**
 * Kök app/not-found.tsx, (site)/[locale] layout'ının DIŞINDA kaldığı için
 * Header/Footer'sız ve TR-only render ediyordu (bkz. SEO denetimi). Bu dosya
 * aynı segmentte olduğu için üst layout'un Header/Footer'ı ile sarmalanır —
 * yalnızca içerik metnini locale'e göre seçmemiz yeterli. not-found.tsx
 * `params` prop'u almadığı için locale adres yolundan (`usePathname`) okunur —
 * `headers()` tüm sayfaları dinamik yapıp önbelleği kapatıyordu; `useParams()`
 * ise notFound() sonrası bu sınırda dil parametresini vermiyor.
 */
const COPY: Record<SiteLocale, { title: string; body: string; home: string; tours: string }> = {
  tr: {
    title: 'Sayfa bulunamadı',
    body: 'Aradığınız sayfa mevcut değil veya taşınmış olabilir.',
    home: 'Ana sayfaya dön',
    tours: 'Turları gör',
  },
  en: {
    title: 'Page not found',
    body: "The page you're looking for doesn't exist or may have moved.",
    home: 'Back to homepage',
    tours: 'See all tours',
  },
  de: {
    title: 'Seite nicht gefunden',
    body: 'Die gesuchte Seite existiert nicht oder wurde verschoben.',
    home: 'Zur Startseite',
    tours: 'Alle Touren ansehen',
  },
  ru: {
    title: 'Страница не найдена',
    body: 'Запрашиваемая страница не существует или была перемещена.',
    home: 'На главную',
    tours: 'Смотреть туры',
  },
}

export default function LocaleNotFound() {
  const locale: SiteLocale = parseLocaleFromPathname(usePathname() ?? '/').locale

  const copy = COPY[locale]
  const homePath = withLocalePath(locale, '/')
  const toursPath = withLocalePath(locale, '/turlar')

  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 py-20 text-center"
      style={{ fontFamily: 'var(--font-family)' }}
    >
      <h1 className="text-2xl font-bold text-zinc-900">{copy.title}</h1>
      <p className="max-w-md text-zinc-600">{copy.body}</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={homePath}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
        >
          {copy.home}
        </Link>
        <Link
          href={toursPath}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-50"
        >
          {copy.tours}
        </Link>
      </div>
    </div>
  )
}
