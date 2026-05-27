import { safeSanityImageUrl, urlFor } from '@/lib/sanity'

/** Sanity CDN çıktı kalitesi (1–100). */
export const SANITY_IMAGE_QUALITY = {
  cover: 92,
  galleryHero: 90,
  galleryThumb: 88,
  og: 90,
} as const

type SanityImageSource = Parameters<typeof urlFor>[0]
type SanityImageBuilder = ReturnType<typeof urlFor>

/** Tur kartı / liste kapak — 4:3, retina için yeterli çözünürlük. */
export function tourCoverImagePipe(b: SanityImageBuilder): SanityImageBuilder {
  return b.width(1400).height(1050).fit('crop').quality(SANITY_IMAGE_QUALITY.cover).auto('format')
}

export function tourCoverImageUrl(source: SanityImageSource | null | undefined): string | null {
  return safeSanityImageUrl(source, tourCoverImagePipe)
}

/** Tur detay üst galeri — en-boy oranı korunur, geniş ekran + retina. */
export function tourGalleryHeroImagePipe(b: SanityImageBuilder): SanityImageBuilder {
  return b.width(2560).quality(SANITY_IMAGE_QUALITY.galleryHero).auto('format')
}

export function tourGalleryHeroImageUrl(source: SanityImageSource | null | undefined): string | null {
  return safeSanityImageUrl(source, tourGalleryHeroImagePipe)
}

/** next/image — Sanity CDN zaten optimize; çift sıkıştırmayı önler. */
export const SANITY_DISPLAY_IMAGE_PROPS = {
  quality: 92,
  unoptimized: true,
} as const
