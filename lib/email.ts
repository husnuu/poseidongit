import { Resend } from 'resend'
import QRCode from 'qrcode'
import { buildGoogleCalendarUrl } from '@/lib/calendar'
import { timeMinutesBefore } from '@/lib/boardingTime'
import { getBaseUrl, getSiteName } from '@/lib/seo'
import {
  manageBookingUrl,
  manageBookingUrlForLocale,
  voucherPdfUrl,
  getEmailBaseUrl,
  customerTicketViewUrl,
  paymentLinkUrlForLocale,
} from '@/lib/siteUrls'
import type { SiteLocale } from '@/lib/i18n/config'
import {
  normalizeBookingFlowLocale,
  bookingEmailPremiumStrings,
  formatParticipantCountsLine,
  paymentLinkPageCopy,
} from '@/lib/i18n/bookingFlowLocale'
import { supabase } from '@/lib/supabase'
import type { SupabaseBookingRow } from '@/lib/bookingsSupabase'
import { client, urlFor } from '@/lib/sanity'
import { tourImageAndPickupQuery, siteSettingsLogoQuery } from '@/lib/queries'
import { mapImageUrlFromEmbed } from '@/lib/staticMap'
import { additionalTravelerLabels, normalizeAdditionalTravelersFromStorage } from '@/lib/bookingAdditionalTravelers'
import { computeDepositAmounts, type TourDepositConfig } from '@/lib/bookingDepositAmount'
import { getDailyManifestReport, type DailyManifestTrip } from '@/lib/reports/dailyManifest'

const DEFAULT_FROM = (() => {
  const n = process.env.NEXT_PUBLIC_SITE_NAME || 'Çeşme Poseidon Booking'
  return `${n} <noreply@cesmetekneturu.net>`
})()

/** E-postadaki buton linkleri için production-safe domain (cesmetekneturu.net). */
const OFFICIAL_EMAIL_DOMAIN = 'https://cesmetekneturu.net'

/** Transactional e-posta: site ile uyumlu lacivert + nötr yüzeyler. */
const EMAIL_NAVY = '#0c1929'
const EMAIL_BG_PAGE = '#f0f2f6'
const EMAIL_TEXT_BODY = '#334155'
const EMAIL_MUTED = '#64748b'
const EMAIL_BORDER = '#e2e8f0'
const EMAIL_SURFACE = '#ffffff'
/** E-postada kullanılan minimal çizgi ikonları (siyah-gri). */
const EMAIL_ICON_STROKE = '#111827'

