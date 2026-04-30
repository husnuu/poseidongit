import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { withLocalePath } from '@/lib/i18n/paths'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function isSafeBookingId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function formatDate(d: string): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return d
  }
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

  const { data, error } = await supabase
    .from('bookings')
    .select('id, status, reference, tour_title, date, time, customer_first_name, customer_last_name, paid_at, access_token, paid_now, total_price, currency, adult_count, child_count, infant_count')
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) {
    return <ErrorCard title="Rezervasyon bulunamadı" desc="Kayıt yüklenemedi veya mevcut değil." />
  }

  const row = data as SupabaseBookingRow
  const status = String(row.status ?? 'pending').toLowerCase()
  const isPaid = status === 'paid' || status === 'confirmed'
  const isFailed = status === 'failed'
  const ref = (typeof row.reference === 'string' && row.reference.trim()) || row.id.slice(0, 8).toUpperCase()
  const tourTitle = String(row.tour_title ?? '—')
  const date = formatDate(String(row.date ?? ''))
  const customerName = [row.customer_first_name, row.customer_last_name].filter(Boolean).join(' ').trim() || '—'
  const paidAt = row.paid_at ? new Date(String(row.paid_at)).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : null
  const accessToken = typeof row.access_token === 'string' ? row.access_token.trim() : ''
  const paidAmount = row.paid_now ?? row.total_price
  const currency = String(row.currency ?? 'TRY')

  const ticketPath = accessToken && isPaid
    ? withLocalePath('tr', `/bilet/${encodeURIComponent(row.id)}?token=${encodeURIComponent(accessToken)}`)
    : null
  const pdfPath = accessToken && isPaid
    ? `/api/voucher/access?bookingId=${encodeURIComponent(row.id)}&token=${encodeURIComponent(accessToken)}&download=1`
    : null

  if (isFailed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-base font-semibold text-slate-900">Ödeme tamamlanamadı</h1>
          <p className="mt-2 text-sm text-slate-500">
            Bu rezervasyon ödeme aşamasında başarısız olarak işaretlendi. Sorun devam ederse lütfen bizimle iletişime geçin.
          </p>
          <Link href="/" className="mt-6 inline-block text-sm font-medium text-[#1f3c88] hover:underline">
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Başarı ikonu */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" style={{ animationDuration: '2s' }} />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-200">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 text-center">
            {isPaid ? 'Rezervasyonunuz onaylandı!' : 'Ödemeniz alındı'}
          </h1>
          <p className="mt-2 text-sm text-slate-500 text-center max-w-xs">
            {isPaid
              ? 'Ödemeniz başarıyla tamamlandı. Biletiniz e-posta adresinize gönderilmiştir.'
              : 'Kesin onay ve biletiniz birkaç saniye içinde e-postanıza ulaşacaktır.'}
          </p>
        </div>

        {/* Kart */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

          {/* E-posta bildirimi */}
          <div className="flex items-center gap-3 border-b border-slate-100 bg-emerald-50 px-5 py-3">
            <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-emerald-800">
              Biletiniz <strong>e-posta olarak gönderilmiştir.</strong>
            </p>
          </div>

          {/* Detaylar */}
          <div className="divide-y divide-slate-100 px-5">
            <DetailRow label="Rezervasyon no" value={<span className="font-mono font-semibold text-slate-900">{ref}</span>} />
            <DetailRow label="Misafir" value={customerName} />
            <DetailRow label="Tur" value={tourTitle} />
            <DetailRow label="Tarih" value={date} />
            {paidAmount != null && Number(paidAmount) > 0 && (
              <DetailRow
                label="Ödenen tutar"
                value={
                  <span className="font-semibold text-slate-900">
                    {Number(paidAmount).toLocaleString('tr-TR')} {currency}
                  </span>
                }
              />
            )}
            {paidAt && <DetailRow label="Ödeme zamanı" value={paidAt} />}
          </div>

          {/* Butonlar */}
          {ticketPath && (
            <div className="flex flex-col gap-3 px-5 pb-5 pt-5">
              <a
                href={ticketPath}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#fc6c4f] px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-[#f85a3a] active:scale-[.98]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                Biletimi Görüntüle
              </a>

              {pdfPath && (
                <a
                  href={pdfPath}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[.98]"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Biletimi İndir (PDF)
                </a>
              )}
            </div>
          )}

          <div className="border-t border-slate-100 px-5 py-4 text-center">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 hover:underline">
              Ana sayfaya dön
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Sorularınız için bizimle iletişime geçebilirsiniz.
        </p>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className="text-sm text-slate-700 text-right">{value}</span>
    </div>
  )
}

function ErrorCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-base font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{desc}</p>
        <Link href="/" className="mt-6 inline-block text-sm font-medium text-[#1f3c88] hover:underline">
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  )
}
