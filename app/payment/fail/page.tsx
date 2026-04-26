import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function isSafeOid(value: string): boolean {
  return /^[0-9a-f-]{1,64}$/i.test(value)
}

export default async function PaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<{ oid?: string; reason?: string }>
}) {
  const sp = await searchParams
  const oid = (sp.oid ?? '').trim()
  const reason = sp.reason ?? ''

  const row: SupabaseBookingRow | null = oid && isSafeOid(oid)
    ? await supabase
        .from('bookings')
        .select('id, status, reference, tour_title, date, customer_first_name, customer_last_name')
        .eq('id', oid)
        .maybeSingle()
        .then(({ data }) => (data as SupabaseBookingRow | null))
    : null

  const ref = row
    ? (typeof row.reference === 'string' && row.reference.trim()) || row.id.slice(0, 8).toUpperCase()
    : null
  const tourTitle = row ? String(row.tour_title ?? '—') : null
  const date = row ? String(row.date ?? '') : null
  const customerName = row
    ? [row.customer_first_name, row.customer_last_name].filter(Boolean).join(' ').trim()
    : null

  const hashFail = reason === 'hash'

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-8 shadow-md">

        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-700">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-center text-xl font-semibold tracking-tight text-slate-900">
          Ödeme tamamlanamadı
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          {hashFail
            ? 'Ödeme doğrulama hatası oluştu. Güvenlik nedeniyle işlem onaylanmadı.'
            : 'Bu rezervasyon için ödeme işlemi başarısız sonuçlandı.'}
        </p>

        {!hashFail && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 text-center">
            Kartınızdan herhangi bir tutar çekilmedi. Kart bilgilerinizi kontrol ederek tekrar deneyebilirsiniz.
          </div>
        )}

        {row && (
          <dl className="mt-6 space-y-3 rounded-xl bg-slate-50/90 px-4 py-4 text-sm">
            {ref && (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Rezervasyon no</dt>
                <dd className="font-mono text-right text-slate-900">{ref}</dd>
              </div>
            )}
            {customerName && (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Misafir</dt>
                <dd className="text-right text-slate-900">{customerName}</dd>
              </div>
            )}
            {tourTitle && (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Tur</dt>
                <dd className="text-right text-slate-900">{tourTitle}</dd>
              </div>
            )}
            {date && (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Tarih</dt>
                <dd className="text-right text-slate-900">{date}</dd>
              </div>
            )}
          </dl>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Geri dön
          </button>
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