function emailIconSvg(
  name: 'check' | 'clock' | 'x' | 'ticketLight' | 'phone' | 'mail'
): string {
  const s = EMAIL_ICON_STROKE
  switch (name) {
    case 'check':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
    case 'clock':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`
    case 'x':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`
    case 'ticketLight':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/></svg>`
    case 'phone':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`
    case 'mail':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="m22 6-10 7L2 6"/></svg>`
    default:
      return ''
  }
}

/** @deprecated QR e-postadan kaldırıldı. */
export type QrEmbedMethod = 'base64' | 'cid'

export interface BookingEmailPayload {
  bookingId: string
  tourTitle: string
  date: string
  time?: string
  className: string
  /** First Class localar (L1–L10). Eski tek loca için firstClassLoca da kullanılabilir. */
  firstClassLocas?: string[]
  firstClassLoca?: string
  counts: { adult: number; child: number; infant: number }
  totalPrice: number
  currency: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
    note?: string
  }
  /** Opsiyonel: tur kapak görseli URL (e-posta şablonunda kullanılır). */
  tourImageUrl?: string
  /** Opsiyonel: rezervasyon sayfası URL (CTA butonu). Yoksa # kullanılır. */
  bookingUrl?: string
  /** Opsiyonel: dil (örn. Turkish). */
  language?: string
  /** Opsiyonel: toplanma / pickup bilgisi. */
  pickup?: string
  /** Tur mealMenu ile seçilen yemek tercihi. */
  mealPreference?: { key: string; label: string; counts?: Array<{ key: string; label: string; count: number }> }
  /** Ana müşteri dışındaki yolcular (web rezervasyonunda girilen ad-soyad). */
  additionalTravelers?: Array<{ firstName: string; lastName: string; mealPreference?: { key: string; label: string } }>
  /** Opsiyonel: etkinlik süresi (saat). Google Calendar linki için; yoksa 2. */
  durationHours?: number
  /** Opsiyonel: IANA timezone (örn. Europe/Istanbul). Yoksa Europe/Istanbul. */
  timeZone?: string
  /** Opsiyonel: site logosu URL (PDF bilet üstünde kullanılır). */
  logoUrl?: string
  /** Opsiyonel: ödenen tutar (PDF bilette "Ödenen Tutar" satırı için). */
  paidNow?: number
  /** E-posta içindeki buton linkleri için site base URL (örn. https://siteniz.com). Boşsa env kullanılır. */
  siteBaseUrl?: string
  /** Güvenli bilet/voucher linkleri için erişim tokenı. Yeni rezervasyonlarda mutlaka gönderin. */
  accessToken?: string
  /** Durum bilgisi — PDF’te ödenen tutar gösterimi için (satır yolu başarısız olursa). */
  status?: string
  /** Müşteri arayüz dili (tr/en/de) — e-posta metinleri ve bilet URL’leri. */
  siteLocale?: SiteLocale
  /** Opsiyonel: Sanity tur _id — kapora hesabı için. */
  tourId?: string
  /** Opsiyonel: toplanma noktası harita linki (Sanity whereSection.locationMapLink). */
  mapLink?: string
  /** Opsiyonel: toplanma noktası statik harita görseli (whereSection.mapEmbedUrl'den türetilir). */
  mapImageUrl?: string
  /** Opsiyonel: e-postaya CID ile eklenmiş QR görselinin content-id'si (varsa biniş kartında gösterilir). */
  qrCid?: string
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) return null
  return new Resend(key)
}

function getFrom(): string {
  return process.env.EMAIL_FROM?.trim() || DEFAULT_FROM
}

/** Rezervasyon ve form bildirimleri — ADMIN_EMAIL + ADMIN_EMAIL_2… veya virgüllü liste. */
const ADMIN_EMAIL_ENV_KEYS = [
  'ADMIN_EMAIL',
  'ADMIN_EMAIL_2',
  'ADMIN_EMAIL_3',
  'ADMIN_EMAIL_4',
  'ADMIN_NOTIFICATION_EMAILS',
] as const

function getAdminNotificationEmails(): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  const addRaw = (raw: string | undefined) => {
    if (!raw?.trim()) return
    for (const part of raw.split(',')) {
      const email = part.trim()
      if (!email || !email.includes('@')) continue
      const key = email.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(email)
    }
  }

  for (const envKey of ADMIN_EMAIL_ENV_KEYS) {
    addRaw(process.env[envKey])
  }

  return out
}

type ResendAttachment = { filename: string; content: Buffer; contentId?: string }

async function sendToAdminRecipients(
  resend: Resend,
  options: {
    from: string
    subject: string
    html: string
    replyTo?: string
    attachments?: ResendAttachment[]
    logContext?: string
  }
): Promise<void> {
  const recipients = getAdminNotificationEmails()
  if (recipients.length === 0) {
    console.warn(
      '[email] Admin bildirimi gönderilmedi: ADMIN_EMAIL veya ADMIN_EMAIL_2 tanımlı değil.',
      options.logContext ?? ''
    )
    return
  }

  for (const to of recipients) {
    const { error } = await resend.emails.send({
      from: options.from,
      to: [to],
      subject: options.subject,
      html: options.html,
      ...(options.replyTo ? { replyTo: options.replyTo } : {}),
      ...(options.attachments?.length ? { attachments: options.attachments } : {}),
    })
    if (error) {
      console.error('[email] Admin e-postası gönderilemedi:', to, options.logContext ?? '', error)
    } else {
      console.info('[email] Admin bildirimi gönderildi:', to, options.logContext ?? '')
    }
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatEmailBookingDate(dateStr: string, loc: SiteLocale): string {
  try {
    const raw = /^\d{4}-\d{2}-\d{2}/.test(dateStr) ? dateStr.slice(0, 10) : dateStr
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return dateStr
    const tag = loc === 'en' ? 'en-GB' : loc === 'de' ? 'de-DE' : 'tr-TR'
    return d.toLocaleDateString(tag, { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function guestFallbackLabel(loc: SiteLocale, index: number): string {
  if (loc === 'en') return `Guest ${index + 2}`
  if (loc === 'de') return `Gast ${index + 2}`
  return `Yolcu ${index + 2}`
}

/** Sınıf + First Class loca metni (tek veya çoklu). */
function classDisplay(p: BookingEmailPayload, loc: SiteLocale): string {
  const t = bookingEmailPremiumStrings(loc)
  const locas = (p.firstClassLocas?.length ? p.firstClassLocas : p.firstClassLoca ? [p.firstClassLoca] : []).join(
    ', '
  )
  return locas ? `${p.className?.trim() || '—'} · ${t.locaPrefix} ${locas}` : (p.className?.trim() || '—')
}

/** E-postada gösterilecek kısa rezervasyon kodu — UUID'nin ilk (tire öncesi) bölümü. */
function shortReservationCode(bookingId: string): string {
  const t = bookingId.trim()
  return (t.split('-')[0] || t).toUpperCase()
}

function formatAdditionalTravelersHtml(p: BookingEmailPayload, loc: SiteLocale): string {
  const list = (p.additionalTravelers ?? []).filter((t) => (t.firstName?.trim() || t.lastName?.trim()))
  if (list.length === 0) return ''
  const t = bookingEmailPremiumStrings(loc)
  const labels = additionalTravelerLabels(p.counts)
  const items = list
    .map((tr, i) => {
      const role = escapeHtml(labels[i] ?? guestFallbackLabel(loc, i))
      const name = escapeHtml(`${tr.firstName} ${tr.lastName}`.trim())
      const meal = tr.mealPreference?.label?.trim()
        ? ` <span style="color:#64748b;">· ${escapeHtml(t.mealInline)}: ${escapeHtml(tr.mealPreference.label.trim())}</span>`
        : ''
      return `<li style="margin:0 0 6px 0;"><strong>${role}:</strong> ${name}${meal}</li>`
    })
    .join('')
  return `
    <p style="margin: 12px 0 6px;"><strong>${escapeHtml(t.otherTravelers)}</strong></p>
    <ul style="margin: 0; padding-left: 18px;">${items}</ul>
  `
}

function mealCountsLine(
  counts: Array<{ key: string; label: string; count: number }> | undefined
): string {
  if (!counts || counts.length === 0) return ''
  const normalized = counts.filter((x) => x && x.count > 0 && x.label?.trim())
  if (normalized.length === 0) return ''
  return normalized.map((x) => `${x.label.trim()} (${x.count})`).join(' · ')
}

function formatAdminPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

function resolveEmailPaymentAmounts(
  p: BookingEmailPayload,
  options?: { isPaid?: boolean }
): { paidNow: number; remainingAmount: number } {
  if (p.paidNow != null && p.paidNow >= 0) {
    return { paidNow: p.paidNow, remainingAmount: Math.max(0, p.totalPrice - p.paidNow) }
  }
  if (options?.isPaid !== false) {
    return { paidNow: p.totalPrice, remainingAmount: 0 }
  }
  return { paidNow: 0, remainingAmount: p.totalPrice }
}

async function enrichPayloadWithDepositAmounts(
  payload: BookingEmailPayload,
  tourId?: string
): Promise<BookingEmailPayload> {
  if (payload.paidNow != null && payload.paidNow >= 0) return payload
  const tid = (tourId ?? payload.tourId)?.trim()
  if (!tid || payload.totalPrice <= 0) {
    return { ...payload, paidNow: payload.totalPrice }
  }
  try {
    const tourMeta = await client.fetch<{ deposit?: TourDepositConfig } | null>(tourImageAndPickupQuery, {
      tourId: tid,
    })
    const { paidNow } = computeDepositAmounts(payload.totalPrice, tourMeta?.deposit)
    return { ...payload, paidNow, tourId: tid }
  } catch {
    return { ...payload, paidNow: payload.totalPrice }
  }
}

/** Toplanma noktası harita linki + statik harita görselini Sanity'den getirir (whereSection). */
async function fetchTourMapInfo(
  tourId?: string
): Promise<{ mapLink?: string; mapImageUrl?: string }> {
  const tid = tourId?.trim()
  if (!tid) return {}
  try {
    const row = await client.fetch<{ mapLink?: string | null; mapEmbedUrl?: string | null } | null>(
      `*[_type == "tour" && (_id == $id || slug.current == $id)][0]{ "mapLink": whereSection.locationMapLink, "mapEmbedUrl": whereSection.mapEmbedUrl }`,
      { id: tid }
    )
    return {
      mapLink: row?.mapLink?.trim() || undefined,
      mapImageUrl: mapImageUrlFromEmbed(row?.mapEmbedUrl),
    }
  } catch {
    return {}
  }
}

/** Site logosunu Sanity siteSettings'ten getirir (e-posta üst başlığında kullanılır). */
async function fetchSiteLogoUrl(): Promise<string | undefined> {
  try {
    const row = await client.fetch<{ logo?: { url?: string | null } | null } | null>(
      siteSettingsLogoQuery
    )
    return row?.logo?.url?.trim() || undefined
  } catch {
    return undefined
  }
}

/** Biniş kartı QR görselini PNG buffer olarak üretir (e-postaya CID ile eklenir). */
async function generateQrPngBuffer(url: string): Promise<Buffer | null> {
  try {
    const buf = await QRCode.toBuffer(url, {
      type: 'png',
      width: 240,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    })
    return Buffer.isBuffer(buf) ? buf : Buffer.from(buf)
  } catch {
    return null
  }
}

/**
 * Rezervasyon onay e-postası: table-based, inline CSS, Gmail/Outlook/iOS uyumlu.
 * Max 600px, turuncu header, beyaz card, mavi CTA butonu.
 * qrImageSrc: data:image/png;base64,... (default) veya cid:booking-qr (Nodemailer attachment ile).
 */
function buildConfirmationEmailHtml(
  p: BookingEmailPayload,
  options: { subtitle?: string; buttonText?: string; qrImageSrc?: string } = {}
): string {
  const loc = normalizeBookingFlowLocale(p.siteLocale)
  const dateFormatted = formatEmailBookingDate(p.date, loc)
  const participants = formatParticipantCountsLine(p.counts, loc)
  const customerName = `${p.customer.firstName} ${p.customer.lastName}`.trim() || '—'
  const tourImage = p.tourImageUrl?.trim() || ''
  const bookingUrl = p.bookingUrl?.trim() || '#'
  const viewTicketUrl = customerTicketViewUrl(p.bookingId, p.accessToken, loc)
  const calendarUrl = buildGoogleCalendarUrl({
    tourTitle: p.tourTitle,
    date: p.date,
    time: p.time ?? '00:00',
    durationHours: p.durationHours ?? 2,
    pickup: p.pickup,
    referenceNumber: p.bookingId,
    bookingUrl,
    timeZone: p.timeZone,
  })
  const language = p.language?.trim() || 'Turkish'
  const pickup = p.pickup?.trim() || '—'
  const subtitle = options.subtitle ?? 'Rezervasyonunuz kaydedildi.'
  const buttonText = options.buttonText ?? 'Open booking'
  const qrImageSrc = options.qrImageSrc

  const detailRows = [
    { label: 'Reference', value: p.bookingId, highlight: true },
    { label: 'Date', value: dateFormatted + (p.time ? ` · ${p.time}` : '') },
    { label: 'Participants', value: participants },
    { label: 'Class', value: classDisplay(p, loc) },
    { label: 'Name', value: customerName },
    { label: 'Email', value: p.customer.email || '—' },
    { label: 'Phone', value: p.customer.phone || '—' },
    { label: 'Language', value: language },
    { label: 'Pickup', value: pickup },
    { label: 'Price', value: `${p.totalPrice} ${p.currency}`, price: true },
  ]

  const rowsHtml = detailRows
    .map((row) => {
      const valueStyle = row.highlight
        ? 'color: #0c1929; font-weight: 600;'
        : row.price
          ? 'font-weight: 700; font-size: 18px; color: #1f2937;'
          : 'color: #1f2937;'
      return `<tr>
  <td style="padding: 10px 0 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; vertical-align: top; width: 120px;">${escapeHtml(row.label)}</td>
  <td style="padding: 10px 0 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; vertical-align: top; ${valueStyle}">${escapeHtml(row.value)}</td>
</tr>`
    })
    .join('')

  const imageCell = tourImage
    ? `<td style="padding-right: 16px; vertical-align: top;" width="80"><img src="${escapeHtml(tourImage)}" alt="" width="80" height="80" style="display: block; width: 80px; height: 80px; border-radius: 8px; object-fit: cover;" /></td>`
    : ''

  const qrCell =
    qrImageSrc
      ? `<td style="vertical-align: top; padding-left: 16px; text-align: right;" width="96"><img src="${escapeHtml(qrImageSrc)}" alt="QR" width="96" height="96" style="display: block; width: 96px; height: 96px; border-radius: 8px; border: 1px solid #e5e7eb; margin-left: auto;" /></td>`
      : ''

  return `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rezervasyon Onayı</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px;">
          <tr>
            <td style="background-color: #0c1929; padding: 20px 24px; text-align: center;">
              <span style="color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">CESME POSEIDON</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 0 0 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                <tr>
                  <td style="padding: 24px; border-radius: 12px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        ${imageCell}
                        <td style="vertical-align: top;">
                          <div style="font-size: 18px; font-weight: 700; color: #1f2937; line-height: 1.3;">${escapeHtml(p.tourTitle)}</div>
                          <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">${escapeHtml(subtitle)}</div>
                        </td>
                        ${qrCell}
                      </tr>
                    </table>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 20px;">
                      <tr><td style="border-top: 1px solid #e5e7eb; height: 1px; line-height: 1px; font-size: 1px;">&nbsp;</td></tr>
                    </table>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 8px;">
                      ${rowsHtml}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 24px 0 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${escapeHtml(bookingUrl)}" style="height: 48px; width: 552px; v-text-anchor: middle; border-radius: 8px;" arcsize="16%" strokecolor="#0c1929" fill="t">
                      <v:fill type="tile" color="#0c1929" />
                      <center><a href="${escapeHtml(bookingUrl)}" style="color: #ffffff; font-weight: 600; text-decoration: none;">${escapeHtml(buttonText)}</a></center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${escapeHtml(bookingUrl)}" target="_blank" style="display: inline-block; width: 100%; max-width: 552px; background-color: #0c1929; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 8px; box-sizing: border-box;">${escapeHtml(buttonText)}</a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 24px 0 24px; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #6b7280;">Takviminize eklemek için <a href="${escapeHtml(calendarUrl)}" style="color: #0c1929; text-decoration: underline;">Add to Google Calendar</a>.</p>
              <p style="margin: 8px 0 0 0;"><a href="${escapeHtml(calendarUrl)}" target="_blank" style="display: inline-block; font-size: 14px; font-weight: 500; color: #0c1929; text-decoration: none; padding: 10px 20px; border: 2px solid #0c1929; border-radius: 8px; box-sizing: border-box;">Add to Calendar</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 24px 0 24px; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #6b7280;">Biletinizi sitede görüntülemek için <a href="${escapeHtml(viewTicketUrl)}" style="color: #0c1929; text-decoration: underline;">buraya tıklayın</a>.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 24px 24px 24px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">If you have any questions, reply to this email.</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">&copy; 2026 ${process.env.NEXT_PUBLIC_SITE_NAME || 'Booking'}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildCustomerEmailHtml(p: BookingEmailPayload): string {
  const base = getEmailBaseUrl().replace(/\/$/, '')
  const bookingUrl = p.bookingUrl || `${base}/rezervasyon`
  return buildPremiumConfirmationEmailHtml({ ...p, bookingUrl }, { isPaid: false })
}

type AdminEmailVariant = 'new' | 'paid' | 'manual'

function buildPremiumAdminNotificationHtml(p: BookingEmailPayload, variant: AdminEmailVariant): string {
  const meta = {
    new: { heading: 'Yeni Rezervasyon', subtitle: 'Yeni bir rezervasyon oluşturuldu.' },
    paid: { heading: 'Rezervasyon Ödendi', subtitle: 'Bir rezervasyon ödeme olarak işaretlendi.' },
    manual: { heading: 'Manuel Rezervasyon', subtitle: 'Panelden manuel olarak kaydedildi.' },
  }[variant]

  const dateFormatted = formatDate(p.date)
  const participants = formatParticipantCountsLine(p.counts, 'tr')
  const customerName = `${p.customer.firstName} ${p.customer.lastName}`.trim() || '—'
  const pickup = p.pickup?.trim() || '—'
  const { paidNow, remainingAmount } = resolveEmailPaymentAmounts(p, { isPaid: variant !== 'new' })
  const mealCounts = mealCountsLine(p.mealPreference?.counts)
  const navy = EMAIL_NAVY
  const bg = EMAIL_BG_PAGE

  const detailRow = (label: string, value: string, bold = false) =>
    `<tr>
      <td style="padding:11px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_MUTED};font-size:13px;width:44%;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:11px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${bold ? navy : EMAIL_TEXT_BODY};font-size:13px;font-weight:${bold ? '700' : '500'};text-align:right;vertical-align:top;">${escapeHtml(value)}</td>
    </tr>`

  const extraList = (p.additionalTravelers ?? []).filter((x) => x.firstName?.trim() || x.lastName?.trim())
  const travelerLabels = additionalTravelerLabels(p.counts)
  const extraTravelersRowHtml =
    extraList.length > 0
      ? detailRow(
          'Diğer yolcular',
          extraList
            .map((g, i) => {
              const role = travelerLabels[i] ?? guestFallbackLabel('tr', i)
              const name = `${g.firstName} ${g.lastName}`.trim()
              const meal = g.mealPreference?.label?.trim() ? ` · ${g.mealPreference.label.trim()}` : ''
              return `${role}: ${name}${meal}`
            })
            .join(' | ')
        )
      : ''

  const noteBlock =
    p.customer.note && p.customer.note.trim()
      ? `<tr><td style="background:${EMAIL_SURFACE};padding:0 28px 18px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <div style="background:#fffbeb;border:1px solid #fde68a;border-left:3px solid #d97706;border-radius:8px;padding:14px 16px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#92400e;">Müşteri Notu</p>
      <p style="margin:0;font-size:13px;color:${EMAIL_TEXT_BODY};line-height:1.55;">${escapeHtml(p.customer.note.trim())}</p>
    </div>
  </td></tr>`
      : ''

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${escapeHtml(meta.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${bg};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};">
<tr><td align="center" style="padding:36px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;border-collapse:separate;">

  <tr><td style="background:${navy};height:4px;border-radius:10px 10px 0 0;line-height:4px;font-size:0;">&nbsp;</td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:26px 28px 18px;text-align:center;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0;font-size:21px;font-weight:700;color:${navy};letter-spacing:-0.02em;">${escapeHtml(getSiteName() || 'Poseidon Booking')}</p>
    <p style="margin:6px 0 0;font-size:13px;color:${EMAIL_MUTED};line-height:1.45;">Admin Bildirimi</p>
  </td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:22px 28px 0;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0;font-size:17px;font-weight:700;color:${navy};letter-spacing:-0.02em;">${escapeHtml(meta.heading)}</p>
    <p style="margin:6px 0 0;font-size:14px;color:${EMAIL_MUTED};line-height:1.55;">${escapeHtml(meta.subtitle)}</p>
  </td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:18px 28px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <div style="background:#f8fafc;border:1px solid ${EMAIL_BORDER};border-left:3px solid ${navy};border-radius:8px;padding:16px 18px;">
      <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${EMAIL_MUTED};">Rezervasyon No</p>
      <p style="margin:8px 0 0;font-size:18px;font-weight:700;color:${navy};letter-spacing:0.04em;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;">${escapeHtml(p.bookingId)}</p>
    </div>
  </td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:4px 28px 22px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:${navy};text-transform:uppercase;letter-spacing:0.08em;">Rezervasyon Detayları</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${detailRow('Tur', p.tourTitle)}
      ${detailRow('Tarih', dateFormatted)}
      ${p.time ? detailRow('Kalkış saati', p.time) : ''}
      ${detailRow('Toplanma noktası', pickup)}
      ${detailRow('Misafirler', participants)}
      ${detailRow('Sınıf', classDisplay(p, 'tr'))}
      ${p.mealPreference?.label?.trim() ? detailRow('Yemek tercihi', p.mealPreference.label.trim()) : ''}
      ${mealCounts ? detailRow('Yemek dağılımı', mealCounts) : ''}
      ${extraTravelersRowHtml}
    </table>
  </td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:0 28px 22px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:${navy};text-transform:uppercase;letter-spacing:0.08em;">Ödeme Özeti</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${detailRow('Toplam Tutar', formatAdminPrice(p.totalPrice, p.currency), true)}
      ${detailRow('Ödenen Tutar (kapora)', formatAdminPrice(paidNow, p.currency), true)}
      ${remainingAmount > 0 ? detailRow('Kalan (kapıda nakit)', formatAdminPrice(remainingAmount, p.currency), true) : ''}
    </table>
  </td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:0 28px 22px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:${navy};text-transform:uppercase;letter-spacing:0.08em;">Müşteri Bilgileri</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${detailRow('Ad Soyad', customerName)}
      ${detailRow('E-posta', p.customer.email || '—')}
      ${detailRow('Telefon', p.customer.phone || '—')}
    </table>
  </td></tr>

  ${noteBlock}

  <tr><td style="background:#eef1f5;padding:18px 28px;border-radius:0 0 10px 10px;border:1px solid ${EMAIL_BORDER};border-top:none;">
    <p style="margin:0;font-size:11px;color:${EMAIL_MUTED};text-align:center;line-height:1.45;">Bu e-posta otomatik olarak gönderilmiştir.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

function buildAdminEmailHtml(p: BookingEmailPayload): string {
  return buildPremiumAdminNotificationHtml(p, 'new')
}

/**
 * Manuel rezervasyon oluşturulduğunda tüm admin adreslerine bildirim gönderir.
 * RESEND_API_KEY yoksa sessizce atlar.
 */
export async function sendManualBookingAdminNotification(
  payload: BookingEmailPayload
): Promise<void> {
  const resend = getResend()
  if (!resend) return
  const from = getFrom()
  const enriched = await enrichPayloadWithDepositAmounts(payload, payload.tourId)
  await sendToAdminRecipients(resend, {
    from,
    subject: `Manuel rezervasyon: ${enriched.tourTitle} – ${enriched.date}`,
    html: buildPremiumAdminNotificationHtml(enriched, 'manual'),
    logContext: enriched.bookingId,
  })
}

const CLASS_ROW_LABEL: Record<'eco' | 'premium' | 'first', string> = {
  eco: 'Eco',
  premium: 'Premium',
  first: 'First Class',
}

function buildDailyManifestTripHtml(trip: DailyManifestTrip): string {
  const navy = EMAIL_NAVY
  const occupancyPct = trip.totalCapacity > 0 ? Math.round((trip.totalBooked / trip.totalCapacity) * 100) : 0

  const classRows = (['eco', 'premium', 'first'] as const)
    .filter((k) => trip.byClass[k].capacity > 0 || trip.byClass[k].booked > 0)
    .map(
      (k) => `<tr>
        <td style="padding:6px 0;color:${EMAIL_MUTED};font-size:12px;">${escapeHtml(CLASS_ROW_LABEL[k])}</td>
        <td style="padding:6px 0;color:${navy};font-size:12px;font-weight:700;text-align:right;">${trip.byClass[k].booked} / ${trip.byClass[k].capacity}</td>
      </tr>`
    )
    .join('')

  const bookingRows = trip.bookings
    .map((b) => {
      const names = b.passengers
        .map((p) => escapeHtml(p.name) + (p.mealLabel ? ` <span style="color:${EMAIL_MUTED};">(${escapeHtml(p.mealLabel)})</span>` : ''))
        .join(', ')
      const extrasLine = b.extras.length
        ? `<p style="margin:4px 0 0;font-size:12px;color:${EMAIL_MUTED};"><strong style="color:${navy};">Ekstra:</strong> ${escapeHtml(b.extras.map((e) => `${e.title} × ${e.quantity}`).join(', '))}</p>`
        : ''
      const noteLine = b.customerNote
        ? `<p style="margin:4px 0 0;font-size:12px;color:#92400e;background:#fffbeb;border-left:2px solid #d97706;padding:4px 8px;border-radius:4px;"><strong>Not:</strong> ${escapeHtml(b.customerNote)}</p>`
        : ''
      return `<div style="padding:10px 0;border-top:1px solid ${EMAIL_BORDER};">
        <div style="display:flex;justify-content:space-between;gap:8px;">
          <span style="font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;font-weight:700;color:${navy};">#${escapeHtml(b.reference)}</span>
          <span style="font-size:12px;font-weight:700;color:${navy};">${escapeHtml(b.className)} · ${b.guestCount} kişi</span>
        </div>
        <p style="margin:4px 0 0;font-size:13px;color:${EMAIL_TEXT_BODY};">${names}</p>
        ${extrasLine}
        ${noteLine}
      </div>`
    })
    .join('')

  return `<tr><td style="background:${EMAIL_SURFACE};padding:0 28px 22px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <div style="border:1px solid ${EMAIL_BORDER};border-radius:10px;padding:16px 18px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <div>
          <p style="margin:0;font-size:15px;font-weight:700;color:${navy};">${escapeHtml(trip.tourTitle)}</p>
          <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_MUTED};">${trip.time ? escapeHtml(trip.time) : 'Saat belirtilmemiş'}</p>
        </div>
        <span style="flex-shrink:0;font-size:12px;font-weight:700;color:${navy};background:#f8fafc;border:1px solid ${EMAIL_BORDER};border-radius:999px;padding:4px 10px;">
          ${trip.totalBooked} / ${trip.totalCapacity} (%${occupancyPct})
        </span>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
        ${classRows}
      </table>
      ${bookingRows}
    </div>
  </td></tr>`
}

/**
 * Her sabah (cron ile) o günün tüm seferlerini — sınıf bazlı doluluk, yolcu listesi,
 * yemek tercihleri, özel istek ve ekstralarla birlikte — adminlere e-posta olarak gönderir.
 * O gün hiç aktif rezervasyon yoksa e-posta gönderilmez.
 */
export async function sendDailyAdminManifestEmail(dateStr: string): Promise<{ sent: boolean; tripCount: number }> {
  const report = await getDailyManifestReport(dateStr)
  if (report.trips.length === 0) return { sent: false, tripCount: 0 }

  const resend = getResend()
  if (!resend) {
    console.warn('[email] Günlük yolcu listesi gönderilmedi: RESEND_API_KEY tanımlı değil.')
    return { sent: false, tripCount: report.trips.length }
  }

  const navy = EMAIL_NAVY
  const dateFormatted = formatDate(dateStr)
  const totalGuests = report.trips.reduce((s, t) => s + t.totalBooked, 0)

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Günlük Yolcu Listesi</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BG_PAGE};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BG_PAGE};">
<tr><td align="center" style="padding:36px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border-collapse:separate;">

  <tr><td style="background:${navy};height:4px;border-radius:10px 10px 0 0;line-height:4px;font-size:0;">&nbsp;</td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:26px 28px 8px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0;font-size:20px;font-weight:800;color:${navy};letter-spacing:-0.02em;">Günlük Yolcu Listesi</p>
    <p style="margin:6px 0 0;font-size:13px;color:${EMAIL_MUTED};">${escapeHtml(dateFormatted)} · ${report.trips.length} sefer · ${totalGuests} yolcu</p>
  </td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:16px 28px 4px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">&nbsp;</td></tr>

  ${report.trips.map(buildDailyManifestTripHtml).join('')}

  <tr><td style="background:#eef1f5;padding:18px 28px;border-radius:0 0 10px 10px;border:1px solid ${EMAIL_BORDER};border-top:none;">
    <p style="margin:0;font-size:11px;color:${EMAIL_MUTED};text-align:center;line-height:1.45;">Bu e-posta her sabah otomatik olarak gönderilmiştir.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

  await sendToAdminRecipients(resend, {
    from: getFrom(),
    subject: `Günlük Yolcu Listesi – ${dateFormatted} (${report.trips.length} sefer, ${totalGuests} yolcu)`,
    html,
    logContext: dateStr,
  })

  return { sent: true, tripCount: report.trips.length }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export interface PaymentLinkEmailPayload {
  bookingId: string
  accessToken: string
  tourTitle: string
  date: string
  time?: string | null
  amountDue: number
  currency: string
  customer: { firstName: string; lastName: string; email: string }
  siteLocale?: SiteLocale
}

/**
 * Ödemesi tamamlanmamış (pending) veya elle oluşturulmuş bir rezervasyona ödeme linki gönderir.
 * Müşteri linke tıklayıp ödemeyi tamamladığında mevcut NestPay callback akışı rezervasyonu
 * otomatik olarak "ödendi" yapar (bkz. /api/payment/callback) — burada ek bir onay adımı gerekmez.
 */
export async function sendPaymentLinkEmail(
  payload: PaymentLinkEmailPayload
): Promise<{ ok: boolean; url: string; error?: string }> {
  const loc = normalizeBookingFlowLocale(payload.siteLocale)
  const url = paymentLinkUrlForLocale(payload.bookingId, payload.accessToken, loc)
  const copy = paymentLinkPageCopy(loc)
  const brandBlue = '#2168b8'
  const secondary = '#131719'
  const dateFormatted = formatEmailBookingDate(payload.date, loc)
  const fullName = `${payload.customer.firstName} ${payload.customer.lastName}`.trim()
  const greetName = payload.customer.firstName?.trim() || fullName || '—'

  function fmtPrice(amount: number, currency: string) {
    try {
      return new Intl.NumberFormat(loc === 'tr' ? 'tr-TR' : 'en-US', {
        style: 'currency', currency,
        minimumFractionDigits: 0, maximumFractionDigits: 0,
      }).format(amount)
    } catch { return `${amount} ${currency}` }
  }

  const html = `<!DOCTYPE html>
<html lang="${loc}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${escapeHtml(copy.waitingTitle)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BG_PAGE};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BG_PAGE};">
<tr><td align="center" style="padding:36px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;border-collapse:separate;">

  <tr><td style="background:${EMAIL_SURFACE};padding:22px 28px;text-align:center;border:1px solid ${EMAIL_BORDER};border-bottom:none;border-radius:10px 10px 0 0;">
    <p style="margin:0;font-size:20px;font-weight:800;color:${brandBlue};letter-spacing:-0.02em;">${escapeHtml(getSiteName() || 'Poseidon Booking')}</p>
  </td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:26px 28px 8px;text-align:center;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0;font-size:19px;font-weight:800;color:${secondary};">${escapeHtml(copy.greeting(greetName))}</p>
    <p style="margin:8px 0 0;font-size:14px;color:${EMAIL_TEXT_BODY};">${escapeHtml(payload.tourTitle)}</p>
    <p style="margin:2px 0 0;font-size:13px;color:${EMAIL_MUTED};">${escapeHtml(dateFormatted)}${payload.time ? ` · ${escapeHtml(payload.time)}` : ''}</p>
  </td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:20px 28px 26px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${EMAIL_BORDER};border-radius:12px;">
      <tr><td style="padding:20px;text-align:center;">
        <p style="margin:0;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:${EMAIL_MUTED};">${escapeHtml(copy.amountDue)}</p>
        <p style="margin:8px 0 0;font-size:28px;font-weight:800;color:${secondary};">${fmtPrice(payload.amountDue, payload.currency)}</p>
      </td></tr>
    </table>
    <a href="${escapeHtml(url)}" target="_blank"
       style="display:block;width:100%;background:${brandBlue};color:#ffffff!important;font-size:15px;font-weight:700;text-decoration:none;text-align:center;padding:15px 22px;border-radius:10px;box-sizing:border-box;margin-top:18px;">
      ${escapeHtml(copy.payNowCta)}
    </a>
  </td></tr>

  <tr><td style="background:#eef1f5;padding:18px 28px;border-radius:0 0 10px 10px;border:1px solid ${EMAIL_BORDER};border-top:none;">
    <p style="margin:0;font-size:11px;color:${EMAIL_MUTED};text-align:center;line-height:1.45;">
      &copy; ${new Date().getFullYear()} ${escapeHtml(getSiteName() || 'Poseidon')}
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

  const resend = getResend()
  if (!resend) return { ok: false, url, error: 'RESEND_API_KEY tanımlı değil' }
  const from = getFrom()
  const subjectT = loc === 'en' ? 'Complete your payment' : loc === 'de' ? 'Zahlung abschließen' : 'Ödemenizi Tamamlayın'
  const { error } = await resend.emails.send({
    from,
    to: [payload.customer.email],
    subject: `${subjectT} – ${payload.tourTitle}`,
    html,
  })
  if (error) {
    console.error('[email] Ödeme linki e-postası gönderilemedi:', payload.bookingId, error)
    return { ok: false, url, error: 'E-posta gönderilemedi' }
  }
  return { ok: true, url }
}

export interface BookingUpdatedEmailPayload {
  bookingId: string
  tourTitle: string
  date: string
  time?: string | null
  customer: { firstName: string; lastName: string; email: string }
  /** Neyin değiştiğine dair kısa, okunabilir özet — örn. "Tarih: 17 Eylül 2026 → 20 Eylül 2026". */
  changeSummary: string
  siteLocale?: SiteLocale
  accessToken?: string
}

function bookingUpdatedHeadline(loc: SiteLocale): string {
  if (loc === 'en') return 'Your booking has been updated'
  if (loc === 'de') return 'Ihre Buchung wurde aktualisiert'
  return 'Rezervasyonunuz Güncellendi'
}

function bookingUpdatedWhatChangedLabel(loc: SiteLocale): string {
  if (loc === 'en') return 'What changed?'
  if (loc === 'de') return 'Was hat sich geändert?'
  return 'Ne değişti?'
}

/**
 * Rezervasyon güncellendiğinde (tarih değişikliği, misafir bilgisi düzenleme vb.)
 * hem müşteriye hem adminlere bilgilendirme e-postası gönderir.
 */
export async function sendBookingUpdatedEmails(payload: BookingUpdatedEmailPayload): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] Güncelleme e-postası gönderilmedi: RESEND_API_KEY tanımlı değil.')
    return
  }
  const from = getFrom()
  const loc = normalizeBookingFlowLocale(payload.siteLocale)
  const t = bookingEmailPremiumStrings(loc)
  const brandBlue = '#2168b8'
  const secondary = '#131719'
  const dateFormatted = formatEmailBookingDate(payload.date, loc)
  const fullName = `${payload.customer.firstName} ${payload.customer.lastName}`.trim()
  const greetName = payload.customer.firstName?.trim() || fullName || '—'
  const manageUrl = manageBookingUrlForLocale(payload.bookingId, loc)
  const viewTicketUrl = customerTicketViewUrl(payload.bookingId, payload.accessToken, loc)
  const headline = bookingUpdatedHeadline(loc)
  const changeSummaryHtml = escapeHtml(payload.changeSummary).replace(/\n/g, '<br>')

  const customerHtml = `<!DOCTYPE html>
<html lang="${loc}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${escapeHtml(headline)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BG_PAGE};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BG_PAGE};">
<tr><td align="center" style="padding:36px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;border-collapse:separate;">

  <tr><td style="background:${EMAIL_SURFACE};padding:22px 28px;text-align:center;border:1px solid ${EMAIL_BORDER};border-bottom:none;border-radius:10px 10px 0 0;">
    <p style="margin:0;font-size:20px;font-weight:800;color:${brandBlue};letter-spacing:-0.02em;">${escapeHtml(getSiteName() || 'Poseidon Booking')}</p>
  </td></tr>

  <tr><td style="background:${brandBlue};padding:22px 28px;text-align:center;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0;font-size:19px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">${escapeHtml(headline)}</p>
    <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">${escapeHtml(payload.tourTitle)}</p>
  </td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:22px 28px 8px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0;font-size:15px;font-weight:700;color:${secondary};">${escapeHtml(t.greeting(greetName))}</p>
    <p style="margin:8px 0 0;font-size:13px;color:${EMAIL_MUTED};">${escapeHtml(dateFormatted)}${payload.time ? ` · ${escapeHtml(payload.time)}` : ''}</p>
  </td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:12px 28px 22px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${EMAIL_BORDER};border-radius:12px;">
      <tr><td style="padding:18px 20px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:${EMAIL_MUTED};">${escapeHtml(bookingUpdatedWhatChangedLabel(loc))}</p>
        <p style="margin:0;font-size:14px;font-weight:600;color:${secondary};line-height:1.6;">${changeSummaryHtml}</p>
      </td></tr>
    </table>
    <p style="margin:14px 0 0;font-size:13px;color:${EMAIL_TEXT_BODY};">${escapeHtml(t.manageIntro)}</p>
    <a href="${escapeHtml(manageUrl)}" target="_blank"
       style="display:block;width:100%;background:${brandBlue};color:#ffffff!important;font-size:15px;font-weight:700;text-decoration:none;text-align:center;padding:15px 22px;border-radius:10px;box-sizing:border-box;margin-top:10px;">
      ${escapeHtml(t.manageCta)}
    </a>
    <a href="${escapeHtml(viewTicketUrl)}" target="_blank"
       style="display:block;width:100%;background:${EMAIL_SURFACE};color:${brandBlue}!important;font-size:14px;font-weight:600;text-decoration:none;text-align:center;padding:13px 22px;border-radius:10px;border:1.5px solid ${brandBlue};box-sizing:border-box;margin-top:10px;">
      ${escapeHtml(t.viewTicketCta)}
    </a>
  </td></tr>

  <tr><td style="background:#eef1f5;padding:18px 28px;border-radius:0 0 10px 10px;border:1px solid ${EMAIL_BORDER};border-top:none;">
    <p style="margin:0;font-size:11px;color:${EMAIL_MUTED};text-align:center;line-height:1.45;">
      &copy; ${new Date().getFullYear()} ${escapeHtml(getSiteName() || 'Poseidon')}
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

  const adminHtml = `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Rezervasyon Güncellendi</title></head>
<body style="margin:0;padding:0;background:${EMAIL_BG_PAGE};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BG_PAGE};">
<tr><td align="center" style="padding:36px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;border-collapse:separate;">
  <tr><td style="background:${EMAIL_NAVY};height:4px;border-radius:10px 10px 0 0;line-height:4px;font-size:0;">&nbsp;</td></tr>
  <tr><td style="background:${EMAIL_SURFACE};padding:26px 28px 8px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0;font-size:20px;font-weight:800;color:${EMAIL_NAVY};letter-spacing:-0.02em;">Rezervasyon Güncellendi</p>
    <p style="margin:6px 0 0;font-size:13px;color:${EMAIL_MUTED};">${escapeHtml(payload.tourTitle)} · ${escapeHtml(dateFormatted)}${payload.time ? ` · ${escapeHtml(payload.time)}` : ''}</p>
  </td></tr>
  <tr><td style="background:${EMAIL_SURFACE};padding:18px 28px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <div style="background:#f8fafc;border:1px solid ${EMAIL_BORDER};border-left:3px solid ${EMAIL_NAVY};border-radius:8px;padding:16px 18px;">
      <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${EMAIL_MUTED};">Rezervasyon No</p>
      <p style="margin:6px 0 0;font-size:16px;font-weight:700;color:${EMAIL_NAVY};font-family:ui-monospace,SFMono-Regular,Consolas,monospace;">${escapeHtml(payload.bookingId)}</p>
      <p style="margin:12px 0 0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${EMAIL_MUTED};">Ne değişti?</p>
      <p style="margin:6px 0 0;font-size:14px;font-weight:600;color:${secondary};line-height:1.6;">${changeSummaryHtml}</p>
    </div>
  </td></tr>
  <tr><td style="background:${EMAIL_SURFACE};padding:0 28px 22px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_MUTED};font-size:13px;">Müşteri</td>
        <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${secondary};font-size:13px;font-weight:600;text-align:right;">${escapeHtml(fullName || '—')}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:${EMAIL_MUTED};font-size:13px;">E-posta</td>
        <td style="padding:10px 0;color:${secondary};font-size:13px;font-weight:600;text-align:right;">${escapeHtml(payload.customer.email)}</td>
      </tr>
    </table>
  </td></tr>
  <tr><td style="background:#eef1f5;padding:18px 28px;border-radius:0 0 10px 10px;border:1px solid ${EMAIL_BORDER};border-top:none;">
    <p style="margin:0;font-size:11px;color:${EMAIL_MUTED};text-align:center;">Bu e-posta otomatik olarak gönderilmiştir.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

  const [customerResult] = await Promise.allSettled([
    resend.emails.send({
      from,
      to: [payload.customer.email],
      subject: `${headline} – ${payload.tourTitle}`,
      html: customerHtml,
    }),
  ])
  if (customerResult.status === 'fulfilled' && customerResult.value.error) {
    console.error('[email] Güncelleme müşteri e-postası gönderilemedi:', payload.bookingId, customerResult.value.error)
  } else if (customerResult.status === 'rejected') {
    console.error('[email] Güncelleme müşteri e-postası gönderilemedi:', payload.bookingId, customerResult.reason)
  }

  await sendToAdminRecipients(resend, {
    from,
    subject: `Rezervasyon güncellendi: ${payload.tourTitle} – ${payload.date}`,
    html: adminHtml,
    logContext: payload.bookingId,
  })
}

/**
 * Rezervasyon oluşturulduğunda müşteri ve (ADMIN_EMAIL ayarlıysa) admin(ler)e e-posta gönderir.
 * QR kod bookingUrl ile üretilir ve HTML'e base64 inline gömülür (Gmail/Outlook uyumlu).
 * RESEND_API_KEY yoksa sessizce atlar. Hata durumunda loglar, isteği başarısız yapmaz.
 */
export async function sendBookingEmails(
  payload: BookingEmailPayload,
  options?: { embedQr?: QrEmbedMethod }
): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] E-posta gönderilmedi: RESEND_API_KEY .env içinde tanımlı değil.')
    return
  }

  const from = getFrom()
  const baseUrl = getEmailBaseUrl().replace(/\/$/, '')
  const bookingUrl = payload.bookingUrl || `${baseUrl}/rezervasyon`
  const voucherUrlForPdf = payload.accessToken
    ? voucherPdfUrl(payload.bookingId, false, payload.accessToken)
    : voucherPdfUrl(payload.bookingId, false)

  const { data: bookingRow } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', payload.bookingId)
    .single()
  const row = bookingRow as SupabaseBookingRow | null
  const loc = normalizeBookingFlowLocale(payload.siteLocale ?? row?.ui_locale)
  const mergedPayload: BookingEmailPayload = { ...payload, siteLocale: loc }
  const subjT = bookingEmailPremiumStrings(loc)

  const attachments: Array<{ filename: string; content: Buffer; contentId?: string }> = []

  const [{ mapLink, mapImageUrl }, siteLogoUrl] = await Promise.all([
    fetchTourMapInfo(typeof row?.tour_id === 'string' ? String(row.tour_id).trim() : mergedPayload.tourId),
    fetchSiteLogoUrl(),
  ])
  let qrCid: string | undefined
  if (mergedPayload.accessToken?.trim()) {
    const qrBuffer = await generateQrPngBuffer(voucherUrlForPdf)
    if (qrBuffer) {
      qrCid = `qr-${mergedPayload.bookingId}`
      attachments.push({ filename: 'biniş-karti-qr.png', content: qrBuffer, contentId: qrCid })
    }
  }

  const customerHtml = buildCustomerEmailHtml({
    ...mergedPayload,
    bookingUrl,
    mapLink,
    mapImageUrl,
    qrCid,
    logoUrl: mergedPayload.logoUrl ?? siteLogoUrl,
  })

  const { error: customerError } = await resend.emails.send({
    from,
    to: [mergedPayload.customer.email],
    subject: `${subjT.subjectReceived} – ${mergedPayload.tourTitle}`,
    html: customerHtml,
    ...(attachments.length > 0 && { attachments }),
  })
  if (customerError) {
    console.error('[email] Müşteri e-postası gönderilemedi:', mergedPayload.bookingId, customerError)
  }

  await sendToAdminRecipients(resend, {
    from,
    subject: `Yeni rezervasyon: ${mergedPayload.tourTitle} – ${mergedPayload.date}`,
    html: buildAdminEmailHtml(
      await enrichPayloadWithDepositAmounts(
        mergedPayload,
        typeof row?.tour_id === 'string' ? String(row.tour_id).trim() : mergedPayload.tourId
      )
    ),
    logContext: mergedPayload.bookingId,
  })
}

/**
 * Premium rezervasyon onay e-postası (ödeme sonrası): sade kart düzeni, lacivert marka rengi (#0c1929), Inter, inline CSS.
 * isPaid: false = rezervasyon ilk oluşturulduğunda, true = ödeme onaylandığında.
 */
function buildPremiumConfirmationEmailHtml(
  p: BookingEmailPayload,
  options?: { isPaid?: boolean }
): string {
  const loc = normalizeBookingFlowLocale(p.siteLocale)
  const t = bookingEmailPremiumStrings(loc)
  const htmlLang = loc === 'en' ? 'en' : loc === 'de' ? 'de' : 'tr'
  const isPaid = options?.isPaid !== false
  const successTitle = isPaid ? t.successTitlePaid : t.successTitlePending
  const dateFormatted = formatEmailBookingDate(p.date, loc)
  const tourImage = p.tourImageUrl?.trim() || ''
  const pickup = p.pickup?.trim() || 'Çeşme Sahil'
  const supportPhone = process.env.SUPPORT_PHONE?.trim() || '+90 533 417 36 56'
  const supportEmail = process.env.SUPPORT_EMAIL?.trim() || 'turkeycesme@hotmail.com'

  const manageUrl = manageBookingUrlForLocale(p.bookingId, loc)
  const viewTicketUrl = customerTicketViewUrl(p.bookingId, p.accessToken, loc)
  const heroImg = tourImage || ''

  /** Bu şablona özel marka renkleri — diğer e-posta şablonlarını (admin/iade/iletişim) etkilemez. */
  const brandBlue = '#2168b8'
  const brandOrange = '#fc6c4f'
  const bg = EMAIL_BG_PAGE
  const secondary = '#131719'

  function fmtPrice(amount: number, currency: string) {
    try {
      return new Intl.NumberFormat(htmlLang === 'tr' ? 'tr-TR' : 'en-US', {
        style: 'currency', currency,
        minimumFractionDigits: 0, maximumFractionDigits: 0,
      }).format(amount)
    } catch { return `${amount} ${currency}` }
  }

  const detailRow = (label: string, value: string, bold = false) =>
    `<tr>
      <td style="padding:11px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_MUTED};font-size:13px;width:44%;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:11px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${bold ? secondary : EMAIL_TEXT_BODY};font-size:13px;font-weight:${bold ? '700' : '500'};text-align:right;vertical-align:top;">${escapeHtml(value)}</td>
    </tr>`

  const extraList = (p.additionalTravelers ?? []).filter((x) => x.firstName?.trim() || x.lastName?.trim())
  const travelerLabels = additionalTravelerLabels(p.counts)
  const extraTravelersRowHtml = extraList.length > 0
    ? detailRow(escapeHtml(t.otherTravelers), extraList.map((g, i) => {
        const role = travelerLabels[i] ?? guestFallbackLabel(loc, i)
        const name = `${g.firstName} ${g.lastName}`.trim()
        const meal = g.mealPreference?.label?.trim() ? ` · ${g.mealPreference.label.trim()}` : ''
        return `${role}: ${name}${meal}`
      }).join(' | '))
    : ''
  const mealCounts = mealCountsLine(p.mealPreference?.counts)
  const { paidNow, remainingAmount } = resolveEmailPaymentAmounts(p, { isPaid })
  const showCashRemaining = remainingAmount > 0

  const fullName = `${p.customer.firstName} ${p.customer.lastName}`.trim() || '—'
  const greetName = p.customer.firstName?.trim() || fullName
  const totalPax = (p.counts.adult ?? 0) + (p.counts.child ?? 0) + (p.counts.infant ?? 0)
  const boardingStart = timeMinutesBefore(p.time, 30)
  const latestBoarding = timeMinutesBefore(p.time, 10)

  const qrBlock = p.qrCid
    ? `<img src="cid:${p.qrCid}" width="160" height="160" alt="QR" style="display:block;margin:16px auto 0;width:160px;height:160px;" />`
    : ''

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${escapeHtml(successTitle)}</title>
</head>
<body style="margin:0;padding:0;background:${bg};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};">
<tr><td align="center" style="padding:36px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;border-collapse:separate;">

  <tr><td style="background:${EMAIL_SURFACE};padding:22px 28px;text-align:center;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};border-top:1px solid ${EMAIL_BORDER};border-radius:10px 10px 0 0;">
    ${p.logoUrl?.trim()
      ? `<img src="${escapeHtml(p.logoUrl.trim())}" alt="${escapeHtml(getSiteName() || 'Logo')}" style="display:inline-block;max-height:44px;max-width:220px;width:auto;height:auto;" />`
      : `<p style="margin:0;font-size:20px;font-weight:800;color:${brandBlue};letter-spacing:-0.02em;">${escapeHtml(getSiteName() || 'Poseidon Booking')}</p>`
    }
  </td></tr>

  ${heroImg
    ? `<tr><td style="padding:0;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};background-color:${brandBlue};background-image:url('${escapeHtml(heroImg)}');background-size:cover;background-position:center;" background="${escapeHtml(heroImg)}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td height="220" style="height:220px;padding:0;" valign="bottom">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="background:linear-gradient(to top, rgba(12,16,20,0.82) 0%, rgba(12,16,20,0.35) 60%, rgba(12,16,20,0) 100%);padding:70px 28px 20px;">
                <p style="margin:0;font-size:21px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;text-shadow:0 1px 3px rgba(0,0,0,0.4);">${isPaid ? '🎉 ' : ''}${escapeHtml(successTitle)}</p>
                <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.92);text-shadow:0 1px 3px rgba(0,0,0,0.4);">${escapeHtml(p.tourTitle)}</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </td></tr>`
    : `<tr><td style="background:${brandBlue};padding:22px 28px;text-align:center;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
        <p style="margin:0;font-size:19px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">${isPaid ? '🎉 ' : ''}${escapeHtml(successTitle)}</p>
        <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">${escapeHtml(p.tourTitle)}</p>
      </td></tr>`
  }

  <tr><td style="background:${EMAIL_SURFACE};padding:22px 28px 6px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0 0 10px;font-size:15px;font-weight:700;color:${secondary};">${escapeHtml(t.greeting(greetName))}</p>
    <p style="margin:0;font-size:13px;color:${EMAIL_TEXT_BODY};line-height:1.65;">${escapeHtml(t.introText(p.tourTitle))}</p>
  </td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:18px 28px 22px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${EMAIL_BORDER};border-radius:12px;">
      <tr><td style="padding:22px 20px;text-align:center;">
        <p style="margin:0;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:${brandOrange};">${escapeHtml(t.boardingPassTitle)}</p>
        <p style="margin:8px 0 0;font-size:22px;font-weight:800;color:${brandBlue};letter-spacing:0.03em;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;">#${escapeHtml(shortReservationCode(p.bookingId))}</p>
        <p style="margin:12px 0 0;font-size:13px;color:${EMAIL_TEXT_BODY};"><strong style="color:${secondary};">${escapeHtml(t.date)}:</strong> ${escapeHtml(dateFormatted)}${p.time ? ` · ${escapeHtml(p.time)}` : ''}</p>
        <p style="margin:4px 0 0;font-size:13px;color:${EMAIL_TEXT_BODY};"><strong style="color:${secondary};">${escapeHtml(t.reservationOwner)}:</strong> ${escapeHtml(fullName)}</p>
        <p style="margin:4px 0 0;font-size:13px;color:${EMAIL_TEXT_BODY};"><strong style="color:${secondary};">${escapeHtml(t.guests)}:</strong> ${totalPax}</p>
        <p style="margin:10px 0 0;">
          <span style="display:inline-block;background:${brandBlue};color:#ffffff;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;padding:5px 12px;border-radius:999px;">${escapeHtml(classDisplay(p, loc))}</span>
        </p>
        ${qrBlock}
        ${p.qrCid ? `<p style="margin:14px 0 0;font-size:12px;font-weight:700;color:${brandOrange};">${escapeHtml(t.boardingPassHint)}</p>` : ''}
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:0 28px 20px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:${brandBlue};">${escapeHtml(t.meetingPointTitle)}:</p>
    <p style="margin:0;font-size:13px;color:${EMAIL_TEXT_BODY};line-height:1.6;">${escapeHtml(pickup)}</p>
    ${p.mapImageUrl?.trim()
      ? (() => {
          const mapImgTag = `<img src="${escapeHtml(p.mapImageUrl.trim())}" alt="${escapeHtml(t.meetingPointTitle)}" width="524" style="display:block;width:100%;max-height:200px;object-fit:cover;" />`
          const pin = `<div style="position:absolute;top:50%;left:50%;width:14px;height:14px;transform:translate(-50%,-50%);background:${brandOrange};border:3px solid #ffffff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>`
          const inner = p.mapLink?.trim()
            ? `<a href="${escapeHtml(p.mapLink.trim())}" target="_blank">${mapImgTag}</a>${pin}`
            : `${mapImgTag}${pin}`
          return `<div style="position:relative;margin:12px 0 0;border-radius:12px;overflow:hidden;border:1px solid ${EMAIL_BORDER};line-height:0;">${inner}</div>`
        })()
      : ''
    }
    ${p.mapLink?.trim() ? `<p style="margin:8px 0 0;"><a href="${escapeHtml(p.mapLink.trim())}" target="_blank" style="color:${brandBlue};font-size:13px;font-weight:600;text-decoration:underline;">${escapeHtml(t.viewOnMap)}</a></p>` : ''}
  </td></tr>

  ${p.time ? `<tr><td style="background:${EMAIL_SURFACE};padding:0 28px 20px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:${brandBlue};">${escapeHtml(t.boardingScheduleTitle)}:</p>
    <p style="margin:0;font-size:13px;color:${EMAIL_TEXT_BODY};">${escapeHtml(t.boardingStarts)}: <strong style="color:${secondary};">${escapeHtml(boardingStart ?? '—')}</strong></p>
    <p style="margin:4px 0 0;font-size:13px;color:${EMAIL_TEXT_BODY};">${escapeHtml(t.latestBoarding)}: <strong style="color:${secondary};">${escapeHtml(latestBoarding ?? '—')}</strong></p>
    <p style="margin:4px 0 0;font-size:13px;color:${EMAIL_TEXT_BODY};">${escapeHtml(t.departureLabel)}: <strong style="color:${secondary};">${escapeHtml(p.time)}</strong></p>
  </td></tr>` : ''}

  <tr><td style="background:${EMAIL_SURFACE};padding:0 28px 20px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:${secondary};">${escapeHtml(t.whatToBringTitle)}:</p>
    <p style="margin:0;font-size:13px;color:${EMAIL_TEXT_BODY};line-height:1.6;">${escapeHtml(t.whatToBringText)}</p>
  </td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:0 28px 22px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:${secondary};">${escapeHtml(t.foodDrinkTitle)}:</p>
    <p style="margin:0;font-size:13px;color:${EMAIL_TEXT_BODY};line-height:1.6;">${escapeHtml(t.foodDrinkPolicyText)}</p>
  </td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:4px 28px 22px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:${secondary};text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(t.priceBreakdownTitle)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${detailRow(t.classLabel, classDisplay(p, loc))}
      ${p.mealPreference?.label?.trim() ? detailRow(t.mealPref, p.mealPreference.label.trim()) : ''}
      ${mealCounts ? detailRow(t.mealDist, mealCounts) : ''}
      ${extraTravelersRowHtml}
      ${detailRow(t.paidRow, fmtPrice(paidNow, p.currency))}
      ${showCashRemaining ? detailRow(t.remainingRow, fmtPrice(remainingAmount, p.currency)) : ''}
      <tr>
        <td style="padding:14px 0 0;color:${EMAIL_MUTED};font-size:13px;font-weight:700;">${escapeHtml(t.totalRow)}</td>
        <td style="padding:14px 0 0;color:${brandBlue};font-size:20px;font-weight:800;text-align:right;">${fmtPrice(p.totalPrice, p.currency)}</td>
      </tr>
    </table>
    ${showCashRemaining ? `<p style="margin:12px 0 0;font-size:12px;color:${EMAIL_MUTED};line-height:1.5;">${escapeHtml(t.bulletCashRemaining)}</p>` : ''}
  </td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:0 28px 22px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0 0 10px;font-size:13px;color:${EMAIL_TEXT_BODY};">${escapeHtml(t.manageIntro)}</p>
    <a href="${escapeHtml(manageUrl)}" target="_blank"
       style="display:block;width:100%;background:${brandOrange};color:#ffffff!important;font-size:15px;font-weight:700;text-decoration:none;text-align:center;padding:15px 22px;border-radius:10px;box-sizing:border-box;margin-bottom:10px;">
      ${escapeHtml(t.manageCta)}
    </a>
    <a href="${escapeHtml(viewTicketUrl)}" target="_blank"
       style="display:block;width:100%;background:${EMAIL_SURFACE};color:${brandBlue}!important;font-size:14px;font-weight:600;text-decoration:none;text-align:center;padding:13px 22px;border-radius:10px;border:1.5px solid ${brandBlue};box-sizing:border-box;">
      ${escapeHtml(t.viewTicketCta)}
    </a>
  </td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:0 28px 26px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${EMAIL_MUTED};">${escapeHtml(t.contactTitle)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr><td style="padding:0 0 8px;">
        <a href="tel:${escapeHtml(supportPhone.replace(/[^+\d]/g, ''))}" style="display:inline-block;white-space:nowrap;background:#f1f5f9;border:1px solid ${EMAIL_BORDER};border-radius:999px;padding:8px 14px;font-size:12px;font-weight:600;color:${secondary};text-decoration:none;">
          <span style="display:inline-block;vertical-align:middle;">${emailIconSvg('phone')}</span>
          <span style="display:inline-block;vertical-align:middle;margin-left:6px;">${escapeHtml(supportPhone)}</span>
        </a>
      </td></tr>
      <tr><td>
        <a href="mailto:${escapeHtml(supportEmail)}" style="display:inline-block;white-space:nowrap;background:#f1f5f9;border:1px solid ${EMAIL_BORDER};border-radius:999px;padding:8px 14px;font-size:12px;font-weight:600;color:${secondary};text-decoration:none;">
          <span style="display:inline-block;vertical-align:middle;">${emailIconSvg('mail')}</span>
          <span style="display:inline-block;vertical-align:middle;margin-left:6px;">${escapeHtml(supportEmail)}</span>
        </a>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="background:#eef1f5;padding:18px 28px;border-radius:0 0 10px 10px;border:1px solid ${EMAIL_BORDER};border-top:none;">
    <p style="margin:0;font-size:12px;color:${EMAIL_MUTED};text-align:center;line-height:1.5;">
      &copy; ${new Date().getFullYear()} ${escapeHtml(getSiteName() || 'Poseidon')} &nbsp;·&nbsp;
      <a href="https://cesmetekneturu.net/yasal/gizlilik-politikasi" style="color:${EMAIL_MUTED};text-decoration:underline;" target="_blank">Gizlilik</a> &nbsp;·&nbsp;
      <a href="https://cesmetekneturu.net/yasal/iptal-ve-iade-politikasi" style="color:${EMAIL_MUTED};text-decoration:underline;" target="_blank">İptal-İade</a>
    </p>
    <p style="margin:8px 0 0;font-size:11px;color:${EMAIL_MUTED};text-align:center;line-height:1.45;">${escapeHtml(t.footerAuto)}</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

function buildCustomerPaidEmailHtml(p: BookingEmailPayload): string {
  const base = getEmailBaseUrl().replace(/\/$/, '')
  const bookingUrl = p.bookingUrl || `${base}/rezervasyon`
  return buildPremiumConfirmationEmailHtml({ ...p, bookingUrl }, { isPaid: true })
}

function buildAdminPaidEmailHtml(p: BookingEmailPayload): string {
  return buildPremiumAdminNotificationHtml(p, 'paid')
}

/**
 * Rezervasyon "ödendi" olarak işaretlendiğinde müşteri ve admin'e e-posta gönderir.
 * RESEND_API_KEY yoksa e-posta gönderilmez (konsola uyarı yazılır).
 */
export async function sendBookingPaidEmails(payload: BookingEmailPayload): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] E-posta gönderilmedi: RESEND_API_KEY .env içinde tanımlı değil.')
    return
  }

  const from = getFrom()
  const baseUrl = getEmailBaseUrl().replace(/\/$/, '')
  const bookingUrl = payload.bookingUrl || `${baseUrl}/rezervasyon`
  const voucherUrlForPdf = payload.accessToken
    ? voucherPdfUrl(payload.bookingId, false, payload.accessToken)
    : voucherPdfUrl(payload.bookingId, false)

  const { data: bookingRow } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', payload.bookingId)
    .single()
  const row = bookingRow as SupabaseBookingRow | null
  const fromDb = normalizeAdditionalTravelersFromStorage(row?.additional_travelers)
  const additionalTravelersMerged =
    payload.additionalTravelers && payload.additionalTravelers.length > 0
      ? payload.additionalTravelers
      : fromDb.length > 0
        ? fromDb
        : undefined
  const mergedPayload: BookingEmailPayload = {
    ...payload,
    siteLocale: normalizeBookingFlowLocale(payload.siteLocale ?? row?.ui_locale),
    ...(additionalTravelersMerged?.length ? { additionalTravelers: additionalTravelersMerged } : {}),
    ...(payload.paidNow == null &&
    row?.paid_now != null &&
    !Number.isNaN(Number(row.paid_now)) && { paidNow: Number(row.paid_now) }),
  }
  const tourIdForDeposit =
    typeof row?.tour_id === 'string' ? String(row.tour_id).trim() : mergedPayload.tourId
  const enrichedPayload = await enrichPayloadWithDepositAmounts(mergedPayload, tourIdForDeposit)
  const loc = normalizeBookingFlowLocale(enrichedPayload.siteLocale)
  const subjT = bookingEmailPremiumStrings(loc)

  const attachments: Array<{ filename: string; content: Buffer; contentId?: string }> = []

  const [{ mapLink, mapImageUrl }, siteLogoUrl] = await Promise.all([
    fetchTourMapInfo(tourIdForDeposit),
    fetchSiteLogoUrl(),
  ])
  let qrCid: string | undefined
  if (enrichedPayload.accessToken?.trim()) {
    const qrBuffer = await generateQrPngBuffer(voucherUrlForPdf)
    if (qrBuffer) {
      qrCid = `qr-${enrichedPayload.bookingId}`
      attachments.push({ filename: 'biniş-karti-qr.png', content: qrBuffer, contentId: qrCid })
    }
  }

  const customerHtml = buildCustomerPaidEmailHtml({
    ...enrichedPayload,
    bookingUrl,
    mapLink,
    mapImageUrl,
    qrCid,
    logoUrl: enrichedPayload.logoUrl ?? siteLogoUrl,
  })

  const { error: customerError } = await resend.emails.send({
    from,
    to: [enrichedPayload.customer.email],
    subject: `${subjT.subjectPaid} – ${enrichedPayload.tourTitle}`,
    html: customerHtml,
    ...(attachments.length > 0 && { attachments }),
  })
  if (customerError) {
    console.error('[email] Ödendi müşteri e-postası gönderilemedi:', enrichedPayload.bookingId, customerError)
  }

  await sendToAdminRecipients(resend, {
    from,
    subject: `Rezervasyon ödendi: ${enrichedPayload.tourTitle} – ${enrichedPayload.date}`,
    html: buildAdminPaidEmailHtml(enrichedPayload),
    logContext: enrichedPayload.bookingId,
  })
}

