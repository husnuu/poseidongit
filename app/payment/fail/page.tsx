import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'
import FailPageBackButton from '@/components/FailPageBackButton'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function isSafeOid(value: string): boolean {
  return /^[0-9a-f-]{1,64}$/i.test(value)
}

function formatDate(d: string): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return d
  }
}

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim()
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim()

export default async function PaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<{ oid?: string; reason?: string }>
}) {
  const sp = await searchParams
  const oid = (sp.oid ?? '').trim()
  const reason = sp.reason ?? ''
  const hashFail = reason === 'hash'

  const row: SupabaseBookingRow | null = oid && isSafeOid(oid)
    ? await supabase
        .from('bookings')
        .select('id, status, reference, tour_title, date, customer_first_name, customer_last_name, tour_id')
        .eq('id', oid)
        .maybeSingle()
        .then(({ data }) => (data as SupabaseBookingRow | null))
    : null

  const ref = row
    ? (typeof row.reference === 'string' && row.reference.trim()) || row.id.slice(0, 8).toUpperCase()
    : null
  const tourTitle = row ? String(row.tour_title ?? '—') : null
  const date = row?.date ? formatDate(String(row.date)) : null
  const customerName = row
    ? [row.customer_first_name, row.customer_last_name].filter(Boolean).join(' ').trim()
    : null

  const whatsappHref = WHATSAPP
    ? `https://wa.me/${WHATSAPP.replace(/\D/g, '')}?text=${encodeURIComponent(`Merhaba, ödeme işlemim başarısız oldu. Rezervasyon no: ${ref ?? oid}`)}`
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/60 via-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* İkon + başlık */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 shadow-md shadow-red-100">
            <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 text-center">
            Ödeme tamamlanamadı
          </h1>
          <p className="mt-2 text-sm text-slate-500 text-center max-w-xs">
            {hashFail
              ? 'Ödeme doğrulama hatası oluştu. Güvenlik nedeniyle işlem onaylanmadı.'
              : 'Ödeme işleminiz başarısız sonuçlandı.'}
          </p>
        </div>

        {/* Kart */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

          {/* Bilgi banner */}
          {!hashFail && (
            <div className="flex items-start gap-3 border-b border-amber-100 bg-amber-50 px-5 py-4">
              <svg className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Kartınızdan herhangi bir tutar çekilmedi.</strong>{' '}
                Kart bilgilerinizi kontrol ederek tekrar deneyebilirsiniz.
              </p>
            </div>
          )}

          {/* Rezervasyon detayları */}
          {row && (
            <div className="divide-y divide-slate-100 px-5">
              {ref && <DetailRow label="Rezervasyon no" value={<span className="font-mono font-semibold">{ref}</span>} />}
              {customerName && <DetailRow label="Misafir" value={customerName} />}
              {tourTitle && <DetailRow label="Tur" value={tourTitle} />}
              {date && <DetailRow label="Tarih" value={date} />}
            </div>
          )}

          {/* Butonlar */}
          <div className="flex flex-col gap-3 px-5 py-5">
            <FailPageBackButton />

            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25d366] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#20bd5a] active:scale-[.98]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp ile Yardım Al
              </a>
            )}

            {SUPPORT_PHONE && (
              <a
                href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[.98]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {SUPPORT_PHONE} — Bizi Ara
              </a>
            )}
          </div>

          <div className="border-t border-slate-100 px-5 py-4 text-center">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 hover:underline">
              Ana sayfaya dön
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Sorun tekrar yaşanırsa farklı bir kart veya banka ile deneyebilirsiniz.
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
