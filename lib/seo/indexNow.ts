import { getBaseUrl } from '@/lib/seo'
import { canonicalRouteToPublicPath } from '@/lib/i18n/routeAliases'
import { SITE_LOCALES, type SiteLocale } from '@/lib/i18n/config'

/**
 * IndexNow — Bing, Yandex, Seznam, Naver ve (Bing üzerinden) ChatGPT/Copilot
 * aramasına "bu sayfalar değişti" bildirimi. Google IndexNow kullanmıyor;
 * Google sitemap'i (lastmod) ve Search Console üzerinden okur.
 *
 * Anahtar: INDEXNOW_KEY (8–128 karakter, harf/rakam/tire). Anahtar dosyası
 * /indexnow.txt adresinde yayınlanır (app/indexnow.txt/route.ts).
 */
export function getIndexNowKey(): string | null {
  const k = process.env.INDEXNOW_KEY?.trim()
  return k && /^[A-Za-z0-9-]{8,128}$/.test(k) ? k : null
}

/** Kanonik iç yolu (örn. /tur/x) her dil için mutlak public URL'e çevirir. */
export function localizedUrls(
  canonicalPath: string,
  localeSlugs?: Partial<Record<SiteLocale, string | null | undefined>>,
  segment?: string
): string[] {
  const base = getBaseUrl()
  return SITE_LOCALES.map((loc) => {
    const path =
      segment && localeSlugs?.[loc] ? `/${segment}/${localeSlugs[loc]}` : canonicalPath
    if (loc === 'tr') return `${base}${path === '/' ? '' : path}`
    const localized = canonicalRouteToPublicPath(loc, path)
    return `${base}/${loc}${localized === '/' ? '' : localized}`
  })
}

export async function submitIndexNow(urls: string[]): Promise<{ ok: boolean; status?: number; skipped?: string }> {
  const key = getIndexNowKey()
  if (!key) return { ok: false, skipped: 'INDEXNOW_KEY not set' }
  const base = getBaseUrl()
  const unique = [...new Set(urls.filter((u) => u.startsWith(base)))].slice(0, 10000)
  if (unique.length === 0) return { ok: false, skipped: 'no urls' }
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(base).host,
        key,
        keyLocation: `${base}/indexnow.txt`,
        urlList: unique,
      }),
      signal: AbortSignal.timeout(10000),
    })
    // 200 = alındı, 202 = alındı (anahtar doğrulaması bekleniyor)
    return { ok: res.status === 200 || res.status === 202, status: res.status }
  } catch {
    return { ok: false, skipped: 'request failed' }
  }
}