// ─── İptal e-postaları ────────────────────────────────────────────────────────

export type CancellationEmailOpts = {
  bookingId: string
  tourTitle: string
  date: string
  time?: string | null
  customer: { firstName: string; lastName: string; email: string; phone?: string | null }
  counts: { adult: number; child: number; infant: number }
  totalPrice: number
  currency: string
  /** 'customer' | 'admin' | admin e-posta adresi */
  cancelledBy?: string
  refundOk?: boolean
  refundStatus?: string | null
  refundAmount?: number | null
  refundErrMsg?: string | null
  siteLocale?: SiteLocale
}

/** Sayısal misafir dökümü (X Yetişkin, Y Çocuk, Z Bebek) — üç dilde. */
function guestCountsLine(counts: { adult: number; child: number; infant: number }, loc: SiteLocale): string {
  if (loc === 'en') {
    return `${counts.adult} Adult${counts.adult === 1 ? '' : 's'}${counts.child ? `, ${counts.child} Child${counts.child === 1 ? '' : 'ren'}` : ''}${counts.infant ? `, ${counts.infant} Infant${counts.infant === 1 ? '' : 's'}` : ''}`
  }
  if (loc === 'de') {
    return `${counts.adult} Erwachsene${counts.child ? `, ${counts.child} Kind${counts.child === 1 ? '' : 'er'}` : ''}${counts.infant ? `, ${counts.infant} Kleinkind${counts.infant === 1 ? '' : 'er'}` : ''}`
  }
  return `${counts.adult} Yetişkin${counts.child ? `, ${counts.child} Çocuk` : ''}${counts.infant ? `, ${counts.infant} Bebek` : ''}`
}

