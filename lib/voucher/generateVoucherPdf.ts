/**
 * A4 e-bilet PDF — web’deki BoardingPassTicket ile aynı içerik ve düzen (kenardan kenara, tek sayfa).
 */
import { PDFDocument, rgb, StandardFonts, PageSizes, type PDFFont } from 'pdf-lib'
import QRCode from 'qrcode'
import type { SiteLocale } from '@/lib/i18n/config'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { numberLocaleForBooking, voucherPdfUiStrings, formatParticipantCountsLine } from '@/lib/i18n/bookingFlowLocale'
import type { VoucherData } from './types'

const BLUE = rgb(30 / 255, 58 / 255, 138 / 255)
const BLUE_LIGHT = rgb(37 / 255, 99 / 255, 235 / 255)
const WHITE = rgb(1, 1, 1)
const GRAY_LABEL = rgb(82 / 255, 88 / 255, 102 / 255)
const GRAY_MUTED = rgb(100 / 255, 106 / 255, 120 / 255)
const GRAY_VALUE = rgb(15 / 255, 23 / 255, 42 / 255)
const SLATE_50 = rgb(248 / 255, 250 / 255, 252 / 255)
const CARD_BORDER = rgb(226 / 255, 232 / 255, 240 / 255)
const EMERALD_800 = rgb(6 / 255, 95 / 255, 70 / 255)

const MONTSERRAT_REG =
  'https://cdn.jsdelivr.net/npm/@fontsource/montserrat@5.2.5/files/montserrat-latin-400-normal.ttf'
const MONTSERRAT_BOLD =
  'https://cdn.jsdelivr.net/npm/@fontsource/montserrat@5.2.5/files/montserrat-latin-700-normal.ttf'
const DEJAVU_FONT_URL =
  'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf'
const DEJAVU_BOLD_URL =
  'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans-Bold.ttf'

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

function generateQRDataUrl(url: string, pixelSize: number): Promise<string> {
  return QRCode.toDataURL(url, {
    type: 'image/png',
    width: pixelSize,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#0f172a', light: '#ffffff' },
  })
}

