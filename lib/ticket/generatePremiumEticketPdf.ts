import { PDFDocument, rgb, StandardFonts, PageSizes, type PDFFont, type PDFPage } from 'pdf-lib'
import QRCode from 'qrcode'
import type { PremiumEticketPayload } from './premiumEticket'

const MONTSERRAT_REG =
  'https://cdn.jsdelivr.net/npm/@fontsource/montserrat@5.2.5/files/montserrat-latin-400-normal.ttf'
const MONTSERRAT_BOLD =
  'https://cdn.jsdelivr.net/npm/@fontsource/montserrat@5.2.5/files/montserrat-latin-700-normal.ttf'
const DEJAVU_FONT_URL =
  'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf'
const DEJAVU_BOLD_URL =
  'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans-Bold.ttf'

// —— Palette (navy “wallet” kartı) ——
const NAVY_DEEP = { r: 6 / 255, g: 12 / 255, b: 32 / 255 }
const NAVY_MID = { r: 15 / 255, g: 31 / 255, b: 68 / 255 }
const NAVY_SOFT = { r: 28 / 255, g: 48 / 255, b: 92 / 255 }
const GLASS = rgb(255 / 255, 255 / 255, 255 / 255)
const GLASS_BORDER = rgb(120 / 255, 140 / 255, 180 / 255)
const TEXT_PRIMARY = rgb(248 / 255, 250 / 255, 252 / 255)
const TEXT_MUTED = rgb(148 / 255, 163 / 255, 184 / 255)
const TEXT_ACCENT = rgb(186 / 255, 230 / 255, 253 / 255)
const PAID_GREEN = rgb(52 / 255, 211 / 255, 153 / 255)
const REMAIN_AMBER = rgb(251 / 255, 191 / 255, 36 / 255)
const QR_SURFACE = rgb(1, 1, 1)

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

async function tryEmbedFontUrl(doc: PDFDocument, url: string): Promise<PDFFont | null> {
  try {
    const fontkit = (await import('@pdf-lib/fontkit')).default
    doc.registerFontkit(fontkit)
    const res = await fetch(url)
    if (!res.ok) return null
    const bytes = new Uint8Array(await res.arrayBuffer())
    return doc.embedFont(bytes)
  } catch {
    return null
  }
}

async function loadFonts(doc: PDFDocument): Promise<{ font: PDFFont; bold: PDFFont }> {
  let font = await tryEmbedFontUrl(doc, MONTSERRAT_REG)
  let bold = await tryEmbedFontUrl(doc, MONTSERRAT_BOLD)
  if (!font) font = await tryEmbedFontUrl(doc, DEJAVU_FONT_URL)
  if (!bold) bold = await tryEmbedFontUrl(doc, DEJAVU_BOLD_URL)
  if (!font) font = await doc.embedFont(StandardFonts.Helvetica)
  if (!bold) bold = await doc.embedFont(StandardFonts.HelveticaBold)
  return { font, bold }
}

async function embedPngFromDataUrl(doc: PDFDocument, dataUrl: string) {
  const m = /^data:image\/png;base64,(.+)$/i.exec(dataUrl)
  const base64 = m?.[1] ?? ''
  const buf = Buffer.from(base64, 'base64')
  return doc.embedPng(buf)
}

async function tryEmbedRemoteImage(doc: PDFDocument, url: string) {
  try {
    const ctrl = new AbortController()
    const kill = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(kill))
    if (!res.ok) return null
    const bytes = new Uint8Array(await res.arrayBuffer())
    try {
      return await doc.embedPng(bytes)
    } catch {
      return await doc.embedJpg(bytes)
    }
  } catch {
    return null
  }
}

function drawNavyGradient(page: PDFPage, W: number, H: number) {
  const steps = 56
  const h = H / steps
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    const r = lerp(NAVY_SOFT.r, NAVY_DEEP.r, t)
    const g = lerp(NAVY_SOFT.g, NAVY_DEEP.g, t)
    const b = lerp(NAVY_SOFT.b, NAVY_DEEP.b, t)
    page.drawRectangle({
      x: 0,
      y: i * h,
      width: W,
      height: h + 0.5,
      color: rgb(r, g, b),
    })
  }
}

function drawGlassCard(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  opacity = 0.14
) {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: GLASS,
    opacity,
    borderColor: GLASS_BORDER,
    borderWidth: 0.65,
    borderOpacity: 0.35,
  })
}

