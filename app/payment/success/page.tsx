import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { withLocalePath } from '@/lib/i18n/paths'
import { isYachtDepositBooking } from '@/lib/yachtDepositBooking'
import {
  formatPaymentAmount,
  formatPaymentSuccessDate,
  formatPaymentSuccessDateTime,
  getPaymentSuccessUi,
  paymentSuccessLocaleFromBooking,
} from '@/lib/i18n/strings/paymentSuccessPage'

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
  const uiDefault = getPaymentSuccessUi('tr')

  if (!oid || !isSafeOid(oid)) {
    return <ErrorCard ui={uiDefault} title={uiDefault.invalidLinkTitle} desc={uiDefault.invalidLinkDesc} />
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, status, source, tour_id, reference, tour_title, date, time, customer_first_name, customer_last_name, paid_at, access_token, paid_now, total_price, currency, adult_count, child_count, infant_count, ui_locale'
    )
    .eq('id', oid)
    .maybeSingle()

  if (error || !data) {
    return <ErrorCard ui={uiDefault} title={uiDefault.notFoundTitle} desc={uiDefault.notFoundDesc} />
  }

  const row = data as SupabaseBookingRow
  const locale = paymentSuccessLocaleFromBooking(
    typeof row.ui_locale === 'string' ? row.ui_locale : null
  )
  const ui = getPaymentSuccessUi(locale)
  const isYachtDeposit = isYachtDepositBooking(row)
  const ref = (typeof row.reference === 'string' && row.reference.trim()) || row.id.slice(0, 8).toUpperCase()
  const tourTitle = String(row.tour_title ?? '—')
  const date = formatPaymentSuccessDate(String(row.date ?? ''), locale)
  const customerName = [row.customer_first_name, row.customer_last_name].filter(Boolean).join(' ').trim() || '—'
  const paidAt = row.paid_at
    ? formatPaymentSuccessDateTime(String(row.paid_at), locale)
    : null
  const status = String(row.status ?? '').toLowerCase()
  const isPaid = status === 'paid' || status === 'confirmed'
  const accessToken = typeof row.access_token === 'string' ? row.access_token.trim() : ''
  const paidAmount = row.paid_now ?? row.total_price
  const currency = String(row.currency ?? 'TRY')

  const ticketPath = accessToken
    ? withLocalePath(locale, `/bilet/${encodeURIComponent(row.id)}?token=${encodeURIComponent(accessToken)}`)
    : null
  const pdfPath = accessToken
    ? `/api/voucher/access?bookingId=${encodeURIComponent(row.id)}&token=${encodeURIComponent(accessToken)}&download=1`
    : null
  const homePath = withLocalePath(locale, '/')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div
              className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30"
              style={{ animationDuration: '2s' }}
            />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-200">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 text-center">
            {isYachtDeposit
              ? isPaid
                ? ui.yachtDepositPaidTitle
                : ui.yachtDepositPendingTitle
              : isPaid
                ? ui.tourPaidTitle
                : ui.tourPendingTitle}
          </h1>
          <p className="mt-2 text-sm text-slate-500 text-center max-w-xs">
            {isYachtDeposit
              ? isPaid
                ? ui.yachtDepositPaidDesc
                : ui.yachtDepositPendingDesc
              : isPaid
                ? ui.tourPaidDesc
                : ui.tourPendingDesc}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-emerald-50 px-5 py-3">
            <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-emerald-800">
              <strong>{isYachtDeposit ? ui.yachtDepositEmailNote : ui.tourEmailNote}</strong>
            </p>
          </div>

          <div className="divide-y divide-slate-100 px-5">
            <DetailRow
              label={ui.labelReference}
              value={<span className="font-mono font-semibold text-slate-900">{ref}</span>}
            />
            <DetailRow label={ui.labelGuest} value={customerName} />
            <DetailRow label={isYachtDeposit ? ui.labelTransaction : ui.labelTour} value={tourTitle} />
            <DetailRow label={ui.labelDate} value={date} />
            {paidAmount != null && Number(paidAmount) > 0 && (
              <DetailRow
                label={ui.labelAmountPaid}
                value={
                  <span className="font-semibold text-slate-900">
                    {formatPaymentAmount(Number(paidAmount), currency, locale)}
                  </span>
                }
              />
            )}
            {paidAt && <DetailRow label={ui.labelPaidAt} value={paidAt} />}
          </div>

          {ticketPath && !isYachtDeposit && (
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
                {ui.viewTicket}
              </a>

              {pdfPath && (
                <a
                  href={pdfPath}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[.98]"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {ui.downloadPdf}
                </a>
              )}
            </div>
          )}

          <div className="border-t border-slate-100 px-5 py-4 text-center">
            <Link href={homePath} className="text-sm text-slate-500 hover:text-slate-700 hover:underline">
              {ui.backHome}
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">{ui.footerNote}</p>
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

function ErrorCard({
  ui,
  title,
  desc,
}: {
  ui: ReturnType<typeof getPaymentSuccessUi>
  title: string
  desc: string
}) {
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
        <Link href={withLocalePath('tr', '/')} className="mt-6 inline-block text-sm font-medium text-[#1f3c88] hover:underline">
          {ui.backHome}
        </Link>
      </div>
    </div>
  )
}
