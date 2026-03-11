import { PDFDocument, rgb, StandardFonts, type PDFFont } from 'pdf-lib'
import QRCode from 'qrcode'
import type { VoucherData } from './types'

const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89
const MARGIN = 28
const SPACING = 16

/* Biniş kartı renkleri (web ile aynı) */
const BLUE = rgb(30 / 255, 58 / 255, 138 / 255)       // #1e3a8a
const BLUE_LIGHT = rgb(37 / 255, 99 / 255, 235 / 255) // #2563eb
const WHITE = rgb(1, 1, 1)
const GRAY_LABEL = rgb(107 / 255, 114 / 255, 128 / 255)
const GRAY_VALUE = rgb(17 / 255, 24 / 255, 39 / 255)
const CARD_BG = rgb(249 / 255, 250 / 255, 251 / 255)
const DASHED_STROKE = rgb(209 / 255, 213 / 255, 219 / 255)

const DEJAVU_FONT_URL =
  'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf'
const DEJAVU_BOLD_URL =
  'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans-Bold.ttf'

async function loadFont(doc: PDFDocument): Promise<PDFFont> {
  try {
    const fontkit = (await import('@pdf-lib/fontkit')).default
    doc.registerFontkit(fontkit)
    const res = await fetch(DEJAVU_FONT_URL)
    if (!res.ok) throw new Error('Font fetch failed')
    const bytes = new Uint8Array(await res.arrayBuffer())
    return doc.embedFont(bytes)
  } catch {
    return doc.embedFont(StandardFonts.Helvetica)
  }
}

async function loadBoldFont(doc: PDFDocument): Promise<PDFFont> {
  try {
    const fontkit = (await import('@pdf-lib/fontkit')).default
    doc.registerFontkit(fontkit)
    const res = await fetch(DEJAVU_BOLD_URL)
    if (!res.ok) throw new Error('Bold font fetch failed')
    const bytes = new Uint8Array(await res.arrayBuffer())
    return doc.embedFont(bytes)
  } catch {
    return doc.embedFont(StandardFonts.HelveticaBold)
  }
}

function generateQRDataUrl(url: string, size = 220): Promise<string> {
  return QRCode.toDataURL(url, {
    type: 'image/png',
    width: size,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  })
}

function statusLabel(status?: string): string {
  switch (status) {
    case 'paid':
      return 'Ödendi'
    case 'cancelled':
      return 'İptal'
    default:
      return 'Onay Bekliyor'
  }
}

