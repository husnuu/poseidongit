/**
 * Google Haritalar → Paylaş → Haritayı yerleştir → iframe `src`
 * Örnek: https://www.google.com/maps/embed?pb=!1m18!1m12!...
 *
 * Paylaşım: `.../maps/embed?pb=` → `.../maps?pb=` (aynı pb, birebir aynı harita).
 * Yol tarifi: Google `dir` API’si `destination` olarak tam URL’yi güvenilir işlemez;
 * `pb` metninden çıkarılan en olası pin koordinatları `destination=lat,lng` olarak verilir.
 */

/** Standart “Haritayı yerleştir” iframe adresi mi? (`.../maps/embed?pb=...`) */
function isClassicGoogleMapsEmbedIframeSrc(url: string): boolean {
  try {
    const u = new URL(url.trim())
    const host = u.hostname.toLowerCase()
    if (!/\.google\./.test(host) && host !== 'maps.google.com') return false
    const p = u.pathname.replace(/\/+$/, '') || '/'
    return p === '/maps/embed'
  } catch {
    return false
  }
}

/**
 * iframe `src` → aynı `pb` (ve diğer query) ile tam ekran Google Haritalar.
 */
export function googleMapsEmbedIframeSrcToMapsUrl(embedSrc: string): string | null {
  const raw = embedSrc.trim()
  if (!raw || !isClassicGoogleMapsEmbedIframeSrc(raw)) return null
  try {
    const u = new URL(raw)
    u.pathname = '/maps'
    return u.toString()
  } catch {
    return null
  }
}

function isReasonableLatLng(lat: number, lng: number): boolean {
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false
  if (lat === 0 && lng === 0) return false
  return true
}

/**
 * Gömülü URL’nin tamamında (özellikle `pb` değeri) geçen !3d(lat)!4d(lng) vb. eşleşmeleri tarar.
 * Birden fazla çift varsa önce Akdeniz / Türkiye bandına yakın olanı, yoksa son eşleşmeyi seçer (genelde pin).
 */
export function extractBestLatLngFromEmbed(embedUrl: string): { lat: number; lng: number } | null {
  const s = embedUrl.trim()
  if (!s) return null

  const candidates: Array<{ lat: number; lng: number }> = []

  const scanStrings = new Set<string>([s])
  const bangDecoded = s.replace(/%21/gi, '!')
  if (bangDecoded !== s) scanStrings.add(bangDecoded)
  try {
    const once = decodeURIComponent(s)
    if (once !== s) scanStrings.add(once)
  } catch {
    // ignore
  }

  const re34 = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g
  let m: RegExpExecArray | null
  for (const scan of scanStrings) {
    re34.lastIndex = 0
    while ((m = re34.exec(scan)) !== null) {
      const lat = Number(m[1])
      const lng = Number(m[2])
      if (isReasonableLatLng(lat, lng)) candidates.push({ lat, lng })
    }

    const re23 = /!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/g
    while ((m = re23.exec(scan)) !== null) {
      const lng = Number(m[1])
      const lat = Number(m[2])
      if (isReasonableLatLng(lat, lng)) candidates.push({ lat, lng })
    }

    const re43 = /!4d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/g
    while ((m = re43.exec(scan)) !== null) {
      const lng = Number(m[1])
      const lat = Number(m[2])
      if (isReasonableLatLng(lat, lng)) candidates.push({ lat, lng })
    }

    const at = scan.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
    if (at) {
      const lat = Number(at[1])
      const lng = Number(at[2])
      if (isReasonableLatLng(lat, lng)) candidates.push({ lat, lng })
    }

    const cm = scan.match(/[?&]center=([^&]+)/i)
    if (cm) {
      try {
        const decoded = decodeURIComponent(cm[1].replace(/\+/g, ' '))
        const parts = decoded.split(',')
        if (parts.length === 2) {
          const lat = Number(parts[0].trim())
          const lng = Number(parts[1].trim())
          if (isReasonableLatLng(lat, lng)) candidates.push({ lat, lng })
        }
      } catch {
        // ignore
      }
    }
  }

  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  const inEastMed = candidates.filter(
    (c) => c.lat >= 30 && c.lat <= 45 && c.lng >= 15 && c.lng <= 50
  )
  if (inEastMed.length > 0) return inEastMed[inEastMed.length - 1]
  return candidates[candidates.length - 1]
}

/** @deprecated extractBestLatLngFromEmbed kullanın */
export function tryParseLatLngFromGoogleEmbed(embedUrl: string): { lat: number; lng: number } | null {
  return extractBestLatLngFromEmbed(embedUrl)
}

