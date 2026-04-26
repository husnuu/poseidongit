import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function isSafeOid(value: string): boolean {
  return /^[0-9a-f-]{1,64}$/i.test(value)
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ oid?: string }>
}) {
  const sp = await searchParams
  const oid = (sp.oid ?? '').trim()

  if (!oid || !isSafeOid(oid)) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-lg font-semibold text-zinc-900">Bağlantı geçersiz</h1>
          <p className="mt-2 text-sm text-zinc-600">Sipariş numarası eksik veya geçersiz.</p>
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
    .eq('id', oid)
    .maybeSingle()

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-lg font-semibold text-zinc-900">Rezervasyon bulunamadı</h1>
          <p className="mt-2 text-sm text-zinc-600">Kayıt yüklenemedi. Lütfen destek ile iletişime geçin.</p>
          <Link href="/" className="mt-6 inline-block text-sm font-medium text-[#1f3c88] hover:underline">
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    )
  }

  const row = data as SupabaseBookingRow
  const ref = (typeof row.reference === 'string' && row.reference.trim()) || row.id.slice(0, 8).toUpperCase()
  const tourTitle = String(row.tour_title ?? '—')
  const date = String(row.date ?? '')
  const customerName = [row.customer_first_name, row.customer_last_name].filter(Boolean).join(' ').trim()
  const paidAt = row.paid_at ? new Date(String(row.paid_at)).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : null
  const status = String(row.status ?? '').toLowerCase()

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-8 shadow-md">

        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-center text-xl font-semibold tracking-tight text-slate-900">
          {status === 'paid' || status === 'confirmed'
            ? 'Rezervasyonunuz onaylandı!'
            : 'Ödemeniz alındı, işleniyor…'}
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          {status === 'paid' || status === 'confirmed'
            ? 'Ödemeniz başarıyla tamamlandı. İyi yolculuklar dileriz.'
            : 'Kesin onay ve e-posta bildirimi kısa süre içinde iletilecektir.'}
        </p>

        <dl className="mt-6 space-y-3 rounded-xl bg-slate-50/90 px-4 py-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Rezervasyon no</dt>
            <dd className="font-mono text-right text-slate-900">{ref}</dd>
          </div>
          {customerName && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Misafir</dt>
              <dd className="text-right text-slate-900">{customerName}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Tur</dt>
            <dd className="text-right text-slate-900">{tourTitle}</dd>
          </div>
          {date && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Tarih</dt>
              <dd className="text-right text-slate-900">{date}</dd>
            </div>
          )}
          {paidAt && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Ödeme zamanı</dt>
              <dd className="text-right text-slate-900">{paidAt}</dd>
            </div>
          )}
        </dl>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex justify-center rounded-xl bg-[#1f3c88] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#162d66]"
          >
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    </div>
  )
}
