import { Suspense } from 'react'
import ManageBookingClient from './ManageBookingClient'
import { ticketPageUrl, voucherPdfUrl } from '@/lib/siteUrls'

export const metadata = {
  title: 'Rezervasyonumu Yönet | Cesme Poseidon',
  description: 'Rezervasyonunuzu görüntüleyin, biletinizi indirin veya iptal edin.',
}

export default async function RezervasyonYonetPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>
}) {
  const params = await searchParams
  const bookingId = typeof params.bookingId === 'string' ? params.bookingId.trim() : ''
  const ticketUrl = bookingId ? ticketPageUrl(bookingId) : ''
  const pdfDownloadUrl = bookingId ? voucherPdfUrl(bookingId, true) : ''

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <Suspense fallback={<div className="max-w-xl mx-auto px-6 py-8">Yükleniyor...</div>}>
        <ManageBookingClient
          initialBookingId={bookingId}
          ticketPageUrl={ticketUrl}
          voucherPdfUrl={pdfDownloadUrl}
        />
      </Suspense>
    </div>
  )
}