/** Kalkış saatinden 30 dakika önce biniş saatini hesaplar (örn. "18:00" → "17:30"). */
function boardingTimeBeforeDeparture(departureTime: string | undefined): string | null {
  if (!departureTime?.trim()) return null
  const m = departureTime.trim().match(/^(\d{1,2})\s*:\s*(\d{2})/)
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

/** Kalkış saatine 7 saat 10 dakika ekleyerek varış saatini hesaplar. */
function arrivalTimeAfterDeparture(departureTime: string | undefined): string | null {
  if (!departureTime?.trim()) return null
  const m = departureTime.trim().match(/^(\d{1,2})\s*:\s*(\d{2})/)
  if (!m) return null
  let h = parseInt(m[1], 10)
  let min = parseInt(m[2], 10)
  min += 10
  if (min >= 60) {
    min -= 60
    h += 1
  }
  h += 7
  if (h >= 24) h -= 24
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

function drawDashedLine(
  page: {
    drawLine: (opts: {
      start: { x: number; y: number }
      end: { x: number; y: number }
      thickness?: number
      color?: ReturnType<typeof rgb>
      dashArray?: number[]
    }) => void
  },
  x1: number,
  y: number,
  x2: number,
  color = DASHED_STROKE
) {
  page.drawLine({
    start: { x: x1, y },
    end: { x: x2, y },
    thickness: 0.5,
    color,
    dashArray: [4, 3],
  })
}

/**
 * İki kartlı biniş kartı PDF: sol kart (mavi başlık + beyaz satırlar + küçük QR),
 * sağ kart (beyaz üst + büyük QR + lacivert alt bar). Web bilet ile aynı görsel dil.
 */
export async function generateVoucherPdf(data: VoucherData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await loadFont(doc)
  const boldFont = await loadBoldFont(doc)
  const page = doc.addPage([A4_WIDTH, A4_HEIGHT])

  const qrLargeSize = 140
  const qrLargeDataUrl = await generateQRDataUrl(data.bookingUrl, 320)
  const qrLargeImg = await doc.embedPng(qrLargeDataUrl)
  const scaleLarge = qrLargeSize / Math.max(qrLargeImg.width, qrLargeImg.height)

  const cardWidth = A4_WIDTH - 2 * MARGIN
  let y = A4_HEIGHT - MARGIN

  // ---------- KART 1: Ana biniş kartı ----------
  const headerBlueH = 58
  const bodyRowH = 26
  const bodyRows = 5
  const card1BodyH = 200

  // Lacivert başlık: sadece "Cesme Poseidon Mobil Bilet" büyük ve kalın, tüm alanı kaplar
  page.drawRectangle({
    x: MARGIN,
    y: y - headerBlueH,
    width: cardWidth,
    height: headerBlueH,
    color: BLUE,
  })
  const headerTitle = 'Cesme Poseidon Mobil Bilet'
  const headerTitleSize = 26
  const headerTitleW = boldFont.widthOfTextAtSize(headerTitle, headerTitleSize)
  page.drawText(headerTitle, {
    x: (A4_WIDTH - headerTitleW) / 2,
    y: y - headerBlueH + (headerBlueH - headerTitleSize) / 2 + 4,
    size: headerTitleSize,
    font: boldFont,
    color: WHITE,
  })

  y -= headerBlueH

  // Beyaz gövde + kesik çizgiler
  page.drawRectangle({
    x: MARGIN,
    y: y - card1BodyH,
    width: cardWidth,
    height: card1BodyH,
    color: WHITE,
  })
  const leftX = MARGIN + 20
  const rightX = A4_WIDTH - MARGIN - 20
  let rowY = y - 16

  const drawRow = (
    label1: string,
    value1: string,
    label2: string,
    value2: string,
    value1Blue = false
  ) => {
    page.drawText(label1, { x: leftX, y: rowY, size: 9, font: boldFont, color: GRAY_LABEL })
    page.drawText(value1, {
      x: leftX,
      y: rowY - 13,
      size: 12,
      font: value1Blue ? boldFont : font,
      color: value1Blue ? BLUE_LIGHT : GRAY_VALUE,
    })
    const v2 = value2.length > 24 ? value2.slice(0, 22) + '…' : value2
    const wLabel2 = font.widthOfTextAtSize(label2, 9)
    const wVal2 = font.widthOfTextAtSize(v2, 12)
    page.drawText(label2, { x: rightX - Math.max(wLabel2, wVal2), y: rowY, size: 9, font: boldFont, color: GRAY_LABEL })
    page.drawText(v2, { x: rightX - wVal2, y: rowY - 13, size: 12, font, color: GRAY_VALUE })
    rowY -= bodyRowH
  }

  drawRow('TUR', data.tourTitle, 'TARIH', data.date, true)
  drawDashedLine(page, leftX, rowY + 6, rightX)
  rowY -= 6
  const boardingTimeRow = boardingTimeBeforeDeparture(data.time) ?? data.time ?? '—'
  drawRow('TOPLANMA', data.meetingPickup, 'BINIŞ', boardingTimeRow)
  drawDashedLine(page, leftX, rowY + 6, rightX)
  rowY -= 6
  page.drawText('SINIF', { x: leftX, y: rowY, size: 9, font: boldFont, color: GRAY_LABEL })
  page.drawText(data.className?.trim() || '—', { x: leftX, y: rowY - 13, size: 12, font, color: GRAY_VALUE })
  rowY -= bodyRowH
  drawDashedLine(page, leftX, rowY + 6, rightX)
  rowY -= 6
  page.drawText('YOLCU', { x: leftX, y: rowY, size: 9, font: boldFont, color: GRAY_LABEL })
  page.drawText(data.customerName, {
    x: leftX,
    y: rowY - 13,
    size: 12,
    font: boldFont,
    color: BLUE_LIGHT,
  })
  rowY -= bodyRowH + 2
  drawDashedLine(page, leftX, rowY + 10, rightX)
  rowY -= 6
  page.drawText('REZERVASYON NO', { x: leftX, y: rowY, size: 9, font: boldFont, color: GRAY_LABEL })
  page.drawText(data.referenceNumber, {
    x: leftX,
    y: rowY - 13,
    size: 12,
    font: boldFont,
    color: BLUE_LIGHT,
  })
  rowY -= 18

  y -= card1BodyH + SPACING

  // ---------- KART 2: QR / Biniş doğrulama ----------
  const card2TopH = 62
  const card2QrH = 28 + qrLargeSize + 28
  const card2BarH = 48
  const card2H = card2TopH + card2QrH + card2BarH

  page.drawRectangle({
    x: MARGIN,
    y: y - card2TopH,
    width: cardWidth,
    height: card2TopH,
    color: WHITE,
  })
  const arrivalTime = arrivalTimeAfterDeparture(data.time)
  const depTimeStr = data.time ?? '—'
  const arrTimeStr = arrivalTime ?? '—'
  drawDashedLine(page, MARGIN + 20, y - card2TopH + 26, A4_WIDTH - MARGIN - 20)
  // Sol sütun: KALKIŞ + saat (etiket üstte, saat altta, çakışmasın)
  page.drawText('KALKIŞ', { x: MARGIN + 24, y: y - 12, size: 9, font: boldFont, color: GRAY_LABEL })
  page.drawText(depTimeStr, { x: MARGIN + 24, y: y - 28, size: 13, font: boldFont, color: GRAY_VALUE })
  // Sağ sütun: VARIŞ + saat (etiket üstte, saat altta)
  const rightColW = Math.max(
    boldFont.widthOfTextAtSize('VARIŞ', 9),
    boldFont.widthOfTextAtSize(arrTimeStr, 13)
  )
  const rightColX = A4_WIDTH - MARGIN - 24 - rightColW
  page.drawText('VARIŞ', { x: rightColX, y: y - 12, size: 9, font: boldFont, color: GRAY_LABEL })
  page.drawText(arrTimeStr, { x: rightColX, y: y - 28, size: 13, font: boldFont, color: GRAY_VALUE })
  page.drawText('TUR', { x: MARGIN + 24, y: y - 46, size: 9, font: boldFont, color: GRAY_LABEL })
  const tourTitleFull2 = data.tourTitle
  if (font.widthOfTextAtSize(tourTitleFull2, 12) <= cardWidth - 48) {
    page.drawText(tourTitleFull2, { x: MARGIN + 24, y: y - 56, size: 12, font: boldFont, color: GRAY_VALUE })
  } else {
    const mid = Math.ceil(tourTitleFull2.length / 2)
    page.drawText(tourTitleFull2.slice(0, mid), { x: MARGIN + 24, y: y - 50, size: 11, font: boldFont, color: GRAY_VALUE })
    page.drawText(tourTitleFull2.slice(mid), { x: MARGIN + 24, y: y - 59, size: 11, font, color: GRAY_VALUE })
  }

  y -= card2TopH

  page.drawRectangle({
    x: MARGIN,
    y: y - card2QrH,
    width: cardWidth,
    height: card2QrH,
    color: WHITE,
  })
  drawDashedLine(page, MARGIN + 20, y - 18, A4_WIDTH - MARGIN - 20)
  const qrHintText = 'Binişte bu QR kodu gösterin'
  page.drawText(qrHintText, {
    x: (A4_WIDTH - font.widthOfTextAtSize(qrHintText, 11)) / 2,
    y: y - 32,
    size: 11,
    font,
    color: GRAY_VALUE,
  })
  const qr2X = (A4_WIDTH - qrLargeSize) / 2
  const qr2Y = y - card2QrH + 32
  page.drawImage(qrLargeImg, {
    x: qr2X,
    y: qr2Y,
    width: qrLargeImg.width * scaleLarge,
    height: qrLargeImg.height * scaleLarge,
  })

  y -= card2QrH

  page.drawRectangle({
    x: MARGIN,
    y: y - card2BarH,
    width: cardWidth,
    height: card2BarH,
    color: BLUE,
  })
  const refNum = data.referenceNumber
  const barLabelSize = 9
  const barValueSize = 12
  const barLineH = 18
  const barTop = y - card2BarH
  page.drawText('YOLCU', { x: MARGIN + 24, y: barTop + card2BarH - 12, size: barLabelSize, font: boldFont, color: WHITE, opacity: 0.9 })
  page.drawText(data.customerName, {
    x: MARGIN + 24,
    y: barTop + card2BarH - 12 - barLineH,
    size: barValueSize,
    font: boldFont,
    color: WHITE,
  })
  const refW = boldFont.widthOfTextAtSize(refNum, barValueSize)
  const refLabelW = boldFont.widthOfTextAtSize('REZERVASYON NO', barLabelSize)
  const rightW = Math.max(refW, refLabelW)
  const rightBarX = A4_WIDTH - MARGIN - 24 - rightW
  page.drawText('REZERVASYON NO', {
    x: rightBarX,
    y: barTop + card2BarH - 12,
    size: barLabelSize,
    font: boldFont,
    color: WHITE,
    opacity: 0.9,
  })
  page.drawText(refNum, {
    x: rightBarX,
    y: barTop + card2BarH - 12 - barLineH,
    size: barValueSize,
    font: boldFont,
    color: WHITE,
  })

  y -= card2BarH + SPACING

  // Özet: Toplam, Ödenen, Biniş (30 dk önce), Varış (7s 10dk sonra), Kişi sayısı, Toplanma
  const boardingTime = boardingTimeBeforeDeparture(data.time)
  const arrivalTimeInfo = arrivalTimeAfterDeparture(data.time)
  const infoLineH = 14
  const infoRows = 6
  const infoH = infoRows * infoLineH + 12
  page.drawRectangle({
    x: MARGIN,
    y: y - infoH,
    width: cardWidth,
    height: infoH,
    color: CARD_BG,
  })
  let infoY = y - 14
  page.drawText('Toplam', { x: MARGIN + 20, y: infoY, size: 11, font: boldFont, color: GRAY_LABEL })
  const totalStr = `${data.totalPrice} ${data.currency}`
  page.drawText(totalStr, {
    x: A4_WIDTH - MARGIN - 20 - font.widthOfTextAtSize(totalStr, 12),
    y: infoY,
    size: 12,
    font: boldFont,
    color: GRAY_VALUE,
  })
  infoY -= infoLineH
  const paidAmount = data.depositAmount != null ? data.depositAmount : data.totalPrice
  const paidStr = `${paidAmount} ${data.currency}`
  page.drawText('Ödenen tutar', { x: MARGIN + 20, y: infoY, size: 11, font: boldFont, color: GRAY_LABEL })
  page.drawText(paidStr, {
    x: A4_WIDTH - MARGIN - 20 - font.widthOfTextAtSize(paidStr, 12),
    y: infoY,
    size: 12,
    font: boldFont,
    color: GRAY_VALUE,
  })
  infoY -= infoLineH
  const binişLabel = boardingTime
    ? `Biniş: ${boardingTime} (kalkış saatinden 30 dk önce)`
    : 'Biniş: kalkış saatinden 30 dakika önce'
  page.drawText(binişLabel, {
    x: MARGIN + 20,
    y: infoY,
    size: 10,
    font,
    color: GRAY_VALUE,
  })
  infoY -= infoLineH
  page.drawText('Varış', { x: MARGIN + 20, y: infoY, size: 11, font: boldFont, color: GRAY_LABEL })
  page.drawText(arrivalTimeInfo ?? '—', {
    x: A4_WIDTH - MARGIN - 20 - font.widthOfTextAtSize(arrivalTimeInfo ?? '—', 12),
    y: infoY,
    size: 12,
    font: boldFont,
    color: GRAY_VALUE,
  })
  infoY -= infoLineH
  const participantsStr = `Yetişkin: ${data.adults}  ·  Çocuk: ${data.children}  ·  Bebek: ${data.babies}`
  page.drawText('Kişi sayısı', { x: MARGIN + 20, y: infoY, size: 11, font: boldFont, color: GRAY_LABEL })
  page.drawText(participantsStr, {
    x: A4_WIDTH - MARGIN - 20 - font.widthOfTextAtSize(participantsStr, 11),
    y: infoY,
    size: 11,
    font,
    color: GRAY_VALUE,
  })
  infoY -= infoLineH
  page.drawText(`Toplanma: ${data.meetingPickup}`, {
    x: MARGIN + 20,
    y: infoY,
    size: 10,
    font,
    color: GRAY_LABEL,
  })

  y -= infoH + 20

  // Önemli bilgiler
  page.drawText('Önemli Bilgiler', { x: MARGIN, y: y, size: 12, font: boldFont, color: GRAY_VALUE })
  y -= 16
  const bullets = [
    'Lütfen kalkış saatinden 30 dakika önce teknede olun.',
    'Biniş sırasında QR biletinizi gösteriniz.',
    'Rezervasyon numaranızı saklayınız.',
  ]
  for (const line of bullets) {
    page.drawText('•', { x: MARGIN, y, font, size: 10, color: GRAY_LABEL })
    page.drawText(line, { x: MARGIN + 10, y, font, size: 10, color: GRAY_VALUE })
    y -= 14
  }

  y -= 14

  // Footer
  const footerHeight = 32
  page.drawRectangle({ x: 0, y: 0, width: A4_WIDTH, height: footerHeight, color: BLUE })
  page.drawText(`Destek: ${data.supportEmail}  |  ${data.website}`, {
    x: MARGIN,
    y: footerHeight - 12,
    font,
    size: 9,
    color: WHITE,
    opacity: 0.9,
  })
  page.drawText(`© ${data.copyrightYear} Çeşme Poseidon`, {
    x: MARGIN,
    y: footerHeight - 22,
    font,
    size: 9,
    color: WHITE,
    opacity: 0.9,
  })

  return doc.save()
}
