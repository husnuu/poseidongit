import { Suspense } from 'react'
import ManageBookingClient from './ManageBookingClient'
import { getSiteName } from '@/lib/seo'

const siteName = getSiteName()
export const metadata = {
  title: siteName ? `Rezervasyonumu Yönet | ${siteName}` : 'Rezervasyonumu Yönet',
  description: 'Rezervasyonunuzu görüntüleyin, biletinizi sitede açın veya iptal edin.',
}

export default async function RezervasyonYonetPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>
}) {
  const params = await searchParams
  const bookingId = typeof params.bookingId === 'string' ? params.bookingId.trim() : ''

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <Suspense fallback={<div className="max-w-xl mx-auto px-6 py-8">Yükleniyor...</div>}>
        <ManageBookingClient initialBookingId={bookingId} />
      </Suspense>
    </div>
  )
}
