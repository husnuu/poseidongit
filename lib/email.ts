import { Resend } from 'resend'
import { buildGoogleCalendarUrl } from '@/lib/calendar'
import { generateVoucherPdf } from '@/lib/voucher/generateVoucherPdf'
import type { VoucherData } from '@/lib/voucher/types'
import { DEFAULT_POLICIES, DEFAULT_CONTACT } from '@/lib/voucher/types'
import { getBaseUrl, getSiteName } from '@/lib/seo'
import { manageBookingUrl, voucherPdfUrl, getEmailBaseUrl } from '@/lib/siteUrls'
import { getFirestore } from '@/lib/firebaseAdmin'
import { client, urlFor } from '@/lib/sanity'
import { tourImageAndPickupQuery } from '@/lib/queries'

const DEFAULT_FROM = (() => { const n = process.env.NEXT_PUBLIC_SITE_NAME || 'Booking'; return `${n} <onboarding@resend.dev>` })()

/** E-postadaki buton linkleri için production-safe domain (cesmetekneturu.net). */
const OFFICIAL_EMAIL_DOMAIN = 'https://cesmetekneturu.net'

/** @deprecated QR e-postadan kaldırıldı. */
export type QrEmbedMethod = 'base64' | 'cid'

export interface BookingEmailPayload {
  bookingId: string
  tourTitle: string
  date: string
  time?: string
  className: string
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
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) return null
  return new Resend(key)
}

