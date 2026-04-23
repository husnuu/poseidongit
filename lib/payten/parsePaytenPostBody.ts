function isPaytenRawBodyDebug(): boolean {
  const p = process.env.PAYMENT_DEBUG
  if (p === '1' || p === 'true') return true
  return process.env.NODE_ENV !== 'production'
}

/**
 * Payten okUrl/failUrl/callback genelde `application/x-www-form-urlencoded` POST kullanır.
 * PHP `$_POST` ile aynı anahtar/değer setini yakalamak için gövdeyi metin olarak okuyup çözüyoruz
 * (FormData ile bazı edge-case farklarından kaçınmak için).
 */
export function parseUrlEncodedFormBody(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  const cleaned = raw.replace(/^\uFEFF/, '').trim()
  if (!cleaned) return out
  for (const segment of cleaned.split('&')) {
    if (segment.length === 0) continue
    const eq = segment.indexOf('=')
    const rawKey = eq === -1 ? segment : segment.slice(0, eq)
    const rawVal = eq === -1 ? '' : segment.slice(eq + 1)
    let key: string
    let val: string
    try {
      /** `application/x-www-form-urlencoded`: boşluk `+` ile kodlanabilir (RFC 1866). Gerçek `+` değer `%2B` olmalı. */
      key = decodeURIComponent(rawKey.replace(/\+/g, ' ')).replace(/^\uFEFF/, '')
      val = decodeURIComponent(rawVal.replace(/\+/g, ' '))
    } catch {
      key = rawKey.replace(/^\uFEFF/, '')
      val = rawVal
    }
    out[key] = val
  }
  return out
}

export async function parsePaytenPostToRecord(request: Request): Promise<Record<string, string> | null> {
  const rawType = request.headers.get('content-type') || ''
  const baseType = rawType.split(';')[0]?.trim().toLowerCase() || ''

  if (baseType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData()
      const out: Record<string, string> = {}
      for (const [k, v] of formData.entries()) {
        if (typeof v === 'string') out[k] = v
      }
      if (isPaytenRawBodyDebug()) {
        console.log('[payten] RAW multipart BANK RESPONSE:\n' + JSON.stringify(out, null, 2))
        const entries = [...formData.entries()].map(([k, v]) => [k, typeof v === 'string' ? v : `[${typeof v}]`] as const)
        console.log('[payten] RAW multipart ENTRIES:\n' + JSON.stringify(entries, null, 2))
      }
      return out
    } catch {
      return null
    }
  }

  /** Payten çoğunlukla `application/x-www-form-urlencoded`; `Content-Type` eksik olsa da aynı gövde gelir. */
  try {
    const raw = await request.text()
    if (isPaytenRawBodyDebug()) {
      const max = 12000
      const slice = raw.length > max ? `${raw.slice(0, max)}\n...[truncated ${raw.length} bytes]` : raw
      console.log('[payten] RAW POST BODY:\n' + slice)
    }
    return parseUrlEncodedFormBody(raw)
  } catch {
    return null
  }
}
