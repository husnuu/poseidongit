import { NextRequest, NextResponse } from 'next/server'
import { rateLimitResponse } from '@/lib/rateLimit'
import { supabase } from '@/lib/supabase'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { additionalTravelerSlotCount, normalizeAdditionalTravelersFromStorage } from '@/lib/bookingAdditionalTravelers'
import { sanitizePersonName } from '@/lib/inputSanitize'
import { sendBookingUpdatedEmails } from '@/lib/email'
import { normalizeBookingFlowLocale } from '@/lib/i18n/bookingFlowLocale'

/**
 * POST /api/booking/update-guests
 * Body: { bookingId, email, firstName, lastName, additionalTravelers: [{firstName, lastName}, ...] }
 *
 * Müşteri kendi rezervasyonundaki ad-soyad bilgilerini düzenleyebilir; ayrıca web
 * dışında (manuel/telefon) oluşturulmuş ve ek yolcu adları hiç girilmemiş
 * rezervasyonlarda eksik isimleri tamamlayabilir. Ödenen kişi sayısı (adult/child/
 * infant) burada değiştirilmez — sadece isimler.
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const limited = await rateLimitResponse(request, 'bookingAction')
    if (limited) return limited

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
    }
    const bookingId = typeof body.bookingId === 'string' ? body.bookingId.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const firstName = typeof body.firstName === 'string' ? sanitizePersonName(body.firstName, 80) : ''
    const lastName = typeof body.lastName === 'string' ? sanitizePersonName(body.lastName, 80) : ''
    const rawTravelers = Array.isArray(body.additionalTravelers) ? body.additionalTravelers : []

    if (!bookingId || !email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'bookingId, email, ad ve soyad gerekli' },
        { status: 400 }
      )
    }

    const { data: currentBooking, error: currentBookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()
    if (currentBookingError || !currentBooking) {
      return NextResponse.json({ error: 'Rezervasyon bulunamadı' }, { status: 404 })
    }

    const row = currentBooking as SupabaseBookingRow
    if (row.status === 'cancelled') {
      return NextResponse.json({ error: 'İptal edilmiş rezervasyonun bilgileri düzenlenemez.' }, { status: 400 })
    }

    const bookingEmail = String(row.customer_email ?? '').trim().toLowerCase()
    if (bookingEmail !== email) {
      return NextResponse.json({ error: 'Bu e-posta adresi bu rezervasyona ait değil' }, { status: 403 })
    }

    const counts = {
      adult: Number(row.adult_count ?? 0),
      child: Number(row.child_count ?? 0),
      infant: Number(row.infant_count ?? 0),
    }
    const requiredSlots = additionalTravelerSlotCount(counts)
    if (rawTravelers.length !== requiredSlots) {
      return NextResponse.json(
        { error: `Rezervasyondaki misafir sayısına göre ${requiredSlots} yolcu adı girilmelidir.` },
        { status: 400 }
      )
    }

    const sanitizedTravelers: { firstName: string; lastName: string }[] = []
    for (const t of rawTravelers) {
      if (!t || typeof t !== 'object') {
        return NextResponse.json({ error: 'Geçersiz yolcu bilgisi' }, { status: 400 })
      }
      const tFirst = typeof (t as Record<string, unknown>).firstName === 'string'
        ? sanitizePersonName((t as Record<string, unknown>).firstName as string, 80)
        : ''
      const tLast = typeof (t as Record<string, unknown>).lastName === 'string'
        ? sanitizePersonName((t as Record<string, unknown>).lastName as string, 80)
        : ''
      if (!tFirst || !tLast) {
        return NextResponse.json({ error: 'Tüm yolcular için ad ve soyad girilmelidir.' }, { status: 400 })
      }
      sanitizedTravelers.push({ firstName: tFirst, lastName: tLast })
    }

    // Mevcut yemek tercihi / cinsiyet bilgisi korunur — burada yalnızca isimler değişir.
    const existingTravelers = normalizeAdditionalTravelersFromStorage(row.additional_travelers)
    const mergedTravelers = sanitizedTravelers.map((t, i) => ({
      firstName: t.firstName,
      lastName: t.lastName,
      ...(existingTravelers[i]?.mealPreference && { mealPreference: existingTravelers[i].mealPreference }),
      ...(existingTravelers[i]?.gender && { gender: existingTravelers[i].gender }),
    }))

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        customer_first_name: firstName,
        customer_last_name: lastName,
        additional_travelers: mergedTravelers,
      })
      .eq('id', bookingId)
    if (updateError) {
      throw new Error(`Supabase update-guests failed: ${updateError.message}`)
    }

    const summaryLocale = normalizeBookingFlowLocale(row.ui_locale)
    const nameLabel = summaryLocale === 'en' ? 'Full name' : summaryLocale === 'de' ? 'Name' : 'Ad Soyad'
    const otherTravelersLabel = summaryLocale === 'en' ? 'Other travelers' : summaryLocale === 'de' ? 'Weitere Reisende' : 'Diğer yolcular'
    const changeSummary = [
      `${nameLabel}: ${firstName} ${lastName}`,
      mergedTravelers.length > 0
        ? `${otherTravelersLabel}: ${mergedTravelers.map((t) => `${t.firstName} ${t.lastName}`).join(', ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n')
    await sendBookingUpdatedEmails({
      bookingId,
      tourTitle: String(row.tour_title ?? ''),
      date: String(row.date ?? ''),
      time: row.time ?? undefined,
      customer: { firstName, lastName, email: row.customer_email ?? email },
      changeSummary,
      siteLocale: summaryLocale,
      accessToken: typeof row.access_token === 'string' ? row.access_token : undefined,
    })

    return NextResponse.json({
      ok: true,
      message: 'Misafir bilgileri güncellendi.',
      firstName,
      lastName,
      additionalTravelers: mergedTravelers,
    })
  } catch (e) {
    console.error('[booking update-guests]', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
