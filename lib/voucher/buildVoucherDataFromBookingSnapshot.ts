/**
 * Firestore booking snapshot → VoucherData (/api/voucher ile birebir aynı mantık).
 * E-posta ekindeki PDF ile siteden indirilen PDF aynı kaynaktan üretilir.
 */
import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { client, urlFor } from '@/lib/sanity'
import { tourImageAndPickupQuery } from '@/lib/queries'
import { getEmailBaseUrl } from '@/lib/siteUrls'
import { bookingToVoucherData } from './bookingToVoucher'
import type { VoucherData } from './types'

function voucherAccessUrl(bookingId: string, token: string): string {
  const base = getEmailBaseUrl().replace(/\/$/, '')
  return `${base}/api/voucher/access?bookingId=${encodeURIComponent(bookingId)}&token=${encodeURIComponent(token)}`
}

/**
 * @param snap — bookings/{id} dokümanı
 * @param requestToken — İstek veya e-posta payload’ındaki token; dokümanda accessToken yoksa kullanılır
 */
export async function buildVoucherDataFromBookingSnapshot(
  snap: DocumentSnapshot,
  requestToken: string
): Promise<VoucherData | null> {
  if (!snap.exists) return null

  const data = snap.data()!
  const paidRaw = (data as { paidNow?: unknown }).paidNow
  const paidNow =
    typeof paidRaw === 'number' && Number.isFinite(paidRaw) && paidRaw > 0 ? paidRaw : undefined
  const booking = {
    id: snap.id,
    tourId: data.tourId,
    tourTitle: data.tourTitle,
    date: data.date,
    time: data.time,
    paidNow,
    counts: data.counts,
    classId: data.classId,
    className: data.className,
    firstClassLocas: Array.isArray(data.firstClassLocas) ? data.firstClassLocas : undefined,
    firstClassLoca: typeof data.firstClassLoca === 'string' ? data.firstClassLoca : undefined,
    totalPrice: data.totalPrice,
    currency: data.currency,
    status: data.status,
    meetingPoint: typeof data.meetingPoint === 'string' ? data.meetingPoint : undefined,
    customer: data.customer,
  }

  const storedToken =
    typeof (data as { accessToken?: string }).accessToken === 'string'
      ? (data as { accessToken: string }).accessToken.trim()
      : ''
  const urlToken = storedToken || requestToken.trim()
  if (!urlToken) return null

  const voucherUrl = voucherAccessUrl(snap.id, urlToken)
  let voucherData = bookingToVoucherData(booking, voucherUrl)

  try {
    const tourId = typeof data.tourId === 'string' ? data.tourId.trim() : ''
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