function cancellationEmailStrings(loc: SiteLocale) {
  if (loc === 'en') {
    return {
      pageTitle: 'Booking Cancelled',
      heading: 'Your Booking Has Been Cancelled',
      greeting: (name: string) => `Dear ${name}, your booking has been successfully cancelled.`,
      refundInfoTitle: 'Refund Information',
      refundWithAmount: (amount: number, currency: string) => `Your payment of ${amount} ${currency} will be refunded.`,
      refundGeneric: 'Your payment will be refunded.',
      refundEta: 'Your refund will be completed within 3–10 business days, depending on your bank.',
      refundHelp: 'Please contact us for further assistance.',
      reservationNo: 'Booking Ref.',
      tour: 'Tour',
      date: 'Date',
      guests: 'Guests',
      total: 'Total',
      helpTitle: 'Help & Contact',
    }
  }
  if (loc === 'de') {
    return {
      pageTitle: 'Buchung storniert',
      heading: 'Ihre Buchung wurde storniert',
      greeting: (name: string) => `Sehr geehrte(r) ${name}, Ihre Buchung wurde erfolgreich storniert.`,
      refundInfoTitle: 'Rückerstattungsinformationen',
      refundWithAmount: (amount: number, currency: string) => `Ihre Zahlung in Höhe von ${amount} ${currency} wird erstattet.`,
      refundGeneric: 'Ihre Zahlung wird erstattet.',
      refundEta: 'Die Rückerstattung wird je nach Bank innerhalb von 3–10 Werktagen abgeschlossen.',
      refundHelp: 'Bitte kontaktieren Sie uns für weitere Unterstützung.',
      reservationNo: 'Buchungsnr.',
      tour: 'Tour',
      date: 'Datum',
      guests: 'Gäste',
      total: 'Gesamt',
      helpTitle: 'Hilfe & Kontakt',
    }
  }
  return {
    pageTitle: 'Rezervasyon İptal',
    heading: 'Rezervasyonunuz İptal Edildi',
    greeting: (name: string) => `Sayın ${name}, rezervasyonunuz başarıyla iptal edilmiştir.`,
    refundInfoTitle: 'İade Bilgisi',
    refundWithAmount: (amount: number, currency: string) => `${amount} ${currency} tutarındaki ödemeniz iade edilecektir.`,
    refundGeneric: 'Ödemeniz iade edilecektir.',
    refundEta: 'İade süreciniz bankanıza göre 3–10 iş günü içinde tamamlanır.',
    refundHelp: 'Daha fazla yardım için bize ulaşın.',
    reservationNo: 'Rezervasyon No',
    tour: 'Tur',
    date: 'Tarih',
    guests: 'Misafirler',
    total: 'Toplam',
    helpTitle: 'Yardım ve İletişim',
  }
}

