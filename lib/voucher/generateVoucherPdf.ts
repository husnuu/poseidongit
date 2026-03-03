import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib'
import QRCode from 'qrcode'
import type { VoucherData } from './types'

const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89
const MARGIN = 24
const HEADER_HEIGHT = 72
const SPACING = 20
const QR_SIZE = 80

// Brand: lacivert #131719
const HEADER_RGB = rgb(19 / 255, 23 / 255, 25 / 255)
const WHITE = rgb(1, 1, 1)
const TEXT_PRIMARY = rgb(31 / 255, 41 / 255, 55 / 255) // #1f2937
const TEXT_MUTED = rgb(107 / 255, 114 / 255, 128 / 255) // #6b7280

const DEJAVU_FONT_URL =
  'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf'

async function loadFont(doc: PDFDocument): Promise<PDFFont> {
  try {
    // @pdf-lib/fontkit is optional: enables TTF embedding for Turkish etc.
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

function generateQRDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    type: 'image/png',
    width: 200,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  })
}

function drawSection(
  page: PDFPage,
  font: PDFFont,
  boldFont: PDFFont,
  y: number,
  title: string,
  rows: Array<{ label: string; value: string }>,
  options: { titleSize?: number; rowSize?: number } = {}
): number {
  const titleSize = options.titleSize ?? 11
  const rowSize = options.rowSize ?? 10
  let currentY = y

  page.drawText(title, {
    x: MARGIN,
    y: currentY,
    font: boldFont,
    size: titleSize,
    color: TEXT_PRIMARY,
  })
  currentY -= titleSize + 8

  for (const row of rows) {
    if (!row.value && !row.label) {
      currentY -= rowSize + 2
      continue
    }
    if (row.label) {
      page.drawText(`${row.label}:`, {
        x: MARGIN,
        y: currentY,
        font: font,
        size: rowSize,
        color: TEXT_MUTED,
      })
      page.drawText(row.value, {
        x: MARGIN + 120,
        y: currentY,
        font: font,
        size: rowSize,
        color: TEXT_PRIMARY,
      })
    } else {
      page.drawText(row.value, {
        x: MARGIN,
        y: currentY,
        font: font,
        size: rowSize,
        color: TEXT_PRIMARY,
      })
    }
    currentY -= rowSize + 4
  }

  return currentY - SPACING
}

/**
 * VoucherData ile A4 portrait PDF üretir. pdf-lib + QR kullanır.
 */
export async function generateVoucherPdf(data: VoucherData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await loadFont(doc)
  const boldFont = font
  const page = doc.addPage([A4_WIDTH, A4_HEIGHT])

  // QR as data URL -> embed
  const qrDataUrl = await generateQRDataUrl(data.bookingUrl)
  const qrImage = await doc.embedPng(qrDataUrl)
  const qrScale = QR_SIZE / Math.max(qrImage.width, qrImage.height)

  // ---- HEADER (full width, lacivert)
  page.drawRectangle({
    x: 0,
    y: A4_HEIGHT - HEADER_HEIGHT,
    width: A4_WIDTH,
    height: HEADER_HEIGHT,
    color: HEADER_RGB,
  })

  page.drawText('POSEIDON BOOKING', {
    x: MARGIN,
    y: A4_HEIGHT - MARGIN - 14,
    font,
    size: 14,
    color: WHITE,
  })

  page.drawImage(qrImage, {
    x: A4_WIDTH - MARGIN - QR_SIZE,
    y: A4_HEIGHT - HEADER_HEIGHT + (HEADER_HEIGHT - QR_SIZE) / 2,
    width: qrImage.width * qrScale,
    height: qrImage.height * qrScale,
  })

  // ---- Below header: title + reference
  let y = A4_HEIGHT - HEADER_HEIGHT - SPACING

  page.drawText('Booking Voucher', {
    x: MARGIN,
    y,
    font: boldFont,
    size: 22,
    color: TEXT_PRIMARY,
  })
  y -= 28

  page.drawText(`Reference: ${data.referenceNumber}`, {
    x: MARGIN,
    y,
    font,
    size: 11,
    color: TEXT_MUTED,
  })
  y -= SPACING + 8

  // ---- 1) Tour
  y = drawSection(
    page,
    font,
    boldFont,
    y,
    'Tour',
    [
      { label: 'Tour Title', value: data.tourTitle },
      {
        label: 'Date & Time',
        value: data.time ? `${data.date} · ${data.time}` : data.date,
      },
      { label: 'Meeting / Pickup', value: data.meetingPickup },
      { label: 'Language', value: data.language },
    ],
    {}
  )

  // ---- 2) Customer
  y = drawSection(
    page,
    font,
    boldFont,
    y,
    'Customer',
    [
      { label: 'Name', value: data.customerName },
      { label: 'Email', value: data.customerEmail },
      { label: 'Phone', value: data.customerPhone },
    ],
    {}
  )

  // ---- 3) Participants
  y = drawSection(
    page,
    font,
    boldFont,
    y,
    'Participants',
    [
      { label: 'Adults', value: String(data.adults) },
      { label: 'Children', value: String(data.children) },
      { label: 'Babies', value: String(data.babies) },
    ],
    {}
  )

  // ---- 4) Payment Summary
  const paymentRows: Array<{ label: string; value: string }> = [
    {
      label: 'Total',
      value: `${data.totalPrice} ${data.currency}`,
    },
  ]
  if (data.paidNow != null && data.paidNow > 0) {
    paymentRows.push({
      label: 'Paid now (deposit)',
      value: `${data.paidNow} ${data.currency}`,
    })
  }
  if (data.remainingAmount != null && data.remainingAmount > 0) {
    paymentRows.push({
      label: 'Remaining',
      value: `${data.remainingAmount} ${data.currency}`,
    })
  }
  y = drawSection(page, font, boldFont, y, 'Payment Summary', paymentRows, {})

  // ---- 5) Policies
  y = drawSection(
    page,
    font,
    boldFont,
    y,
    'Policies',
    [
      { label: 'Cancellation', value: data.cancellationPolicy },
      { label: '', value: data.voucherNotice },
    ],
    { rowSize: 9 }
  )

  // ---- Footer
  const footerY = 36
  page.drawText(
    `Support: ${data.supportEmail}  |  ${data.website}`,
    {
      x: MARGIN,
      y: footerY,
      font,
      size: 8,
      color: TEXT_MUTED,
    }
  )
  page.drawText(`© ${data.copyrightYear} Poseidon Booking`, {
    x: MARGIN,
    y: footerY - 12,
    font,
    size: 8,
    color: TEXT_MUTED,
  })

  return doc.save()
}
