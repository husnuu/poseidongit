import { generateBookingAccessToken } from '@/lib/bookingAccessToken'
import { normalizeAdditionalTravelersFromStorage } from '@/lib/bookingAdditionalTravelers'
import { computeDepositAmounts } from '@/lib/bookingDepositAmount'
import { sendBookingPaidEmails, sendYachtDepositPaidEmails } from '@/lib/email'
import { client, urlFor } from '@/lib/sanity'
import { tourImageAndPickupQuery, siteSettingsQuery } from '@/lib/queries'
import { getBaseUrl } from '@/lib/seo'
import { supabase } from '@/lib/supabase'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { isYachtDepositBooking } from '@/lib/yachtDepositBooking'
import { yachtDepositBookingLocale } from '@/lib/yachtDepositDefaults'

/**
 * Rezervasyon `paid` olduktan sonra: paid_now / access_token tamamlama ve müşteri + operasyon e-postaları.
 * Admin panel PATCH ile ödeme callback’i aynı yan etkileri paylaşır.
 */
export async function runBookingPaidEmailSideEffects(
  bookingId: string,
  data: SupabaseBookingRow
): Promise<void> {
  if (isYachtDepositBooking(data)) {
    const paidNow = Number(data.paid_now ?? data.total_price ?? 0)
    const locale = yachtDepositBookingLocale(
      typeof data.ui_locale === 'string' ? data.ui_locale : null
    )
    await sendYachtDepositPaidEmails({
      bookingId,
      amount: paidNow,
      currency: String(data.currency ?? 'TRY'),
      customer: {
        firstName: String(data.customer_first_name ?? ''),
        lastName: String(data.customer_last_name ?? ''),
        email: String(data.customer_email ?? ''),
        phone: String(data.customer_phone ?? ''),
        note: data.customer_note != null ? String(data.customer_note) : undefined,
      },
      charterDate: data.date != null ? String(data.date) : undefined,
      pageTitle: String(
        data.tour_title ??
          (locale === 'tr' ? 'Yat kiralama kapora' : 'Private yacht charter deposit')
      ),
      locale: locale === 'tr' ? 'tr' : 'en',
    })
    return
  }

  const customer = {
    firstName: String(data.customer_first_name ?? ''),
    lastName: String(data.customer_last_name ?? ''),
    email: String(data.customer_email ?? ''),
    phone: String(data.customer_phone ?? ''),
    note: data.customer_note != null ? String(data.customer_note) : undefined,
  }
  const counts = {
    adult: Number(data.adult_count ?? 0),
    child: Number(data.child_count ?? 0),
    infant: Number(data.infant_count ?? 0),
  }
  const tourId = String(data.tour_id ?? '')
  let tourImageUrl: string | undefined
  let pickup: string | undefined
  let logoUrl: string | undefined
  let startTime: string | undefined
  let paidNow: number = Number(data.total_price ?? 0)
  if (tourId) {
    try {
      const tourMeta = await client.fetch<{
        mainImage?: { asset?: { _ref?: string } }
        quickFacts?: { meetingLocation?: string; startTime?: string }
        whereSection?: { meetingPointAddress?: string }
        deposit?: { enabled?: boolean; type?: string; value?: number }
      } | null>(tourImageAndPickupQuery, { tourId })
      if (tourMeta?.mainImage?.asset) {
        tourImageUrl = urlFor(tourMeta.mainImage.asset).width(600).height(240).url()
      }
      pickup =
        (data.meeting_point != null && String(data.meeting_point).trim()) ||
        tourMeta?.whereSection?.meetingPointAddress?.trim() ||
        tourMeta?.quickFacts?.meetingLocation?.trim() ||
        undefined
      startTime = tourMeta?.quickFacts?.startTime?.trim() || (data.time != null ? String(data.time) : undefined)
      const total = Number(data.total_price ?? 0)
      paidNow = computeDepositAmounts(total, tourMeta?.deposit).paidNow
    } catch {
      startTime = data.time != null ? String(data.time) : undefined
    }
  } else {
    startTime = data.time != null ? String(data.time) : undefined
  }
  try {
    const siteSettings = await client.fetch<{ logo?: { asset?: { _ref?: string } } } | null>(siteSettingsQuery)
    if (siteSettings?.logo?.asset) {
      logoUrl = urlFor(siteSettings.logo.asset).width(220).height(70).url()
    }
  } catch {
    // Logo opsiyonel
  }
  const siteBaseUrl = getBaseUrl().replace(/\/$/, '')
  let accessToken =
    typeof data.access_token === 'string' && data.access_token.trim() ? data.access_token.trim() : undefined
  if (!accessToken) {
    accessToken = generateBookingAccessToken()
    const { error: accessTokenError } = await supabase
      .from('bookings')
      .update({ access_token: accessToken, paid_now: paidNow })
      .eq('id', bookingId)
    if (accessTokenError) throw new Error(`Supabase access token update failed: ${accessTokenError.message}`)
  } else {
    const { error: paidNowError } = await supabase.from('bookings').update({ paid_now: paidNow }).eq('id', bookingId)
    if (paidNowError) throw new Error(`Supabase paidNow update failed: ${paidNowError.message}`)
  }
  const rawMeal = (data.meal_preference ?? undefined) as { key?: unknown; label?: unknown } | undefined
  const mealPreference =
    rawMeal &&
    typeof rawMeal === 'object' &&
    typeof rawMeal.key === 'string' &&
    typeof rawMeal.label === 'string' &&
    rawMeal.key.trim() &&
    rawMeal.label.trim()
      ? { key: rawMeal.key.trim(), label: rawMeal.label.trim() }
      : undefined

  const additionalTravelers = normalizeAdditionalTravelersFromStorage(data.additional_travelers)

  await sendBookingPaidEmails({
    bookingId,
    accessToken,
    tourTitle: String(data.tour_title ?? ''),
    date: String(data.date ?? ''),
    time: startTime,
    status: 'paid',
    className: String(data.class_name ?? ''),
    firstClassLocas:
      Array.isArray(data.first_class_locas) && data.first_class_locas.length > 0
        ? data.first_class_locas.filter(
            (x: unknown) => typeof x === 'string' && /^L(10|[1-9])$/.test(String(x).trim())
          )
        : undefined,
    firstClassLoca:
      Array.isArray(data.first_class_locas) && data.first_class_locas.length > 0
        ? undefined
        : typeof data.first_class_loca === 'string' && /^L(10|[1-9])$/.test(data.first_class_loca.trim())
          ? data.first_class_loca.trim()
          : undefined,
    counts,
    totalPrice: Number(data.total_price ?? 0),
    currency: String(data.currency ?? 'TRY'),
    paidNow,
    customer,
    tourImageUrl,
    pickup,
    logoUrl,
    siteBaseUrl,
    ...(mealPreference && { mealPreference }),
    ...(additionalTravelers.length > 0 && { additionalTravelers }),
  })
}