function buildCancellationCustomerHtml(o: CancellationEmailOpts): string {
  const loc = normalizeBookingFlowLocale(o.siteLocale)
  const s = cancellationEmailStrings(loc)
  const siteName = getSiteName() || 'Booking'
  const supportPhone = process.env.SUPPORT_PHONE?.trim() || '+90 533 417 36 56'
  const supportEmail = process.env.SUPPORT_EMAIL?.trim() || 'turkeycesme@hotmail.com'
  const customerName = `${o.customer.firstName} ${o.customer.lastName}`.trim() || '—'
  const dateFormatted = formatEmailBookingDate(o.date, loc)

  let refundLine = ''
  if (o.refundOk) {
    refundLine = `<div style="margin:0;padding:16px 18px;background:#f8fafc;border:1px solid ${EMAIL_BORDER};border-left:3px solid ${EMAIL_NAVY};border-radius:8px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:${EMAIL_NAVY};text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(s.refundInfoTitle)}</p>
      <p style="margin:8px 0 0;font-size:14px;color:${EMAIL_TEXT_BODY};line-height:1.55;">
        ${escapeHtml(o.refundAmount != null ? s.refundWithAmount(o.refundAmount, o.currency) : s.refundGeneric)}
        ${escapeHtml(s.refundEta)}
      </p>
    </div>`
  } else if (o.refundStatus === 'refund_failed' && o.refundErrMsg) {
    refundLine = `<div style="margin:0;padding:16px 18px;background:#fafafa;border:1px solid ${EMAIL_BORDER};border-left:3px solid #525252;border-radius:8px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:${EMAIL_NAVY};text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(s.refundInfoTitle)}</p>
      <p style="margin:8px 0 0;font-size:14px;color:${EMAIL_TEXT_BODY};">${escapeHtml(o.refundErrMsg)}</p>
      <p style="margin:8px 0 0;font-size:13px;color:${EMAIL_MUTED};">${escapeHtml(s.refundHelp)}</p>
    </div>`
  }

  const navy = EMAIL_NAVY
  const cancelIcon = `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:48px;height:48px;background:#f1f5f9;border-radius:10px;border:1px solid ${EMAIL_BORDER};text-align:center;vertical-align:middle;">${emailIconSvg('x')}</td></tr></table>`

  return `<!DOCTYPE html>
<html lang="${loc}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(s.pageTitle)}</title></head>
<body style="margin:0;padding:0;background:${EMAIL_BG_PAGE};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BG_PAGE};">
<tr><td align="center" style="padding:36px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

  <tr><td style="background:${navy};height:4px;border-radius:10px 10px 0 0;line-height:4px;font-size:0;">&nbsp;</td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:22px 28px 14px;text-align:center;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0;font-size:20px;font-weight:700;color:${navy};letter-spacing:-0.02em;">${escapeHtml(siteName)}</p>
  </td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:18px 28px 22px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="width:56px;vertical-align:top;padding-right:14px;">${cancelIcon}</td>
        <td style="vertical-align:top;">
          <p style="margin:0;font-size:17px;font-weight:700;color:${navy};">${escapeHtml(s.heading)}</p>
          <p style="margin:6px 0 0;font-size:14px;color:${EMAIL_MUTED};line-height:1.5;">${escapeHtml(s.greeting(customerName))}</p>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="background:${EMAIL_SURFACE};padding:0 28px 22px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_MUTED};font-size:13px;width:44%;">${escapeHtml(s.reservationNo)}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${navy};font-size:13px;font-weight:700;text-align:right;font-family:ui-monospace,monospace;">${escapeHtml(o.bookingId)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_MUTED};font-size:13px;">${escapeHtml(s.tour)}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_TEXT_BODY};font-size:13px;font-weight:500;text-align:right;">${escapeHtml(o.tourTitle)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_MUTED};font-size:13px;">${escapeHtml(s.date)}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_TEXT_BODY};font-size:13px;text-align:right;">${escapeHtml(dateFormatted)}${o.time ? ` · ${escapeHtml(o.time)}` : ''}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_MUTED};font-size:13px;">${escapeHtml(s.guests)}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_TEXT_BODY};font-size:13px;text-align:right;">${escapeHtml(guestCountsLine(o.counts, loc))}</td>
      </tr>
      <tr>
        <td style="padding:13px 0 0;color:${EMAIL_MUTED};font-size:13px;font-weight:700;">${escapeHtml(s.total)}</td>
        <td style="padding:13px 0 0;color:${navy};font-size:18px;font-weight:700;text-align:right;">${o.totalPrice.toLocaleString(loc === 'en' ? 'en-US' : loc === 'de' ? 'de-DE' : 'tr-TR')} ${escapeHtml(o.currency)}</td>
      </tr>
    </table>
  </td></tr>

  ${refundLine ? `<tr><td style="background:${EMAIL_SURFACE};padding:0 28px 22px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">${refundLine}</td></tr>` : ''}

  <tr><td style="background:${EMAIL_SURFACE};padding:0 28px 26px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${EMAIL_MUTED};">${escapeHtml(s.helpTitle)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:0 10px 6px 0;vertical-align:middle;width:22px;line-height:0;">${emailIconSvg('phone')}</td>
        <td style="padding:0 0 6px;vertical-align:middle;font-size:13px;color:${EMAIL_TEXT_BODY};">${escapeHtml(supportPhone)}</td>
      </tr>
      <tr>
        <td style="padding:0 10px 0 0;vertical-align:middle;width:22px;line-height:0;">${emailIconSvg('mail')}</td>
        <td style="padding:0;vertical-align:middle;font-size:13px;"><a href="mailto:${escapeHtml(supportEmail)}" style="color:${navy};text-decoration:none;font-weight:500;">${escapeHtml(supportEmail)}</a></td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="background:#eef1f5;padding:18px 28px;border-radius:0 0 10px 10px;border:1px solid ${EMAIL_BORDER};border-top:none;text-align:center;">
    <p style="margin:0;font-size:12px;color:${EMAIL_MUTED};">&copy; ${new Date().getFullYear()} ${escapeHtml(siteName)}</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

function buildCancellationAdminHtml(o: CancellationEmailOpts): string {
  const dateFormatted = formatDate(o.date)
  const timeLine = o.time ? `<p style="margin:0 0 8px;"><strong>Saat:</strong> ${escapeHtml(o.time)}</p>` : ''
  const cancelledByLabel = o.cancelledBy === 'customer'
    ? 'Müşteri tarafından iptal edildi'
    : o.cancelledBy === 'admin'
      ? 'Admin tarafından iptal edildi'
      : o.cancelledBy
        ? `Admin tarafından iptal edildi (${escapeHtml(o.cancelledBy)})`
        : 'İptal edildi'

  let refundLine = ''
  if (o.refundOk) {
    refundLine = `<p style="margin:0 0 8px;color:${EMAIL_TEXT_BODY};"><strong style="color:${EMAIL_NAVY};">İade:</strong> Başarılı${o.refundAmount != null ? ` — ${o.refundAmount} ${o.currency}` : ''}</p>`
  } else if (o.refundStatus === 'refund_failed') {
    refundLine = `<p style="margin:0 0 8px;color:${EMAIL_TEXT_BODY};"><strong style="color:${EMAIL_NAVY};">İade:</strong> Başarısız${o.refundErrMsg ? ` — ${escapeHtml(o.refundErrMsg)}` : ''}</p>`
  } else if (!o.refundStatus) {
    refundLine = `<p style="margin:0 0 8px;color:${EMAIL_MUTED};"><strong style="color:${EMAIL_NAVY};">İade:</strong> Uygulanamaz (online ödeme yok)</p>`
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Rezervasyon İptal Bildirimi</title></head>
<body style="font-family:'Inter',system-ui,sans-serif;line-height:1.55;color:${EMAIL_TEXT_BODY};max-width:560px;margin:0 auto;padding:32px 20px;background:${EMAIL_BG_PAGE};">
  <div style="border-bottom:3px solid ${EMAIL_NAVY};padding-bottom:16px;margin-bottom:20px;">
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.1em;color:${EMAIL_MUTED};text-transform:uppercase;">Admin bildirimi</p>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:${EMAIL_NAVY};letter-spacing:-0.02em;">Rezervasyon iptal edildi</h1>
    <p style="margin:8px 0 0;font-size:14px;color:${EMAIL_MUTED};">${escapeHtml(cancelledByLabel)}</p>
  </div>
  <div style="background:${EMAIL_SURFACE};border-radius:10px;padding:20px 22px;border:1px solid ${EMAIL_BORDER};">
    <p style="margin:0 0 8px;"><strong style="color:${EMAIL_NAVY};">Rezervasyon No:</strong> ${escapeHtml(o.bookingId)}</p>
    <p style="margin:0 0 8px;"><strong style="color:${EMAIL_NAVY};">Tur:</strong> ${escapeHtml(o.tourTitle)}</p>
    <p style="margin:0 0 8px;"><strong style="color:${EMAIL_NAVY};">Tarih:</strong> ${escapeHtml(dateFormatted)}</p>
    ${timeLine}
    <p style="margin:0 0 8px;"><strong style="color:${EMAIL_NAVY};">Misafirler:</strong> ${o.counts.adult} Yetişkin${o.counts.child ? `, ${o.counts.child} Çocuk` : ''}${o.counts.infant ? `, ${o.counts.infant} Bebek` : ''}</p>
    <p style="margin:0 0 8px;"><strong style="color:${EMAIL_NAVY};">Toplam:</strong> ${o.totalPrice} ${escapeHtml(o.currency)}</p>
    <hr style="border:none;border-top:1px solid ${EMAIL_BORDER};margin:14px 0;">
    <p style="margin:0 0 8px;"><strong style="color:${EMAIL_NAVY};">Müşteri:</strong> ${escapeHtml(o.customer.firstName)} ${escapeHtml(o.customer.lastName)}</p>
    <p style="margin:0 0 8px;"><strong style="color:${EMAIL_NAVY};">E-posta:</strong> ${escapeHtml(o.customer.email)}</p>
    <p style="margin:0 0 8px;"><strong style="color:${EMAIL_NAVY};">Telefon:</strong> ${escapeHtml(o.customer.phone || '—')}</p>
    <hr style="border:none;border-top:1px solid ${EMAIL_BORDER};margin:14px 0;">
    ${refundLine}
  </div>
</body>
</html>`
}

