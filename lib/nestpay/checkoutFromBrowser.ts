export type NestpayCheckoutResult =
  | { ok: true; html: string }
  | { ok: false; error: string }

/** Rezervasyon sonrası Nestpay HTML yönlendirme sayfasını alır (aynı sekmede gösterilir). */
export async function requestNestpayCheckoutHtml(bookingId: string): Promise<NestpayCheckoutResult> {
  const res = await fetch('/api/payment/initiate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/html',
    },
    body: JSON.stringify({ bookingId }),
  })
  const text = await res.text()
  const contentType = res.headers.get('content-type') ?? ''
  if (!res.ok) {
    try {
      const j = JSON.parse(text) as { error?: string }
      return { ok: false, error: j.error ?? `Ödeme başlatılamadı (${res.status})` }
    } catch {
      return { ok: false, error: text.trim().slice(0, 240) || `Ödeme başlatılamadı (${res.status})` }
    }
  }
  const looksHtml = contentType.includes('text/html') || text.trimStart().toLowerCase().startsWith('<!doctype') || text.trimStart().startsWith('<html')
  if (!looksHtml) {
    return { ok: false, error: 'Ödeme geçidine yönlendirme sayfası alınamadı.' }
  }
  return { ok: true, html: text }
}

/** PHP örneğindeki gibi otomatik form gönderimi için tüm belgeyi Nestpay HTML ile değiştirir. */
export function navigateWithNestpayCheckoutHtml(html: string): void {
  document.open()
  document.write(html)
  document.close()
}
