import { safeSanityImageUrl } from '@/lib/sanity'
import type { PhotoGridImage } from '@/components/PhotoGrid'
import type { YachtGalleryImage, YachtRentalDocument } from '@/lib/yachtTypes'

export type YachtSidebarGalleryItem = { src: string; alt: string }

/** Dahil/dahil değil yanında gösterilecek küçük galeri (önce galeri, yoksa kapak) */
export function buildYachtSidebarGallery(yacht: YachtRentalDocument): YachtSidebarGalleryItem[] {
  const out: YachtSidebarGalleryItem[] = []
  for (const img of yacht.gallery ?? []) {
    if (img?.asset) {
      const src = safeSanityImageUrl(img.asset, (b) => b.width(720).height(540))
      if (src) {
        out.push({
          src,
          alt: img.alt?.trim() || `${yacht.name} — galeri`,
        })
      }
    }
  }
  if (out.length === 0 && yacht.mainImage?.asset) {
    const src = safeSanityImageUrl(yacht.mainImage.asset, (b) => b.width(720).height(540))
    if (src) {
      out.push({
        src,
        alt: yacht.mainImage.alt?.trim() || yacht.name,
      })
    }
  }
  return out
}

export function buildYachtPhotoGridImages(yacht: YachtRentalDocument): PhotoGridImage[] {
  const main = yacht.mainImage?.asset ? [yacht.mainImage] : []
  const gallery = yacht.gallery ?? []
  const all = [...main, ...gallery].filter(
    (img): img is YachtGalleryImage => Boolean(img?.asset)
  )
  const out: PhotoGridImage[] = []
  for (const img of all) {
    const src = safeSanityImageUrl(img.asset!, (b) => b.width(1200))
    if (!src) continue
    out.push({
      src,
      blurDataURL: img.metadata?.lqip ?? null,
      alt: `${yacht.name} - Görsel ${out.length + 1}`,
    })
  }
  return out
}