/**
 * İptal sonrası müşteri ve admin'e bildirim e-postası gönderir.
 * RESEND_API_KEY yoksa sessizce atlar.
 */
export async function sendBookingCancelledEmails(opts: CancellationEmailOpts): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] İptal e-postası gönderilmedi: RESEND_API_KEY tanımlı değil.')
    return
  }
  const from = getFrom()
  const siteName = getSiteName() || 'Booking'

  const cancelLoc = normalizeBookingFlowLocale(opts.siteLocale)
  const cancelSubject = cancelLoc === 'en'
    ? `Your booking has been cancelled — ${opts.tourTitle}`
    : cancelLoc === 'de'
      ? `Ihre Buchung wurde storniert — ${opts.tourTitle}`
      : `Rezervasyonunuz iptal edildi — ${opts.tourTitle}`

  const adminEmails = getAdminNotificationEmails()
  const [customerResult, adminResult] = await Promise.allSettled([
    resend.emails.send({
      from,
      to: [opts.customer.email],
      subject: cancelSubject,
      html: buildCancellationCustomerHtml(opts),
    }),
    adminEmails.length > 0
      ? sendToAdminRecipients(resend, {
          from,
          subject: `İptal bildirimi: ${opts.tourTitle} – ${opts.date}`,
          html: buildCancellationAdminHtml(opts),
          logContext: opts.bookingId,
        }).then(() => ({ data: null, error: null }))
      : Promise.resolve({ data: null, error: null }),
  ])

  if (customerResult.status === 'fulfilled' && customerResult.value.error) {
    console.error('[email] İptal müşteri e-postası gönderilemedi:', opts.bookingId, customerResult.value.error)
  }
  if (adminResult.status === 'fulfilled' && adminResult.value.error) {
    console.error('[email] İptal admin e-postası gönderilemedi:', opts.bookingId, adminResult.value.error)
  }

  void siteName
}

export interface ContactFormPayload {
  name: string
  groupSize: number
  email: string
  phone?: string
  message: string
}

function buildContactFormEmailHtml(p: ContactFormPayload): string {
  const phoneLine = p.phone ? `<p style="margin: 0 0 8px;"><strong>Telefon:</strong> ${escapeHtml(p.phone)}</p>` : ''
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>İletişim Formu</title></head>
<body style="font-family: 'Inter', system-ui, sans-serif; line-height: 1.5; color: ${EMAIL_TEXT_BODY}; max-width: 560px; margin: 0 auto; padding: 28px 20px; background: ${EMAIL_BG_PAGE};">
  <h1 style="margin: 0 0 10px; color: ${EMAIL_NAVY}; font-size: 22px; font-weight: 700;">Yeni İletişim Formu Mesajı</h1>
  <p style="margin: 0 0 18px; color: ${EMAIL_MUTED}; font-size: 14px;">Web sitesinden bir mesaj gönderildi.</p>
  <div style="background: ${EMAIL_SURFACE}; border-radius: 10px; padding: 18px 20px; margin: 0; border: 1px solid ${EMAIL_BORDER};">
    <p style="margin: 0 0 8px;"><strong>Ad Soyad:</strong> ${escapeHtml(p.name)}</p>
    <p style="margin: 0 0 8px;"><strong>Grup Büyüklüğü:</strong> ${p.groupSize}</p>
    <p style="margin: 0 0 8px;"><strong>E-posta:</strong> ${escapeHtml(p.email)}</p>
    ${phoneLine}
    <hr style="border: none; border-top: 1px solid ${EMAIL_BORDER}; margin: 12px 0;">
    <p style="margin: 0 0 8px;"><strong>Mesaj:</strong></p>
    <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(p.message)}</p>
  </div>
</body>
</html>
`.trim()
}

export type YachtInquiryEmailPayload = {
  yachtName: string
  yachtSlug: string
  location?: string
  rentalType?: 'daily' | 'overnight'
  date: string
  checkIn?: string
  checkOut?: string
  nights?: number
  /** E-posta konusu ve özet satırı için kısa metin */
  summaryLine?: string
  guestCount: number
  firstName: string
  lastName: string
  email: string
  phone: string
  message: string
  priceFrom?: number
  currency?: string
}

function buildYachtInquiryEmailHtml(p: YachtInquiryEmailPayload): string {
  const loc = p.location ? `<p style="margin: 0 0 8px;"><strong>Konum:</strong> ${escapeHtml(p.location)}</p>` : ''
  const price =
    p.priceFrom != null
      ? `<p style="margin: 0 0 8px;"><strong>${p.rentalType === 'overnight' ? 'Toplam fiyat (özet)' : 'Günlük fiyat (özet)'}:</strong> ${escapeHtml(String(p.priceFrom))} ${escapeHtml(p.currency ?? 'TRY')}</p>`
      : ''
  const rental =
    p.rentalType === 'overnight'
      ? '<p style="margin: 0 0 8px;"><strong>Kiralama:</strong> Konaklamalı</p>'
      : '<p style="margin: 0 0 8px;"><strong>Kiralama:</strong> Günlük (7 saat)</p>'
  const stay =
    p.rentalType === 'overnight' && p.checkIn && p.checkOut && p.nights != null
      ? `<p style="margin: 0 0 8px;"><strong>Konaklama:</strong> ${escapeHtml(p.checkIn)} → ${escapeHtml(p.checkOut)} (${p.nights} gece)</p>`
      : ''
  const duration =
    p.rentalType === 'overnight'
      ? `<p style="margin: 0 0 8px;"><strong>Süre:</strong> ${p.nights != null ? `${p.nights} gece` : '—'}</p>`
      : '<p style="margin: 0 0 8px;"><strong>Süre:</strong> 7 saat</p>'
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Yat müsaitlik talebi</title></head>
<body style="font-family: 'Inter', system-ui, sans-serif; line-height: 1.5; color: ${EMAIL_TEXT_BODY}; max-width: 560px; margin: 0 auto; padding: 28px 20px; background: ${EMAIL_BG_PAGE};">
  <h1 style="margin: 0 0 18px; color: ${EMAIL_NAVY}; font-size: 22px; font-weight: 700;">Yeni yat müsaitlik talebi</h1>
  <div style="background: ${EMAIL_SURFACE}; border-radius: 10px; padding: 18px 20px; margin: 0; border: 1px solid ${EMAIL_BORDER};">
    <p style="margin: 0 0 8px;"><strong>Yat:</strong> ${escapeHtml(p.yachtName)}</p>
    <p style="margin: 0 0 8px;"><strong>Slug:</strong> ${escapeHtml(p.yachtSlug)}</p>
    ${loc}
    ${rental}
    <p style="margin: 0 0 8px;"><strong>Tarih / aralık:</strong> ${escapeHtml(p.summaryLine ?? p.date)}</p>
    ${stay}
    ${duration}
    <p style="margin: 0 0 8px;"><strong>Misafir:</strong> ${p.guestCount}</p>
    ${price}
    <hr style="border: none; border-top: 1px solid ${EMAIL_BORDER}; margin: 12px 0;">
    <p style="margin: 0 0 8px;"><strong>Ad:</strong> ${escapeHtml(p.firstName)} ${escapeHtml(p.lastName)}</p>
    <p style="margin: 0 0 8px;"><strong>E-posta:</strong> ${escapeHtml(p.email)}</p>
    <p style="margin: 0 0 8px;"><strong>Telefon:</strong> ${escapeHtml(p.phone)}</p>
    <p style="margin: 0 0 8px;"><strong>Mesaj:</strong></p>
    <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(p.message)}</p>
  </div>
</body>
</html>
`.trim()
}

/**
 * Yat müsaitlik formu — admin bildirimi (RESEND_API_KEY + ADMIN_EMAIL).
 */
export type YachtDepositPaidEmailPayload = {
  bookingId: string
  amount: number
  currency: string
  pageTitle: string
  charterDate?: string
  locale?: 'tr' | 'en'
  customer: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    note?: string
  }
}

function buildYachtDepositCustomerEmailHtml(p: YachtDepositPaidEmailPayload): string {
  const siteName = getSiteName() || 'Poseidon'
  const isEn = p.locale === 'en'
  const name = `${p.customer.firstName} ${p.customer.lastName}`.trim()
  const amountStr = `${p.amount.toLocaleString(isEn ? 'en-US' : 'tr-TR')} ${p.currency === 'TRY' ? '₺' : p.currency}`
  const dateLine = p.charterDate
    ? `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;">${isEn ? 'Preferred date' : 'Tercih edilen tarih'}</td><td style="padding:8px 0;font-weight:600;color:#0f172a;font-size:14px;text-align:right;">${escapeHtml(formatDate(p.charterDate))}</td></tr>`
    : ''
  const noteLine = p.customer.note
    ? `<tr><td colspan="2" style="padding:12px 0 0;font-size:13px;color:#475569;line-height:1.5;">${escapeHtml(p.customer.note)}</td></tr>`
    : ''
  return `<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'tr'}"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" style="max-width:560px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
<tr><td style="background:#1e3a5f;padding:20px 24px;"><p style="margin:0;color:#fff;font-size:18px;font-weight:700;">${escapeHtml(siteName)}</p></td></tr>
<tr><td style="padding:24px;">
<p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">${isEn ? 'Deposit payment received' : 'Kapora ödemeniz alındı'}</p>
<p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.5;">${isEn ? `Thank you, ${escapeHtml(name)}. We have received your yacht charter deposit.` : `Teşekkürler ${escapeHtml(name)}. Özel yat kiralama kaporanız tarafımıza ulaştı.`}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
<tr><td style="padding:8px 0;color:#64748b;font-size:14px;">${isEn ? 'Amount paid' : 'Ödenen tutar'}</td><td style="padding:8px 0;font-weight:700;color:#fc6c4f;font-size:16px;text-align:right;">${escapeHtml(amountStr)}</td></tr>
${dateLine}
${noteLine}
</table>
<p style="margin:20px 0 0;font-size:13px;color:#64748b;line-height:1.5;">${isEn ? 'Our team will contact you shortly regarding availability and charter details.' : 'Ekibimiz müsaitlik ve kiralama detayları için kısa süre içinde sizinle iletişime geçecektir.'}</p>
</td></tr>
</table></td></tr></table></body></html>`
}

