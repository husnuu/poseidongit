/**
 * Admin — WhatsApp bildirimleri.
 *   GET                         → durum (yapılandırıldı mı), son mesajlar
 *   GET ?date=YYYY-MM-DD[&tourId][&time] → o seferin yolcu sayısı + örnek önizleme
 *   POST { action: 'broadcast', date, tourId?, time?, preset, newTime?, customMessage? }
 *   POST { action: 'test', bookingId, kind, to, message? }
 *   POST { action: 'resend_confirmation', bookingId }
 */
import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { authorizeAdmin } from '@/lib/adminAuthServer'
import { isWhatsAppEnabled, whatsappTemplateName, type WhatsAppTemplateKind } from '@/lib/whatsapp/config'
import { listRecentWhatsAppMessages } from '@/lib/whatsapp/log'
import { maskPhone, normalizeWhatsAppPhone } from '@/lib/whatsapp/phone'
import {
  buildWaBookingContext,
  findTripBookings,
  previewMessage,
  sendBookingConfirmationWhatsApp,
  sendDisruptionBroadcast,
  sendTestMessage,
  type DisruptionPreset,
} from '@/lib/whatsapp/notifications'
import { DISRUPTION_PRESETS, asTemplateLang } from '@/lib/whatsapp/templates'
import { whatsappTemplateLanguage } from '@/lib/whatsapp/config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const KINDS: WhatsAppTemplateKind[] = ['confirmation', 'reminder_24h', 'reminder_2h', 'disruption']

export async function GET(request: Request) {
  if (!(await authorizeAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(request.url)
  const date = url.searchParams.get('date')?.trim()
  try {
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const rows = await findTripBookings({
        date,
        tourId: url.searchParams.get('tourId')?.trim() || null,
        time: url.searchParams.get('time')?.trim() || null,
      })
      const withPhone = rows.filter((r) => normalizeWhatsAppPhone(r.customer_phone))
      const optedOut = rows.filter((r) => (r as { whatsapp_opt_in?: boolean | null }).whatsapp_opt_in === false)
      const sample = rows[0] ? await buildWaBookingContext(rows[0]).catch(() => null) : null
      const preset = (url.searchParams.get('preset') as DisruptionPreset | 'custom' | null) ?? 'weather_cancel'
      const newTime = url.searchParams.get('newTime') ?? ''
      const custom = url.searchParams.get('message') ?? ''
      const lang = sample ? asTemplateLang(whatsappTemplateLanguage(sample.locale)) : 'tr'
      const message = preset === 'custom' ? custom : DISRUPTION_PRESETS[preset]?.[lang]?.(newTime) ?? ''
      return NextResponse.json({
        total: rows.length,
        withPhone: withPhone.length,
        optedOut: optedOut.length,
        tours: [...new Set(rows.map((r) => `${r.tour_id ?? ''}|${r.tour_title ?? ''}`))].map((s) => {
          const [id, title] = s.split('|')
          return { id, title }
        }),
        preview: sample ? previewMessage('disruption', sample, message) : null,
        bookings: rows.slice(0, 200).map((r) => ({
          id: r.id,
          name: `${r.customer_first_name ?? ''} ${r.customer_last_name ?? ''}`.trim(),
          phone: maskPhone(normalizeWhatsAppPhone(r.customer_phone)),
          time: r.time ?? null,
          tourTitle: r.tour_title ?? null,
          optedOut: (r as { whatsapp_opt_in?: boolean | null }).whatsapp_opt_in === false,
        })),
      })
    }
    const { rows, tableMissing } = await listRecentWhatsAppMessages(60)
    return NextResponse.json({
      enabled: isWhatsAppEnabled(),
      tableMissing,
      templates: Object.fromEntries(KINDS.map((k) => [k, whatsappTemplateName(k)])),
      messages: rows.map((r) => ({ ...r, to_phone: maskPhone(r.to_phone) })),
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!(await authorizeAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const action = String(body.action ?? '')
  try {
    if (action === 'broadcast') {
      const date = String(body.date ?? '').trim()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'Tarih gerekli' }, { status: 400 })
      const preset = String(body.preset ?? '') as DisruptionPreset | 'custom'
      if (!['weather_cancel', 'delay', 'custom'].includes(preset)) {
        return NextResponse.json({ error: 'Geçersiz duyuru türü' }, { status: 400 })
      }
      const customMessage = String(body.customMessage ?? '').trim()
      if (preset === 'custom' && customMessage.length < 10) {
        return NextResponse.json({ error: 'Duyuru metni en az 10 karakter olmalı' }, { status: 400 })
      }
      const rows = await findTripBookings({
        date,
        tourId: body.tourId ? String(body.tourId) : null,
        time: body.time ? String(body.time) : null,
      })
      if (rows.length === 0) return NextResponse.json({ error: 'Bu seferde aktif rezervasyon yok' }, { status: 404 })
      const broadcastId = typeof body.broadcastId === 'string' && body.broadcastId ? body.broadcastId : randomUUID()
      const summary = await sendDisruptionBroadcast({
        broadcastId,
        rows,
        preset,
        newTime: body.newTime ? String(body.newTime) : undefined,
        customMessage,
      })
      return NextResponse.json({ ok: true, broadcastId, ...summary })
    }
    if (action === 'test') {
      const kind = String(body.kind ?? '') as WhatsAppTemplateKind
      const to = normalizeWhatsAppPhone(String(body.to ?? ''))
      if (!KINDS.includes(kind)) return NextResponse.json({ error: 'Geçersiz mesaj türü' }, { status: 400 })
      if (!to) return NextResponse.json({ error: 'Geçerli bir telefon numarası girin' }, { status: 400 })
      const out = await sendTestMessage({
        bookingId: String(body.bookingId ?? ''),
        kind,
        to,
        message: body.message ? String(body.message) : undefined,
      })
      return NextResponse.json(out)
    }
    if (action === 'resend_confirmation') {
      // Ayrı kayıt türüyle: daha önce gönderilmiş/başarısız olmuş onay da yeniden gider.
      const out = await sendBookingConfirmationWhatsApp(String(body.bookingId ?? ''), {
        logKind: `confirmation:resend:${Date.now()}`,
      })
      return NextResponse.json(out)
    }
    return NextResponse.json({ error: 'Bilinmeyen işlem' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
