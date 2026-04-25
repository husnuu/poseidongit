/**
 * Payten tarayıcı dönüşü (okUrl/failUrl) — sipariş kodu çıkarma ve query param güvenliği.
 * Supabase içermez; ödeme route handler’ları bu modülü yüklerek ağır istemci zincirinden kaçınır.
 */

/** Onay / hata sayfası `bookingId` query param güvenliği (ham metin).
 *  UUID formatı (tire içerir) ve alfanümerik/tire/nokta/alt çizgi değerler kabul edilir. */
export function isSafePaytenOrderLookupToken(value: string): boolean {
  const t = value.trim()
  if (t.length < 1 || t.length > 80) return false
  return /^[A-Za-z0-9_.\-]+$/.test(t)
}

/**
 * okUrl / failUrl POST gövdesinden sipariş kodu (`oid`, `ReturnOid`; büyük/küçük harf duyarsız).
 * İkisi de dolu ve farklıysa yönlendirmede `oid` önceliklidir.
 */
export function extractPaytenOrderLookupTokenFromPostRecord(record: Record<string, string>): string {
  const byLower = new Map<string, string>()
  for (const [k, v] of Object.entries(record)) {
    if (typeof v !== 'string') continue
    const t = v.trim()
    if (!t) continue
    byLower.set(k.toLowerCase(), t)
  }
  const oid = byLower.get('oid') ?? ''
  const returnOid = byLower.get('returnoid') ?? ''
  if (oid && returnOid && oid !== returnOid) {
    console.warn('[payten:extract] oid ve ReturnOid farklı; redirect sorgusu için oid kullanılıyor', {
      oid,
      returnOid,
    })
  }
  return oid || returnOid
}
