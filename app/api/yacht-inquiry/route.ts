import { NextResponse } from 'next/server'
import { rateLimitResponse } from '@/lib/rateLimit'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { sendYachtInquiryEmail } from '@/lib/email'
import { overnightNights } from '@/lib/yachtRentalModes'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function parseMissingColumnFromSupabaseError(message: string): string | null {
  const m = message.match(/Could not find the '([^']+)' column of 'yacht_inquiries'/i)
  return m?.[1] ?? null
}

function parseBody(body: unknown): {
  yachtSlug?: string
  yachtName?: string
  location?: string
  rentalType?: 'daily' | 'overnight'
  date?: string
  checkIn?: string
  checkOut?: string
  nights?: number
  guestCount?: number
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  message?: string
  priceFrom?: number
  currency?: string
  turnstileToken?: string
} | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const yachtSlug = typeof b.yachtSlug === 'string' ? b.yachtSlug.trim() : undefined
  const yachtName = typeof b.yachtName === 'string' ? b.yachtName.trim() : undefined
  const location = typeof b.location === 'string' ? b.location.trim() || undefined : undefined
  const rentalTypeRaw = typeof b.rentalType === 'string' ? b.rentalType.trim() : undefined
  const rentalType =
    rentalTypeRaw === 'overnight' ? 'overnight' : rentalTypeRaw === 'daily' ? 'daily' : undefined
  const date = typeof b.date === 'string' ? b.date.trim().slice(0, 10) : undefined
  const checkIn = typeof b.checkIn === 'string' ? b.checkIn.trim().slice(0, 10) : undefined
  const checkOut = typeof b.checkOut === 'string' ? b.checkOut.trim().slice(0, 10) : undefined
  let nights: number | undefined =
    typeof b.nights === 'number'
      ? b.nights
      : typeof b.nights === 'string'
        ? parseInt(b.nights, 10)
        : undefined
  if (nights != null && Number.isNaN(nights)) nights = undefined
  const guestCount =
    typeof b.guestCount === 'number'
      ? b.guestCount
      : typeof b.guestCount === 'string'
        ? parseInt(b.guestCount, 10)
        : undefined
  const firstName = typeof b.firstName === 'string' ? b.firstName.trim() : undefined
  const lastName = typeof b.lastName === 'string' ? b.lastName.trim() : undefined
  const email = typeof b.email === 'string' ? b.email.trim() : undefined
  const phone = typeof b.phone === 'string' ? b.phone.trim() : undefined
  const message = typeof b.message === 'string' ? b.message.trim() : undefined
  const priceFrom =
    typeof b.priceFrom === 'number'
      ? b.priceFrom
      : typeof b.priceFrom === 'string'
        ? parseFloat(b.priceFrom)
        : undefined
  const currency = typeof b.currency === 'string' ? b.currency.trim() : undefined
  const turnstileToken = typeof b.turnstileToken === 'string' ? b.turnstileToken.trim() : undefined
  return {
    yachtSlug,
    yachtName,
    location,
    rentalType,
    date,
    checkIn,
    checkOut,
    nights,
    guestCount,
    firstName,
    lastName,
    email,
    phone,
    message,
    priceFrom: Number.isFinite(priceFrom) ? priceFrom : undefined,
    currency,
    turnstileToken,
  }
}

async function saveToSupabase(data: Record<string, unknown>) {
  let payload: Record<string, unknown> = {
    yacht_slug: data.yachtSlug,
    yacht_name: data.yachtName,
    location: data.location ?? null,
    rental_type: data.rentalType,
    date: data.date,
    check_in: data.checkIn ?? null,
    check_out: data.checkOut ?? null,
    nights: data.nights ?? null,
    guest_count: data.guestCount,
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    phone: data.phone,
    message: data.message,
    price_from: data.priceFrom ?? null,
    currency: data.currency ?? null,
    status: 'new',
    source: 'web',
    is_read: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { error } = await supabase.from('yacht_inquiries').insert(payload)
    if (!error) return
    const missingColumn = parseMissingColumnFromSupabaseError(error.message)
    if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
      delete payload[missingColumn]
      continue
    }
    throw new Error(`Supabase yacht inquiry insert failed: ${error.message}`)
  }
  throw new Error('Supabase yacht inquiry insert failed: schema mismatch')
}

