import Link from 'next/link'
import { getBookingConfirmationData } from '@/lib/bookingConfirmation'
import BookingConfirmationView from '@/components/booking-confirmation/BookingConfirmationView'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function isSafeBookingId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function ErrorCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-base font-semibold text-zinc-900">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{desc}</p>
        <Link href="/" className="mt-6 inline-block text-sm font-medium text-[#2168b8] hover:underline">
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  )
}

export default async function RezervasyonOnaylandiPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>
}) {
  const sp = await searchParams
  const bookingId = typeof sp.bookingId === 'string' ? sp.bookingId.trim() : ''

  if (!bookingId || !isSafeBookingId(bookingId)) {
    return <ErrorCard title="Geçersiz bağlantı" desc="Rezervasyon numarası eksik veya geçersiz." />
  }

  const data = await getBookingConfirmationData(bookingId, 'tr')
  if (!data) {
    return <ErrorCard title="Rezervasyon bulunamadı" desc="Kayıt yüklenemedi veya mevcut değil." />
  }

  return <BookingConfirmationView data={data} />
}