function labels(locale: 'tr' | 'en') {
  const tr = {
    ebilet: 'E-Bilet',
    passenger: 'Yolcu',
    guests: 'Misafir',
    ticketClass: 'Sınıf',
    schedule: 'Saatler',
    boarding: 'Biniş',
    departure: 'Kalkış',
    return: 'Dönüş',
    meeting: 'Buluşma',
    scan: 'Biniş için gösterin',
    payment: 'Ödeme',
    total: 'Toplam',
    paid: 'Ödenen',
    remaining: 'Kalan',
    reservation: 'Rezervasyon',
    contact: 'İletişim',
  }
  const en = {
    ebilet: 'E-Ticket',
    passenger: 'Passenger',
    guests: 'Guests',
    ticketClass: 'Class',
    schedule: 'Schedule',
    boarding: 'Boarding',
    departure: 'Departure',
    return: 'Return',
    meeting: 'Meeting point',
    scan: 'Show at boarding',
    payment: 'Payment',
    total: 'Total',
    paid: 'Paid',
    remaining: 'Due',
    reservation: 'Reservation',
    contact: 'Contact',
  }
  return locale === 'tr' ? tr : en
}

function fmtMoney(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

function guestLine(payload: PremiumEticketPayload, L: ReturnType<typeof labels>) {
  if (typeof payload.guestCount === 'number') {
    return payload.locale === 'tr' ? `${payload.guestCount} misafir` : `${payload.guestCount} guests`
  }
  return payload.guestCount
}

/** Basit çizgi ikonlar (SVG path, pdf-lib y ekseni düzeltmeli) */
function drawIconUser(page: PDFPage, x: number, yBottom: number, sizePt: number, color = TEXT_MUTED) {
  const s = sizePt / 24
  page.drawSvgPath(
    'M 12 11 C 14.2 11 16 9.2 16 7 C 16 4.8 14.2 3 12 3 C 9.8 3 8 4.8 8 7 C 8 9.2 9.8 11 12 11 Z M 4 21 C 4 17 7.5 14 12 14 C 16.5 14 20 17 20 21',
    { x, y: yBottom, scale: s, borderColor: color, borderWidth: 1.35 }
  )
}

function drawIconClock(page: PDFPage, x: number, yBottom: number, sizePt: number, color = TEXT_MUTED) {
  const s = sizePt / 24
  page.drawSvgPath('M 12 7 L 12 12 L 16 14', {
    x,
    y: yBottom,
    scale: s,
    borderColor: color,
    borderWidth: 1.35,
  })
  page.drawSvgPath(
    'M 12 2 C 6.5 2 2 6.5 2 12 C 2 17.5 6.5 22 12 22 C 17.5 22 22 17.5 22 12 C 22 6.5 17.5 2 12 2 Z',
    { x, y: yBottom, scale: s, borderColor: color, borderWidth: 1.2 }
  )
}

function drawIconLocation(page: PDFPage, x: number, yBottom: number, sizePt: number, color = TEXT_MUTED) {
  const s = sizePt / 24
  page.drawSvgPath(
    'M 12 2 C 8.7 2 6 4.7 6 8 C 6 13 12 21 12 21 C 12 21 18 13 18 8 C 18 4.7 15.3 2 12 2 Z M 12 10 C 13.1 10 14 9.1 14 8 C 14 6.9 13.1 6 12 6 C 10.9 6 10 6.9 10 8 C 10 9.1 10.9 10 12 10 Z',
    { x, y: yBottom, scale: s, borderColor: color, borderWidth: 1.15 }
  )
}

export async function generatePremiumEticketPdf(payload: PremiumEticketPayload): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const { font, bold } = await loadFonts(doc)
  const page = doc.addPage(PageSizes.A4)
  const W = page.getWidth()
  const H = page.getHeight()
  const L = labels(payload.locale)
  const numLocale = payload.locale === 'tr' ? 'tr-TR' : 'en-US'

  drawNavyGradient(page, W, H)

  const padX = 44
  const cardW = W - padX * 2
  const topStrip = H - 28
  const brand = (payload.brandName ?? process.env.NEXT_PUBLIC_SITE_NAME ?? 'Poseidon').trim()

  const ebiletW = bold.widthOfTextAtSize(L.ebilet, 9)
  const pillPadX = 10
  const pillW = ebiletW + pillPadX * 2
  const pillX = W - padX - pillW
  const pillY = topStrip - 24
  page.drawRectangle({
    x: pillX,
    y: pillY,
    width: pillW,
    height: 22,
    color: GLASS,
    opacity: 0.12,
    borderColor: GLASS_BORDER,
    borderWidth: 0.5,
    borderOpacity: 0.4,
  })
  page.drawText(L.ebilet, {
    x: pillX + pillPadX,
    y: pillY + 7,
    size: 9,
    font: bold,
    color: TEXT_ACCENT,
  })

  let headerLowY = pillY - 4
  if (payload.logoUrl) {
    const img = await tryEmbedRemoteImage(doc, payload.logoUrl)
    if (img) {
      const maxH = 32
      const scale = Math.min(160 / img.width, maxH / img.height)
      const iw = img.width * scale
      const ih = img.height * scale
      const logoBottom = topStrip - 36 - ih
      page.drawImage(img, { x: padX, y: logoBottom, width: iw, height: ih })
      headerLowY = Math.min(headerLowY, logoBottom - 6)
    }
  } else {
    page.drawText(brand.toUpperCase(), {
      x: padX,
      y: topStrip - 18,
      size: 11,
      font: bold,
      color: TEXT_PRIMARY,
    })
    headerLowY = Math.min(headerLowY, pillY - 26)
  }

  let y = headerLowY - 12

  if (payload.tourTitle?.trim()) {
    page.drawText(payload.tourTitle.trim(), {
      x: padX,
      y: y,
      size: 9,
      font: font,
      color: TEXT_MUTED,
      maxWidth: cardW - pillW - 16,
      lineHeight: 11,
    })
    const lines = Math.min(2, Math.ceil(payload.tourTitle.length / 70) || 1)
    y -= 8 + lines * 11
  }

  // —— Ana bilgi kartı ——
  const mainCardH = 118
  drawGlassCard(page, padX, y - mainCardH, cardW, mainCardH)
  let cy = y - 18
  drawIconUser(page, padX + 16, cy - 12, 13, TEXT_MUTED)
  page.drawText(L.passenger, {
    x: padX + 34,
    y: cy,
    size: 7.5,
    font: bold,
    color: TEXT_MUTED,
  })
  cy -= 20
  page.drawText(payload.passengerName, {
    x: padX + 16,
    y: cy,
    size: 17,
    font: bold,
    color: TEXT_PRIMARY,
    maxWidth: cardW - 32,
    lineHeight: 20,
  })
  cy -= 30
  const colW = (cardW - 48) / 2
  page.drawText(L.guests, {
    x: padX + 16,
    y: cy,
    size: 7,
    font: bold,
    color: TEXT_MUTED,
  })
  page.drawText(L.ticketClass, {
    x: padX + 16 + colW + 16,
    y: cy,
    size: 7,
    font: bold,
    color: TEXT_MUTED,
  })
  cy -= 16
  page.drawText(guestLine(payload, L), {
    x: padX + 16,
    y: cy,
    size: 12,
    font: bold,
    color: TEXT_ACCENT,
  })
  page.drawText(payload.ticketClass, {
    x: padX + 16 + colW + 16,
    y: cy,
    size: 11,
    font: bold,
    color: TEXT_PRIMARY,
    maxWidth: colW,
    lineHeight: 13,
  })

  y -= mainCardH + 18

  // —— Saatler ——
  const timeCardH = payload.meetingPoint?.trim() ? 108 : 82
  drawGlassCard(page, padX, y - timeCardH, cardW, timeCardH)
  let ty = y - 14
  drawIconClock(page, padX + 16, ty - 11, 12, TEXT_MUTED)
  page.drawText(L.schedule, {
    x: padX + 32,
    y: ty,
    size: 8,
    font: bold,
    color: TEXT_MUTED,
  })
  ty -= 26
  const tw = (cardW - 40) / 3
  const timeTrip: [string, string][] = [
    [L.boarding, payload.boardingTime],
    [L.departure, payload.departureTime],
    [L.return, payload.returnTime],
  ]
  for (let i = 0; i < 3; i++) {
    const [lab, val] = timeTrip[i]
    const tx = padX + 16 + i * tw
    page.drawText(lab.toUpperCase(), {
      x: tx,
      y: ty,
      size: 6.5,
      font: bold,
      color: TEXT_MUTED,
    })
    page.drawText(val, {
      x: tx,
      y: ty - 20,
      size: 14,
      font: bold,
      color: TEXT_PRIMARY,
    })
  }
  ty -= 44
  if (payload.meetingPoint?.trim()) {
    drawIconLocation(page, padX + 16, ty - 11, 12, TEXT_MUTED)
    page.drawText(L.meeting, {
      x: padX + 32,
      y: ty,
      size: 7.5,
      font: bold,
      color: TEXT_MUTED,
    })
    ty -= 16
    page.drawText(payload.meetingPoint.trim(), {
      x: padX + 16,
      y: ty,
      size: 9,
      font: font,
      color: TEXT_ACCENT,
      maxWidth: cardW - 32,
      lineHeight: 12,
    })
  }

  y -= timeCardH + 20

  // —— QR (büyük, beyaz yüzey) ——
  const qrPixels = 720
  const qrDataUrl = await QRCode.toDataURL(payload.qrPayload, {
    type: 'image/png',
    width: qrPixels,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#0f172a', light: '#ffffff' },
  })
  const qrImg = await embedPngFromDataUrl(doc, qrDataUrl)
  const qrTarget = 168
  const qrScale = qrTarget / Math.max(qrImg.width, qrImg.height)
  const qrW = qrImg.width * qrScale
  const qrH = qrImg.height * qrScale
  const qrBoxPad = 18
  const qrBoxW = qrW + qrBoxPad * 2
  const qrBoxH = qrH + qrBoxPad * 2 + 36
  const qrBoxX = (W - qrBoxW) / 2

  page.drawRectangle({
    x: qrBoxX,
    y: y - qrBoxH,
    width: qrBoxW,
    height: qrBoxH,
    color: QR_SURFACE,
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 0.8,
  })
  page.drawText(L.scan, {
    x: W / 2 - bold.widthOfTextAtSize(L.scan, 8) / 2,
    y: y - 14,
    size: 8,
    font: bold,
    color: rgb(0.35, 0.4, 0.48),
  })
  const qix = qrBoxX + qrBoxPad
  const qiy = y - qrBoxH + qrBoxPad
  page.drawImage(qrImg, { x: qix, y: qiy, width: qrW, height: qrH })

  y -= qrBoxH + 22

  // —— Ödeme özeti ——
  const payH = 72
  drawGlassCard(page, padX, y - payH, cardW, payH, 0.1)
  page.drawText(L.payment.toUpperCase(), {
    x: padX + 16,
    y: y - 14,
    size: 7,
    font: bold,
    color: TEXT_MUTED,
  })
  const pw = (cardW - 40) / 3
  const payY = y - 40
  const amounts: [string, string, ReturnType<typeof rgb>][] = [
    [L.total, fmtMoney(payload.totalAmount, payload.currency, numLocale), TEXT_PRIMARY],
    [L.paid, fmtMoney(payload.paidAmount, payload.currency, numLocale), PAID_GREEN],
    [
      L.remaining,
      fmtMoney(payload.remainingAmount, payload.currency, numLocale),
      REMAIN_AMBER,
    ],
  ]
  for (let i = 0; i < 3; i++) {
    const [lab, val, col] = amounts[i]
    const px = padX + 16 + i * pw
    page.drawText(lab, { x: px, y: payY + 22, size: 7, font: bold, color: TEXT_MUTED })
    page.drawText(val, { x: px, y: payY, size: 12, font: bold, color: col })
  }

  y -= payH + 20

  // —— Footer ——
  const footH = 62
  drawGlassCard(page, padX, y - footH, cardW, footH, 0.08)
  page.drawText(L.reservation, {
    x: padX + 16,
    y: y - 16,
    size: 7,
    font: bold,
    color: TEXT_MUTED,
  })
  page.drawText(payload.reservationCode, {
    x: padX + 16,
    y: y - 36,
    size: 15,
    font: bold,
    color: TEXT_ACCENT,
  })

  const contactBits = [payload.contactPhone, payload.contactEmail, payload.contactWebsite].filter(
    Boolean
  ) as string[]
  const contactLine = contactBits.join('  ·  ')
  if (contactLine) {
    page.drawText(L.contact, {
      x: padX + 16,
      y: y - 52,
      size: 6.5,
      font: bold,
      color: TEXT_MUTED,
    })
    page.drawText(contactLine, {
      x: padX + 16,
      y: y - footH + 10,
      size: 7.5,
      font: font,
      color: TEXT_MUTED,
      maxWidth: cardW - 32,
      lineHeight: 10,
    })
  }

  // İnce marka çizgisi (premium detay)
  page.drawRectangle({
    x: padX,
    y: 28,
    width: cardW,
    height: 2,
    color: rgb(NAVY_MID.r, NAVY_MID.g, NAVY_MID.b),
    opacity: 0.9,
  })
  page.drawRectangle({
    x: padX,
    y: 28,
    width: cardW * 0.22,
    height: 2,
    color: TEXT_ACCENT,
    opacity: 0.85,
  })

  return doc.save()
}
