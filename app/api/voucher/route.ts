import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebaseAdmin'
import { client, urlFor } from '@/lib/sanity'
import { tourImageAndPickupQuery } from '@/lib/queries'
import { generateVoucherPdf } from '@/lib/voucher/generateVoucherPdf'
import { bookingToVoucherData } from '@/lib/voucher/bookingToVoucher'
import { getEmailBaseUrl } from '@/lib/siteUrls'

const COLLECTION = 'bookings'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getVoucherUrl(bookingId: string): string {
  const base = getEmailBaseUrl().replace(/\/$/, '')
  return `${base}/api/voucher?bookingId=${encodeURIComponent(bookingId)}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')?.trim()
    const download = searchParams.get('download') === '1'

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing bookingId. Use /api/voucher?bookingId=...' },
        { status: 400 }
      )
    }

    const db = getFirestore()
    const snap = await db.collection(COLLECTION).doc(bookingId).get()

    if (!snap.exists) {
      return NextResponse.json(
        { error: 'Booking not found', bookingId },
        { status: 404 }
      )
    }

    const data = snap.data()!
    const booking = {
      id: snap.id,
      tourId: data.tourId,
      tourTitle: data.tourTitle,
      date: data.date,
      time: data.time,
      counts: data.counts,
      classId: data.classId,
      className: data.className,
      totalPrice: data.totalPrice,
      currency: data.currency,
      status: data.status,
      customer: data.customer,
    }

    const voucherUrl = getVoucherUrl(bookingId)
    let voucherData = bookingToVoucherData(booking, voucherUrl)
    try {
      const tourId = typeof data.tourId === 'string' ? data.tourId.trim() : ''
      if (tourId) {
        const tourMeta = await client.fetch<{
          mainImage?: { asset?: { _ref?: string } }
          gallery?: { _ref?: string }[]
          durationLabel?: string | null
          meetingPoint?: string | null
          quickFacts?: { startTime?: string | null }
          deposit?: { enabled?: boolean; type?: string; value?: number }
          included?: string[] | null
          notIncluded?: string[] | null
        } | null>(tourImageAndPickupQuery, { tourId })
        if (tourMeta) {
          const tourImageUrl = tourMeta.mainImage?.asset
            ? urlFor(tourMeta.mainImage.asset).width(600).height(320).url()
            : undefined
          const galleryRefs = (tourMeta.gallery ?? []).filter((a: { _ref?: string }) => a?._ref).slice(0, 3)
          const tourGalleryUrls = galleryRefs.length > 0
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
          }
        }
      }
    } catch {
      // PDF tur görseli olmadan da üretilir
    }
    const pdfBytes = await generateVoucherPdf(voucherData)

    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Bilet'
  const filename = `${siteName}-Bilet-${voucherData.referenceNumber}.pdf`
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': download
          ? `attachment; filename="${safeFilename}"`
          : `inline; filename="${safeFilename}"`,
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (e) {
    console.error('[voucher] Error:', e)
    const message = e instanceof Error ? e.message : 'Failed to generate voucher'
    return NextResponse.json(
      { error: 'Voucher generation failed', details: message },
      { status: 500 }
    )
  }
}
