/**
 * Widget'ın hangi sitelerde açılabileceği (CSP frame-ancestors). Middleware'de
 * (edge) çalışır; bu yüzden supabase-js yerine doğrudan REST çağrısı yapılır.
 *
 * Partnerin `widget_domains` alanı boşsa (ya da sütun henüz yoksa, sorgu hata
 * verirse) widget her sitede açılır — kısıtlama isteğe bağlıdır.
 */
const CACHE_MS = 60_000
const cache = new Map<string, { value: string; at: number }>()

const HOST_REGEX = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/

/** "https://www.otel.com/sayfa" gibi girişleri "otel.com"a indirger; geçersizse null. */
export function normalizeWidgetDomain(input: string): string | null {
  let s = input.trim().toLowerCase()
  if (!s) return null
  s = s.replace(/^[a-z]+:\/\//, '').split(/[/?#]/)[0].replace(/:\d+$/, '').replace(/^\*\./, '').replace(/^www\./, '')
  return HOST_REGEX.test(s) ? s : null
}

export function parseWidgetDomains(raw: unknown): string[] {
  if (typeof raw !== 'string') return []
  const out = new Set<string>()
  for (const part of raw.split(/[\s,]+/)) {
    const d = normalizeWidgetDomain(part)
    if (d) out.add(d)
  }
  return [...out].slice(0, 20)
}

export function frameAncestorsFor(domains: string[]): string {
  if (domains.length === 0) return 'frame-ancestors *'
  // 'self': admin/partner panelindeki önizleme her zaman çalışsın.
  return `frame-ancestors 'self' ${domains.map((d) => `https://${d} https://*.${d}`).join(' ')}`
}

export async function frameAncestorsForPartner(slug: string): Promise<string> {
  const hit = cache.get(slug)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value

  let value = frameAncestorsFor([])
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (url && key && /^[a-z0-9-]{1,80}$/.test(slug)) {
    try {
      const res = await fetch(
        `${url.replace(/\/$/, '')}/rest/v1/partners?slug=eq.${slug}&select=widget_domains&limit=1`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' }
      )
      if (res.ok) {
        const rows = (await res.json()) as { widget_domains?: unknown }[]
        value = frameAncestorsFor(parseWidgetDomains(rows[0]?.widget_domains))
      }
    } catch {
      /* sorgu başarısızsa widget engellenmez */
    }
  }
  cache.set(slug, { value, at: Date.now() })
  return value
}