function tryPlaceQueryFromEmbed(embedUrl: string): string | null {
  const m = embedUrl.trim().match(/[?&]q=([^&]+)/i)
  if (!m) return null
  try {
    const q = decodeURIComponent(m[1].replace(/\+/g, ' ')).trim()
    return q.length > 0 ? q : null
  } catch {
    return null
  }
}

type PlaceResolution =
  | { url: string; source: 'embedPb' | 'embedParsed' | 'embedRaw' | 'address' }
  | null

function resolvePlaceUrl(
  address: string | null | undefined,
  mapEmbedUrl: string | null | undefined
): PlaceResolution {
  const embed = typeof mapEmbedUrl === 'string' ? mapEmbedUrl.trim() : ''
  if (embed) {
    const fromPb = googleMapsEmbedIframeSrcToMapsUrl(embed)
    if (fromPb) {
      return { url: fromPb, source: 'embedPb' }
    }

    const fromQ = tryPlaceQueryFromEmbed(embed)
    if (fromQ) {
      return {
        url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fromQ)}`,
        source: 'embedParsed',
      }
    }
    const ll = extractBestLatLngFromEmbed(embed)
    if (ll) {
      return {
        url: `https://www.google.com/maps/search/?api=1&query=${ll.lat}%2C${ll.lng}`,
        source: 'embedParsed',
      }
    }
    return { url: embed, source: 'embedRaw' }
  }

  const a = typeof address === 'string' ? address.trim() : ''
  if (a.length > 0) {
    return {
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`,
      source: 'address',
    }
  }
  return null
}

/** Tam Google Haritalar’da aynı gömülü haritayı açan link (pb korunur). */
export function buildGoogleMapsPlaceUrl(
  address: string | null | undefined,
  mapEmbedUrl: string | null | undefined
): string | null {
  return resolvePlaceUrl(address, mapEmbedUrl)?.url ?? null
}

/**
 * Yol tarifi: `destination` için Google’ın desteklediği biçim — koordinat veya yer adı.
 * `pb` embed için önce aynı stringden lat,lng çıkarılır (tam maps URL’si destination olarak verilmez).
 */
export function buildGoogleDirectionsUrl(
  address: string | null | undefined,
  mapEmbedUrl: string | null | undefined
): string | null {
  const embed = typeof mapEmbedUrl === 'string' ? mapEmbedUrl.trim() : ''

  if (embed) {
    const pin = extractBestLatLngFromEmbed(embed)
    if (pin) {
      const dest = `${pin.lat},${pin.lng}`
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`
    }
    const q = tryPlaceQueryFromEmbed(embed)
    if (q) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`
    }
    const addrFallback = typeof address === 'string' ? address.trim() : ''
    if (addrFallback) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addrFallback)}`
    }
    return null
  }

  const a = typeof address === 'string' ? address.trim() : ''
  if (a.length > 0) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(a)}`
  }
  return null
}

/** wa.me — pb haritasında ayrı adres satırı yok (iframe ile birebir aynı link). */
export function buildWhatsappShareLocationUrl(
  address: string | null | undefined,
  mapEmbedUrl: string | null | undefined,
  contextLabel?: string | null
): string | null {
  const r = resolvePlaceUrl(address, mapEmbedUrl)
  if (!r) return null

  const lines: string[] = []
  const label = typeof contextLabel === 'string' ? contextLabel.trim() : ''
  if (label) lines.push(label)
  if (r.source === 'address') {
    const addr = typeof address === 'string' ? address.trim() : ''
    if (addr) lines.push(addr)
  }
  lines.push(r.url)
  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`
}

/** Sanity’de girilen tam harita bağlantısı (https yoksa eklenir). */
export function normalizeUserMapLink(url: string): string {
  const t = url.trim()
  if (!t) return t
  if (/^https?:\/\//i.test(t)) return t
  return `https://${t}`
}

/** CMS konum linki → yol tarifi (varış = sizin verdiğiniz URL). */
export function buildDirectionsUrlFromManagedLocationLink(managedUrl: string): string | null {
  const u = normalizeUserMapLink(managedUrl)
  if (!u) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(u)}`
}

/** CMS konum linki → WhatsApp metni (başlık + aynı bağlantı). */
export function buildWhatsappUrlFromManagedLocationLink(
  managedUrl: string,
  contextLabel?: string | null
): string | null {
  const u = normalizeUserMapLink(managedUrl)
  if (!u) return null
  const lines: string[] = []
  const label = typeof contextLabel === 'string' ? contextLabel.trim() : ''
  if (label) lines.push(label)
  lines.push(u)
  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`
}
