import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFirestore } from '@/lib/firebaseAdmin'
import { validateBookingAccessToken } from '@/lib/bookingAccessToken'
import { client, urlFor } from '@/lib/sanity'
import { tourImageAndPickupQuery } from '@/lib/queries'
import { manageBookingUrl, getSiteBaseUrl } from '@/lib/siteUrls'
import BoardingPassTicket from '@/components/boarding-pass/BoardingPassTicket'

const COLLECTION = 'bookings'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function AccessDenied() {
  const base = getSiteBaseUrl()
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-xl font-bold text-zinc-900 mb-2">Erişim reddedildi</h1>
        <p className="text-zinc-600 mb-6">
          Bilet sayfasına erişmek için e-postanızdaki veya rezervasyon yönetim sayfasındaki geçerli linki kullanın.
        </p>
        <Link
          href={base ? `${base}/` : '/'}
          className="inline-block px-5 py-2.5 rounded-lg bg-[#1f3c88] text-white font-semibold hover:bg-[#0c1929]"
        >
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  )
}

type TicketData = {
  bookingId: string
  tourId: string
  tourTitle: string
  date: string
  time?: string
  meetingPoint: string
  counts: { adult: number; child: number; infant: number }
  classId: string
  className: string
  firstClassLocas?: string[]
  totalPrice: number
  currency: string
  status: string
  customerName: string
  /** Firestore’da varsa (admin ödeme sonrası yazılmış olabilir). */
  paidNowStored?: number
}

async function getTicketData(bookingId: string): Promise<TicketData | null> {
  const db = getFirestore()
  const snap = await db.collection(COLLECTION).doc(bookingId).get()
  if (!snap.exists) return null
  const d = snap.data()!
  const customer = (d.customer ?? {}) as Record<string, string>
  const counts = (d.counts ?? { adult: 0, child: 0, infant: 0 }) as { adult: number; child: number; infant: number }
  const tourId = typeof d.tourId === 'string' ? d.tourId.trim() : ''
  const classId = typeof d.classId === 'string' ? d.classId.trim().toLowerCase() : ''
  const firstClassLocasRaw = Array.isArray(d.firstClassLocas) ? d.firstClassLocas : []
  const firstClassLocas = firstClassLocasRaw
    .map((x) => (typeof x === 'string' ? x.trim().toUpperCase() : ''))
    .filter((x) => /^L(10|[1-9])$/.test(x))
  const fallbackLoca = typeof d.firstClassLoca === 'string' ? d.firstClassLoca.trim().toUpperCase() : ''
  const normalizedLocas = firstClassLocas.length
    ? firstClassLocas
    : /^L(10|[1-9])$/.test(fallbackLoca)
      ? [fallbackLoca]
      : undefined
  const paidRaw = (d as Record<string, unknown>).paidNow
  const paidNowStored = typeof paidRaw === 'number' && Number.isFinite(paidRaw) && paidRaw > 0 ? paidRaw : undefined
  return {
    bookingId: snap.id,
    tourId,
    tourTitle: String(d.tourTitle ?? '—'),
    date: String(d.date ?? ''),
    time: d.time != null ? String(d.time) : undefined,
    meetingPoint: String((d as Record<string, unknown>).meetingPoint ?? 'Çeşme Marina'),
    counts: { adult: counts.adult ?? 0, child: counts.child ?? 0, infant: counts.infant ?? 0 },
    classId,
    className: String(d.className ?? '—'),
    firstClassLocas: normalizedLocas,
    totalPrice: Number(d.totalPrice ?? 0),
    currency: String(d.currency ?? 'TRY'),
    status: String(d.status ?? 'pending'),
    customerName: [customer.firstName, customer.lastName].filter(Boolean).join(' ') || '—',
    ...(paidNowStored != null && { paidNowStored }),
  }
}

