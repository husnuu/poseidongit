import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib'
import QRCode from 'qrcode'
import type { PremiumEticketPayload } from './premiumEticket'

// —— Font URLs ——
const DEJAVU_FONT_URL = 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf'
const DEJAVU_BOLD_URL = 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans-Bold.ttf'

// —— Palette: temiz beyaz boarding pass ——
const WHITE   = rgb(1, 1, 1)
const OFF_WHITE = rgb(0.97, 0.975, 0.985)
const NAVY    = rgb(0.09, 0.20, 0.42)        // #172066
const CORAL   = rgb(0.988, 0.424, 0.310)     // #fc6c4f
const SLATE   = rgb(0.28, 0.33, 0.40)        // #48545f
const MUTED   = rgb(0.56, 0.61, 0.67)        // #8f9caa
const DIVIDER = rgb(0.88, 0.90, 0.93)        // #e1e6ed
const GREEN   = rgb(0.13, 0.77, 0.37)        // #22c55e
const AMBER   = rgb(0.95, 0.70, 0.13)        // #f2b422

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
  let font = await tryEmbedFontUrl(doc, DEJAVU_FONT_URL)
  let bold = await tryEmbedFontUrl(doc, DEJAVU_BOLD_URL)
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
    try { return await doc.embedPng(bytes) } catch { return await doc.embedJpg(bytes) }
  } catch { return null }
}

