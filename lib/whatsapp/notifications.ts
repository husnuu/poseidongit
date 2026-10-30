import { supabase } from '@/lib/supabase'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { todayStrIstanbul } from '@/lib/istanbulTime'
import {
  isWhatsAppEnabled,
  whatsappTemplateLanguage,
  whatsappTemplateName,
  type WhatsAppTemplateKind,
} from './config'
import { sendWhatsAppTemplate, waParam, type WaTemplateComponent } from './cloudApi'
import { claimWhatsAppMessage, finishWhatsAppMessage } from './log'
import { buildWaBookingContext, loadBookingRow, waUrlSuffix, type WaBookingContext } from './bookingContext'
import { DISRUPTION_PRESETS, asTemplateLang, renderTemplateBody, WHATSAPP_TEMPLATES } from './templates'

export type WaOutcome =
  | { result: 'sent'; messageId: string }
  | { result: 'skipped'; reason: string }
  | { result: 'failed'; error: string }

const ACTIVE_STATUSES = new Set(['paid', 'confirmed'])

/** Şablon değişkenlerinin değerleri (sırası templates.ts → paramNames ile aynı). */
export function templateValues(kind: WhatsAppTemplateKind, ctx: WaBookingContext, message?: string): string[] {
  const time = ctx.time ?? '—'
  const boarding = ctx.boardingTime ?? time
  switch (kind) {
    case 'confirmation':
      return [ctx.firstName, ctx.tourTitle, ctx.dateLabel, time, ctx.meetingPoint, ctx.reservationCode]
    case 'reminder_24h':
      return [ctx.firstName, ctx.tourTitle, ctx.dateLabel, time, boarding, ctx.meetingPoint, ctx.mapLink]
    case 'reminder_2h':
      return [ctx.firstName, ctx.tourTitle, time, boarding, ctx.meetingPoint, ctx.mapLink]
    case 'disruption':
      return [ctx.firstName, ctx.dateLabel, ctx.tourTitle, message ?? '—']
  }
}

export function buildComponents(kind: WhatsAppTemplateKind, ctx: WaBookingContext, message?: string): WaTemplateComponent[] {
  const def = WHATSAPP_TEMPLATES[kind]
  const comps: WaTemplateComponent[] = []
  if (def.headerImage) {
    comps.push({ type: 'header', parameters: [{ type: 'image', image: { link: ctx.ticketImageUrl } }] })
  }
  comps.push({
    type: 'body',
    parameters: templateValues(kind, ctx, message).map((v, i) => ({
      type: 'text' as const,
      // Duyuru metni daha uzun olabilir; diğerleri kısa alanlar.
      text: waParam(v, kind === 'disruption' && i === 3 ? 700 : 300),
    })),
  })
  comps.push({
    type: 'button',
    sub_type: 'url',
    index: '0',
    parameters: [{ type: 'text', text: waUrlSuffix(def.button.target === 'manage' ? ctx.manageUrl : ctx.ticketUrl) }],
  })
  return comps
}

/** Önizleme (admin paneli): mesajın müşteriye görüneceği hali. */
export function previewMessage(kind: WhatsAppTemplateKind, ctx: WaBookingContext, message?: string) {
  const language = whatsappTemplateLanguage(ctx.locale)
  const lang = asTemplateLang(language)
  const def = WHATSAPP_TEMPLATES[kind]
  return {
    template: whatsappTemplateName(kind),
    language,
    body: renderTemplateBody(kind, lang, templateValues(kind, ctx, message)),
    buttonText: def.button.text[lang],
    buttonUrl: def.button.target === 'manage' ? ctx.manageUrl : ctx.ticketUrl,
    headerImageUrl: def.headerImage ? ctx.ticketImageUrl : null,
  }
}

/**
 * Tek mesaj gönderimi: kontrol → kayıt ayır (tekrarı önler) → gönder → kaydı güncelle.
 * `requireLog`: kayıt tablosu yoksa gönderme (zamanlanmış hatırlatmalar için —
 * aksi halde her çalışmada aynı mesaj tekrar giderdi).
 */
