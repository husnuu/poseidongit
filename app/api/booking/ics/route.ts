import { NextRequest, NextResponse } from 'next/server'
import { rateLimitResponse } from '@/lib/rateLimit'
import { validateBookingAccessToken } from '@/lib/bookingAccessToken'
import { buildIcsFile } from '@/lib/icsCalendar'
import { supabase } from '@/lib/supabase'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/booking/ics?bookingId=&token= — Apple/Outlook takvimi için .ics dosyası indirir. */
export async function GET(request: NextRequest) {
  try {
    const limited = await rateLimitResponse(request, 'qr')
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')?.trim()
    const token = searchParams.get('token')?.trim()

    if (!bookingId || !token) {
      return NextResponse.json({ error: 'bookingId ve token gerekli' }, { status: 400 })
    }

    const valid = await validateBookingAccessToken(bookingId, token)
    if (!valid) {
      return NextResponse.json({ error: 'Forbidden. Valid token required.' }, { status: 403 })
    }

    const { data, error } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle()
    if (error || !data) {
      return NextResponse.json({ error: 'Rezervasyon bulunamadı' }, { status: 404 })
    }
    const row = data as SupabaseBookingRow
    const dateStr = String(row.date ?? '')
    if (!dateStr) {
      return NextResponse.json({ error: 'Rezervasyon tarihi eksik' }, { status: 400 })
    }

    const reference = (typeof row.reference === 'string' && row.reference.trim()) || row.id.slice(0, 8).toUpperCase()
    const meetingPoint = typeof row.meeting_point === 'string' ? row.meeting_point : undefined

    const ics = buildIcsFile({
      uid: `${row.id}@cesmetekneturu.net`,
      title: String(row.tour_title ?? 'Tekne Turu'),
      date: dateStr,
      time: row.time != null ? String(row.time) : undefined,
      durationHours: 2,
      location: meetingPoint,
      description: `Rezervasyon no: ${reference}`,
    })

    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="rezervasyon-${reference}.ics"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (e) {
    console.error('[booking/ics] Error:', e)
    return NextResponse.json({ error: 'Takvim dosyası oluşturulamadı' }, { status: 500 })
  }
}
