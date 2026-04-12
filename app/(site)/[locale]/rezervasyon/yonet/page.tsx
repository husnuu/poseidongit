import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import ManageBookingClient from './ManageBookingClient'
import { getSiteName } from '@/lib/seo'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'

const siteName = getSiteName()
export const metadata = {
  title: siteName ? `Rezervasyonumu Yönet | ${siteName}` : 'Rezervasyonumu Yönet',
  description: 'Rezervasyonunuzu görüntüleyin, biletinizi sitede açın veya iptal edin.',
}

export default async function RezervasyonYonetPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ bookingId?: string }>
}) {
  const { locale: raw } = await params
  if (!isSiteLocale(raw)) notFound()
  const locale = raw as SiteLocale
  const sp = await searchParams
  const bookingId = typeof sp.bookingId === 'string' ? sp.bookingId.trim() : ''

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <Suspense fallback={<div className="max-w-xl mx-auto px-6 py-8">Yükleniyor...</div>}>
        <ManageBookingClient initialBookingId={bookingId} locale={locale} />
      </Suspense>
    </div>
  )
}
