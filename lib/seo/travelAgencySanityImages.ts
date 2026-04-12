import { safeSanityImageUrl } from '@/lib/sanity'

type AssetRef = { _ref?: string }

export type SiteSettingsTravelAgencyImages = {
  logo?: { asset?: AssetRef } | null
  favicon?: { asset?: AssetRef } | null
  richResultsImages?: Array<{ asset?: AssetRef } | null> | null
} | null

export type HomeHeroImageUrls = {
  heroImageUrl?: string | null
  heroImageMobileUrl?: string | null
} | null

/**
 * Sanity’den (siteSettings + isteğe bağlı ana sayfa hero) TravelAgency JSON-LD görsel URL’leri.
 * Öncelik: Site Ayarları → "Zengin sonuç görselleri", sonra hero CDN URL’leri.
 */
export function travelAgencyImageOverridesFromSanity(params: {
  settings: SiteSettingsTravelAgencyImages
  hero: HomeHeroImageUrls
}): { logoUrl: string | null; imageUrls: string[] } {
  const imageUrls: string[] = []

  for (const row of params.settings?.richResultsImages ?? []) {
    const u = safeSanityImageUrl(row?.asset ?? null, (b) =>
      b.width(1200).height(630).format('jpg')
    )
    if (u) imageUrls.push(u)
  }

  const h = params.hero
  if (h?.heroImageUrl) imageUrls.push(h.heroImageUrl)
  if (h?.heroImageMobileUrl && h.heroImageMobileUrl !== h.heroImageUrl) {
    imageUrls.push(h.heroImageMobileUrl)
  }

  const seen = new Set<string>()
  const unique = imageUrls.filter((u) => {
    const t = u?.trim()
    if (!t || seen.has(t)) return false
    seen.add(t)
    return true
  })

  const logoUrl =
    safeSanityImageUrl(params.settings?.logo?.asset ?? null, (b) =>
      b.width(320).height(128).format('png')
    ) ??
    safeSanityImageUrl(params.settings?.favicon?.asset ?? null, (b) =>
      b.width(128).height(128).format('png')
    )

  return { logoUrl, imageUrls: unique }
}
