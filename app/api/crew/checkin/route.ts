import { NextResponse } from 'next/server'
import { rateLimitResponse } from '@/lib/rateLimit'
import { requireCrewSession } from '@/lib/crew/crewSession'
import { supabase } from '@/lib/supabase'
import { normalizeMealPreferenceColumn, type SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { normalizeAdditionalTravelersFromStorage } from '@/lib/bookingAdditionalTravelers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
}

/** QR, /api/voucher/access?bookingId=...&token=... URL'i olarak encode edilir; kod alanı ham UUID/referans da olabilir. */
function extractBookingLookupKey(raw: string): string {
  const s = raw.trim()
  if (!s) return s
  try {
    const url = new URL(s)
    const fromQuery = url.searchParams.get('bookingId')
    if (fromQuery) return fromQuery.trim()
  } catch {
    // düz metin / referans kodu — olduğu gibi kullan
  }
  return s
}

async function findBookingRow(code: string): Promise<SupabaseBookingRow | null> {
  if (isUuid(code)) {
    const { data } = await supabase.from('bookings').select('*').eq('id', code).maybeSingle()
    if (data) return data as SupabaseBookingRow
  }
  const { data } = await supabase.from('bookings').select('*').eq('reference', code).maybeSingle()
  return (data as SupabaseBookingRow | null) ?? null
}

export async function POST(request: Request) {
  const limited = await rateLimitResponse(request, 'crewAction')
  if (limited) return limited

  if (!(await requireCrewSession(request))) {
    return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }
  const b = (body ?? {}) as Record<string, unknown>
  const rawCode = typeof b.code === 'string' ? b.code : ''
  const action = b.action === 'undo' ? 'undo' : 'board'
  const code = extractBookingLookupKey(rawCode)
  if (!code) {
    return NextResponse.json({ error: 'Kod okunamadı' }, { status: 400 })
  }

  const row = await findBookingRow(code)
  if (!row) {
    return NextResponse.json({ error: 'Rezervasyon bulunamadı' }, { status: 404 })
  }
  if (row.status === 'cancelled') {
    return NextResponse.json({ error: 'Bu rezervasyon iptal edilmiş' }, { status: 409 })
  }
  if (row.status !== 'paid' && row.status !== 'confirmed') {
    return NextResponse.json({ error: 'Bu rezervasyon onaylı değil (ödeme bekleniyor)' }, { status: 409 })
  }

  const checkedInAt = action === 'board' ? new Date().toISOString() : null
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ checked_in_at: checkedInAt })
    .eq('id', row.id)
  if (updateError) {
    return NextResponse.json({ error: 'Güncellenemedi' }, { status: 500 })
  }

  const mealPreference = normalizeMealPreferenceColumn(row.meal_preference)
  const additionalTravelers = normalizeAdditionalTravelersFromStorage(row.additional_travelers)
  const mealTally = new Map<string, number>()
  if (mealPreference?.label) mealTally.set(mealPreference.label, (mealTally.get(mealPreference.label) ?? 0) + 1)
  for (const t of additionalTravelers) {
    if (t.mealPreference?.label) {
      mealTally.set(t.mealPreference.label, (mealTally.get(t.mealPreference.label) ?? 0) + 1)
    }
  }
  const guestCount =
    Number(row.adult_count ?? 0) + Number(row.child_count ?? 0) + Number(row.infant_count ?? 0)

  return NextResponse.json({
    ok: true,
    booking: {
      id: row.id,
      reference: (typeof row.reference === 'string' && row.reference.trim()) || row.id.slice(0, 8).toUpperCase(),
      passengerName:
        [row.customer_first_name, row.customer_last_name].filter(Boolean).join(' ').trim() || '—',
      tourTitle: String(row.tour_title ?? '—'),
      className: String(row.class_name ?? '').trim(),
      time: row.time ?? null,
      guestCount,
      boarded: action === 'board',
      mealCounts: Array.from(mealTally.entries()).map(([label, count]) => ({ label, count })),
    },
  })
}
