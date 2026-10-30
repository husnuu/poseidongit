import { NextRequest, NextResponse } from 'next/server'
import { renderTicketImage, type TicketImageData } from '@/lib/ticket/ticketImage'
import { siteLogoPngUrl } from '@/lib/ticket/siteLogoPng'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Yalnızca geliştirme: örnek veriyle WhatsApp bilet görseli (tasarım kontrolü). */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const lang = request.nextUrl.searchParams.get('lang') ?? 'tr'
  const locale = (['tr', 'en', 'de', 'ru'].includes(lang) ? lang : 'tr') as TicketImageData['locale']
  return renderTicketImage({
    locale,
    tourTitle: 'Çeşme Adalar & Koylar Turu – Öğle Yemeği Dahil',
    passengerName: 'Ayşe Yılmaz',
    dateLabel: 'Cumartesi, 18 Ekim',
    time: '10:50',
    boardingTime: '10:20',
    meetingPoint: 'Çeşme Sahil',
    className: 'Eco',
    guests: '2 Yetişkin, 1 Çocuk',
    reservationCode: 'A1B2C3D4E5',
    qrPayload: 'https://cesmetekneturu.net/api/voucher/access?bookingId=sample&token=sample',
    total: 5000,
    paid: 1000,
    currency: 'TRY',
    logoUrl: await siteLogoPngUrl(),
  })
}
