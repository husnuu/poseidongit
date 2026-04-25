import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function isSafeBookingId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export default async function RezervasyonOnaylandiPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>
}) {
  const sp = await searchParams
  const orderToken = typeof sp.bookingId === 'string' ? sp.bookingId.trim() : ''

  if (!orderToken || !isSafeBookingId(orderToken)) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-lg font-semibold text-zinc-900">Geçersiz bağlantı</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Rezervasyon / sipariş numarası eksik veya güvenli biçimde değil. Bankanın gösterdiği <strong>oid</strong> veya
            sitedeki rezervasyon kodunuzu kullanın (işlem no TransId değildir).
          </p>
          <Link href="/" className="mt-6 inline-block text-sm font-medium text-[#1f3c88] hover:underline">
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    )
  }

  const resolvedId = orderToken
  if (!resolvedId) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-lg font-semibold text-zinc-900">Rezervasyon bulunamadı</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Bu kod veritabanındaki bir kayıtla eşleşmedi. Ödeme formuna gönderilen sipariş numarası (genelde rezervasyon
            UUID’si) ile paneldeki kayıt aynı olmalıdır; banka dekontundaki <strong>TransId</strong> rezervasyon ID’si
            değildir.
          </p>
          <Link href="/" className="mt-6 inline-block text-sm font-medium text-[#1f3c88] hover:underline">
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    )
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('id, status, reference, tour_title, date, customer_first_name, customer_last_name, paid_at')
    .eq('id', resolvedId)
    .maybeSingle()

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-lg font-semibold text-zinc-900">Rezervasyon bulunamadı</h1>
          <p className="mt-2 text-sm text-zinc-600">Kayıt yüklenemedi veya mevcut değil.</p>
          <Link href="/" className="mt-6 inline-block text-sm font-medium text-[#1f3c88] hover:underline">
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    )
  }

  const row = data as SupabaseBookingRow
  const status = String(row.status ?? 'pending').toLowerCase()
  const ref = (typeof row.reference === 'string' && row.reference.trim()) || row.id.slice(0, 8).toUpperCase()
  const tourTitle = String(row.tour_title ?? '—')
  const date = String(row.date ?? '')
  const customerName = [row.customer_first_name, row.customer_last_name].filter(Boolean).join(' ').trim()
  const paidAt = row.paid_at != null ? String(row.paid_at) : ''
  const isPaid = status === 'paid' || status === 'confirmed'
  const isFailed = status === 'failed'

  const heroIcon = isFailed ? (
    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-700">
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  ) : (
    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )

  const title = isFailed
    ? 'Ödeme tamamlanamadı'
    : isPaid
      ? 'Rezervasyonunuz onaylandı.'
      : 'Ödemeniz alındı, rezervasyonunuz işleniyor.'
  const subtitle = isFailed
    ? 'Bu sayfa yalnızca bilgilendirme içindir. Rezervasyon durumu sunucu kayıtlarına göre güncellenir.'
    : isPaid
      ? 'Ödemeniz kayıtlarımıza işlendi. İyi yolculuklar dileriz.'
      : 'Kesin onay ve e-posta bildirimi sunucumuza gelen banka callback’i ile tamamlanır; birkaç saniye sürebilir.'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-8 shadow-md">
        {heroIcon}
        <h1 className="text-center text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-center text-sm text-slate-600">{subtitle}</p>

        {isFailed && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-900">
            Bu rezervasyon ödeme aşamasında başarısız olarak işaretlendi. Sorun devam ederse bizimle iletişime geçin.
          </div>
        )}

        <dl className="mt-6 space-y-3 rounded-xl bg-slate-50/90 px-4 py-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Rezervasyon no</dt>
            <dd className="font-mono text-right text-slate-900">{ref}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Kayıt ID</dt>
            <dd className="font-mono text-right text-xs text-slate-700 break-all">{row.id}</dd>
          </div>
          {customerName ? (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Misafir</dt>
              <dd className="text-right text-slate-900">{customerName}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Tur</dt>
            <dd className="text-right text-slate-900">{tourTitle}</dd>
          </div>
          {date ? (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Tarih</dt>
              <dd className="text-right text-slate-900">{date}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Durum</dt>
            <dd className="text-right text-slate-900 capitalize">{status}</dd>
          </div>
          {paidAt ? (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Ödeme zamanı</dt>
              <dd className="text-right text-slate-900">
                {new Date(paidAt).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}
              </dd>
            </div>
          ) : null}
        </dl>

        <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">
          Tarayıcıdaki banka yanıtı ile sunucu durumu birkaç saniye farklı olabilir; bilet ve e-posta callback sonrası
          güncellenir.
        </p>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex justify-center rounded-xl bg-[#1f3c88] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#162d66]"
          >
            Ana sayfa
          </Link>
        </div>
      </div>
    </div>
  )
}
