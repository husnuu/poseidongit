import {
  PDFDocument,
  rgb,
  StandardFonts,
  pushGraphicsState,
  popGraphicsState,
  rectangle,
  clip,
  endPath,
  type PDFFont,
  type PDFPage,
  type Color,
} from 'pdf-lib'
import QRCode from 'qrcode'
import type { PremiumEticketPayload } from './premiumEticket'

// —— Font URLs ——
const DEJAVU_FONT_URL = 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf'
const DEJAVU_BOLD_URL = 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans-Bold.ttf'

// —— Palette: modern, yumuşak zemin + beyaz yüzen kartlar ——
const PAGE_BG = rgb(0.953, 0.961, 0.973)      // #f3f5f8 — kağıt değil, hafif mavimsi gri
const WHITE   = rgb(1, 1, 1)
const NAVY    = rgb(33 / 255, 104 / 255, 184 / 255)   // #2168b8 (site brand blue)
const NAVY_DEEP = rgb(14 / 255, 56 / 255, 102 / 255)  // hero scrim / koyu vurgu
const CORAL   = rgb(0.988, 0.424, 0.310)     // #fc6c4f
const SLATE   = rgb(0.28, 0.33, 0.40)        // #48545f
const MUTED   = rgb(0.56, 0.61, 0.67)        // #8f9caa
const DIVIDER = rgb(0.90, 0.92, 0.95)        // #e5ebf2
const SHADOW  = rgb(0.72, 0.76, 0.82)
const GREEN   = rgb(0.06, 0.60, 0.35)
const AMBER   = rgb(0.80, 0.52, 0.02)

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
    class: 'Sınıf', payment: 'ÖDEME ÖZETİ', total: 'Toplam', paid: 'Ödenen',
    remaining: 'Kalan', reservation: 'REZERVASYON NO', scan: 'QR kodu biniş noktasında gösterin',
    contact: 'İletişim', viewOnMap: 'Haritada görüntüle',
    whatToBringTitle: 'Getirmeniz gerekenler',
    whatToBringText:
      'Yüzme kıyafetleri, güneş kremi, şapka, havlu ve yüzme molaları arasında rahat hareket edebilmeniz için hafif kıyafetler getirmenizi öneririz.',
    equipmentProvidedText: 'Can yeleği gibi güvenlik ekipmanları tarafımızdan temin edilmektedir.',
    foodDrinkTitle: 'Yiyecek & İçecek',
    foodDrinkPolicyText: 'Dışarıdan yiyecek getirmeniz serbesttir; içecek getirilmesine izin verilmemektedir.',
    mealLabel: 'Yemek tercihleri',
    passenger: 'YOLCU',
    haveANiceTrip: 'İyi yolculuklar!',
    pageTwoTitle: 'Yolculuk Bilgileri',
    tourDate: 'Tur Tarihi',
  }
  return {
    ebilet: 'E-TICKET', from: 'DEPARTURE', boarding: 'Boarding', departure: 'Departs',
    return: 'Returns', meeting: 'Meeting point', guests: 'Guests',
    class: 'Class', payment: 'PAYMENT SUMMARY', total: 'Total', paid: 'Paid',
    remaining: 'Due', reservation: 'RESERVATION NO', scan: 'Show QR code at boarding',
    contact: 'Contact', viewOnMap: 'View on map',
    whatToBringTitle: 'What to bring',
    whatToBringText:
      'Swimwear, sunscreen, a hat, a towel, and light clothing to move comfortably between swim stops.',
    equipmentProvidedText: 'Safety equipment such as life jackets is provided on board.',
    foodDrinkTitle: 'Food & Drinks',
    foodDrinkPolicyText: "You're welcome to bring your own food; outside drinks are not permitted on board.",
    mealLabel: 'Meal preferences',
    passenger: 'PASSENGER',
    haveANiceTrip: 'Have a great trip!',
    pageTwoTitle: 'Trip Information',
    tourDate: 'Tour Date',
  }
}

// ─── Çizim yardımcıları ──────────────────────────────────────────────────────

/** Köşeleri yuvarlatılmış dikdörtgen için SVG path (w×h kutusu, sol-üst (0,0)). */
function roundedRectPath(w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  return `M ${rr},0 H ${w - rr} Q ${w},0 ${w},${rr} V ${h - rr} Q ${w},${h} ${w - rr},${h} H ${rr} Q 0,${h} 0,${h - rr} V ${rr} Q 0,0 ${rr},0 Z`
}