async function sendForBooking(
  kind: WhatsAppTemplateKind,
  logKind: string,
  ctx: WaBookingContext,
  opts: { requireLog: boolean; message?: string; toOverride?: string }
): Promise<WaOutcome> {
  if (!isWhatsAppEnabled()) return { result: 'skipped', reason: 'not_configured' }
  if (ctx.optedOut && !opts.toOverride) return { result: 'skipped', reason: 'opted_out' }
  const to = opts.toOverride ?? ctx.phone
  if (!to) return { result: 'skipped', reason: 'no_valid_phone' }

  const template = whatsappTemplateName(kind)
  const language = whatsappTemplateLanguage(ctx.locale)
  const claim = await claimWhatsAppMessage({ bookingId: ctx.bookingId, kind: logKind, toPhone: to, template, language })
  if (claim.state === 'duplicate') return { result: 'skipped', reason: 'already_sent' }
  if (claim.state === 'table_missing' && opts.requireLog) {
    console.error('[whatsapp] whatsapp_messages tablosu yok — docs/supabase-whatsapp.sql çalıştırılmalı. Hatırlatma gönderilmedi.')
    return { result: 'skipped', reason: 'log_table_missing' }
  }
  if (claim.state === 'error') console.error('[whatsapp] log claim failed', { logKind, message: claim.message })

  const res = await sendWhatsAppTemplate({ to, template, language, components: buildComponents(kind, ctx, opts.message) })
  if (claim.state === 'claimed') {
    await finishWhatsAppMessage(claim.id, res.ok
      ? { status: 'sent', waMessageId: res.messageId }
      : { status: 'failed', error: res.error })
  }
  if (res.ok) return { result: 'sent', messageId: res.messageId }
  console.error('[whatsapp] send failed', { bookingId: ctx.bookingId, kind, error: res.error })
  return { result: 'failed', error: res.error }
}

/** Ödeme onayı (veya kapıda ödemeli rezervasyon) sonrası: bilet görselli onay mesajı. */
export async function sendBookingConfirmationWhatsApp(
  bookingId: string,
  opts: { allowPending?: boolean; logKind?: string } = {}
): Promise<WaOutcome> {
  if (!isWhatsAppEnabled()) return { result: 'skipped', reason: 'not_configured' }
  try {
    const row = await loadBookingRow(bookingId)
    if (!row) return { result: 'skipped', reason: 'booking_not_found' }
    const status = (row.status ?? '').toString()
    if (!ACTIVE_STATUSES.has(status) && !(opts.allowPending && status === 'pending')) {
      return { result: 'skipped', reason: `status_${status || 'unknown'}` }
    }
    const ctx = await buildWaBookingContext(row)
    if (!ctx) return { result: 'skipped', reason: 'no_access_token' }
    return await sendForBooking('confirmation', opts.logKind ?? 'confirmation', ctx, { requireLog: false })
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    console.error('[whatsapp] confirmation failed', { bookingId, error })
    return { result: 'failed', error }
  }
}

/**
 * Zamanlanmış görev: yaklaşan turlara 24 saat ve 2 saat kala hatırlatma.
 * Pencereler geniş tutuldu (24s: 6–26 saat kala, 2s: 0,5–2,5 saat kala) —
 * görev saatte bir de çalışsa her yolcu her hatırlatmayı tam bir kez alır.
 * Turdan 6 saatten kısa süre önce alınan rezervasyonlara 24s hatırlatması gitmez
 * (zaten yeni onay mesajı aldılar).
 */
