import type { Metadata } from 'next'
import { urlFor } from '@/lib/sanity'
import { absoluteUrl } from '@/lib/seo'
import type { YachtRentalDocument } from '@/lib/yachtTypes'

export function buildYachtDetailMetadata(
  yacht: YachtRentalDocument,
  canonicalPath: string
): Metadata {
  const title =
    yacht.seo?.title?.trim() ||
    `${yacht.name} | Özel yat kiralama`
  const description =
    yacht.seo?.description?.trim() ||
    (yacht.shortDescription ?? `${yacht.name} — günlük charter ve müsaitlik talebi.`)
      .replace(/\s+/g, ' ')
      .slice(0, 160) ||
    `Özel yat: ${yacht.name}. Müsaitlik sorun, teklif alın.`
  const url = absoluteUrl(canonicalPath)
  const ogAsset = yacht.seo?.ogImage?.asset ?? yacht.mainImage?.asset
  const image = ogAsset ? urlFor(ogAsset).width(1200).height(630).url() : undefined
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