/** Yuvarlak köşeli dikdörtgen çizer. (x, yBottom) sol-alt köşedir — drawRectangle ile aynı konvansiyon. */
function roundedRect(
  page: PDFPage,
  x: number, yBottom: number, w: number, h: number, r: number,
  opts: { fill?: Color; borderColor?: Color; borderWidth?: number; opacity?: number } = {}
) {
  page.drawSvgPath(roundedRectPath(w, h, r), {
    x, y: yBottom + h,
    color: opts.fill,
    borderColor: opts.borderColor,
    borderWidth: opts.borderWidth,
    opacity: opts.opacity,
  })
}

/** Hafif bir gölge + üzerinde beyaz (veya verilen renkte) yuvarlak kart — "yüzen kart" hissi. */
function floatingCard(page: PDFPage, x: number, yBottom: number, w: number, h: number, r = 16, fill: Color = WHITE) {
  roundedRect(page, x + 2.5, yBottom - 3, w, h, r, { fill: SHADOW, opacity: 0.35 })
  roundedRect(page, x, yBottom, w, h, r, { fill, borderColor: DIVIDER, borderWidth: 1 })
}

/** Dikdörtgen bir alana görseli ORANTIYI KORUYARAK KIRPARAK (cover-fit) sığdırır — pdf-lib'in
 *  native "object-fit: cover" karşılığı yok, bu yüzden clip path ile elde ediyoruz. */
function drawImageCover(
  page: PDFPage,
  img: Awaited<ReturnType<PDFDocument['embedPng']>>,
  x: number, yBottom: number, w: number, h: number
) {
  const scale = Math.max(w / img.width, h / img.height)
  const drawW = img.width * scale
  const drawH = img.height * scale
  const drawX = x + (w - drawW) / 2
  const drawY = yBottom + (h - drawH) / 2
  page.pushOperators(pushGraphicsState(), rectangle(x, yBottom, w, h), clip(), endPath())
  page.drawImage(img, { x: drawX, y: drawY, width: drawW, height: drawH })
  page.pushOperators(popGraphicsState())
}

/** Görselin altında, metin okunabilirliği için yumuşak koyulaşan sahte gradyan (üst üste yarı-saydam bantlar). */
function drawBottomScrim(page: PDFPage, x: number, yBottom: number, w: number, scrimH: number) {
  const bands = 10
  for (let i = 0; i < bands; i++) {
    const bandH = scrimH / bands
    const t = i / (bands - 1) // 0 (üstte, açık) → 1 (altta, koyu)
    page.drawRectangle({
      x, y: yBottom + i * bandH, width: w, height: bandH + 0.5,
      color: NAVY_DEEP, opacity: 0.08 + t * 0.62,
    })
  }
}

