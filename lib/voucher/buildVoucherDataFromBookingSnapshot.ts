/**
 * Supabase booking row → VoucherData (/api/voucher ile birebir aynı mantık).
 * E-posta ekindeki PDF ile siteden indirilen PDF aynı kaynaktan üretilir.
 */
import { client, urlFor } from '@/lib/sanity'
import { tourImageAndPickupQuery } from '@/lib/queries'
import { getEmailBaseUrl } from '@/lib/siteUrls'
import { normalizeBookingFlowLocale } from '@/lib/i18n/bookingFlowLocale'
import { bookingToVoucherData } from './bookingToVoucher'
import type { VoucherData } from './types'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'

function voucherAccessUrl(bookingId: string, token: string): string {
  const base = getEmailBaseUrl().replace(/\/$/, '')
  return `${base}/api/voucher/access?bookingId=${encodeURIComponent(bookingId)}&token=${encodeURIComponent(token)}`
}

/**
 * @param bookingId — bookings.id (uuid)
 * @param row — Supabase bookings satırı
 * @param requestToken — İstek veya e-posta payload’ındaki token; dokümanda accessToken yoksa kullanılır
 */
export async function buildVoucherDataFromBookingRow(
  bookingId: string,
  row: SupabaseBookingRow,
  requestToken: string
): Promise<VoucherData | null> {
  const paidRaw = row.paid_now
  const paidNow =
    typeof paidRaw === 'number' && Number.isFinite(paidRaw) && paidRaw > 0 ? paidRaw : undefined
  const booking = {
    id: bookingId,
    tourId: row.tour_id ?? undefined,
    tourTitle: row.tour_title ?? undefined,
    date: row.date ?? undefined,
    time: row.time ?? undefined,
    paidNow,
    counts: {
      adult: Number(row.adult_count ?? 0),
      child: Number(row.child_count ?? 0),
      infant: Number(row.infant_count ?? 0),
    },
    classId: row.class_id ?? undefined,
    className: row.class_name ?? undefined,
    firstClassLocas: Array.isArray(row.first_class_locas) ? row.first_class_locas : undefined,
    firstClassLoca: typeof row.first_class_loca === 'string' ? row.first_class_loca : undefined,
    totalPrice: row.total_price ?? 0,
    currency: row.currency ?? 'TRY',
    status: row.status ?? 'pending',
    meetingPoint: typeof row.meeting_point === 'string' ? row.meeting_point : undefined,
    customer: {
      firstName: row.customer_first_name ?? '',
      lastName: row.customer_last_name ?? '',
      email: row.customer_email ?? '',
      phone: row.customer_phone ?? '',
      ...(row.customer_note ? { note: row.customer_note } : {}),
    },
  }

  const storedToken =
    typeof row.access_token === 'string'
      ? row.access_token.trim()
      : ''
  const urlToken = storedToken || requestToken.trim()
  if (!urlToken) return null

  const voucherUrl = voucherAccessUrl(bookingId, urlToken)
  const flowLocale = normalizeBookingFlowLocale(row.ui_locale)
  let voucherData = bookingToVoucherData(booking, voucherUrl, flowLocale)

  try {
    const tourId = typeof row.tour_id === 'string' ? row.tour_id.trim() : ''
    if (tourId) {
      const tourMeta = await client.fetch<{
        mainImage?: { asset?: { _ref?: string } }
        gallery?: { _ref?: string }[]
        durationLabel?: string | null
        meetingPoint?: string | null
        quickFacts?: { startTime?: string | null; returnTime?: string | null }
        deposit?: { enabled?: boolean; type?: string; value?: number }
        included?: string[] | null
        notIncluded?: string[] | null
      } | null>(tourImageAndPickupQuery, { tourId })
      if (tourMeta) {
        const tourImageUrl = tourMeta.mainImage?.asset
          ? urlFor(tourMeta.mainImage.asset).width(600).height(320).url()
          : undefined
        const galleryRefs = (tourMeta.gallery ?? []).filter((a: { _ref?: string }) => a?._ref).slice(0, 3)
        const tourGalleryUrls =
          galleryRefs.length > 0
            ? galleryRefs.map((assetRef: { _ref?: string }) =>
                urlFor(assetRef).width(500).height(340).format('jpg').url()
              )
            : tourMeta.mainImage?.asset
              ? [urlFor(tourMeta.mainImage.asset).width(500).height(340).format('jpg').url()]
              : undefined
        let depositAmount: number | undefined
        if (tourMeta.deposit?.enabled && tourMeta.deposit?.value != null && voucherData.totalPrice > 0) {
          depositAmount =
            tourMeta.deposit.type === 'fixed'
              ? tourMeta.deposit.value
              : Math.round((tourMeta.deposit.value / 100) * voucherData.totalPrice)
        }
        const fallbackTime = tourMeta.quickFacts?.startTime?.trim() || undefined
        const arrivalTime = tourMeta.quickFacts?.returnTime?.trim() || undefined
        voucherData = {
          ...voucherData,
          ...(voucherData.time ? {} : fallbackTime ? { time: fallbackTime } : {}),
          ...(tourImageUrl && { tourImageUrl }),
          ...(tourGalleryUrls?.length && { tourGalleryUrls }),
          ...(tourMeta.meetingPoint && { meetingPickup: tourMeta.meetingPoint }),
          ...(tourMeta.durationLabel && { durationLabel: tourMeta.durationLabel }),
          ...(depositAmount != null && { depositAmount }),
          ...(tourMeta.included?.length && { included: tourMeta.included }),
          ...(tourMeta.notIncluded?.length && { notIncluded: tourMeta.notIncluded }),
          ...(arrivalTime ? { arrivalTime } : {}),
        }
      }
    }
  } catch {
    // PDF tur görseli olmadan da üretilir
  }

  return voucherData
}
