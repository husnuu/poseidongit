import QRCode from 'qrcode'
import { Resend } from 'resend'
import { buildGoogleCalendarUrl } from '@/lib/calendar'

const DEFAULT_FROM = 'Poseidon Booking <onboarding@resend.dev>'

/** QR embed yöntemi: base64 (Gmail/Outlook uyumlu, default) veya cid (Nodemailer ile). */
export type QrEmbedMethod = 'base64' | 'cid'

/**
 * bookingUrl için QR kod PNG üretir. E-posta inline image veya attachment için kullanılır.
 */
export async function generateQrPng(bookingUrl: string): Promise<Buffer> {
  const buf = await QRCode.toBuffer(bookingUrl, {
    type: 'png',
    width: 256,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  })
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf)
}

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
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  const voucherUrl = baseUrl
    ? `${baseUrl.replace(/\/$/, '')}/api/voucher?bookingId=${encodeURIComponent(p.bookingId)}`
    : '#'
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
        ? 'color: #2563eb; font-weight: 600;'
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
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px;">
          <tr>
            <td style="background-color: #ff4d2e; padding: 20px 24px; text-align: center;">
              <span style="color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">POSEIDON BOOKING</span>
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
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${escapeHtml(bookingUrl)}" style="height: 48px; width: 552px; v-text-anchor: middle; border-radius: 8px;" arcsize="16%" strokecolor="#2563eb" fill="t">
                      <v:fill type="tile" color="#2563eb" />
                      <center><a href="${escapeHtml(bookingUrl)}" style="color: #ffffff; font-weight: 600; text-decoration: none;">${escapeHtml(buttonText)}</a></center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${escapeHtml(bookingUrl)}" target="_blank" style="display: inline-block; width: 100%; max-width: 552px; background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%); background-color: #2563eb; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 8px; box-sizing: border-box;">${escapeHtml(buttonText)}</a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 24px 0 24px; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #6b7280;">Takviminize eklemek için <a href="${escapeHtml(calendarUrl)}" style="color: #2563eb; text-decoration: underline;">Add to Google Calendar</a>.</p>
              <p style="margin: 8px 0 0 0;"><a href="${escapeHtml(calendarUrl)}" target="_blank" style="display: inline-block; font-size: 14px; font-weight: 500; color: #2563eb; text-decoration: none; padding: 10px 20px; border: 2px solid #2563eb; border-radius: 8px; box-sizing: border-box;">Add to Calendar</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 24px 0 24px; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #6b7280;">Voucher PDF'inizi indirmek için <a href="${escapeHtml(voucherUrl)}" style="color: #2563eb; text-decoration: underline;">buraya tıklayın</a>.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 24px 24px 24px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">If you have any questions, reply to this email.</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">&copy; 2026 Poseidon Booking</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildCustomerEmailHtml(
  p: BookingEmailPayload,
  qrImageSrc?: string
): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  const bookingUrl = p.bookingUrl || (siteUrl ? `${siteUrl.replace(/\/$/, '')}/rezervasyon` : '#')
  return buildConfirmationEmailHtml(
    { ...p, bookingUrl },
    { subtitle: 'Rezervasyonunuz kaydedildi.', buttonText: 'Open booking', qrImageSrc }
  )
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
  if (!resend) return

  const from = getFrom()
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  const bookingUrl =
    payload.bookingUrl || (siteUrl ? `${siteUrl.replace(/\/$/, '')}/rezervasyon` : '#')

  let qrImageSrc: string | undefined
  let qrBuffer: Buffer | undefined
  try {
    qrBuffer = await generateQrPng(bookingUrl)
    qrImageSrc =
      options?.embedQr === 'cid'
        ? 'cid:booking-qr'
        : `data:image/png;base64,${qrBuffer.toString('base64')}`
  } catch (e) {
    console.warn('[email] QR üretilemedi, e-posta QR olmadan gönderilecek:', e)
  }

  const customerHtml = buildCustomerEmailHtml({ ...payload, bookingUrl }, qrImageSrc)

  const { error: customerError } = await resend.emails.send({
    from,
    to: [payload.customer.email],
    subject: `Rezervasyonunuz alındı – ${payload.tourTitle}`,
    html: customerHtml,
    ...(options?.embedQr === 'cid' && qrBuffer && {
      attachments: [
        {
          filename: 'qr.png',
          content: qrBuffer,
          contentId: 'booking-qr',
        },
      ],
    }),
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

function buildCustomerPaidEmailHtml(
  p: BookingEmailPayload,
  qrImageSrc?: string
): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  const bookingUrl = p.bookingUrl || (siteUrl ? `${siteUrl.replace(/\/$/, '')}/rezervasyon` : '#')
  return buildConfirmationEmailHtml(
    { ...p, bookingUrl },
    { subtitle: 'Ödemeniz alındı. Rezervasyonunuz onaylanmıştır.', buttonText: 'Open booking', qrImageSrc }
  )
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
 * Müşteri e-postasında bookingUrl için QR kod base64 veya CID ile gömülür.
 */
export async function sendBookingPaidEmails(
  payload: BookingEmailPayload,
  options?: { embedQr?: QrEmbedMethod }
): Promise<void> {
  const resend = getResend()
  if (!resend) return

  const from = getFrom()
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  const bookingUrl =
    payload.bookingUrl || (siteUrl ? `${siteUrl.replace(/\/$/, '')}/rezervasyon` : '#')

  let qrImageSrc: string | undefined
  let qrBuffer: Buffer | undefined
  try {
    qrBuffer = await generateQrPng(bookingUrl)
    qrImageSrc =
      options?.embedQr === 'cid'
        ? 'cid:booking-qr'
        : `data:image/png;base64,${qrBuffer.toString('base64')}`
  } catch (e) {
    console.warn('[email] QR üretilemedi:', e)
  }

  const customerHtml = buildCustomerPaidEmailHtml({ ...payload, bookingUrl }, qrImageSrc)

  const { error: customerError } = await resend.emails.send({
    from,
    to: [payload.customer.email],
    subject: `Rezervasyonunuz onaylandı – ${payload.tourTitle}`,
    html: customerHtml,
    ...(options?.embedQr === 'cid' && qrBuffer && {
      attachments: [
        { filename: 'qr.png', content: qrBuffer, contentId: 'booking-qr' },
      ],
    }),
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
