import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Hourglass, CheckCircle2 } from 'lucide-react'
import { validateBookingAccessToken } from '@/lib/bookingAccessToken'
import { getPaymentLinkSummary } from '@/lib/paymentLink'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { paymentLinkPageCopy } from '@/lib/i18n/bookingFlowLocale'
import { formatTicketDate } from '@/lib/voucher/formatTicketDate'
import { customerTicketViewUrl } from '@/lib/siteUrls'
import PayNowButton from '@/components/payment-link/PayNowButton'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function fmtPrice(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

function StatusScreen({
  locale,
  icon,
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  locale: SiteLocale
  icon: React.ReactNode
  title: string
  body: string
  ctaLabel: string
  ctaHref: string
}) {
  void locale
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6" style={{ fontFamily: 'var(--font-family)' }}>
      <div className="w-full max-w-sm rounded-2xl border border-[#f1f5f9] bg-white p-8 text-center shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#2168b8]">
          {icon}
        </div>
        <h1 className="text-base font-bold text-[#131719]">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{body}</p>
        <Link href={ctaHref} className="mt-6 inline-block text-sm font-semibold text-[#2168b8] hover:underline">
          {ctaLabel}
        </Link>
      </div>
    </div>
  )
}

export default async function PaymentLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; bookingId: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { locale: rawLocale, bookingId } = await params
  if (!isSiteLocale(rawLocale)) notFound()
  const locale = rawLocale as SiteLocale
  const { token } = await searchParams
  const copy = paymentLinkPageCopy(locale)
  const homePath = withLocalePath(locale, '/')

  const valid = await validateBookingAccessToken(bookingId, token)
  if (!valid) {
    return (
      <StatusScreen
        locale={locale}
        icon={<Hourglass className="h-6 w-6" aria-hidden />}
        title={copy.accessDeniedTitle}
        body={copy.accessDeniedBody}
        ctaLabel={copy.homeCta}
        ctaHref={homePath}
      />
    )
  }

  const summary = await getPaymentLinkSummary(bookingId)
  if (!summary) notFound()

  if (summary.status !== 'pending') {
    const viewTicketUrl = customerTicketViewUrl(summary.bookingId, summary.accessToken ?? undefined, locale)
    return (
      <StatusScreen
        locale={locale}
        icon={<CheckCircle2 className="h-6 w-6" aria-hidden />}
        title={copy.alreadyPaidTitle}
        body={copy.alreadyPaidBody}
        ctaLabel={copy.viewTicketCta}
        ctaHref={viewTicketUrl}
      />
    )
  }

  const dateFormatted = summary.date ? formatTicketDate(summary.date, locale) : ''

  return (
    <div className="min-h-screen bg-zinc-50" style={{ fontFamily: 'var(--font-family)' }}>
      <div
        className="flex flex-col items-center px-4 pb-12 pt-14 text-center"
        style={{ background: 'linear-gradient(180deg, rgba(33,104,184,0.10) 0%, rgba(33,104,184,0) 100%)' }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
          <Hourglass className="h-8 w-8 text-[#2168b8]" aria-hidden />
        </div>
        <h1 className="mt-5 max-w-md text-2xl font-black leading-snug text-[#131719] sm:text-[28px]">
          {copy.greeting(summary.customerFirstName || '—')}
        </h1>
        <p className="mt-2 max-w-sm text-sm text-zinc-600">{summary.tourTitle}</p>
        {dateFormatted && (
          <p className="mt-1 text-sm font-semibold text-zinc-500">
            {dateFormatted}
            {summary.time ? ` · ${summary.time}` : ''}
          </p>
        )}
      </div>

      <div className="mx-auto -mt-6 max-w-md px-4 pb-16">
        <div className="rounded-2xl border border-[#f1f5f9] bg-white p-6 shadow-[0_4px_20px_rgba(19,23,25,0.08)]">
          <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500">{copy.waitingTitle}</p>
          <div className="mt-3 flex items-center justify-between border-t border-[#f1f5f9] pt-4">
            <span className="text-sm font-semibold text-zinc-600">{copy.amountDue}</span>
            <span className="text-2xl font-black text-[#131719]">
              {fmtPrice(summary.amountDue, summary.currency, locale)}
            </span>
          </div>
          <div className="mt-5">
            <PayNowButton
              bookingId={summary.bookingId}
              label={copy.payNowCta}
              processingLabel={copy.processing}
              errorFallback={copy.errorGeneric}
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href={homePath} className="text-sm text-zinc-500 hover:text-zinc-700 hover:underline">
            {copy.homeCta}
          </Link>
        </div>
      </div>
    </div>
  )
}
