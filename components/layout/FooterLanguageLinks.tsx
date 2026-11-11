'use client'

import { usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'
import { SITE_LOCALES, type SiteLocale } from '@/lib/i18n/config'
import { localeSwitchPath } from '@/lib/i18n/paths'

const LANGUAGE_NAMES: Record<SiteLocale, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  ru: 'Русский',
}

const NAV_LABEL: Record<SiteLocale, string> = {
  tr: 'Dil seçenekleri',
  en: 'Language options',
  de: 'Sprachoptionen',
  ru: 'Выбор языка',
}

/**
 * Sayfanın diğer dillerdeki karşılıklarına düz <a> bağlantıları. Header'daki dil
 * seçici yalnızca açılınca render edilen bir menü olduğundan, EN/DE/RU sayfalarına
 * HTML'de hiç bağlantı yoktu (tarayıcılar bu sayfaları yalnızca site haritasından
 * buluyordu). Bu liste sunucu HTML'inde her sayfada yer alır.
 */
export default function FooterLanguageLinks({ locale }: { locale: SiteLocale }) {
  const pathname = usePathname() ?? '/'
  return (
    <nav aria-label={NAV_LABEL[locale]} className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold text-white">
      <Globe className="h-3.5 w-3.5 text-white/70" aria-hidden />
      {SITE_LOCALES.map((loc) =>
        loc === locale ? (
          <span key={loc} aria-current="page" className="text-white/60">
            {LANGUAGE_NAMES[loc]}
          </span>
        ) : (
          <a
            key={loc}
            href={localeSwitchPath(pathname, loc)}
            hrefLang={loc}
            lang={loc}
            className="transition-colors hover:text-white/75"
          >
            {LANGUAGE_NAMES[loc]}
          </a>
        )
      )}
    </nav>
  )
}