function getFrom(): string {
  return process.env.EMAIL_FROM?.trim() || DEFAULT_FROM
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

function formatParticipants(counts: { adult: number; child: number; infant: number }): string {
  const parts: string[] = []
  if (counts.adult > 0) parts.push(`${counts.adult} Yetişkin`)
  if (counts.child > 0) parts.push(`${counts.child} Çocuk`)
  if (counts.infant > 0) parts.push(`${counts.infant} Bebek`)
  return parts.length > 0 ? parts.join(', ') : '—'
}

/** BookingEmailPayload + voucherUrl ile e-posta ekinde gönderilecek PDF için VoucherData üretir. */
function payloadToVoucherData(payload: BookingEmailPayload, voucherUrl: string): VoucherData {
  const website = getEmailBaseUrl().replace(/\/$/, '') || DEFAULT_CONTACT.website
  return {
    referenceNumber: payload.bookingId,
    bookingUrl: voucherUrl,
    tourTitle: payload.tourTitle,
    date: payload.date,
    time: payload.time,
    meetingPickup: payload.pickup?.trim() || 'Çeşme Sahil',
    language: 'Türkçe',
    className: payload.className?.trim() || undefined,
    customerName: `${payload.customer.firstName} ${payload.customer.lastName}`.trim() || '—',
    customerEmail: payload.customer.email || '—',
    customerPhone: payload.customer.phone || '—',
    adults: payload.counts.adult ?? 0,
    children: payload.counts.child ?? 0,
    babies: payload.counts.infant ?? 0,
    totalPrice: payload.totalPrice,
    currency: payload.currency,
    paidNow: payload.paidNow,
    remainingAmount: undefined,
    cancellationPolicy: DEFAULT_POLICIES.cancellationPolicy,
    voucherNotice: DEFAULT_POLICIES.voucherNotice,
    supportEmail: process.env.SUPPORT_EMAIL?.trim() || DEFAULT_CONTACT.supportEmail,
    website,
    copyrightYear: new Date().getFullYear(),
    logoUrl: payload.logoUrl?.trim() || undefined,
  }
}

/** VoucherData'yı Sanity tur verisiyle zenginleştirir (kapora, dahil/dahil değil, süre, görseller). */
async function enrichVoucherDataWithTour(data: VoucherData, tourId: string): Promise<VoucherData> {
  try {
    const tourMeta = await client.fetch<{
      mainImage?: { asset?: { _ref?: string } }
      gallery?: { _ref?: string }[]
      durationLabel?: string | null
      meetingPoint?: string | null
      deposit?: { enabled?: boolean; type?: string; value?: number }
      included?: string[] | null
      notIncluded?: string[] | null
    } | null>(tourImageAndPickupQuery, { tourId })
    if (!tourMeta) return data
    const tourImageUrl = tourMeta.mainImage?.asset
      ? urlFor(tourMeta.mainImage.asset).width(600).height(320).url()
      : undefined
    const galleryRefs = (tourMeta.gallery ?? []).filter((a: { _ref?: string }) => a?._ref).slice(0, 3)
    const tourGalleryUrls = galleryRefs.length > 0
      ? galleryRefs.map((assetRef: { _ref?: string }) =>
          urlFor(assetRef).width(500).height(340).format('jpg').url()
        )
      : tourMeta.mainImage?.asset
        ? [urlFor(tourMeta.mainImage.asset).width(500).height(340).format('jpg').url()]
        : undefined
    let depositAmount: number | undefined
    if (tourMeta.deposit?.enabled && tourMeta.deposit?.value != null && data.totalPrice > 0) {
      depositAmount =
        tourMeta.deposit.type === 'fixed'
          ? tourMeta.deposit.value
          : Math.round((tourMeta.deposit.value / 100) * data.totalPrice)
    }
    return {
      ...data,
      ...(tourImageUrl && { tourImageUrl }),
      ...(tourGalleryUrls?.length && { tourGalleryUrls }),
      ...(tourMeta.meetingPoint && { meetingPickup: tourMeta.meetingPoint }),
      ...(tourMeta.durationLabel && { durationLabel: tourMeta.durationLabel }),
      ...(depositAmount != null && { depositAmount }),
      ...(tourMeta.included?.length && { included: tourMeta.included }),
      ...(tourMeta.notIncluded?.length && { notIncluded: tourMeta.notIncluded }),
    }
  } catch {
    return data
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
  const dateFormatted = formatDate(p.date)
  const participants = formatParticipants(p.counts)
  const customerName = `${p.customer.firstName} ${p.customer.lastName}`.trim() || '—'
  const tourImage = p.tourImageUrl?.trim() || ''
  const bookingUrl = p.bookingUrl?.trim() || '#'
  const baseUrl = getEmailBaseUrl()
  const voucherUrl = `${baseUrl.replace(/\/$/, '')}/api/voucher?bookingId=${encodeURIComponent(p.bookingId)}`
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
    { label: 'Class', value: p.className },
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
              <p style="margin: 0; font-size: 13px; color: #6b7280;">Voucher PDF'inizi indirmek için <a href="${escapeHtml(voucherUrl)}" style="color: #0c1929; text-decoration: underline;">buraya tıklayın</a>.</p>
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

function buildAdminEmailHtml(p: BookingEmailPayload): string {
  const dateFormatted = formatDate(p.date)
  const timeLine = p.time ? `<p><strong>Saat:</strong> ${escapeHtml(p.time)}</p>` : ''
  const noteLine =
    p.customer.note && p.customer.note.trim()
      ? `<p><strong>Müşteri notu:</strong> ${escapeHtml(p.customer.note.trim())}</p>`
      : ''

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Yeni Rezervasyon</title></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #333; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="color: #0c4a6e;">Yeni Rezervasyon</h1>
  <p>Yeni bir rezervasyon oluşturuldu.</p>
  <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px;"><strong>Rezervasyon No:</strong> ${escapeHtml(p.bookingId)}</p>
    <p style="margin: 0 0 8px;"><strong>Tur:</strong> ${escapeHtml(p.tourTitle)}</p>
    <p style="margin: 0 0 8px;"><strong>Tarih:</strong> ${escapeHtml(dateFormatted)}</p>
    ${timeLine}
    <p style="margin: 0 0 8px;"><strong>Sınıf:</strong> ${escapeHtml(p.className)}</p>
    <p style="margin: 0 0 8px;"><strong>Yetişkin:</strong> ${p.counts.adult} · <strong>Çocuk:</strong> ${p.counts.child} · <strong>Bebek:</strong> ${p.counts.infant}</p>
    <p style="margin: 0 0 8px;"><strong>Toplam:</strong> ${p.totalPrice} ${escapeHtml(p.currency)}</p>
    <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 12px 0;">
    <p style="margin: 0 0 8px;"><strong>Müşteri:</strong> ${escapeHtml(p.customer.firstName)} ${escapeHtml(p.customer.lastName)}</p>
    <p style="margin: 0 0 8px;"><strong>E-posta:</strong> ${escapeHtml(p.customer.email)}</p>
    <p style="margin: 0;"><strong>Telefon:</strong> ${escapeHtml(p.customer.phone || '—')}</p>
  </div>
  ${noteLine}
</body>
</html>
`.trim()
}

/**
 * Manuel rezervasyon oluşturulduğunda admin'e (veya belirtilen adrese) bildirim e-postası gönderir.
 * RESEND_API_KEY yoksa sessizce atlar.
 */
export async function sendManualBookingAdminNotification(
  to: string,
  payload: BookingEmailPayload
): Promise<void> {
  const resend = getResend()
  if (!resend || !to?.trim()) return
  const from = getFrom()
  const html = buildAdminEmailHtml(payload)
  const { error } = await resend.emails.send({
    from,
    to: [to.trim()],
    subject: `Manuel rezervasyon: ${payload.tourTitle} – ${payload.date}`,
    html,
  })
  if (error) {
    console.error('[email] Manuel rezervasyon admin bildirimi gönderilemedi:', payload.bookingId, error)
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Rezervasyon oluşturulduğunda müşteri ve (ADMIN_EMAIL ayarlıysa) admin'e e-posta gönderir.
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
  const voucherUrlForPdf = voucherPdfUrl(payload.bookingId, false)

  const customerHtml = buildCustomerEmailHtml({ ...payload, bookingUrl })

  const attachments: Array<{ filename: string; content: Buffer; contentId?: string }> = []
  try {
    let voucherData = payloadToVoucherData(payload, voucherUrlForPdf)
    try {
      const db = getFirestore()
      const snap = await db.collection('bookings').doc(payload.bookingId).get()
      const tourId = typeof snap.data()?.tourId === 'string' ? String(snap.data()?.tourId).trim() : ''
      if (tourId) voucherData = await enrichVoucherDataWithTour(voucherData, tourId)
    } catch {
      // Tur verisi olmadan PDF üretilir
    }
    const pdfBytes = await generateVoucherPdf(voucherData)
    attachments.push({
      filename: `${getSiteName() || 'Bilet'}-Bilet-${payload.bookingId}.pdf`,
      content: Buffer.from(pdfBytes),
    })
  } catch (e) {
    console.warn('[email] PDF bilet eklenemedi:', e)
  }

  const { error: customerError } = await resend.emails.send({
    from,
    to: [payload.customer.email],
    subject: `Rezervasyonunuz alındı – ${payload.tourTitle}`,
    html: customerHtml,
    ...(attachments.length > 0 && { attachments }),
  })
  if (customerError) {
    console.error('[email] Müşteri e-postası gönderilemedi:', payload.bookingId, customerError)
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim()
  if (adminEmail) {
    const { error: adminError } = await resend.emails.send({
      from,
      to: [adminEmail],
      subject: `Yeni rezervasyon: ${payload.tourTitle} – ${payload.date}`,
      html: buildAdminEmailHtml(payload),
    })
    if (adminError) {
      console.error('[email] Admin e-postası gönderilemedi:', payload.bookingId, adminError)
    }
  }
}

/**
 * Premium rezervasyon onay e-postası (ödeme sonrası): Airbnb/GetYourGuide tarzı, Türkçe.
 * Kart tabanlı, marka renkleri (navy lacivert, beyaz yazı), anasayfa fontu (Inter), inline CSS.
 * isPaid: false = rezervasyon ilk oluşturulduğunda, true = ödeme onaylandığında.
 */
function buildPremiumConfirmationEmailHtml(
  p: BookingEmailPayload,
  options?: { isPaid?: boolean }
): string {
  const isPaid = options?.isPaid !== false
  const successTitle = isPaid ? 'Rezervasyonunuz onaylandı!' : 'Rezervasyonunuz alındı!'
  const successSub =
    isPaid
      ? 'Ödemeniz başarıyla alındı. Bu e-postayı bilet olarak saklayabilirsiniz.'
      : 'Ödemenizi tamamladığınızda biletiniz e-posta ile gönderilecektir.'
  const dateFormatted = formatDate(p.date)
  const participants = formatParticipants(p.counts)
  const tourImage = p.tourImageUrl?.trim() || ''
  const pickup = p.pickup?.trim() || 'Çeşme Sahil'
  const primary = '#0c1929'
  const headerFooterBg = '#0c1929'
  const accent = '#c9a227'
  const bgLight = '#f5f5f5'
  const cardBg = '#ffffff'
  const textDark = '#1a1a1a'
  const textMuted = '#6b7280'
  const supportPhone = process.env.SUPPORT_PHONE?.trim() || '+90 XXX XXX XX XX'
  const supportEmail = process.env.SUPPORT_EMAIL?.trim() || 'destek@cesmeposeidon.com'
  const emailFont = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

  const manageUrl = manageBookingUrl(p.bookingId)
  const pdfDownloadUrl = voucherPdfUrl(p.bookingId, true)
  const heroImg = tourImage || ''

  const paidRowHtml =
    p.paidNow != null && p.paidNow > 0
      ? `<tr><td style="padding:12px 20px;border-top:1px solid #e5e7eb;color:${textMuted};font-size:13px;">Ödenen Tutar</td><td style="padding:12px 20px;border-top:1px solid #e5e7eb;color:${primary};font-size:14px;font-weight:600;text-align:right;">${escapeHtml(String(p.paidNow))} ${escapeHtml(p.currency)}</td></tr>`
      : ''

  return `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rezervasyon Onayı – ${getSiteName() || 'Rezervasyon'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:${bgLight};font-family:${emailFont};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${bgLight};font-family:${emailFont};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;">
          <!-- Header (navy lacivert, yazılar beyaz) -->
          <tr>
            <td style="background-color:${headerFooterBg};padding:28px 24px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;font-family:${emailFont};">${getSiteName() || 'Rezervasyon'}</h1>
              <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.9);font-size:14px;font-family:${emailFont};">Tekne Turu Rezervasyonu</p>
            </td>
          </tr>
          <!-- Hero image: mutlaka tur fotoğrafı (kapak ile aynı) -->
          <tr>
            <td style="padding:0;">
              ${heroImg ? `<img src="${escapeHtml(heroImg)}" alt="Tekne turu" width="600" height="240" style="display:block;width:100%;height:auto;max-height:240px;object-fit:cover;" />` : `<div style="width:100%;height:180px;background:${headerFooterBg};"></div>`}
            </td>
          </tr>
          <!-- Success message card -->
          <tr>
            <td style="padding:24px 24px 16px 24px;background:${cardBg};">
              <h2 style="margin:0;color:${primary};font-size:20px;font-weight:700;font-family:${emailFont};">${successTitle}</h2>
              <p style="margin:10px 0 0 0;color:${textMuted};font-size:15px;line-height:1.5;font-family:${emailFont};">${successSub}</p>
            </td>
          </tr>
          <!-- Reservation ID badge -->
          <tr>
            <td style="padding:0 24px 24px 24px;background:${cardBg};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${bgLight};border:2px solid ${accent};border-radius:10px;padding:16px 20px;">
                <tr>
                  <td style="color:${textMuted};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Rezervasyon No</td>
                </tr>
                <tr>
                  <td style="padding:4px 0 0 0;color:${primary};font-size:22px;font-weight:700;letter-spacing:1px;">${escapeHtml(p.bookingId)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Booking details (QR kaldırıldı) -->
          <tr>
            <td style="padding:0 24px 24px 24px;background:${cardBg};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${bgLight};border-radius:12px;border:1px solid #e5e7eb;">
                <tr><td colspan="2" style="padding:16px 20px 0 20px;color:${textDark};font-size:16px;font-weight:700;">Rezervasyon Detayları</td></tr>
                <tr><td style="padding:12px 20px;border-top:1px solid #e5e7eb;color:${textMuted};font-size:13px;width:140px;">Tur</td><td style="padding:12px 20px;border-top:1px solid #e5e7eb;color:${textDark};font-size:13px;font-weight:500;text-align:right;">${escapeHtml(p.tourTitle)}</td></tr>
                <tr><td style="padding:12px 20px;border-top:1px solid #e5e7eb;color:${textMuted};font-size:13px;">Tarih</td><td style="padding:12px 20px;border-top:1px solid #e5e7eb;color:${textDark};font-size:13px;text-align:right;">${escapeHtml(dateFormatted)}</td></tr>
                <tr><td style="padding:12px 20px;border-top:1px solid #e5e7eb;color:${textMuted};font-size:13px;">Kalkış saati</td><td style="padding:12px 20px;border-top:1px solid #e5e7eb;color:${textDark};font-size:13px;text-align:right;">${escapeHtml(p.time || '—')}</td></tr>
                <tr><td style="padding:12px 20px;border-top:1px solid #e5e7eb;color:${textMuted};font-size:13px;">Toplanma noktası</td><td style="padding:12px 20px;border-top:1px solid #e5e7eb;color:${textDark};font-size:13px;text-align:right;">${escapeHtml(pickup)}</td></tr>
                <tr><td style="padding:12px 20px;border-top:1px solid #e5e7eb;color:${textMuted};font-size:13px;">Misafirler</td><td style="padding:12px 20px;border-top:1px solid #e5e7eb;color:${textDark};font-size:13px;text-align:right;">${escapeHtml(participants)}</td></tr>
                <tr><td style="padding:12px 20px;border-top:1px solid #e5e7eb;color:${textMuted};font-size:13px;">Sınıf</td><td style="padding:12px 20px;border-top:1px solid #e5e7eb;color:${textDark};font-size:13px;text-align:right;">${escapeHtml(p.className)}</td></tr>
                ${paidRowHtml}
                <tr><td style="padding:16px 20px;border-top:2px solid #e5e7eb;color:${textMuted};font-size:13px;">Toplam Tutar</td><td style="padding:16px 20px;border-top:2px solid #e5e7eb;color:${primary};font-size:18px;font-weight:700;text-align:right;">${escapeHtml(String(p.totalPrice))} ${escapeHtml(p.currency)}</td></tr>
              </table>
            </td>
          </tr>
          <!-- Buttons -->
          <tr>
            <td style="padding:0 24px 24px 24px;background:${cardBg};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:0 0 12px 0;">
                    <a href="${escapeHtml(manageUrl)}" target="_blank" style="display:block;width:100%;background-color:${primary};color:#ffffff!important;font-size:16px;font-weight:600;text-decoration:none;text-align:center;padding:16px 24px;border-radius:10px;box-sizing:border-box;font-family:${emailFont};">Rezervasyonumu Yönet</a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="${escapeHtml(pdfDownloadUrl)}" target="_blank" style="display:block;width:100%;background-color:transparent;color:${textDark}!important;font-size:15px;font-weight:600;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;border:2px solid #d1d5db;box-sizing:border-box;font-family:${emailFont};">PDF Bilet İndir</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Important info -->
          <tr>
            <td style="padding:0 24px 24px 24px;background:${cardBg};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fefce8;border:1px solid #fde047;border-radius:10px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <div style="font-size:14px;font-weight:700;color:${textDark};margin-bottom:8px;">Önemli Bilgiler</div>
                    <ul style="margin:0;padding:0 0 0 18px;color:${textMuted};font-size:13px;line-height:1.6;">
                      <li style="margin-bottom:4px;">Lütfen kalkış saatinden 30 dakika önce teknede olun.</li>
                      <li style="margin-bottom:4px;">Biniş sırasında biletinizi (sayfa veya PDF) göstermeniz yeterlidir.</li>
                      <li>Sorularınız için bizimle iletişime geçebilirsiniz.</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Contact -->
          <tr>
            <td style="padding:0 24px 24px 24px;background:${cardBg};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e5e7eb;padding-top:20px;">
                <tr>
                  <td>
                    <div style="font-size:13px;font-weight:700;color:${textDark};margin-bottom:8px;">İletişim</div>
                    <p style="margin:0 0 4px 0;font-size:14px;color:${textMuted};">${escapeHtml(supportPhone)}</p>
                    <p style="margin:0;font-size:14px;color:${primary};"><a href="mailto:${escapeHtml(supportEmail)}" style="color:${primary};text-decoration:none;font-family:${emailFont};">${escapeHtml(supportEmail)}</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer (navy lacivert, yazılar beyaz) -->
          <tr>
            <td style="padding:24px 24px 32px 24px;background-color:${headerFooterBg};border-radius:0 0 12px 12px;">
              <p style="margin:0;font-size:12px;color:#ffffff;text-align:center;font-family:${emailFont};">${getSiteName() || 'Tekne Turları'}</p>
              <p style="margin:8px 0 0 0;font-size:12px;text-align:center;"><a href="#" style="color:#ffffff;text-decoration:underline;">KVKK</a> · <a href="#" style="color:#ffffff;text-decoration:underline;">İptal-İade</a> · <a href="#" style="color:#ffffff;text-decoration:underline;">Gizlilik</a></p>
              <p style="margin:16px 0 0 0;font-size:11px;color:#ffffff;text-align:center;opacity:0.9;">Bu e-posta otomatik olarak gönderilmiştir.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
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
  const dateFormatted = formatDate(p.date)
  const timeLine = p.time ? `<p><strong>Saat:</strong> ${escapeHtml(p.time)}</p>` : ''

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Rezervasyon Ödendi</title></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #333; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="color: #047857;">Rezervasyon Ödendi</h1>
  <p>Bir rezervasyon ödeme olarak işaretlendi.</p>
  <div style="background: #ecfdf5; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #a7f3d0;">
    <p style="margin: 0 0 8px;"><strong>Rezervasyon No:</strong> ${escapeHtml(p.bookingId)}</p>
    <p style="margin: 0 0 8px;"><strong>Tur:</strong> ${escapeHtml(p.tourTitle)}</p>
    <p style="margin: 0 0 8px;"><strong>Tarih:</strong> ${escapeHtml(dateFormatted)}</p>
    ${timeLine}
    <p style="margin: 0 0 8px;"><strong>Sınıf:</strong> ${escapeHtml(p.className)}</p>
    <p style="margin: 0 0 8px;"><strong>Toplam:</strong> ${p.totalPrice} ${escapeHtml(p.currency)}</p>
    <hr style="border: none; border-top: 1px solid #a7f3d0; margin: 12px 0;">
    <p style="margin: 0 0 8px;"><strong>Müşteri:</strong> ${escapeHtml(p.customer.firstName)} ${escapeHtml(p.customer.lastName)}</p>
    <p style="margin: 0 0 8px;"><strong>E-posta:</strong> ${escapeHtml(p.customer.email)}</p>
    <p style="margin: 0;"><strong>Telefon:</strong> ${escapeHtml(p.customer.phone || '—')}</p>
  </div>
</body>
</html>
`.trim()
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
  const voucherUrlForPdf = voucherPdfUrl(payload.bookingId, false)

  const customerHtml = buildCustomerPaidEmailHtml({ ...payload, bookingUrl })

  const attachments: Array<{ filename: string; content: Buffer; contentId?: string }> = []
  try {
    let voucherData = payloadToVoucherData(payload, voucherUrlForPdf)
    try {
      const db = getFirestore()
      const snap = await db.collection('bookings').doc(payload.bookingId).get()
      const tourId = typeof snap.data()?.tourId === 'string' ? String(snap.data()?.tourId).trim() : ''
      if (tourId) voucherData = await enrichVoucherDataWithTour(voucherData, tourId)
    } catch {
      // Tur verisi olmadan PDF üretilir
    }
    const pdfBytes = await generateVoucherPdf(voucherData)
    attachments.push({
      filename: `${getSiteName() || 'Bilet'}-Bilet-${payload.bookingId}.pdf`,
      content: Buffer.from(pdfBytes),
    })
  } catch (e) {
    console.warn('[email] PDF bilet eklenemedi:', e)
  }

  const { error: customerError } = await resend.emails.send({
    from,
    to: [payload.customer.email],
    subject: `Rezervasyonunuz onaylandı – ${payload.tourTitle}`,
    html: customerHtml,
    ...(attachments.length > 0 && { attachments }),
  })
  if (customerError) {
    console.error('[email] Ödendi müşteri e-postası gönderilemedi:', payload.bookingId, customerError)
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim()
  if (adminEmail) {
    const { error: adminError } = await resend.emails.send({
      from,
      to: [adminEmail],
      subject: `Rezervasyon ödendi: ${payload.tourTitle} – ${payload.date}`,
      html: buildAdminPaidEmailHtml(payload),
    })
    if (adminError) {
      console.error('[email] Ödendi admin e-postası gönderilemedi:', payload.bookingId, adminError)
    }
  }
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
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #333; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="color: #0c4a6e;">Yeni İletişim Formu Mesajı</h1>
  <p>Web sitesinden bir mesaj gönderildi.</p>
  <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px;"><strong>Ad Soyad:</strong> ${escapeHtml(p.name)}</p>
    <p style="margin: 0 0 8px;"><strong>Grup Büyüklüğü:</strong> ${p.groupSize}</p>
    <p style="margin: 0 0 8px;"><strong>E-posta:</strong> ${escapeHtml(p.email)}</p>
    ${phoneLine}
    <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 12px 0;">
    <p style="margin: 0 0 8px;"><strong>Mesaj:</strong></p>
    <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(p.message)}</p>
  </div>
</body>
</html>
`.trim()
}

/**
 * İletişim formu gönderiminde admin'e e-posta atar.
 * RESEND_API_KEY ve ADMIN_EMAIL ayarlı olmalı.
 */
export async function sendContactFormEmail(payload: ContactFormPayload): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) return { ok: false, error: 'E-posta yapılandırılmamış' }
  const to = process.env.ADMIN_EMAIL?.trim()
  if (!to) return { ok: false, error: 'Alıcı e-posta yok' }
  const from = getFrom()
  const { error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: payload.email,
    subject: `İletişim formu: ${payload.name}`,
    html: buildContactFormEmailHtml(payload),
  })
  if (error) {
    console.error('[email] İletişim formu e-postası gönderilemedi:', error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
