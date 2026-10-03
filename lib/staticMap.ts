import { getBaseUrl } from '@/lib/seo'

/**
 * E-posta ve PDF bilette gömülü statik harita görseli üretir.
 * Google Maps API anahtarı gerektirmez: Google'ın "Haritayı yerleştir" iframe
 * linklerindeki (whereSection.mapEmbedUrl) pb= parametresi enlem/boylamı
 * düz ondalık olarak (!2d<lng>!3d<lat>) içerir; buradan koordinat çıkarılır.
 *
 * ÖNEMLİ: Bu embed URL'deki koordinat, embed kodu alınırken haritanın
 * EKRANDAKİ GÖRÜNÜM MERKEZİDİR — kullanıcı pini koyduktan sonra haritayı
 * kaydırmış/yakınlaştırmışsa gerçek işaretlenen noktadan (gerçek bir turda
 * ~225m) sapabilir. "Haritada Aç" yol tarifi linkindeki (locationMapLink,
 * ?destination=lat,lng) koordinat ise Google'ın GEOCODE ETTİĞİ gerçek hedef
 * noktasıdır — bu yüzden varsa ona öncelik verilir (bkz. resolveMapLatLng).
 */

export function parseLatLngFromMapEmbedUrl(
  embedUrl: string | undefined | null
): { lat: number; lng: number } | null {
  if (!embedUrl?.trim()) return null
  const m = /!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/.exec(embedUrl)
  if (!m) return null
  const lng = Number(m[1])
  const lat = Number(m[2])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

/** Google Maps "yol tarifi al" linkinden (?destination=lat,lng) koordinat çıkarır —
 *  embed URL'in görünüm merkezinden daha güvenilir, çünkü bu gerçek geocode edilmiş hedeftir. */
export function parseLatLngFromDirectionsLink(
  directionsLink: string | undefined | null
): { lat: number; lng: number } | null {
  if (!directionsLink?.trim()) return null
  const m = /[?&]destination=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/.exec(directionsLink)
  if (!m) return null
  const lat = Number(m[1])
  const lng = Number(m[2])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

/** Önce yol tarifi linkindeki (daha güvenilir) hedef koordinatı, yoksa embed URL'in
 *  görünüm merkezini dener. */
export function resolveMapLatLng(
  directionsLink: string | undefined | null,
  embedUrl: string | undefined | null
): { lat: number; lng: number } | null {
  return parseLatLngFromDirectionsLink(directionsLink) ?? parseLatLngFromMapEmbedUrl(embedUrl)
}

/**
 * Wikimedia'nın anahtarsız statik harita servisi (OpenStreetMap tabanlı).
 * Hotlink politikası nedeniyle yalnızca sunucu tarafında (User-Agent ile)
 * çağrılmalı — bkz. /api/static-map proxy route'u.
 */
export function wikimediaStaticMapUrl(
  lat: number,
  lng: number,
  opts?: { width?: number; height?: number; zoom?: number }
): string {
  const width = opts?.width ?? 600
  const height = opts?.height ?? 260
  const zoom = opts?.zoom ?? 15
  return `https://maps.wikimedia.org/img/osm-intl,${zoom},${lat},${lng},${width}x${height}.png`
}

/**
 * E-posta/PDF'te gösterilecek harita görselinin public URL'i.
 * Kendi /api/static-map proxy'imize işaret eder: e-posta istemcileri
 * (Gmail, Outlook vb.) resmi doğrudan Wikimedia'dan değil bizim
 * sunucumuzdan ister; gerçek Wikimedia isteği sunucu tarafında
 * uygun User-Agent ile yapılır.
 */
export function staticMapImageUrl(
  lat: number,
  lng: number,
  opts?: { width?: number; height?: number; zoom?: number }
): string {
  const width = opts?.width ?? 600
  const height = opts?.height ?? 260
  const zoom = opts?.zoom ?? 15
  const base = getBaseUrl()
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    w: String(width),
    h: String(height),
    z: String(zoom),
  })
  return `${base}/api/static-map?${params.toString()}`
}

/** whereSection.mapEmbedUrl (+ varsa daha güvenilir locationMapLink) → statik harita
 *  görseli URL'i (koordinat çıkarılamazsa undefined). */
export function mapImageUrlFromEmbed(
  embedUrl: string | undefined | null,
  opts?: { width?: number; height?: number; zoom?: number },
  directionsLink?: string | undefined | null
): string | undefined {
  const coords = resolveMapLatLng(directionsLink, embedUrl)
  if (!coords) return undefined
  return staticMapImageUrl(coords.lat, coords.lng, opts)
}