function fmtMoney(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency', currency,
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

function guestLine(payload: PremiumEticketPayload) {
  if (typeof payload.guestCount === 'number') {
    return payload.locale === 'tr' ? `${payload.guestCount} misafir` : `${payload.guestCount} guests`
  }
  return payload.guestCount
}

function labels(locale: 'tr' | 'en') {
  if (locale === 'tr') return {
    ebilet: 'E-BİLET', from: 'KALKIŞ', boarding: 'Biniş', departure: 'Kalkış',
    return: 'Dönüş', meeting: 'Buluşma noktası', guests: 'Misafir',
    class: 'Sınıf', payment: 'ÖDEME ÖZETI', total: 'Toplam', paid: 'Ödenen',
    remaining: 'Kalan', reservation: 'REZERVASYON NO', scan: 'QR kodu biniş noktasında gösterin',
    contact: 'İletişim',
  }
  return {
    ebilet: 'E-TICKET', from: 'DEPARTURE', boarding: 'Boarding', departure: 'Departs',
    return: 'Returns', meeting: 'Meeting point', guests: 'Guests',
    class: 'Class', payment: 'PAYMENT', total: 'Total', paid: 'Paid',
    remaining: 'Due', reservation: 'RESERVATION NO', scan: 'Show QR code at boarding',
    contact: 'Contact',
  }
}

/** Yatay köprü çizgisi */
function hLine(page: PDFPage, x: number, y: number, w: number) {
  page.drawLine({ start: { x, y }, end: { x: x + w, y }, thickness: 0.6, color: DIVIDER })
}

/** Sol başlık + sağ değer çifti */
function labelValue(
  page: PDFPage,
  font: PDFFont, bold: PDFFont,
  x: number, y: number, w: number,
  label: string, value: string,
  valSize = 10, valColor = SLATE
) {
  page.drawText(label.toUpperCase(), { x, y: y + 14, size: 7, font: bold, color: MUTED })
  page.drawText(value, { x, y, size: valSize, font: bold, color: valColor, maxWidth: w, lineHeight: 13 })
}

/** Rounded rectangle yoksa köşeli çiz (pdf-lib desteği kısıtlı) */
function card(page: PDFPage, x: number, y: number, w: number, h: number, bg = OFF_WHITE) {
  page.drawRectangle({ x, y, width: w, height: h, color: bg })
}

export async function generatePremiumEticketPdf(payload: PremiumEticketPayload): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const { font, bold } = await loadFonts(doc)

  // A4 sayfası: 595 × 842 pt
  const page = doc.addPage([595, 842])
  const W = page.getWidth()
  const H = page.getHeight()
  const L = labels(payload.locale)
  const numLocale = payload.locale === 'tr' ? 'tr-TR' : 'en-US'

  const padX = 36
  const cardW = W - padX * 2

  // —— Beyaz zemin ——
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: WHITE })

  // —— Üst şerit (navy) ——
  const topH = 80
  page.drawRectangle({ x: 0, y: H - topH, width: W, height: topH, color: NAVY })

  // Logo / marka
  const brand = (payload.brandName ?? process.env.NEXT_PUBLIC_SITE_NAME ?? 'Poseidon').trim()
  let logoBottom = H - topH + 20
  if (payload.logoUrl) {
    const img = await tryEmbedRemoteImage(doc, payload.logoUrl)
    if (img) {
      const maxH = 36, scale = Math.min(160 / img.width, maxH / img.height)
      const iw = img.width * scale, ih = img.height * scale
      logoBottom = H - topH + (topH - ih) / 2
      page.drawImage(img, { x: padX, y: logoBottom, width: iw, height: ih })
    } else {
      page.drawText(brand.toUpperCase(), { x: padX, y: H - topH + 28, size: 16, font: bold, color: WHITE })
    }
  } else {
    page.drawText(brand.toUpperCase(), { x: padX, y: H - topH + 28, size: 16, font: bold, color: WHITE })
  }

  // E-Bilet etiketi (sağ üst)
  const pillTxt = L.ebilet
  const pillW = bold.widthOfTextAtSize(pillTxt, 8) + 20
  const pillH = 20
  const pillX = W - padX - pillW
  const pillY = H - topH + (topH - pillH) / 2
  page.drawRectangle({ x: pillX, y: pillY, width: pillW, height: pillH, color: CORAL })
  page.drawText(pillTxt, { x: pillX + 10, y: pillY + 6, size: 8, font: bold, color: WHITE })

  // —— Turuncu şerit (ince) ——
  page.drawRectangle({ x: 0, y: H - topH - 4, width: W, height: 4, color: CORAL })

  let y = H - topH - 28

  // —— Tur başlığı ——
  if (payload.tourTitle?.trim()) {
    page.drawText(payload.tourTitle.trim().toUpperCase(), {
      x: padX, y, size: 13, font: bold, color: NAVY,
      maxWidth: cardW, lineHeight: 16,
    })
    y -= 22
    hLine(page, padX, y + 4, cardW)
    y -= 16
  }

  // —— Yolcu bilgi kartı ——
  const paxCardH = 80
  card(page, padX, y - paxCardH, cardW, paxCardH)
  page.drawRectangle({ x: padX, y: y - paxCardH, width: 4, height: paxCardH, color: CORAL })

  // İsim
  page.drawText(payload.locale === 'tr' ? 'YOLCU' : 'PASSENGER',
    { x: padX + 14, y: y - 16, size: 7, font: bold, color: MUTED })
  page.drawText(payload.passengerName,
    { x: padX + 14, y: y - 34, size: 16, font: bold, color: NAVY, maxWidth: cardW * 0.55 })

  // Misafir + Sınıf
  const col2x = padX + 14 + cardW * 0.58
  page.drawText(L.guests.toUpperCase(), { x: col2x, y: y - 16, size: 7, font: bold, color: MUTED })
  page.drawText(guestLine(payload), { x: col2x, y: y - 34, size: 13, font: bold, color: CORAL })

  page.drawText(L.class.toUpperCase(), { x: col2x, y: y - 54, size: 7, font: bold, color: MUTED })
  page.drawText(payload.ticketClass, { x: col2x, y: y - 68, size: 10, font: bold, color: SLATE, maxWidth: cardW * 0.38 })

  y -= paxCardH + 18

  // —— Saat + Konum ——
  const timeCardH = payload.meetingPoint?.trim() ? 108 : 76
  card(page, padX, y - timeCardH, cardW, timeCardH)
  page.drawRectangle({ x: padX, y: y - timeCardH, width: 4, height: timeCardH, color: NAVY })

  const tw = (cardW - 24) / 3
  const times: [string, string][] = [
    [L.boarding, payload.boardingTime],
    [L.departure, payload.departureTime],
    [L.return, payload.returnTime],
  ]
  for (let i = 0; i < 3; i++) {
    const [lbl, val] = times[i]
    const tx = padX + 14 + i * tw
    page.drawText(lbl.toUpperCase(), { x: tx, y: y - 16, size: 7, font: bold, color: MUTED })
    page.drawText(val, { x: tx, y: y - 36, size: 16, font: bold, color: NAVY })
    if (i < 2) page.drawLine({
      start: { x: tx + tw - 8, y: y - 18 }, end: { x: tx + tw - 8, y: y - 52 },
      thickness: 0.5, color: DIVIDER,
    })
  }

  if (payload.meetingPoint?.trim()) {
    hLine(page, padX + 14, y - 56, cardW - 28)
    page.drawText(L.meeting.toUpperCase(), { x: padX + 14, y: y - 68, size: 7, font: bold, color: MUTED })
    page.drawText(payload.meetingPoint.trim(), {
      x: padX + 14, y: y - 84, size: 10, font: font, color: SLATE,
      maxWidth: cardW - 28, lineHeight: 13,
    })
  }

  y -= timeCardH + 18

  // —— Perforasyon çizgisi (koçan ayrımı) ——
  const perfY = y - 4
  page.drawLine({ start: { x: padX, y: perfY }, end: { x: W - padX, y: perfY }, thickness: 0.5, color: DIVIDER, dashArray: [4, 3] })
  page.drawCircle({ x: padX - 8, y: perfY, size: 8, color: WHITE })
  page.drawCircle({ x: W - padX + 8, y: perfY, size: 8, color: WHITE })
  y -= 22

  // —— QR Kod ——
  const qrPixels = 480
  const qrDataUrl = await QRCode.toDataURL(payload.qrPayload, {
    type: 'image/png', width: qrPixels, margin: 2, errorCorrectionLevel: 'M',
    color: { dark: '#172066', light: '#ffffff' },
  })
  const qrImg = await embedPngFromDataUrl(doc, qrDataUrl)
  const qrTarget = 120
  const qrScale = qrTarget / Math.max(qrImg.width, qrImg.height)
  const qrW = qrImg.width * qrScale
  const qrH = qrImg.height * qrScale
  const qrBoxPad = 12
  const qrBoxW = qrW + qrBoxPad * 2
  const qrBoxH = qrH + qrBoxPad * 2 + 30
  const qrBoxX = (W - qrBoxW) / 2

  card(page, qrBoxX, y - qrBoxH, qrBoxW, qrBoxH)
  page.drawRectangle({ x: qrBoxX, y: y - qrBoxH, width: qrBoxW, height: qrBoxH, borderColor: DIVIDER, borderWidth: 0.7 })

  page.drawText(L.scan, {
    x: W / 2 - bold.widthOfTextAtSize(L.scan, 8) / 2,
    y: y - 16, size: 8, font: bold, color: MUTED,
  })
  page.drawImage(qrImg, { x: qrBoxX + qrBoxPad, y: y - qrBoxH + qrBoxPad, width: qrW, height: qrH })

  y -= qrBoxH + 20

  // —— Rezervasyon no (büyük) ——
  const resCode = payload.reservationCode
  const resW = bold.widthOfTextAtSize(resCode, 18)
  page.drawText(L.reservation, {
    x: W / 2 - bold.widthOfTextAtSize(L.reservation, 8) / 2,
    y: y - 14, size: 8, font: bold, color: MUTED,
  })
  page.drawText(resCode, { x: W / 2 - resW / 2, y: y - 36, size: 18, font: bold, color: NAVY })

  hLine(page, padX, y - 48, cardW)
  y -= 66

  // —— Ödeme özeti ——
  page.drawText(L.payment, { x: padX, y, size: 8, font: bold, color: MUTED })
  y -= 18

  const pw = (cardW - 16) / 3
  const payItems: [string, number, ReturnType<typeof rgb>][] = [
    [L.total, payload.totalAmount, NAVY],
    [L.paid, payload.paidAmount, GREEN],
    [L.remaining, payload.remainingAmount, AMBER],
  ]
  for (let i = 0; i < 3; i++) {
    const [lbl, amt, col] = payItems[i]
    const px = padX + i * pw
    page.drawText(lbl.toUpperCase(), { x: px, y, size: 7, font: bold, color: MUTED })
    page.drawText(fmtMoney(amt, payload.currency, numLocale), { x: px, y: y - 18, size: 13, font: bold, color: col })
  }

  y -= 44
  hLine(page, padX, y, cardW)
  y -= 20

  // —— Footer iletişim ——
  const contactBits = [payload.contactPhone, payload.contactEmail, payload.contactWebsite].filter(Boolean) as string[]
  if (contactBits.length) {
    page.drawText(L.contact.toUpperCase(), { x: padX, y, size: 7, font: bold, color: MUTED })
    page.drawText(contactBits.join('   ·   '), { x: padX, y: y - 14, size: 8, font: font, color: SLATE, maxWidth: cardW, lineHeight: 11 })
  }

  // Alt turuncu bar
  page.drawRectangle({ x: 0, y: 0, width: W, height: 6, color: CORAL })

  return doc.save()
}