export async function POST(request: Request) {
  try {
    const limited = await rateLimitResponse(request, 'publicForm')
    if (limited) return limited

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
    }

    const data = parseBody(body)
    if (!data) {
      return NextResponse.json({ error: 'Geçersiz veri.' }, { status: 400 })
    }

    const {
      yachtSlug,
      yachtName,
      location,
      rentalType,
      date,
      checkIn,
      checkOut,
      nights: nightsBody,
      guestCount,
      firstName,
      lastName,
      email,
      phone,
      message,
      priceFrom,
      currency,
      turnstileToken,
    } = data

    if (!yachtSlug || !yachtName) {
      return NextResponse.json({ error: 'Yat bilgisi eksik.' }, { status: 400 })
    }

    const mode = rentalType === 'overnight' ? 'overnight' : 'daily'

    if (mode === 'daily') {
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'Geçerli bir tarih seçin.' }, { status: 400 })
      }
    } else {
      if (!checkIn || !checkOut || !/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
        return NextResponse.json({ error: 'Giriş ve ayrılış tarihlerini seçin.' }, { status: 400 })
      }
      const n = overnightNights(checkIn, checkOut)
      if (n < 1) {
        return NextResponse.json({ error: 'Konaklama en az 1 gece olmalıdır.' }, { status: 400 })
      }
      if (nightsBody != null && nightsBody !== n) {
        return NextResponse.json({ error: 'Gece sayısı tarihlerle uyuşmuyor.' }, { status: 400 })
      }
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Geçerli bir tarih seçin.' }, { status: 400 })
    }

    if (typeof guestCount !== 'number' || Number.isNaN(guestCount) || guestCount < 1 || guestCount > 120) {
      return NextResponse.json({ error: 'Misafir sayısı geçersiz.' }, { status: 400 })
    }
    if (!firstName || firstName.length < 1) {
      return NextResponse.json({ error: 'Ad gerekli.' }, { status: 400 })
    }
    if (!lastName || lastName.length < 1) {
      return NextResponse.json({ error: 'Soyad gerekli.' }, { status: 400 })
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Geçerli e-posta girin.' }, { status: 400 })
    }
    if (!phone || phone.length < 7) {
      return NextResponse.json({ error: 'Geçerli telefon girin.' }, { status: 400 })
    }
    if (!message || message.length < 5) {
      return NextResponse.json({ error: 'Mesaj çok kısa.' }, { status: 400 })
    }

    const hasTurnstileSecret = Boolean(process.env.TURNSTILE_SECRET_KEY?.trim())
    if (hasTurnstileSecret && !turnstileToken) {
      return NextResponse.json({ error: 'Lütfen doğrulama kutusunu işaretleyin.' }, { status: 400 })
    }
    if (hasTurnstileSecret && turnstileToken) {
      const verifyResult = await verifyTurnstileToken(turnstileToken, {
        remoteip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      })
      if (!verifyResult.success) {
        console.warn('[yacht-inquiry] Turnstile:', verifyResult['error-codes'])
        return NextResponse.json({ error: 'Doğrulama başarısız.' }, { status: 400 })
      }
    }

    const nightsComputed = mode === 'overnight' && checkIn && checkOut ? overnightNights(checkIn, checkOut) : undefined

    const payload: Record<string, unknown> = {
      yachtSlug,
      yachtName,
      rentalType: mode,
      date,
      guestCount,
      firstName,
      lastName,
      email,
      phone,
      message,
    }
    if (location) payload.location = location
    if (mode === 'overnight' && checkIn && checkOut && nightsComputed != null) {
      payload.checkIn = checkIn
      payload.checkOut = checkOut
      payload.nights = nightsComputed
    }
    if (priceFrom != null && Number.isFinite(priceFrom)) payload.priceFrom = priceFrom
    if (currency) payload.currency = currency

    await saveToSupabase(payload)

    const emailSummaryDate =
      mode === 'overnight' && checkIn && checkOut && nightsComputed != null
        ? `${checkIn} → ${checkOut} (${nightsComputed} gece)`
        : date

    const { ok, error: mailError } = await sendYachtInquiryEmail({
      yachtName,
      yachtSlug,
      location,
      rentalType: mode,
      date,
      checkIn: mode === 'overnight' ? checkIn : undefined,
      checkOut: mode === 'overnight' ? checkOut : undefined,
      nights: mode === 'overnight' ? nightsComputed : undefined,
      summaryLine: emailSummaryDate,
      guestCount,
      firstName,
      lastName,
      email,
      phone,
      message,
      priceFrom: priceFrom != null && Number.isFinite(priceFrom) ? priceFrom : undefined,
      currency,
    })
    if (!ok) {
      return NextResponse.json(
        { error: mailError ?? 'Talep kaydedilemedi. Lütfen daha sonra tekrar deneyin.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.',
    })
  } catch (e) {
    console.error('[yacht-inquiry] POST:', e)
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 })
  }
}
