import { urlFor } from '@/lib/sanity'
import type { PhotoGridImage } from '@/components/PhotoGrid'
import type { YachtGalleryImage, YachtRentalDocument } from '@/lib/yachtTypes'

export type YachtSidebarGalleryItem = { src: string; alt: string }

/** Dahil/dahil değil yanında gösterilecek küçük galeri (önce galeri, yoksa kapak) */
export function buildYachtSidebarGallery(yacht: YachtRentalDocument): YachtSidebarGalleryItem[] {
  const out: YachtSidebarGalleryItem[] = []
  for (const img of yacht.gallery ?? []) {
    if (img?.asset) {
      out.push({
        src: urlFor(img.asset).width(720).height(540).url(),
        alt: img.alt?.trim() || `${yacht.name} — galeri`,
      })
    }
  }
  if (out.length === 0 && yacht.mainImage?.asset) {
    out.push({
      src: urlFor(yacht.mainImage.asset).width(720).height(540).url(),
      alt: yacht.mainImage.alt?.trim() || yacht.name,
    })
  }
  return out
}

export function buildYachtPhotoGridImages(yacht: YachtRentalDocument): PhotoGridImage[] {
  const main = yacht.mainImage?.asset ? [yacht.mainImage] : []
  const gallery = yacht.gallery ?? []
  const all = [...main, ...gallery].filter(
    (img): img is YachtGalleryImage => Boolean(img?.asset)
  )
  return all.map((img, i) => ({
    src: urlFor(img.asset!).width(1200).url(),
    blurDataURL: img.metadata?.lqip ?? null,
    alt: `${yacht.name} - Görsel ${i + 1}`,
  }))
}