function buildYachtDepositAdminEmailHtml(p: YachtDepositPaidEmailPayload): string {
  const name = `${p.customer.firstName} ${p.customer.lastName}`.trim()
  const amountStr = `${p.amount.toLocaleString('tr-TR')} ${p.currency === 'TRY' ? '₺' : p.currency}`
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;">
<h2>Yat kapora ödemesi alındı</h2>
<p><strong>${escapeHtml(name)}</strong> — ${escapeHtml(p.customer.email)}</p>
<p>Telefon: ${escapeHtml(p.customer.phone ?? '—')}</p>
<p>Tutar: <strong>${escapeHtml(amountStr)}</strong></p>
<p>Rezervasyon ID: ${escapeHtml(p.bookingId)}</p>
${p.charterDate ? `<p>Tarih: ${escapeHtml(formatDate(p.charterDate))}</p>` : ''}
${p.customer.note ? `<p>Not:<br>${escapeHtml(p.customer.note).replace(/\n/g, '<br>')}</p>` : ''}
</body></html>`
}

export async function sendYachtDepositPaidEmails(p: YachtDepositPaidEmailPayload): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] Yat kapora: RESEND yapılandırılmamış')
    return
  }
  const from = getFrom()
  const isEn = p.locale === 'en'
  const customerSubject = isEn
    ? `Deposit received — ${getSiteName() || 'Yacht charter'}`
    : `Kapora ödemeniz alındı — ${getSiteName() || 'Yat kiralama'}`

  const { error: custErr } = await resend.emails.send({
    from,
    to: [p.customer.email],
    subject: customerSubject,
    html: buildYachtDepositCustomerEmailHtml(p),
  })
  if (custErr) console.error('[email] Yat kapora müşteri maili:', custErr)

  await sendToAdminRecipients(resend, {
    from,
    subject: `Yat kapora ödendi: ${p.customer.firstName} ${p.customer.lastName} — ${amountStr(p)}`,
    html: buildYachtDepositAdminEmailHtml(p),
    replyTo: p.customer.email,
    logContext: p.bookingId,
  })
}

function amountStr(p: YachtDepositPaidEmailPayload): string {
  return `${p.amount.toLocaleString('tr-TR')} ${p.currency === 'TRY' ? '₺' : p.currency}`
}

export async function sendYachtInquiryEmail(
  payload: YachtInquiryEmailPayload
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) return { ok: false, error: 'E-posta yapılandırılmamış' }
  const recipients = getAdminNotificationEmails()
  if (recipients.length === 0) return { ok: false, error: 'Alıcı e-posta yok (ADMIN_EMAIL tanımlayın)' }
  const from = getFrom()
  const subjTail = payload.summaryLine ?? payload.date
  await sendToAdminRecipients(resend, {
    from,
    subject: `Yat talebi: ${payload.yachtName} — ${subjTail}`,
    html: buildYachtInquiryEmailHtml(payload),
    replyTo: payload.email,
    logContext: payload.yachtName,
  })
  return { ok: true }
}

/**
 * İletişim formu gönderiminde admin'e e-posta atar.
 * RESEND_API_KEY ve ADMIN_EMAIL ayarlı olmalı.
 */
export async function sendContactFormEmail(payload: ContactFormPayload): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) return { ok: false, error: 'E-posta yapılandırılmamış' }
  const recipients = getAdminNotificationEmails()
  if (recipients.length === 0) return { ok: false, error: 'Alıcı e-posta yok (ADMIN_EMAIL tanımlayın)' }
  const from = getFrom()
  await sendToAdminRecipients(resend, {
    from,
    subject: `İletişim formu: ${payload.name}`,
    html: buildContactFormEmailHtml(payload),
    replyTo: payload.email,
    logContext: payload.email,
  })
  return { ok: true }
}

// ─── İade talebi e-postaları (yeni akış) ──────────────────────────────────────

export type RefundRequestEmailOpts = {
  bookingId: string
  tourTitle: string
  date: string
  time?: string | null
  customer: { firstName: string; lastName: string; email: string; phone?: string | null }
  amount: number
  currency: string
  reason?: string | null
  manageUrl?: string | null
  siteLocale?: SiteLocale
}

function refundRequestEmailStrings(loc: SiteLocale) {
  if (loc === 'en') {
    return {
      pageTitle: 'Refund Request Received',
      heading: 'Your Refund Request Has Been Received',
      greeting: (name: string) => `Dear ${name}, your refund request has been forwarded to our team.`,
      etaNote: 'It will be resolved within 24 hours.',
      reservationNo: 'Booking Ref.',
      tour: 'Tour',
      date: 'Date',
      requestedAmount: 'Requested refund',
      reasonLabel: 'Reason',
      helpTitle: 'Help & Contact',
    }
  }
  if (loc === 'de') {
    return {
      pageTitle: 'Rückerstattungsantrag eingegangen',
      heading: 'Ihr Rückerstattungsantrag ist eingegangen',
      greeting: (name: string) => `Sehr geehrte(r) ${name}, Ihr Rückerstattungsantrag wurde an unser Team weitergeleitet.`,
      etaNote: 'Er wird innerhalb von 24 Stunden bearbeitet.',
      reservationNo: 'Buchungsnr.',
      tour: 'Tour',
      date: 'Datum',
      requestedAmount: 'Beantragte Rückerstattung',
      reasonLabel: 'Grund',
      helpTitle: 'Hilfe & Kontakt',
    }
  }
  return {
    pageTitle: 'İade Talebi Alındı',
    heading: 'İade Talebiniz Alındı',
    greeting: (name: string) => `Sayın ${name}, iade talebiniz yöneticilerimize iletildi.`,
    etaNote: '24 saat içinde sonuçlanacaktır.',
    reservationNo: 'Rezervasyon No',
    tour: 'Tur',
    date: 'Tarih',
    requestedAmount: 'Talep edilen iade',
    reasonLabel: 'Talep nedeni',
    helpTitle: 'Yardım ve İletişim',
  }
}

function refundRequestCustomerHtml(o: RefundRequestEmailOpts): string {
  const loc = normalizeBookingFlowLocale(o.siteLocale)
  const s = refundRequestEmailStrings(loc)
  const siteName = getSiteName() || 'Booking'
  const supportPhone = process.env.SUPPORT_PHONE?.trim() || '+90 533 417 36 56'
  const supportEmail = process.env.SUPPORT_EMAIL?.trim() || 'turkeycesme@hotmail.com'
  const customerName = `${o.customer.firstName} ${o.customer.lastName}`.trim() || '—'
  const dateFormatted = formatEmailBookingDate(o.date, loc)
  const numLocale = loc === 'en' ? 'en-US' : loc === 'de' ? 'de-DE' : 'tr-TR'
  const pendingIcon = `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:48px;height:48px;background:#f1f5f9;border-radius:10px;border:1px solid ${EMAIL_BORDER};text-align:center;vertical-align:middle;">${emailIconSvg('clock')}</td></tr></table>`
  return `<!DOCTYPE html>
<html lang="${loc}"><head><meta charset="utf-8"><title>${escapeHtml(s.pageTitle)}</title></head>
<body style="margin:0;padding:0;background:${EMAIL_BG_PAGE};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BG_PAGE};"><tr><td align="center" style="padding:36px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
  <tr><td style="background:${EMAIL_NAVY};height:4px;border-radius:10px 10px 0 0;line-height:4px;font-size:0;">&nbsp;</td></tr>
  <tr><td style="background:${EMAIL_SURFACE};padding:22px 28px 16px;text-align:center;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0;font-size:20px;font-weight:700;color:${EMAIL_NAVY};letter-spacing:-0.02em;">${escapeHtml(siteName)}</p>
  </td></tr>
  <tr><td style="background:${EMAIL_SURFACE};padding:16px 28px 20px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="width:56px;vertical-align:top;padding-right:14px;">${pendingIcon}</td>
      <td style="vertical-align:top;">
        <p style="margin:0;font-size:17px;font-weight:700;color:${EMAIL_NAVY};">${escapeHtml(s.heading)}</p>
        <p style="margin:6px 0 0;font-size:14px;color:${EMAIL_MUTED};line-height:1.5;">${escapeHtml(s.greeting(customerName))} <strong style="color:${EMAIL_TEXT_BODY};font-weight:600;">${escapeHtml(s.etaNote)}</strong></p>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="background:${EMAIL_SURFACE};padding:0 28px 22px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_MUTED};font-size:13px;width:44%;">${escapeHtml(s.reservationNo)}</td>
          <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_NAVY};font-size:13px;font-weight:700;text-align:right;font-family:ui-monospace,monospace;">${escapeHtml(o.bookingId)}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_MUTED};font-size:13px;">${escapeHtml(s.tour)}</td>
          <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_TEXT_BODY};font-size:13px;font-weight:500;text-align:right;">${escapeHtml(o.tourTitle)}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_MUTED};font-size:13px;">${escapeHtml(s.date)}</td>
          <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_TEXT_BODY};font-size:13px;text-align:right;">${escapeHtml(dateFormatted)}${o.time ? ` · ${escapeHtml(o.time)}` : ''}</td></tr>
      <tr><td style="padding:13px 0 0;color:${EMAIL_MUTED};font-size:13px;font-weight:700;">${escapeHtml(s.requestedAmount)}</td>
          <td style="padding:13px 0 0;color:${EMAIL_NAVY};font-size:18px;font-weight:700;text-align:right;">${o.amount.toLocaleString(numLocale)} ${escapeHtml(o.currency)}</td></tr>
    </table>
    ${o.reason?.trim() ? `<p style="margin:14px 0 0;font-size:13px;color:${EMAIL_TEXT_BODY};"><strong style="color:${EMAIL_NAVY};">${escapeHtml(s.reasonLabel)}:</strong> ${escapeHtml(o.reason.trim())}</p>` : ''}
  </td></tr>
  <tr><td style="background:${EMAIL_SURFACE};padding:0 28px 26px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${EMAIL_MUTED};">${escapeHtml(s.helpTitle)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr><td style="padding:0 10px 6px 0;vertical-align:middle;width:22px;line-height:0;">${emailIconSvg('phone')}</td>
          <td style="padding:0 0 6px;vertical-align:middle;font-size:13px;color:${EMAIL_TEXT_BODY};">${escapeHtml(supportPhone)}</td></tr>
      <tr><td style="padding:0 10px 0 0;vertical-align:middle;width:22px;line-height:0;">${emailIconSvg('mail')}</td>
          <td style="padding:0;vertical-align:middle;font-size:13px;"><a href="mailto:${escapeHtml(supportEmail)}" style="color:${EMAIL_NAVY};text-decoration:none;font-weight:500;">${escapeHtml(supportEmail)}</a></td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#eef1f5;padding:18px 28px;border-radius:0 0 10px 10px;border:1px solid ${EMAIL_BORDER};border-top:none;text-align:center;">
    <p style="margin:0;font-size:12px;color:${EMAIL_MUTED};">&copy; ${new Date().getFullYear()} ${escapeHtml(siteName)}</p>
  </td></tr>
</table></td></tr></table></body></html>`
}

function refundRequestAdminHtml(o: RefundRequestEmailOpts): string {
  const dateFormatted = formatDate(o.date)
  const reasonLine = o.reason?.trim()
    ? `<p style="margin:0 0 8px;"><strong>Talep nedeni:</strong> ${escapeHtml(o.reason.trim())}</p>`
    : ''
  const manageLink = o.manageUrl?.trim()
    ? `<p style="margin:18px 0 0;"><a href="${escapeHtml(o.manageUrl.trim())}" style="display:inline-block;background:${EMAIL_NAVY};color:#fff!important;padding:11px 20px;border-radius:10px;text-decoration:none;font-weight:600;font-size:13px;">Admin panelinde aç</a></p>`
    : ''
  return `<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8"><title>Yeni İade Talebi</title></head>
<body style="font-family:'Inter',system-ui,sans-serif;line-height:1.55;color:${EMAIL_TEXT_BODY};max-width:560px;margin:0 auto;padding:28px 20px;background:${EMAIL_BG_PAGE};">
  <div style="border-bottom:3px solid ${EMAIL_NAVY};padding-bottom:14px;margin-bottom:18px;">
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.1em;color:${EMAIL_MUTED};text-transform:uppercase;">Admin</p>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:${EMAIL_NAVY};">Yeni İade Talebi</h1>
    <p style="margin:8px 0 0;font-size:14px;color:${EMAIL_MUTED};">Müşteri online ödenen rezervasyon için iade talebi oluşturdu.</p>
  </div>
  <div style="background:${EMAIL_SURFACE};border-radius:10px;padding:18px 20px;border:1px solid ${EMAIL_BORDER};">
    <p style="margin:0 0 8px;"><strong style="color:${EMAIL_NAVY};">Rezervasyon No:</strong> ${escapeHtml(o.bookingId)}</p>
    <p style="margin:0 0 8px;"><strong style="color:${EMAIL_NAVY};">Tur:</strong> ${escapeHtml(o.tourTitle)}</p>
    <p style="margin:0 0 8px;"><strong style="color:${EMAIL_NAVY};">Tarih:</strong> ${escapeHtml(dateFormatted)}${o.time ? ` · ${escapeHtml(o.time)}` : ''}</p>
    <p style="margin:0 0 8px;"><strong style="color:${EMAIL_NAVY};">Talep edilen tutar:</strong> ${o.amount.toLocaleString('tr-TR')} ${escapeHtml(o.currency)}</p>
    <hr style="border:none;border-top:1px solid ${EMAIL_BORDER};margin:12px 0;">
    <p style="margin:0 0 8px;"><strong style="color:${EMAIL_NAVY};">Müşteri:</strong> ${escapeHtml(o.customer.firstName)} ${escapeHtml(o.customer.lastName)}</p>
    <p style="margin:0 0 8px;"><strong style="color:${EMAIL_NAVY};">E-posta:</strong> ${escapeHtml(o.customer.email)}</p>
    <p style="margin:0 0 8px;"><strong style="color:${EMAIL_NAVY};">Telefon:</strong> ${escapeHtml(o.customer.phone || '—')}</p>
    ${reasonLine}
  </div>
  ${manageLink}
</body></html>`
}