function boardingTimeBefore(time: string | undefined): string | null {
  if (!time?.trim()) return null
  const m = time.trim().match(/^(\d{1,2})\s*:\s*(\d{2})/)
  if (!m) return null
  let h = parseInt(m[1], 10)
  let min = parseInt(m[2], 10)
  min -= 30
  if (min < 0) {
    min += 60
    h -= 1
  }
  if (h < 0) h += 24
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

/** Web bilet sayfasındaki “ödenen tutar” mantığına yakın */
function resolvePaidAmountForPdf(data: VoucherData): number | null {
  if (typeof data.paidNow === 'number' && data.paidNow > 0) return data.paidNow
  const st = (data.status ?? '').toLowerCase()
  if (st !== 'paid' && st !== 'confirmed') return null
  if (data.totalPrice <= 0) return null
  if (typeof data.depositAmount === 'number' && data.depositAmount > 0) return data.depositAmount
  return data.totalPrice
}

/** maxWidth ile kırpılmış metnin yaklaşık satır sayısı (satır yüksekliği lineH) */
function estimateWrappedLines(text: string, maxW: number, lineH: number, size: number, f: PDFFont): number {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return 1
  let lines = 1
  let lineW = 0
  for (const w of words) {
    const piece = (lineW > 0 ? ' ' : '') + w
    const pw = f.widthOfTextAtSize(piece, size)
    if (lineW + pw > maxW && lineW > 0) {
      lines++
      lineW = f.widthOfTextAtSize(w, size)
    } else {
      lineW += pw
    }
  }
  return Math.max(1, lines)
}

export async function generateVoucherPdf(
  data: VoucherData,
  locale: SiteLocale = DEFAULT_LOCALE
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const { font, bold } = await loadFonts(doc)
  const page = doc.addPage(PageSizes.A4)
  const W = page.getWidth()
  const H = page.getHeight()
  const pad = 22
  const innerW = W - pad * 2
  const s = voucherPdfUiStrings(locale)
  const numLoc = numberLocaleForBooking(locale)

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: WHITE })

  const depTime = data.time?.trim() || '—'
  const boardingTime = boardingTimeBefore(data.time) ?? depTime
  const scheduleLine =
    depTime !== '—' ? s.estDeparture(depTime, boardingTime) : s.boardingTimeOnly(boardingTime)

  const tourTitle = (data.tourTitle ?? '—').trim()
  const tourUpper =
    tourTitle.length > 96 ? `${tourTitle.slice(0, 93).toUpperCase()}…` : tourTitle.toUpperCase()
  const classDisplay = data.firstClassLoca?.trim()
    ? `${(data.className ?? '—').trim()} · ${s.locaPrefix} ${data.firstClassLoca.trim()}`
    : (data.className ?? '—').trim() || '—'

  const paidShown = resolvePaidAmountForPdf(data)
  const participantsLine = formatParticipantCountsLine(
    { adult: data.adults, child: data.children, infant: data.babies },
    locale
  )
  const arr = data.arrivalTime?.trim()

  // —— Mavi başlık (web ile aynı tam genişlik) ——
  const routeMaxW = innerW - 120
  const routeLines = estimateWrappedLines(tourUpper, routeMaxW, 13, 11, bold)
  const dateBoxH = 76
  const headerH = 26 + 28 + 14 + routeLines * 14 + 8 + dateBoxH + 18
  const headerBottom = H - headerH

  page.drawRectangle({ x: 0, y: headerBottom, width: W, height: headerH, color: BLUE })

  let ty = H - 18
  page.drawText(s.ebiletBadge, { x: pad, y: ty, size: 8, font: bold, color: WHITE })
  const dur = data.durationLabel?.trim()
  if (dur) {
    const durLine = `${s.durationPrefix} ${dur}`
    page.drawText(durLine, {
      x: W - pad - bold.widthOfTextAtSize(durLine, 8),
      y: ty,
      size: 8,
      font: bold,
      color: WHITE,
      opacity: 0.88,
    })
  }
  ty -= 26

  page.drawText(s.cesme, { x: pad, y: ty, size: 14, font: bold, color: WHITE })
  page.drawText(tourUpper, {
    x: pad + 108,
    y: ty,
    size: 11,
    font: bold,
    color: WHITE,
    maxWidth: routeMaxW,
    lineHeight: 13,
  })
  ty -= 12 + routeLines * 14

  const insetX = pad
  const insetW = innerW
  const insetBottom = headerBottom + 14
  const insetTop = insetBottom + dateBoxH
  page.drawRectangle({
    x: insetX,
    y: insetBottom,
    width: insetW,
    height: dateBoxH,
    color: rgb(0, 0, 0),
    opacity: 0.1,
    borderColor: WHITE,
    borderWidth: 0.6,
    borderOpacity: 0.35,
  })

  let dty = insetTop - 14
  page.drawText(s.tourDate, {
    x: insetX + 14,
    y: dty,
    size: 8,
    font: bold,
    color: WHITE,
    opacity: 0.78,
  })
  dty -= 22
  page.drawText(data.date, { x: insetX + 14, y: dty, size: 20, font: bold, color: WHITE })
  dty -= 24
  page.drawText(scheduleLine, {
    x: insetX + 14,
    y: dty,
    size: 9,
    font: bold,
    color: WHITE,
    opacity: 0.95,
    maxWidth: insetW - 28,
    lineHeight: 11,
  })
  const schedLines = estimateWrappedLines(scheduleLine, insetW - 28, 11, 9, bold)
  dty -= 10 + (schedLines - 1) * 11
  if (arr) {
    dty -= 12
    page.drawText(s.estArrival(arr), {
      x: insetX + 14,
      y: dty,
      size: 9,
      font: bold,
      color: WHITE,
      opacity: 0.9,
      maxWidth: insetW - 28,
    })
  }

  // —— Beyaz gövde ——
  let y = headerBottom - 28
  const colGap = 20
  const colW = (innerW - colGap) / 2
  const baseX = pad

  page.drawText(s.passenger, { x: baseX, y: y, size: 8, font: bold, color: GRAY_LABEL })
  page.drawText(s.classLabel, { x: baseX + colW + colGap, y: y, size: 8, font: bold, color: GRAY_LABEL })
  y -= 18
  page.drawText(data.customerName, {
    x: baseX,
    y,
    size: 13,
    font: bold,
    color: BLUE_LIGHT,
    maxWidth: colW + 16,
  })
  page.drawText(classDisplay, {
    x: baseX + colW + colGap,
    y,
    size: 12,
    font: bold,
    color: GRAY_VALUE,
    maxWidth: colW,
  })
  y -= 16
  page.drawText(participantsLine, {
    x: baseX,
    y,
    size: 9,
    font: bold,
    color: GRAY_MUTED,
    maxWidth: colW + 40,
  })

  y -= 28
  const refBoxH = 42
  page.drawRectangle({
    x: baseX,
    y: y - refBoxH + 12,
    width: innerW,
    height: refBoxH,
    color: SLATE_50,
    borderColor: CARD_BORDER,
    borderWidth: 0.5,
  })
  page.drawText(s.refNumber, {
    x: baseX + 12,
    y: y - 2,
    size: 8,
    font: bold,
    color: GRAY_LABEL,
  })
  page.drawText(data.referenceNumber, {
    x: baseX + 12,
    y: y - 20,
    size: 12,
    font: bold,
    color: GRAY_VALUE,
  })
  y -= refBoxH + 18

  // —— QR ——
  const qrPixels = 640
  const qrDataUrl = await generateQRDataUrl(data.bookingUrl, qrPixels)
  const qrImg = await embedPngFromDataUrl(doc, qrDataUrl)
  const qrTarget = 168
  const qrScale = qrTarget / Math.max(qrImg.width, qrImg.height)

  const qrSectionH = 22 + 18 + 14 + qrTarget + 36
  const qx0 = (W - (qrTarget + 40)) / 2
  page.drawRectangle({
    x: qx0 - 10,
    y: y - qrSectionH + 10,
    width: qrTarget + 60,
    height: qrSectionH,
    color: SLATE_50,
    borderColor: CARD_BORDER,
    borderWidth: 1.2,
  })

  let qy = y - 12
  const qrCenter = qx0 + (qrTarget + 40) / 2
  page.drawText(s.boardingVerify, {
    x: qrCenter - bold.widthOfTextAtSize(s.boardingVerify, 8) / 2,
    y: qy,
    size: 8,
    font: bold,
    color: GRAY_LABEL,
  })
  qy -= 20
  page.drawText(s.qrCode, {
    x: qrCenter - bold.widthOfTextAtSize(s.qrCode, 12) / 2,
    y: qy,
    size: 12,
    font: bold,
    color: GRAY_VALUE,
  })
  qy -= 16
  const hint = s.qrHint
  page.drawText(hint, {
    x: qrCenter - font.widthOfTextAtSize(hint, 9) / 2,
    y: qy,
    size: 9,
    font: bold,
    color: GRAY_MUTED,
  })
  qy -= 18

  const qix = qx0 + 12
  const qiy = qy - qrTarget
  page.drawRectangle({
    x: qix - 4,
    y: qiy - 4,
    width: qrTarget + 8,
    height: qrTarget + 8,
    color: WHITE,
    borderColor: CARD_BORDER,
    borderWidth: 1,
  })
  page.drawImage(qrImg, {
    x: qix,
    y: qiy,
    width: qrImg.width * qrScale,
    height: qrImg.height * qrScale,
  })

  y = qiy - 28

  // —— Alt bilgi (slate-50) ——
  const footH = paidShown != null ? 68 : 58
  if (y - footH < 36) {
    y = footH + 48
  }
  page.drawRectangle({
    x: 0,
    y: y - footH,
    width: W,
    height: footH,
    color: SLATE_50,
    borderColor: CARD_BORDER,
    borderWidth: 0.5,
  })

  const fy = y - 18
  page.drawText(s.total, { x: pad, y: fy, size: 8, font: bold, color: GRAY_LABEL })
  const totalStr = `${Number(data.totalPrice).toLocaleString(numLoc)} ${data.currency}`
  page.drawText(totalStr, { x: pad, y: fy - 20, size: 15, font: bold, color: GRAY_VALUE })

  let fx2 = pad + 200
  if (paidShown != null) {
    page.drawText(s.paid, { x: fx2, y: fy, size: 8, font: bold, color: GRAY_LABEL })
    const paidStr = `${paidShown.toLocaleString(numLoc)} ${data.currency}`
    page.drawText(paidStr, { x: fx2, y: fy - 20, size: 12, font: bold, color: EMERALD_800 })
    fx2 += 150
  }

  const meetX = Math.min(W - pad - 200, fx2 + 20)
  page.drawText(s.meeting, { x: meetX, y: fy, size: 8, font: bold, color: GRAY_LABEL })
  page.drawText(data.meetingPickup, {
    x: meetX,
    y: fy - 20,
    size: 9,
    font: bold,
    color: GRAY_VALUE,
    maxWidth: W - meetX - pad,
    lineHeight: 11,
  })

  return doc.save()
}
