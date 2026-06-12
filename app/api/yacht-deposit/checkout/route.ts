import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { yachtDepositPageQuery } from '@/lib/queries'
import { rateLimitResponse } from '@/lib/rateLimit'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { generateBookingAccessToken } from '@/lib/bookingAccessToken'
import { normalizeDateOnly } from '@/lib/bookingsSupabase'
import {
  sanitizeMultilineText,
  sanitizePersonName,
  sanitizePhoneDisplay,
  sanitizeTourTitleText,
} from '@/lib/inputSanitize'
import { supabase } from '@/lib/supabase'
import { insertBookingWithColumnFallback } from '@/lib/supabaseInsertRetry'
import { buildPaymentFormFields, loadNestpayConfig } from '@/lib/nestpay/hash'
import { YACHT_DEPOSIT_TOUR_ID } from '@/lib/yachtDepositBooking'
import type { SiteLocale } from '@/lib/i18n/config'

export const dynamic = 'force-dynamic'

const CURRENCY = 'TRY'

async function loadDepositAmountFromSanity(): Promise<number> {
  const page = await client.fetch<{
    enabled?: boolean | null
    depositAmount?: number | null
    titleTop?: string | null
    titleBottom?: string | null
  } | null>(yachtDepositPageQuery, {}, { useCdn: false })

  if (!page || page.enabled === false) {
    throw new Error('DEPOSIT_PAGE_DISABLED')
  }
  const amount = Number(page.depositAmount)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('DEPOSIT_AMOUNT_INVALID')
  }
  return Math.round(amount)
}

function pageTitleForLocale(locale: SiteLocale): string {
  if (locale === 'en') return 'Private yacht charter deposit'
  if (locale === 'de') return 'Privater Yachtcharter — Anzahlung'
  return 'Özel tekne kapora'
}

export async function POST(request: Request) {
  try {
    const limited = await rateLimitResponse(request, 'booking')
    if (limited) return limited

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
    }

    const b = body as Record<string, unknown>
    const firstName = typeof b.firstName === 'string' ? sanitizePersonName(b.firstName, 80) : ''
    const lastName = typeof b.lastName === 'string' ? sanitizePersonName(b.lastName, 80) : ''
    const email =
      typeof b.email === 'string' ? b.email.trim().toLowerCase().slice(0, 254) : ''
    const phone = typeof b.phone === 'string' ? sanitizePhoneDisplay(b.phone, 48) : ''
    const charterDate =
      typeof b.charterDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.charterDate.trim())
        ? b.charterDate.trim()
        : null
    const termsAccepted = b.termsAccepted === true
    const yachtName =
      typeof b.yachtName === 'string' ? sanitizeTourTitleText(b.yachtName, 200) : ''
    const message =
      typeof b.message === 'string' ? sanitizeMultilineText(b.message, 2000) : ''
    const localeRaw = typeof b.locale === 'string' ? b.locale.trim() : 'tr'
    const locale: SiteLocale = localeRaw === 'en' ? 'en' : localeRaw === 'de' ? 'de' : 'tr'
    const turnstileToken = typeof b.turnstileToken === 'string' ? b.turnstileToken.trim() : ''

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json({ error: 'Ad, soyad, e-posta ve telefon zorunludur.' }, { status: 400 })
    }
    if (!charterDate) {
      return NextResponse.json(
        { error: locale === 'en' ? 'Please select a charter date.' : 'Kiralama tarihi seçilmelidir.' },
        { status: 400 }
      )
    }
    if (!termsAccepted) {
      return NextResponse.json(
        {
          error:
            locale === 'en'
              ? 'You must accept the distance sales agreement.'
              : 'Mesafeli satış sözleşmesini kabul etmeniz gerekir.',
        },
        { status: 400 }
      )
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Geçerli bir e-posta girin.' }, { status: 400 })
    }

    const secret = process.env.TURNSTILE_SECRET_KEY?.trim()
    if (secret) {
      if (!turnstileToken) {
        return NextResponse.json({ error: 'Doğrulama gerekli.' }, { status: 400 })
      }
      const forwarded = request.headers.get('x-forwarded-for')
      const verify = await verifyTurnstileToken(turnstileToken, {
        remoteip: forwarded?.split(',')[0]?.trim(),
      })
      if (!verify.success) {
        return NextResponse.json({ error: 'Doğrulama başarısız.' }, { status: 400 })
      }
    }

    const depositAmount = await loadDepositAmountFromSanity()
    const tourTitle = pageTitleForLocale(locale)
    const dateNorm = normalizeDateOnly(charterDate)

    const noteParts = [
      yachtName ? `Tekne: ${yachtName}` : null,
      message || null,
    ].filter(Boolean)
    const customerNote = noteParts.length ? noteParts.join('\n') : undefined

    const accessToken = generateBookingAccessToken()
    const insertPayload: Record<string, unknown> = {
      created_at: new Date().toISOString(),
      status: 'pending',
      // booking_source enum: web | manual | … — kapora tour_id ile ayırt edilir
      source: 'web',
      tour_id: YACHT_DEPOSIT_TOUR_ID,
      tour_title: tourTitle,
      date: dateNorm,
      class_id: 'deposit',
      class_name: locale === 'en' ? 'Yacht charter deposit' : 'Yat kiralama kapora',
      unit_price: depositAmount,
      total_price: depositAmount,
      paid_now: depositAmount,
      currency: CURRENCY,
      customer_first_name: firstName,
      customer_last_name: lastName,
      customer_email: email,
      customer_phone: phone,
      ...(customerNote ? { customer_note: customerNote } : {}),
      adult_count: 1,
      child_count: 0,
      infant_count: 0,
      access_token: accessToken,
      ui_locale: locale,
    }

    let inserted: { id: string }
    try {
      inserted = await insertBookingWithColumnFallback(async (payload) => {
        const { data, error } = await supabase
          .from('bookings')
          .insert(payload)
          .select('id')
          .single()
        return { data: data as { id: string } | null, error }
      }, insertPayload)
    } catch (insertErr) {
      console.error('[yacht-deposit/checkout] insert failed', insertErr)
      return NextResponse.json({ error: 'Kayıt oluşturulamadı.' }, { status: 500 })
    }

    const bookingId = String(inserted.id)
    let config
    try {
      config = loadNestpayConfig()
    } catch (err) {
      console.error('[yacht-deposit/checkout] NestPay config', err)
      return NextResponse.json({ error: 'Ödeme sistemi yapılandırılamadı.' }, { status: 500 })
    }

    const payment = buildPaymentFormFields(
      {
        bookingId,
        amount: depositAmount,
        customerName: `${firstName} ${lastName}`.trim(),
        customerEmail: email,
        lang: locale === 'en' ? 'en' : 'tr',
      },
      config
    )

    return NextResponse.json({
      action: payment.action,
      fields: payment.fields,
      bookingId,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'DEPOSIT_PAGE_DISABLED') {
      return NextResponse.json({ error: 'Kapora ödeme sayfası şu an kapalı.' }, { status: 403 })
    }
    if (msg === 'DEPOSIT_AMOUNT_INVALID') {
      return NextResponse.json({ error: 'Kapora tutarı yapılandırılmamış.' }, { status: 503 })
    }
    console.error('[yacht-deposit/checkout]', err)
    return NextResponse.json({ error: 'İşlem tamamlanamadı.' }, { status: 500 })
  }
}