/** Yatay köprü çizgisi */
function hLine(page: PDFPage, x: number, y: number, w: number, color: Color = DIVIDER) {
  page.drawLine({ start: { x, y }, end: { x: x + w, y }, thickness: 1, color })
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

  const padX = 32
  const cardW = W - padX * 2

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAGE_BG })

  // ── Tam genişlikte hero görsel (kırpılarak kaplanır) + alt gradyan + üzerine başlık ──
  const heroH = 208
  const heroTop = H
  const heroBottom = H - heroH
  const brand = (payload.brandName ?? process.env.NEXT_PUBLIC_SITE_NAME ?? 'Poseidon').trim()

  let heroImg: Awaited<ReturnType<typeof tryEmbedRemoteImage>> = null
  if (payload.tourImageUrl) {
    heroImg = await tryEmbedRemoteImage(doc, payload.tourImageUrl)
  }

  if (heroImg) {
    drawImageCover(page, heroImg, 0, heroBottom, W, heroH)
    drawBottomScrim(page, 0, heroBottom, W, heroH * 0.72)
  } else {
    page.drawRectangle({ x: 0, y: heroBottom, width: W, height: heroH, color: NAVY })
  }

  // Marka / logo — hero üzerinde sol üst (açık renk, gölgeli okunur)
  let logoDrawn = false
  if (payload.logoUrl) {
    const logoImg = await tryEmbedRemoteImage(doc, payload.logoUrl)
    if (logoImg) {
      const maxH = 30
      const scale = Math.min(140 / logoImg.width, maxH / logoImg.height)
      const iw = logoImg.width * scale
      const ih = logoImg.height * scale
      page.drawImage(logoImg, { x: padX, y: heroTop - 20 - ih, width: iw, height: ih })
      logoDrawn = true
    }
  }
  if (!logoDrawn) {
    page.drawText(brand.toUpperCase(), { x: padX, y: heroTop - 36, size: 15, font: bold, color: WHITE })
  }

  // "E-BİLET" rozeti — hero üzerinde sağ üst
  const pillTxt = L.ebilet
  const pillW = bold.widthOfTextAtSize(pillTxt, 8.5) + 22
  const pillH = 22
  roundedRect(page, W - padX - pillW, heroTop - 20 - pillH, pillW, pillH, pillH / 2, { fill: CORAL })
  page.drawText(pillTxt, {
    x: W - padX - pillW + 11, y: heroTop - 20 - pillH + 7.5, size: 8.5, font: bold, color: WHITE,
  })

  // Tur başlığı + sınıf rozeti — hero altındaki gradyan üzerinde
  const titleY = heroBottom + 52
  if (payload.tourTitle?.trim()) {
    page.drawText(payload.tourTitle.trim(), {
      x: padX, y: titleY, size: 18, font: bold, color: WHITE,
      maxWidth: cardW - 20, lineHeight: 21,
    })
  }
  const classTxt = payload.ticketClass
  const classPillW = bold.widthOfTextAtSize(classTxt, 9) + 20
  roundedRect(page, padX, heroBottom + 16, classPillW, 20, 10, { fill: WHITE, opacity: 0.92 })
  page.drawText(classTxt, { x: padX + 10, y: heroBottom + 22, size: 9, font: bold, color: NAVY })

  let y = heroBottom - 16

  // ── Yolcu / Misafir / Sınıf bilgi kartı ──
  const paxCardH = 72
  floatingCard(page, padX, y - paxCardH, cardW, paxCardH)

  page.drawText(L.passenger, { x: padX + 20, y: y - 20, size: 8, font: bold, color: MUTED })
  page.drawText(payload.passengerName, {
    x: padX + 20, y: y - 40, size: 16, font: bold, color: NAVY, maxWidth: cardW * 0.52,
  })

  const col2x = padX + 20 + cardW * 0.56
  page.drawText(L.guests.toUpperCase(), { x: col2x, y: y - 20, size: 8, font: bold, color: MUTED })
  page.drawText(guestLine(payload), { x: col2x, y: y - 36, size: 13, font: bold, color: CORAL })

  page.drawText(L.class.toUpperCase(), { x: col2x, y: y - 52, size: 8, font: bold, color: MUTED })
  page.drawText(payload.ticketClass, { x: col2x, y: y - 65, size: 9.5, font: bold, color: SLATE, maxWidth: cardW * 0.36 })

  y -= paxCardH + 14

  // ── Tarih + Saat + Buluşma noktası kartı ──
  const hasDateRow = !!payload.tourDate?.trim()
  const dateRowH = hasDateRow ? 32 : 0
  const timeCardH = dateRowH + (payload.meetingPoint?.trim() ? 112 : 72)
  floatingCard(page, padX, y - timeCardH, cardW, timeCardH)

  if (hasDateRow) {
    page.drawText(L.tourDate.toUpperCase(), { x: padX + 20, y: y - 20, size: 8, font: bold, color: MUTED })
    page.drawText(payload.tourDate!.trim(), { x: padX + 20, y: y - 36, size: 13, font: bold, color: CORAL })
    hLine(page, padX + 20, y - dateRowH, cardW - 40)
  }

  const tw = (cardW - 40) / 3
  const times: [string, string][] = [
    [L.boarding, payload.boardingTime],
    [L.departure, payload.departureTime],
    [L.return, payload.returnTime],
  ]
  for (let i = 0; i < 3; i++) {
    const [lbl, val] = times[i]
    const tx = padX + 20 + i * tw
    page.drawText(lbl.toUpperCase(), { x: tx, y: y - dateRowH - 22, size: 8, font: bold, color: MUTED })
    page.drawText(val, { x: tx, y: y - dateRowH - 44, size: 17, font: bold, color: NAVY })
    if (i < 2) {
      page.drawLine({
        start: { x: tx + tw - 14, y: y - dateRowH - 18 }, end: { x: tx + tw - 14, y: y - dateRowH - 52 },
        thickness: 1, color: DIVIDER,
      })
    }
  }

  if (payload.meetingPoint?.trim()) {
    hLine(page, padX + 20, y - dateRowH - 62, cardW - 40)
    page.drawText(L.meeting.toUpperCase(), { x: padX + 20, y: y - dateRowH - 76, size: 8, font: bold, color: MUTED })
    page.drawText(payload.meetingPoint.trim(), {
      x: padX + 20, y: y - dateRowH - 91, size: 10, font, color: SLATE,
      maxWidth: cardW - 40, lineHeight: 12.5,
    })
  }

  y -= timeCardH + 16

  // ── QR kartı (gölgeli, ortalanmış) + Rezervasyon No ──
  const qrPixels = 480
  const qrDataUrl = await QRCode.toDataURL(payload.qrPayload, {
    type: 'image/png', width: qrPixels, margin: 1, errorCorrectionLevel: 'M',
    color: { dark: '#0e3866', light: '#ffffff' },
  })
  const qrImg = await embedPngFromDataUrl(doc, qrDataUrl)
  const qrTarget = 110
  const qrScale = qrTarget / Math.max(qrImg.width, qrImg.height)
  const qrW = qrImg.width * qrScale
  const qrH = qrImg.height * qrScale
  const qrBoxPad = 16
  const qrBoxW = qrW + qrBoxPad * 2
  const qrBoxH = qrH + qrBoxPad * 2 + 26 + 48 // QR + üst metin + rezervasyon no bloğu
  const qrBoxX = (W - qrBoxW) / 2

  floatingCard(page, qrBoxX, y - qrBoxH, qrBoxW, qrBoxH, 18)

  page.drawText(L.scan, {
    x: W / 2 - font.widthOfTextAtSize(L.scan, 8.5) / 2,
    y: y - 16, size: 8.5, font, color: MUTED,
  })
  const qrImgY = y - 16 - 12 - qrH
  page.drawImage(qrImg, { x: W / 2 - qrW / 2, y: qrImgY, width: qrW, height: qrH })

  hLine(page, qrBoxX + 20, qrImgY - 14, qrBoxW - 40)

  const resCode = payload.reservationCode
  const resW = bold.widthOfTextAtSize(resCode, 19)
  page.drawText(L.reservation, {
    x: W / 2 - bold.widthOfTextAtSize(L.reservation, 8) / 2,
    y: qrImgY - 29, size: 8, font: bold, color: MUTED,
  })
  page.drawText(resCode, { x: W / 2 - resW / 2, y: qrImgY - 50, size: 19, font: bold, color: NAVY })

  y -= qrBoxH + 16

  // ── Ödeme özeti — 3 eşit "chip" kart ──
  page.drawText(L.payment, { x: padX, y, size: 9, font: bold, color: MUTED })
  y -= 14

  const chipGap = 10
  const chipW = (cardW - chipGap * 2) / 3
  const chipH = 48
  const payItems: [string, number, Color][] = [
    [L.total, payload.totalAmount, NAVY],
    [L.paid, payload.paidAmount, GREEN],
    [L.remaining, payload.remainingAmount, AMBER],
  ]
  for (let i = 0; i < 3; i++) {
    const [lbl, amt, col] = payItems[i]
    const cx = padX + i * (chipW + chipGap)
    roundedRect(page, cx, y - chipH, chipW, chipH, 12, { fill: WHITE, borderColor: DIVIDER, borderWidth: 1 })
    page.drawText(lbl.toUpperCase(), { x: cx + 14, y: y - 18, size: 7.5, font: bold, color: MUTED })
    const amtTxt = fmtMoney(amt, payload.currency, numLocale)
    page.drawText(amtTxt, { x: cx + 14, y: y - 36, size: 13, font: bold, color: col, maxWidth: chipW - 24 })
  }

  y -= chipH + 18

  // ── Footer iletişim ──
  const contactBits = [payload.contactPhone, payload.contactEmail, payload.contactWebsite].filter(Boolean) as string[]
  if (contactBits.length) {
    page.drawText(L.contact.toUpperCase(), {
      x: W / 2 - bold.widthOfTextAtSize(L.contact.toUpperCase(), 7.5) / 2,
      y, size: 7.5, font: bold, color: MUTED,
    })
    y -= 15
    const line = contactBits.join('   ·   ')
    page.drawText(line, {
      x: W / 2 - font.widthOfTextAtSize(line, 9) / 2,
      y, size: 9, font, color: SLATE, maxWidth: cardW, lineHeight: 12,
    })
  }

  // Alt turuncu şerit — marka imzası
  page.drawRectangle({ x: 0, y: 0, width: W, height: 6, color: CORAL })

  // ───────────────────────────────────────────────────────────────────────
  // Sayfa 2: Yolculuk bilgileri (getirmeniz gerekenler / yiyecek-içecek / buluşma + harita)
  // ───────────────────────────────────────────────────────────────────────
  const page2 = doc.addPage([595, 842])
  page2.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAGE_BG })

  const topH2 = 86
  page2.drawRectangle({ x: 0, y: H - topH2, width: W, height: topH2, color: NAVY })
  page2.drawText(brand.toUpperCase(), { x: padX, y: H - 34, size: 13, font: bold, color: WHITE })
  page2.drawText(L.pageTwoTitle, { x: padX, y: H - 58, size: 19, font: bold, color: WHITE })
  page2.drawRectangle({ x: 0, y: H - topH2 - 5, width: W, height: 5, color: CORAL })

  let y2 = H - topH2 - 30

  type InfoSection = { title: string; body: string; sub?: string }
  const sections: InfoSection[] = [
    { title: L.whatToBringTitle, body: L.whatToBringText, sub: L.equipmentProvidedText },
    { title: L.foodDrinkTitle, body: L.foodDrinkPolicyText },
  ]
  if (payload.mealCounts?.length) {
    const mealLine = payload.mealCounts.map((m) => `${m.label} × ${m.count}`).join('   ·   ')
    sections.push({ title: L.mealLabel, body: mealLine })
  }

  for (const section of sections) {
    const lines = section.sub ? 3 : 2
    const h = lines === 3 ? 108 : 78
    floatingCard(page2, padX, y2 - h, cardW, h, 16)
    page2.drawText(section.title.toUpperCase(), { x: padX + 20, y: y2 - 24, size: 9.5, font: bold, color: NAVY })
    page2.drawText(section.body, {
      x: padX + 20, y: y2 - 44, size: 10.5, font, color: SLATE, maxWidth: cardW - 40, lineHeight: 14,
    })
    if (section.sub) {
      page2.drawText(section.sub, {
        x: padX + 20, y: y2 - 90, size: 9.5, font, color: MUTED, maxWidth: cardW - 40, lineHeight: 13,
      })
    }
    y2 -= h + 18
  }

  // Toplanma noktası + harita — harita görseli önce getirilir, kart yüksekliği
  // GERÇEKTEN kullanılabilir bir görsel olup olmamasına göre belirlenir (URL verilip
  // de çekilemezse kartta boşuna büyük bir boşluk kalmasın diye).
  const mapImg = payload.mapImageUrl ? await tryEmbedRemoteImage(doc, payload.mapImageUrl) : null
  if (payload.meetingPoint?.trim() || mapImg) {
    const mapH = mapImg ? 170 : 0
    const textH = 56
    const cardH = textH + (mapImg ? mapH + 16 : 0) + 16
    floatingCard(page2, padX, y2 - cardH, cardW, cardH, 16)

    page2.drawText(L.meeting.toUpperCase(), { x: padX + 20, y: y2 - 24, size: 9.5, font: bold, color: NAVY })
    if (payload.meetingPoint?.trim()) {
      page2.drawText(payload.meetingPoint.trim(), {
        x: padX + 20, y: y2 - 42, size: 10.5, font, color: SLATE, maxWidth: cardW - 40, lineHeight: 14,
      })
    }

    if (mapImg) {
      const mapX = padX + 16
      const mapW = cardW - 32
      const mapYBottom = y2 - cardH + 14
      drawImageCover(page2, mapImg, mapX, mapYBottom, mapW, mapH)
      roundedRect(page2, mapX, mapYBottom, mapW, mapH, 12, { borderColor: DIVIDER, borderWidth: 1 })
      // Merkez pin işaretçisi
      const pinX = mapX + mapW / 2
      const pinY = mapYBottom + mapH / 2
      page2.drawCircle({ x: pinX, y: pinY, size: 9, color: WHITE })
      page2.drawCircle({ x: pinX, y: pinY, size: 6, color: CORAL })
    }
    y2 -= cardH + 18

    if (payload.mapLink?.trim()) {
      page2.drawText(`${L.viewOnMap}: ${payload.mapLink.trim()}`, {
        x: padX, y: y2, size: 9, font, color: NAVY, maxWidth: cardW, lineHeight: 13,
      })
      y2 -= 20
    }
  }

  // Kapanış notu
  page2.drawText(L.haveANiceTrip, {
    x: W / 2 - bold.widthOfTextAtSize(L.haveANiceTrip, 12) / 2,
    y: Math.min(y2 - 16, 120), size: 12, font: bold, color: NAVY,
  })

  page2.drawRectangle({ x: 0, y: 0, width: W, height: 6, color: CORAL })

  return doc.save()
}
