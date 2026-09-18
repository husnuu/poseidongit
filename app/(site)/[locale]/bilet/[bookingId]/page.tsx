import Link from 'next/link'
import { notFound } from 'next/navigation'
import { validateBookingAccessToken } from '@/lib/bookingAccessToken'
import { getBookingConfirmationData } from '@/lib/bookingConfirmation'
import BookingConfirmationView from '@/components/booking-confirmation/BookingConfirmationView'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { boardingPassPageCopy } from '@/lib/i18n/bookingFlowLocale'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function AccessDenied({ locale }: { locale: SiteLocale }) {
  const copy = boardingPassPageCopy(locale)
  const homePath = withLocalePath(locale, '/')
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-zinc-50 p-6"
      style={{ fontFamily: 'var(--font-family)' }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#f1f5f9] bg-white p-8 text-center shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
        <h1 className="mb-2 text-xl font-bold text-[#131719]">{copy.accessDeniedTitle}</h1>
        <p className="mb-6 text-zinc-500">{copy.accessDeniedBody}</p>
        <Link
          href={homePath}
          className="inline-block rounded-xl px-5 py-2.5 font-semibold text-white"
          style={{ background: 'var(--primary, #2168b8)' }}
        >
          {copy.homeCta}
        </Link>
      </div>
    </div>
  )
}

export default async function BiletPage({
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

  const valid = await validateBookingAccessToken(bookingId, token)
  if (!valid) {
    return <AccessDenied locale={locale} />
  }

  const data = await getBookingConfirmationData(bookingId, locale)
  if (!data) notFound()

  return <BookingConfirmationView data={data} />
}
