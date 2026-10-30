import { whatsappApiVersion, whatsappCredentials } from './config'

/** Şablon parametrelerinde Meta'nın reddettiği karakterleri temizler
    (yeni satır, sekme, 4'ten fazla ardışık boşluk) ve uzunluğu sınırlar. */
export function waParam(value: string | number | null | undefined, max = 300): string {
  const s = String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/ {4,}/g, '   ')
    .trim()
  const out = s || '—'
  return out.length > max ? `${out.slice(0, max - 1)}…` : out
}

export type WaTemplateComponent =
  | { type: 'header'; parameters: Array<{ type: 'image'; image: { link: string } }> }
  | { type: 'body'; parameters: Array<{ type: 'text'; text: string }> }
  | {
      type: 'button'
      sub_type: 'url'
      index: string
      parameters: Array<{ type: 'text'; text: string }>
    }

export type WaSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string; status?: number }

/** Onaylı bir şablonu tek alıcıya gönderir (POST /{phone-number-id}/messages). */
export async function sendWhatsAppTemplate(params: {
  to: string
  template: string
  language: string
  components: WaTemplateComponent[]
}): Promise<WaSendResult> {
  const creds = whatsappCredentials()
  if (!creds) return { ok: false, error: 'not_configured' }

  const url = `https://graph.facebook.com/${whatsappApiVersion()}/${encodeURIComponent(creds.phoneNumberId)}/messages`
  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: params.to,
    type: 'template',
    template: {
      name: params.template,
      language: { code: params.language },
      components: params.components,
    },
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${creds.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))
    const json = (await res.json().catch(() => ({}))) as {
      messages?: Array<{ id?: string }>
      error?: { message?: string; code?: number; error_data?: { details?: string } }
    }
    const id = json.messages?.[0]?.id
    if (res.ok && id) return { ok: true, messageId: id }
    const err = json.error
    const detail = err?.error_data?.details ? ` — ${err.error_data.details}` : ''
    return {
      ok: false,
      status: res.status,
      error: err?.message ? `${err.code ?? res.status}: ${err.message}${detail}` : `HTTP ${res.status}`,
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
