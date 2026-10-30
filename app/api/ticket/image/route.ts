import { NextRequest, NextResponse } from 'next/server'
import { validateBookingAccessToken } from '@/lib/bookingAccessToken'
import { buildVoucherDataFromBookingRow } from '@/lib/voucher/buildVoucherDataFromBookingSnapshot'
import { formatParticipantCountsLine } from '@/lib/i18n/bookingFlowLocale'
import { rateLimitResponse } from '@/lib/rateLimit'
import { renderTicketImage } from '@/lib/ticket/ticketImage'
import { buildWaBookingContext, loadBookingRow } from '@/lib/whatsapp/bookingContext'
import { siteLogoPngUrl } from '@/lib/ticket/siteLogoPng'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/ticket/image?bookingId=…&token=…
 * Rezervasyona özel PNG bilet (WhatsApp onay mesajının görseli).
 * Erişim: rezervasyonun gizli erişim anahtarı (bilet sayfasıyla aynı).

 * Tasarım kontrolü için örnek: /api/ticket/image/sample (yalnızca geliştirme).
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams

  const limited = await rateLimitResponse(request, 'voucherPdf')
  if (limited) return limited

  const bookingId = sp.get('bookingId')?.trim() ?? ''
  const token = (sp.get('token') ?? '').trim().replace(/ /g, '+')
  if (!bookingId || !token || !(await validateBookingAccessToken(bookingId, token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const row = await loadBookingRow(bookingId)
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const [ctx, voucher, logoUrl] = await Promise.all([
      buildWaBookingContext(row),
      buildVoucherDataFromBookingRow(bookingId, row, token),
      siteLogoPngUrl(),
    ])
    if (!ctx || !voucher) return NextResponse.json({ error: 'Ticket data unavailable' }, { status: 500 })

    const loca = Array.isArray(row.first_class_locas) && row.first_class_locas.length > 0
      ? row.first_class_locas.join(', ')
      : row.first_class_loca ?? ''
    const total = Number(row.total_price ?? 0)
    const paid = Number(row.paid_now ?? 0)
    const img = await renderTicketImage({
      locale: ctx.locale,
      tourTitle: ctx.tourTitle,
      passengerName: `${row.customer_first_name ?? ''} ${row.customer_last_name ?? ''}`.trim() || '—',
      dateLabel: ctx.dateLabel,
      time: ctx.time,
      boardingTime: ctx.boardingTime,
      meetingPoint: ctx.meetingPoint,
      className: row.class_name ? `${row.class_name}${loca ? ` · ${loca}` : ''}` : null,
      guests: formatParticipantCountsLine(
        { adult: Number(row.adult_count ?? 0), child: Number(row.child_count ?? 0), infant: Number(row.infant_count ?? 0) },
        ctx.locale
      ),
      reservationCode: ctx.reservationCode,
      qrPayload: voucher.bookingUrl,
      total,
      paid: Number.isFinite(paid) ? paid : 0,
      currency: (row.currency ?? 'TRY').toString().toUpperCase(),
      logoUrl,
    })
    img.headers.set('Cache-Control', 'private, max-age=300')
    return img
  } catch (e) {
    console.error('[ticket/image] failed', e)
    return NextResponse.json({ error: 'Ticket image failed' }, { status: 500 })
  }
}
