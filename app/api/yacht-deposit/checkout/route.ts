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
import { getYachtDepositApiMessages } from '@/lib/yachtDepositDefaults'
import {
  buildYachtDepositCharterConfig,
  formatDepositCharterDateSummary,
  type YachtDepositYachtRef,
} from '@/lib/yachtDepositCharter'

export const dynamic = 'force-dynamic'

const CURRENCY = 'TRY'

type DepositPageConfig = {
  enabled?: boolean | null
  depositAmount?: number | null
  charterDateStart?: string | null
  charterDateEnd?: string | null
  yacht?: YachtDepositYachtRef | null
}

async function loadDepositPageFromSanity(): Promise<{
  amount: number
  charter: ReturnType<typeof buildYachtDepositCharterConfig>
}> {
  const page = await client.fetch<DepositPageConfig | null>(
    yachtDepositPageQuery,
    {},
    { useCdn: false }
  )

  if (!page || page.enabled === false) {
    throw new Error('DEPOSIT_PAGE_DISABLED')
  }
  const amount = Number(page.depositAmount)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('DEPOSIT_AMOUNT_INVALID')
  }

  const charter = buildYachtDepositCharterConfig(
    page.yacht,
    page.charterDateStart,
    page.charterDateEnd,
    'tr'
  )

  return { amount: Math.round(amount), charter }
}

function pageTitleForLocale(locale: SiteLocale): string {
  if (locale === 'en') return 'Private yacht charter deposit'
  if (locale === 'de') return 'Privater Yachtcharter — Anzahlung'
  return 'Özel tekne kapora'
}

export async function POST(request: Request) {
  let locale: SiteLocale = 'tr'
  try {
    const limited = await rateLimitResponse(request, 'booking')
    if (limited) return limited

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: getYachtDepositApiMessages(locale).invalidRequest }, { status: 400 })
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: getYachtDepositApiMessages(locale).invalidRequest }, { status: 400 })
    }

    const b = body as Record<string, unknown>
    const localeRaw = typeof b.locale === 'string' ? b.locale.trim() : 'tr'
    locale = localeRaw === 'en' ? 'en' : localeRaw === 'de' ? 'de' : 'tr'
    const api = getYachtDepositApiMessages(locale)
    const firstName = typeof b.firstName === 'string' ? sanitizePersonName(b.firstName, 80) : ''
    const lastName = typeof b.lastName === 'string' ? sanitizePersonName(b.lastName, 80) : ''
    const email =
      typeof b.email === 'string' ? b.email.trim().toLowerCase().slice(0, 254) : ''
    const phone = typeof b.phone === 'string' ? sanitizePhoneDisplay(b.phone, 48) : ''
    const charterDate =
      typeof b.charterDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.charterDate.trim())
        ? b.charterDate.trim()
        : null
    const charterDateEnd =
      typeof b.charterDateEnd === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.charterDateEnd.trim())
        ? b.charterDateEnd.trim()
        : null
    const yachtId = typeof b.yachtId === 'string' ? b.yachtId.trim() : ''
    const yachtSlug = typeof b.yachtSlug === 'string' ? b.yachtSlug.trim() : ''
    const yachtName =
      typeof b.yachtName === 'string' ? sanitizeTourTitleText(b.yachtName, 200) : ''
    const termsAccepted = b.termsAccepted === true
    const message =
      typeof b.message === 'string' ? sanitizeMultilineText(b.message, 2000) : ''
    const turnstileToken = typeof b.turnstileToken === 'string' ? b.turnstileToken.trim() : ''

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json({ error: api.requiredFields }, { status: 400 })
    }
    if (!termsAccepted) {
      return NextResponse.json({ error: api.termsRequired }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: api.invalidEmail }, { status: 400 })
    }

    const secret = process.env.TURNSTILE_SECRET_KEY?.trim()
    if (secret) {
      if (!turnstileToken) {
        return NextResponse.json({ error: api.turnstileRequired }, { status: 400 })
      }
      const forwarded = request.headers.get('x-forwarded-for')
      const verify = await verifyTurnstileToken(turnstileToken, {
        remoteip: forwarded?.split(',')[0]?.trim(),
      })
      if (!verify.success) {
        return NextResponse.json({ error: api.turnstileFailed }, { status: 400 })
      }
    }

    const { amount: depositAmount, charter: sanityCharter } =
      await loadDepositPageFromSanity()

    const resolvedCharterDate = sanityCharter?.charterDateStart ?? charterDate
    const resolvedCharterEnd = sanityCharter?.charterDateEnd ?? charterDateEnd
    const resolvedYachtName = sanityCharter?.yachtName ?? yachtName
    const resolvedYachtSlug = sanityCharter?.yachtSlug ?? yachtSlug

    if (sanityCharter) {
      if (charterDate && charterDate !== sanityCharter.charterDateStart) {
        return NextResponse.json({ error: api.charterMismatch }, { status: 400 })
      }
      if (yachtId && yachtId !== sanityCharter.yachtId) {
        return NextResponse.json({ error: api.yachtMismatch }, { status: 400 })
      }
    }

    if (!resolvedCharterDate) {
      return NextResponse.json({ error: api.charterDateRequired }, { status: 400 })
    }

    const tourTitle = resolvedYachtName
      ? `${resolvedYachtName} — ${pageTitleForLocale(locale)}`
      : pageTitleForLocale(locale)
    const dateNorm = normalizeDateOnly(resolvedCharterDate)

    const noteParts = [
      resolvedYachtName ? `${api.noteYachtPrefix}: ${resolvedYachtName}` : null,
      resolvedCharterEnd
        ? `${api.noteDateRangePrefix}: ${formatDepositCharterDateSummary(resolvedCharterDate, resolvedCharterEnd, locale)}`
        : null,
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
      class_id: resolvedYachtSlug || 'deposit',
      class_name:
        locale === 'tr'
          ? resolvedYachtName
            ? `${resolvedYachtName} — kapora`
            : 'Yat kiralama kapora'
          : resolvedYachtName
            ? `${resolvedYachtName} — deposit`
            : 'Yacht charter deposit',
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
      return NextResponse.json({ error: api.recordFailed }, { status: 500 })
    }

    const bookingId = String(inserted.id)
    let config
    try {
      config = loadNestpayConfig()
    } catch (err) {
      console.error('[yacht-deposit/checkout] NestPay config', err)
      return NextResponse.json({ error: api.paymentConfigFailed }, { status: 500 })
    }

    const payment = buildPaymentFormFields(
      {
        bookingId,
        amount: depositAmount,
        customerName: `${firstName} ${lastName}`.trim(),
        customerEmail: email,
        lang: locale === 'tr' ? 'tr' : 'en',
      },
      config
    )

    return NextResponse.json({
      action: payment.action,
      fields: payment.fields,
      bookingId,
    })
  } catch (err) {
    const api = getYachtDepositApiMessages(locale)
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'DEPOSIT_PAGE_DISABLED') {
      return NextResponse.json({ error: api.pageDisabled }, { status: 403 })
    }
    if (msg === 'DEPOSIT_AMOUNT_INVALID') {
      return NextResponse.json({ error: api.amountInvalid }, { status: 503 })
    }
    console.error('[yacht-deposit/checkout]', err)
    return NextResponse.json({ error: api.genericFailed }, { status: 500 })
  }
}
