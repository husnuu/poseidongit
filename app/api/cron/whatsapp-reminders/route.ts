/**
 * GET /api/cron/whatsapp-reminders
 *
 * Yaklaşan turlara WhatsApp hatırlatması (24 saat ve 2 saat kala). Her
 * yolcu her hatırlatmayı tam bir kez alır (whatsapp_messages tablosu).
 * 15 dakikada bir çalıştırılması önerilir; saatte bir de doğru çalışır.
 *
 * Tetikleme:
 *   - Vercel Cron (Pro plan): vercel.json → { "path": "/api/cron/whatsapp-reminders", "schedule": "*\/15 * * * *" }
 *   - Harici zamanlayıcı (ör. cron-job.org): GET …/api/cron/whatsapp-reminders  +  Authorization: Bearer CRON_SECRET
 */
import { NextRequest, NextResponse } from 'next/server'
import { runWhatsAppReminderSweep } from '@/lib/whatsapp/notifications'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  // Hatırlatma görevi müşteriye mesaj gönderdiği için secret ZORUNLU (üretimde).
  if (!secret) return process.env.NODE_ENV !== 'production'
  return (
    request.headers.get('authorization') === `Bearer ${secret}` ||
    request.nextUrl.searchParams.get('secret') === secret
  )
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const summary = await runWhatsAppReminderSweep()
    return NextResponse.json({ ok: true, ...summary })
  } catch (e) {
    console.error('[cron/whatsapp-reminders] failed', e)
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
