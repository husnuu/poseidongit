import Link from 'next/link'
import { headers } from 'next/headers'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'

const STRINGS: Record<SiteLocale, { title: string; body: string; cta: string; footer: string }> = {
  tr: {
    title: 'Rezervasyon bulunamadı',
    body: 'Bu bilet numarasına ait rezervasyon sistemde bulunamadı. Lütfen e-postanızdaki linki kontrol edin veya rezervasyon numaranızı doğrulayın.',
    cta: 'Ana sayfaya dön',
    footer: 'Sorun devam ederse bizimle iletişime geçin.',
  },
  en: {
    title: 'Booking not found',
    body: 'We could not find a booking for this ticket number. Please check the link in your email or verify your booking reference.',
    cta: 'Back to home',
    footer: 'If the problem persists, please contact us.',
  },
  de: {
    title: 'Buchung nicht gefunden',
    body: 'Wir konnten keine Buchung zu dieser Ticketnummer finden. Bitte überprüfen Sie den Link in Ihrer E-Mail oder Ihre Buchungsnummer.',
    cta: 'Zurück zur Startseite',
    footer: 'Falls das Problem weiterhin besteht, kontaktieren Sie uns bitte.',
  },
}

export default async function BiletNotFound() {
  const h = await headers()
  const loc = h.get('x-site-locale')
  const locale: SiteLocale = loc && isSiteLocale(loc) ? loc : 'tr'
  const s = STRINGS[locale]

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-zinc-200 p-8 text-center">
        <h1 className="text-xl font-bold text-zinc-900 mb-2">{s.title}</h1>
        <p className="text-zinc-600 mb-6 text-sm">{s.body}</p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-[#0c1929] px-5 py-3 text-white font-semibold hover:opacity-90 transition-opacity"
        >
          {s.cta}
        </Link>
        <p className="mt-6 text-xs text-zinc-500">{s.footer}</p>
      </div>
    </div>
  )
}
