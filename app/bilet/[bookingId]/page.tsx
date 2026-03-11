import { notFound } from 'next/navigation'
import { getFirestore } from '@/lib/firebaseAdmin'
import { client, urlFor } from '@/lib/sanity'
import { tourImageAndPickupQuery } from '@/lib/queries'
import { voucherPdfUrl, manageBookingUrl, getSiteBaseUrl } from '@/lib/siteUrls'
import BoardingPassTicket from '@/components/boarding-pass/BoardingPassTicket'

const COLLECTION = 'bookings'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type TicketData = {
  bookingId: string
  tourId: string
  tourTitle: string
  date: string
  time?: string
  meetingPoint: string
  counts: { adult: number; child: number; infant: number }
  className: string
  totalPrice: number
  currency: string
  status: string
  customerName: string
}

async function getTicketData(bookingId: string): Promise<TicketData | null> {
  const db = getFirestore()
  const snap = await db.collection(COLLECTION).doc(bookingId).get()
  if (!snap.exists) return null
  const d = snap.data()!
  const customer = (d.customer ?? {}) as Record<string, string>
  const counts = (d.counts ?? { adult: 0, child: 0, infant: 0 }) as { adult: number; child: number; infant: number }
  const tourId = typeof d.tourId === 'string' ? d.tourId.trim() : ''
  return {
    bookingId: snap.id,
    tourId,
    tourTitle: String(d.tourTitle ?? '—'),
    date: String(d.date ?? ''),
    time: d.time != null ? String(d.time) : undefined,
    meetingPoint: String((d as Record<string, unknown>).meetingPoint ?? 'Çeşme Marina'),
    counts: { adult: counts.adult ?? 0, child: counts.child ?? 0, infant: counts.infant ?? 0 },
    className: String(d.className ?? '—'),
    totalPrice: Number(d.totalPrice ?? 0),
    currency: String(d.currency ?? 'TRY'),
    status: String(d.status ?? 'pending'),
    customerName: [customer.firstName, customer.lastName].filter(Boolean).join(' ') || '—',
  }
}

type TourMeta = {
  mainImage?: { asset?: { _ref?: string } }
  durationLabel?: string | null
  meetingPoint?: string | null
  quickFacts?: { startTime?: string | null }
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
}: {
  params: Promise<{ bookingId: string }>
}) {
  const { bookingId } = await params
  const ticket = await getTicketData(bookingId)
  if (!ticket) notFound()

  const base = getSiteBaseUrl()
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
  const qrImageUrl = base ? `${base}/api/qr?bookingId=${encodeURIComponent(bookingId)}` : undefined
  const displayTime = ticket.time?.trim() || tourMeta?.quickFacts?.startTime?.trim() || undefined

  return (
    <BoardingPassTicket
      bookingId={ticket.bookingId}
      tourTitle={ticket.tourTitle}
      tourImageUrl={tourImageUrl}
      dateFormatted={dateFormatted}
      time={displayTime}
      durationLabel={durationLabel}
      meetingPoint={meetingPoint}
      customerName={ticket.customerName}
      participants={participants}
      className={ticket.className}
      totalPrice={ticket.totalPrice}
      currency={ticket.currency}
      status={ticket.status}
      pdfDownloadUrl={voucherPdfUrl(bookingId, true)}
      manageUrl={manageBookingUrl(bookingId)}
      homeUrl={base ? `${base}/` : '/'}
      qrImageUrl={qrImageUrl}
    />
  )
}
