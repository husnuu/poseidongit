import type { Metadata } from 'next'
import { safeSanityImageUrl } from '@/lib/sanity'
import { buildPageMetadata } from '@/lib/seo/buildPageMetadata'
import type { YachtRentalDocument } from '@/lib/yachtTypes'
import type { SiteLocale } from '@/lib/i18n/config'

function metaDescription(yacht: YachtRentalDocument): string {
  const seod = yacht.seo?.description?.trim()
  if (seod) return seod.slice(0, 160)
  const short = yacht.shortDescription
  const text = typeof short === 'string' ? short : ''
  const collapsed = text.replace(/\s+/g, ' ').trim().slice(0, 160)
  if (collapsed) return collapsed
  return `Özel yat: ${yacht.name}. Müsaitlik sorun, teklif alın.`
}

/**
 * `canonicalPath` locale ÖNEKİ OLMADAN verilir (örn. `/yat-kiralama/cesme/foo`) —
 * hreflang alternates ve canonical bu yoldan, doğru locale önekiyle üretilir.
 */
export function buildYachtDetailMetadata(
  yacht: YachtRentalDocument,
  canonicalPath: string,
  locale: SiteLocale = 'tr'
): Metadata {
  const title =
    yacht.seo?.title?.trim() ||
    `${yacht.name} | Özel yat kiralama`
  const description = metaDescription(yacht)
  const ogAsset = yacht.seo?.ogImage?.asset ?? yacht.mainImage?.asset
  const image =
    safeSanityImageUrl(ogAsset, (b) => b.width(1200).height(630)) ?? undefined
  return buildPageMetadata({
    locale,
    path: canonicalPath,
    title,
    description,
    image,
    imageAlt: yacht.name,
  })
}
