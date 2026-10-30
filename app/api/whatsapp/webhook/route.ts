/**
 * Meta WhatsApp webhook — mesaj durum bildirimleri (iletildi / okundu / başarısız).
 *
 * Meta App Dashboard → WhatsApp → Configuration → Webhook:
 *   Callback URL: https://<site>/api/whatsapp/webhook
 *   Verify token: WHATSAPP_WEBHOOK_VERIFY_TOKEN
 *   Abone olunacak alan: messages
 * İmza doğrulaması: WHATSAPP_APP_SECRET (X-Hub-Signature-256).
 */
import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { updateWhatsAppStatusByMessageId, type WaLogStatus } from '@/lib/whatsapp/log'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const verify = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim()
  if (verify && sp.get('hub.mode') === 'subscribe' && sp.get('hub.verify_token') === verify) {
    return new NextResponse(sp.get('hub.challenge') ?? '', { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

function validSignature(raw: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET?.trim()
  if (!secret) return process.env.NODE_ENV !== 'production'
  if (!header?.startsWith('sha256=')) return false
  const expected = createHmac('sha256', secret).update(raw).digest('hex')
  const a = Buffer.from(header.slice(7), 'hex')
  const b = Buffer.from(expected, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

const STATUS_MAP: Record<string, WaLogStatus> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
}

export async function POST(request: NextRequest) {
  const raw = await request.text()
  if (!validSignature(raw, request.headers.get('x-hub-signature-256'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  try {
    const body = JSON.parse(raw) as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            statuses?: Array<{ id?: string; status?: string; errors?: Array<{ title?: string; message?: string; code?: number }> }>
          }
        }>
      }>
    }
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const st of change.value?.statuses ?? []) {
          const mapped = st.status ? STATUS_MAP[st.status] : undefined
          if (!st.id || !mapped) continue
          const err = st.errors?.[0]
          await updateWhatsAppStatusByMessageId(
            st.id,
            mapped,
            err ? `${err.code ?? ''} ${err.title ?? err.message ?? ''}`.trim() : null
          )
        }
      }
    }
  } catch (e) {
    console.error('[whatsapp/webhook] parse failed', e)
  }
  // Meta her zaman 200 bekler; aksi halde tekrar dener.
  return NextResponse.json({ ok: true })
}
