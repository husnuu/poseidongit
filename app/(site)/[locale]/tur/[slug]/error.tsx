'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'

const STRINGS: Record<SiteLocale, { title: string; body: string; retry: string; home: string }> = {
  tr: {
    title: 'Tur yüklenemedi',
    body: 'Bu tur sayfası şu an açılamıyor. Lütfen tekrar deneyin veya ana sayfaya dönün.',
    retry: 'Tekrar dene',
    home: 'Ana sayfa',
  },
  en: {
    title: 'Tour failed to load',
    body: 'This tour page cannot be opened right now. Please try again or return to the homepage.',
    retry: 'Try again',
    home: 'Home',
  },
  de: {
    title: 'Tour konnte nicht geladen werden',
    body: 'Diese Tourseite kann derzeit nicht geöffnet werden. Bitte versuchen Sie es erneut oder kehren Sie zur Startseite zurück.',
    retry: 'Erneut versuchen',
    home: 'Startseite',
  },
  ru: {
    title: 'Не удалось загрузить тур',
    body: 'Эта страница тура сейчас недоступна. Пожалуйста, попробуйте снова или вернитесь на главную страницу.',
    retry: 'Попробовать снова',
    home: 'Главная',
  },
}

function localeFromPathname(pathname: string | null): SiteLocale {
  const seg = pathname?.split('/').filter(Boolean)[0]
  return seg && isSiteLocale(seg) ? seg : 'tr'
}

export default function TourError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const pathname = usePathname()
  const locale = localeFromPathname(pathname)
  const s = STRINGS[locale]

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-xl font-bold text-zinc-900 mb-2">{s.title}</h1>
      <p className="text-zinc-600 text-center mb-6 max-w-md">{s.body}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
        >
          {s.retry}
        </button>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-100"
        >
          {s.home}
        </Link>
      </div>
    </div>
  )
}