type TourMeta = {
  mainImage?: { asset?: { _ref?: string } }
  durationLabel?: string | null
  meetingPoint?: string | null
  quickFacts?: { startTime?: string | null; returnTime?: string | null }
  deposit?: { enabled?: boolean; type?: string; value?: number }
}

/** Bilet üzerinde gösterilecek ödenen tutar (Firestore paidNow veya kapora/tam ödeme mantığı). */
function resolvePaidAmountForTicket(
  totalPrice: number,
  status: string,
  paidNowStored: number | undefined,
  tourMeta: TourMeta | null
): number | null {
  if (typeof paidNowStored === 'number' && paidNowStored > 0) return paidNowStored
  const st = status.toLowerCase()
  if (st !== 'paid' && st !== 'confirmed') return null
  if (totalPrice <= 0) return null
  const dep = tourMeta?.deposit
  if (dep?.enabled && dep.value != null) {
    return dep.type === 'percentage' ? Math.round((totalPrice * dep.value) / 100) : Math.round(dep.value)
  }
  return totalPrice
}

async function getTourMeta(tourId: string): Promise<TourMeta | null> {
  if (!tourId) return null
  try {
    return await client.fetch<TourMeta | null>(tourImageAndPickupQuery, { tourId })
  } catch {
    return null
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export default async function BiletPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { bookingId } = await params
  const { token } = await searchParams

  const valid = await validateBookingAccessToken(bookingId, token)
  if (!valid) {
    return <AccessDenied />
  }

  const ticket = await getTicketData(bookingId)
  if (!ticket) notFound()

  const base = getSiteBaseUrl()
  const tokenForUrls = token ?? ''
  const tourMeta = await getTourMeta(ticket.tourId)
  const tourImageUrl =
    tourMeta?.mainImage?.asset != null
      ? urlFor(tourMeta.mainImage.asset).width(800).height(400).url()
      : null
  const meetingPoint = tourMeta?.meetingPoint?.trim() || ticket.meetingPoint
  const durationLabel = tourMeta?.durationLabel?.trim() || null

  const participants =
    [
      ticket.counts.adult > 0 && `${ticket.counts.adult} Yetişkin`,
      ticket.counts.child > 0 && `${ticket.counts.child} Çocuk`,
      ticket.counts.infant > 0 && `${ticket.counts.infant} Bebek`,
    ]
      .filter(Boolean)
      .join(', ') || '—'

  const dateFormatted = formatDate(ticket.date)
  const qrImageUrl =
    base && tokenForUrls
      ? `${base}/api/qr?bookingId=${encodeURIComponent(bookingId)}&token=${encodeURIComponent(tokenForUrls)}`
      : undefined
  const displayTime = ticket.time?.trim() || tourMeta?.quickFacts?.startTime?.trim() || undefined
  const arrivalTime = tourMeta?.quickFacts?.returnTime?.trim() || undefined
  const paidAmount = resolvePaidAmountForTicket(
    ticket.totalPrice,
    ticket.status,
    ticket.paidNowStored,
    tourMeta
  )
  const classDisplay =
    ticket.classId === 'first' && (ticket.firstClassLocas?.length ?? 0) > 0
      ? `${ticket.className} · Loca ${ticket.firstClassLocas!.join(', ')}`
      : ticket.className

  return (
    <BoardingPassTicket
      bookingId={ticket.bookingId}
      tourTitle={ticket.tourTitle}
      tourImageUrl={tourImageUrl}
      dateFormatted={dateFormatted}
      time={displayTime}
      arrivalTime={arrivalTime}
      durationLabel={durationLabel}
      meetingPoint={meetingPoint}
      customerName={ticket.customerName}
      participants={participants}
      className={classDisplay}
      totalPrice={ticket.totalPrice}
      currency={ticket.currency}
      paidAmount={paidAmount}
      status={ticket.status}
      manageUrl={manageBookingUrl(bookingId)}
      homeUrl={base ? `${base}/` : '/'}
      qrImageUrl={qrImageUrl}
    />
  )
}