export async function runWhatsAppReminderSweep(nowMs = Date.now()) {
  const summary = { checked: 0, sent: 0, skipped: 0, failed: 0, enabled: isWhatsAppEnabled(), details: [] as string[] }
  if (!summary.enabled) return summary

  const today = todayStrIstanbul()
  const until = new Date(`${today}T00:00:00Z`)
  until.setUTCDate(until.getUTCDate() + 2)
  const untilStr = until.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .gte('date', today)
    .lte('date', untilStr)
    .in('status', [...ACTIVE_STATUSES])
  if (error) throw new Error(`reminder query failed: ${error.message}`)

  for (const row of (data ?? []) as SupabaseBookingRow[]) {
    summary.checked += 1
    let ctx: WaBookingContext | null = null
    try {
      ctx = await buildWaBookingContext(row)
    } catch (e) {
      summary.failed += 1
      summary.details.push(`${row.id}: context ${e instanceof Error ? e.message : String(e)}`)
      continue
    }
    if (!ctx?.departureAt) {
      summary.skipped += 1
      continue
    }
    const hoursLeft = (ctx.departureAt - nowMs) / 3_600_000
    const kind: WhatsAppTemplateKind | null =
      hoursLeft > 0.5 && hoursLeft <= 2.5 ? 'reminder_2h' : hoursLeft > 6 && hoursLeft <= 26 ? 'reminder_24h' : null
    if (!kind) {
      summary.skipped += 1
      continue
    }
    const out = await sendForBooking(kind, kind, ctx, { requireLog: true })
    if (out.result === 'sent') summary.sent += 1
    else if (out.result === 'failed') {
      summary.failed += 1
      summary.details.push(`${row.id}: ${out.error}`)
    } else summary.skipped += 1
    if (out.result === 'skipped' && out.reason === 'log_table_missing') break
  }
  return summary
}

export type DisruptionPreset = keyof typeof DISRUPTION_PRESETS

/** Bir seferin (tarih + isteğe bağlı tur/saat) aktif rezervasyonları. */
export async function findTripBookings(filter: { date: string; tourId?: string | null; time?: string | null }) {
  let q = supabase.from('bookings').select('*').eq('date', filter.date).in('status', [...ACTIVE_STATUSES])
  if (filter.tourId) q = q.eq('tour_id', filter.tourId)
  const { data, error } = await q
  if (error) throw new Error(`trip query failed: ${error.message}`)
  let rows = (data ?? []) as SupabaseBookingRow[]
  if (filter.time) rows = rows.filter((r) => !r.time || String(r.time).slice(0, 5) === filter.time)
  return rows
}

/**
 * İptal / gecikme duyurusu — seferdeki tüm yolculara. `broadcastId` aynı
 * duyurunun bir yolcuya iki kez gitmesini engeller (yeniden denemede güvenli).
 */
export async function sendDisruptionBroadcast(input: {
  broadcastId: string
  rows: SupabaseBookingRow[]
  preset: DisruptionPreset | 'custom'
  newTime?: string
  customMessage?: string
}) {
  const summary = { total: input.rows.length, sent: 0, skipped: 0, failed: 0, details: [] as string[] }
  for (const row of input.rows) {
    const ctx = await buildWaBookingContext(row).catch(() => null)
    if (!ctx) {
      summary.skipped += 1
      continue
    }
    const lang = asTemplateLang(whatsappTemplateLanguage(ctx.locale))
    const message =
      input.preset === 'custom'
        ? (input.customMessage ?? '').trim()
        : DISRUPTION_PRESETS[input.preset][lang](input.newTime?.trim() ?? '')
    if (!message) {
      summary.skipped += 1
      continue
    }
    const out = await sendForBooking('disruption', `disruption:${input.broadcastId}`, ctx, { requireLog: false, message })
    if (out.result === 'sent') summary.sent += 1
    else if (out.result === 'failed') {
      summary.failed += 1
      summary.details.push(`${row.id}: ${out.error}`)
    } else {
      summary.skipped += 1
      summary.details.push(`${row.id}: ${out.reason}`)
    }
  }
  return summary
}

/** Admin "test gönderimi": seçili rezervasyonun mesajını verilen numaraya yollar. */
export async function sendTestMessage(input: {
  bookingId: string
  kind: WhatsAppTemplateKind
  to: string
  message?: string
}): Promise<WaOutcome> {
  const row = await loadBookingRow(input.bookingId)
  if (!row) return { result: 'skipped', reason: 'booking_not_found' }
  const ctx = await buildWaBookingContext(row)
  if (!ctx) return { result: 'skipped', reason: 'no_access_token' }
  return sendForBooking(input.kind, `test:${input.kind}:${Date.now()}`, ctx, {
    requireLog: false,
    message: input.message,
    toOverride: input.to,
  })
}

export { buildWaBookingContext, loadBookingRow }
export type { SupabaseBookingRow }