export async function sendRefundRequestReceivedEmails(opts: RefundRequestEmailOpts): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] İade talebi e-postası gönderilmedi: RESEND_API_KEY tanımlı değil.')
    return
  }
  const from = getFrom()
  const refundReqLoc = normalizeBookingFlowLocale(opts.siteLocale)
  const refundReqSubject = refundReqLoc === 'en'
    ? `Your refund request has been received — ${opts.tourTitle}`
    : refundReqLoc === 'de'
      ? `Ihr Rückerstattungsantrag ist eingegangen — ${opts.tourTitle}`
      : `İade talebiniz alındı — ${opts.tourTitle}`
  const [c, a] = await Promise.allSettled([
    resend.emails.send({
      from,
      to: [opts.customer.email],
      subject: refundReqSubject,
      html: refundRequestCustomerHtml(opts),
    }),
    getAdminNotificationEmails().length > 0
      ? sendToAdminRecipients(resend, {
          from,
          subject: `Yeni İade Talebi: ${opts.tourTitle} – ${opts.date}`,
          html: refundRequestAdminHtml(opts),
          logContext: opts.bookingId,
        }).then(() => ({ data: null, error: null }))
      : Promise.resolve({ data: null, error: null }),
  ])
  if (c.status === 'fulfilled' && c.value.error) {
    console.error('[email] İade talebi (müşteri) gönderilemedi:', opts.bookingId, c.value.error)
  }
  if (a.status === 'fulfilled' && a.value.error) {
    console.error('[email] İade talebi (admin) gönderilemedi:', opts.bookingId, a.value.error)
  }
}

export type RefundDecisionEmailOpts = {
  bookingId: string
  tourTitle: string
  date: string
  time?: string | null
  customer: { firstName: string; lastName: string; email: string }
  amount: number
  currency: string
  /** Onayda yapılan iade tipi. */
  refundType?: 'void' | 'credit' | null
  /** Reddedildiyse sebep. */
  reason?: string | null
  siteLocale?: SiteLocale
}

function refundApprovedEmailStrings(loc: SiteLocale) {
  if (loc === 'en') {
    return {
      pageTitle: 'Your Refund Has Been Approved',
      heading: 'Your Refund Request Has Been Approved',
      greeting: (name: string) => `Dear ${name}, your refund request has been approved and your booking has been cancelled.`,
      speedVoid: 'The refund has been notified to your bank; the amount usually appears back on your card within a few hours.',
      speedCredit: 'The refund has been notified to your bank; depending on your bank, it may take 3–10 business days to appear on your card.',
      reservationNo: 'Booking Ref.',
      tour: 'Tour',
      date: 'Date',
      refundAmount: 'Refund amount',
    }
  }
  if (loc === 'de') {
    return {
      pageTitle: 'Ihre Rückerstattung wurde genehmigt',
      heading: 'Ihr Rückerstattungsantrag wurde genehmigt',
      greeting: (name: string) => `Sehr geehrte(r) ${name}, Ihr Rückerstattungsantrag wurde genehmigt und Ihre Buchung wurde storniert.`,
      speedVoid: 'Die Rückerstattung wurde Ihrer Bank gemeldet; der Betrag erscheint in der Regel innerhalb weniger Stunden auf Ihrer Karte.',
      speedCredit: 'Die Rückerstattung wurde Ihrer Bank gemeldet; je nach Bank kann es 3–10 Werktage dauern, bis der Betrag auf Ihrer Karte erscheint.',
      reservationNo: 'Buchungsnr.',
      tour: 'Tour',
      date: 'Datum',
      refundAmount: 'Erstattungsbetrag',
    }
  }
  return {
    pageTitle: 'İade Talebiniz Onaylandı',
    heading: 'İade Talebiniz Onaylandı',
    greeting: (name: string) => `Sayın ${name}, iade talebiniz onaylandı ve rezervasyonunuz iptal edildi.`,
    speedVoid: 'İade bankaya bildirildi; tutar genellikle birkaç saat içinde kartınıza geri yansır.',
    speedCredit: 'İade bankaya bildirildi; banka süreçlerine göre tutarın kartınıza yansıması 3–10 iş günü sürebilir.',
    reservationNo: 'Rezervasyon No',
    tour: 'Tur',
    date: 'Tarih',
    refundAmount: 'İade tutarı',
  }
}

function refundRejectedEmailStrings(loc: SiteLocale) {
  if (loc === 'en') {
    return {
      pageTitle: 'About Your Refund Request',
      heading: 'Your Refund Request Has Been Declined',
      greeting: (name: string) => `Dear ${name}, we reviewed your refund request but were unable to approve it at this time.`,
      reasonLabel: 'Reason',
      contactPrefix: 'For more information, please contact us:',
      reservationNo: 'Booking Ref.',
      tour: 'Tour',
      date: 'Date',
    }
  }
  if (loc === 'de') {
    return {
      pageTitle: 'Zu Ihrem Rückerstattungsantrag',
      heading: 'Ihr Rückerstattungsantrag wurde abgelehnt',
      greeting: (name: string) => `Sehr geehrte(r) ${name}, wir haben Ihren Rückerstattungsantrag geprüft, konnten ihn derzeit jedoch nicht genehmigen.`,
      reasonLabel: 'Grund',
      contactPrefix: 'Für weitere Informationen kontaktieren Sie uns bitte:',
      reservationNo: 'Buchungsnr.',
      tour: 'Tour',
      date: 'Datum',
    }
  }
  return {
    pageTitle: 'İade Talebiniz Reddedildi',
    heading: 'İade Talebiniz Reddedildi',
    greeting: (name: string) => `Sayın ${name}, iade talebinizi inceledik ancak şu an için onaylayamadık.`,
    reasonLabel: 'Ret nedeni',
    contactPrefix: 'Ek bilgi için bizimle iletişime geçebilirsiniz:',
    reservationNo: 'Rezervasyon No',
    tour: 'Tur',
    date: 'Tarih',
  }
}

function refundApprovedCustomerHtml(o: RefundDecisionEmailOpts): string {
  const loc = normalizeBookingFlowLocale(o.siteLocale)
  const s = refundApprovedEmailStrings(loc)
  const siteName = getSiteName() || 'Booking'
  const customerName = `${o.customer.firstName} ${o.customer.lastName}`.trim() || '—'
  const dateFormatted = formatEmailBookingDate(o.date, loc)
  const numLocale = loc === 'en' ? 'en-US' : loc === 'de' ? 'de-DE' : 'tr-TR'
  const speedNote = o.refundType === 'void' ? s.speedVoid : s.speedCredit
  const okIcon = `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:48px;height:48px;background:#f1f5f9;border-radius:10px;border:1px solid ${EMAIL_BORDER};text-align:center;vertical-align:middle;">${emailIconSvg('check')}</td></tr></table>`
  return `<!DOCTYPE html>
<html lang="${loc}"><head><meta charset="utf-8"><title>${escapeHtml(s.pageTitle)}</title></head>
<body style="margin:0;padding:0;background:${EMAIL_BG_PAGE};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BG_PAGE};"><tr><td align="center" style="padding:36px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
  <tr><td style="background:${EMAIL_NAVY};height:4px;border-radius:10px 10px 0 0;line-height:4px;font-size:0;">&nbsp;</td></tr>
  <tr><td style="background:${EMAIL_SURFACE};padding:22px 28px 14px;text-align:center;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0;font-size:20px;font-weight:700;color:${EMAIL_NAVY};">${escapeHtml(siteName)}</p>
  </td></tr>
  <tr><td style="background:${EMAIL_SURFACE};padding:14px 28px 20px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <table role="presentation" width="100%"><tr>
      <td style="width:56px;vertical-align:top;padding-right:14px;">${okIcon}</td>
      <td style="vertical-align:top;">
        <p style="margin:0;font-size:17px;font-weight:700;color:${EMAIL_NAVY};">${escapeHtml(s.heading)}</p>
        <p style="margin:6px 0 0;font-size:14px;color:${EMAIL_MUTED};line-height:1.55;">${escapeHtml(s.greeting(customerName))} ${escapeHtml(speedNote)}</p>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="background:${EMAIL_SURFACE};padding:0 28px 22px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_MUTED};font-size:13px;width:44%;">${escapeHtml(s.reservationNo)}</td>
          <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_NAVY};font-size:13px;font-weight:700;text-align:right;font-family:ui-monospace,monospace;">${escapeHtml(o.bookingId)}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_MUTED};font-size:13px;">${escapeHtml(s.tour)}</td>
          <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_TEXT_BODY};font-size:13px;font-weight:500;text-align:right;">${escapeHtml(o.tourTitle)}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_MUTED};font-size:13px;">${escapeHtml(s.date)}</td>
          <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_TEXT_BODY};font-size:13px;text-align:right;">${escapeHtml(dateFormatted)}${o.time ? ` · ${escapeHtml(o.time)}` : ''}</td></tr>
      <tr><td style="padding:13px 0 0;color:${EMAIL_MUTED};font-size:13px;font-weight:700;">${escapeHtml(s.refundAmount)}</td>
          <td style="padding:13px 0 0;color:${EMAIL_NAVY};font-size:18px;font-weight:700;text-align:right;">${o.amount.toLocaleString(numLocale)} ${escapeHtml(o.currency)}</td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#eef1f5;padding:18px 28px;border-radius:0 0 10px 10px;border:1px solid ${EMAIL_BORDER};border-top:none;text-align:center;">
    <p style="margin:0;font-size:12px;color:${EMAIL_MUTED};">&copy; ${new Date().getFullYear()} ${escapeHtml(siteName)}</p>
  </td></tr>
</table></td></tr></table></body></html>`
}

function refundRejectedCustomerHtml(o: RefundDecisionEmailOpts): string {
  const loc = normalizeBookingFlowLocale(o.siteLocale)
  const s = refundRejectedEmailStrings(loc)
  const siteName = getSiteName() || 'Booking'
  const supportEmail = process.env.SUPPORT_EMAIL?.trim() || 'turkeycesme@hotmail.com'
  const customerName = `${o.customer.firstName} ${o.customer.lastName}`.trim() || '—'
  const dateFormatted = formatEmailBookingDate(o.date, loc)
  const reasonBlock = o.reason?.trim()
    ? `<p style="margin:14px 0 0;font-size:13px;color:${EMAIL_TEXT_BODY};"><strong style="color:${EMAIL_NAVY};">${escapeHtml(s.reasonLabel)}:</strong> ${escapeHtml(o.reason.trim())}</p>`
    : ''
  const xIcon = `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="width:48px;height:48px;background:#f1f5f9;border-radius:10px;border:1px solid ${EMAIL_BORDER};text-align:center;vertical-align:middle;">${emailIconSvg('x')}</td></tr></table>`
  return `<!DOCTYPE html>
<html lang="${loc}"><head><meta charset="utf-8"><title>${escapeHtml(s.pageTitle)}</title></head>
<body style="margin:0;padding:0;background:${EMAIL_BG_PAGE};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BG_PAGE};"><tr><td align="center" style="padding:36px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
  <tr><td style="background:${EMAIL_NAVY};height:4px;border-radius:10px 10px 0 0;line-height:4px;font-size:0;">&nbsp;</td></tr>
  <tr><td style="background:${EMAIL_SURFACE};padding:22px 28px 14px;text-align:center;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <p style="margin:0;font-size:20px;font-weight:700;color:${EMAIL_NAVY};">${escapeHtml(siteName)}</p>
  </td></tr>
  <tr><td style="background:${EMAIL_SURFACE};padding:14px 28px 20px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <table role="presentation" width="100%"><tr>
      <td style="width:56px;vertical-align:top;padding-right:14px;">${xIcon}</td>
      <td style="vertical-align:top;">
        <p style="margin:0;font-size:17px;font-weight:700;color:${EMAIL_NAVY};">${escapeHtml(s.heading)}</p>
        <p style="margin:6px 0 0;font-size:14px;color:${EMAIL_MUTED};line-height:1.55;">${escapeHtml(s.greeting(customerName))}</p>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="background:${EMAIL_SURFACE};padding:0 28px 22px;border-left:1px solid ${EMAIL_BORDER};border-right:1px solid ${EMAIL_BORDER};">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_MUTED};font-size:13px;width:44%;">${escapeHtml(s.reservationNo)}</td>
          <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_NAVY};font-size:13px;font-weight:700;text-align:right;font-family:ui-monospace,monospace;">${escapeHtml(o.bookingId)}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_MUTED};font-size:13px;">${escapeHtml(s.tour)}</td>
          <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_TEXT_BODY};font-size:13px;font-weight:500;text-align:right;">${escapeHtml(o.tourTitle)}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_MUTED};font-size:13px;">${escapeHtml(s.date)}</td>
          <td style="padding:10px 0;border-bottom:1px solid ${EMAIL_BORDER};color:${EMAIL_TEXT_BODY};font-size:13px;text-align:right;">${escapeHtml(dateFormatted)}${o.time ? ` · ${escapeHtml(o.time)}` : ''}</td></tr>
    </table>
    ${reasonBlock}
    <p style="margin:14px 0 0;font-size:13px;color:${EMAIL_TEXT_BODY};">${escapeHtml(s.contactPrefix)} <a href="mailto:${escapeHtml(supportEmail)}" style="color:${EMAIL_NAVY};font-weight:600;text-decoration:underline;">${escapeHtml(supportEmail)}</a></p>
  </td></tr>
  <tr><td style="background:#eef1f5;padding:18px 28px;border-radius:0 0 10px 10px;border:1px solid ${EMAIL_BORDER};border-top:none;text-align:center;">
    <p style="margin:0;font-size:12px;color:${EMAIL_MUTED};">&copy; ${new Date().getFullYear()} ${escapeHtml(siteName)}</p>
  </td></tr>
</table></td></tr></table></body></html>`
}

export async function sendRefundApprovedEmails(opts: RefundDecisionEmailOpts): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] İade onay e-postası gönderilmedi: RESEND_API_KEY tanımlı değil.')
    return
  }
  const from = getFrom()
  const approveLoc = normalizeBookingFlowLocale(opts.siteLocale)
  const approveSubject = approveLoc === 'en'
    ? `Your refund has been approved — ${opts.tourTitle}`
    : approveLoc === 'de'
      ? `Ihre Rückerstattung wurde genehmigt — ${opts.tourTitle}`
      : `İade talebiniz onaylandı — ${opts.tourTitle}`
  const { error } = await resend.emails.send({
    from,
    to: [opts.customer.email],
    subject: approveSubject,
    html: refundApprovedCustomerHtml(opts),
  })
  if (error) {
    console.error('[email] İade onay (müşteri) e-postası gönderilemedi:', opts.bookingId, error)
  }
}

export async function sendRefundRejectedEmails(opts: RefundDecisionEmailOpts): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] İade ret e-postası gönderilmedi: RESEND_API_KEY tanımlı değil.')
    return
  }
  const from = getFrom()
  const rejectLoc = normalizeBookingFlowLocale(opts.siteLocale)
  const rejectSubject = rejectLoc === 'en'
    ? `About your refund request — ${opts.tourTitle}`
    : rejectLoc === 'de'
      ? `Zu Ihrem Rückerstattungsantrag — ${opts.tourTitle}`
      : `İade talebiniz hakkında bilgi — ${opts.tourTitle}`
  const { error } = await resend.emails.send({
    from,
    to: [opts.customer.email],
    subject: rejectSubject,
    html: refundRejectedCustomerHtml(opts),
  })
  if (error) {
    console.error('[email] İade ret (müşteri) e-postası gönderilemedi:', opts.bookingId, error)
  }
}
