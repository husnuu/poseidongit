import type { Metadata } from 'next'
import { safeSanityImageUrl } from '@/lib/sanity'
import { absoluteUrl } from '@/lib/seo'
import type { YachtRentalDocument } from '@/lib/yachtTypes'

function metaDescription(yacht: YachtRentalDocument): string {
  const seod = yacht.seo?.description?.trim()
  if (seod) return seod.slice(0, 160)
  const short = yacht.shortDescription
  const text = typeof short === 'string' ? short : ''
  const collapsed = text.replace(/\s+/g, ' ').trim().slice(0, 160)
  if (collapsed) return collapsed
  return `Özel yat: ${yacht.name}. Müsaitlik sorun, teklif alın.`
}

export function buildYachtDetailMetadata(
  yacht: YachtRentalDocument,
  canonicalPath: string
): Metadata {
  const title =
    yacht.seo?.title?.trim() ||
    `${yacht.name} | Özel yat kiralama`
  const description = metaDescription(yacht)
  const url = absoluteUrl(canonicalPath)
  const ogAsset = yacht.seo?.ogImage?.asset ?? yacht.mainImage?.asset
  const image =
    safeSanityImageUrl(ogAsset, (b) => b.width(1200).height(630)) ?? undefined
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: image ? [{ url: image, width: 1200, height: 630, alt: yacht.name }] : undefined,
    },
  }
}
