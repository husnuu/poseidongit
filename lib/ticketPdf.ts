import { jsPDF } from 'jspdf'

const FONT_URL = '/api/admin/font/dejavu-sans'
const FONT_VFS_NAME = 'DejaVuSans.ttf'
const FONT_DISPLAY_NAME = 'DejaVuSans'
const PRIMARY_RGB: [number, number, number] = [33, 104, 184] // #2168b8
const TEXT_DARK: [number, number, number] = [40, 40, 40]
const TEXT_MUTED: [number, number, number] = [97, 99, 101]

let cachedFontBase64: string | null = null

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

async function loadTurkishFont(doc: jsPDF): Promise<void> {
  if (cachedFontBase64) {
    doc.addFileToVFS(FONT_VFS_NAME, cachedFontBase64)
    doc.addFont(FONT_VFS_NAME, FONT_DISPLAY_NAME, 'normal', undefined, 'Identity-H')
    doc.setFont(FONT_DISPLAY_NAME, 'normal')
    return
  }
  const res = await fetch(FONT_URL)
  if (!res.ok) throw new Error('Font yüklenemedi')
  const ab = await res.arrayBuffer()
  cachedFontBase64 = arrayBufferToBase64(ab)
  doc.addFileToVFS(FONT_VFS_NAME, cachedFontBase64)
  doc.addFont(FONT_VFS_NAME, FONT_DISPLAY_NAME, 'normal', undefined, 'Identity-H')
  doc.setFont(FONT_DISPLAY_NAME, 'normal')
}

export interface TicketPdfData {
  bookingId: string
  tourTitle: string
  date: string
  className: string
  totalPrice: number
  currency: string
  customer: { firstName: string; lastName: string; email: string; phone: string }
  counts: { adult: number; child: number; baby: number }
}

export async function generateTicketPdf(data: TicketPdfData): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  await loadTurkishFont(doc)

  const pageW = doc.internal.pageSize.getWidth()
  const margin = 18
  let y = margin

  // Header band – primary color
  doc.setFillColor(...PRIMARY_RGB)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont(FONT_DISPLAY_NAME, 'normal')
  doc.text(process.env.NEXT_PUBLIC_SITE_NAME || 'Booking', margin, 18)
  doc.setFontSize(11)
  doc.text('Rezervasyon Bileti', margin, 24)

  y = 36
  doc.setTextColor(...TEXT_DARK)

  // Rezervasyon no
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(margin, y, pageW - 2 * margin, 16, 2, 2, 'F')
  doc.setFontSize(10)
  doc.setTextColor(...TEXT_MUTED)
  doc.text('Rezervasyon No', margin + 8, y + 8)
  doc.setFontSize(14)
  doc.setTextColor(...PRIMARY_RGB)
  doc.text(data.bookingId, margin + 8, y + 13)
  doc.setTextColor(...TEXT_DARK)
  y += 24

  // Tur detayları
  doc.setFontSize(12)
  doc.setTextColor(...PRIMARY_RGB)
  doc.text('Tur Bilgileri', margin, y)
  doc.setFontSize(10)
  doc.setTextColor(...TEXT_DARK)
  y += 8
  doc.text(`Tur: ${data.tourTitle}`, margin, y)
  y += 6
  doc.text(`Tarih: ${data.date}`, margin, y)
  y += 6
  doc.text(`Sınıf: ${data.className}`, margin, y)
  y += 14

  // Yolcu bilgileri
  doc.setFontSize(12)
  doc.setTextColor(...PRIMARY_RGB)
  doc.text('Yolcu Bilgileri', margin, y)
  doc.setFontSize(10)
  doc.setTextColor(...TEXT_DARK)
  y += 8
  const fullName = `${data.customer.firstName} ${data.customer.lastName}`.trim() || '—'
  doc.text(`Ad Soyad: ${fullName}`, margin, y)
  y += 6
  doc.text(`E-posta: ${data.customer.email || '—'}`, margin, y)
  y += 6
  doc.text(`Telefon: ${data.customer.phone || '—'}`, margin, y)
  y += 6
  const pax = [
    data.counts.adult > 0 && `${data.counts.adult} Yetişkin`,
    data.counts.child > 0 && `${data.counts.child} Çocuk`,
    data.counts.baby > 0 && `${data.counts.baby} Bebek`,
  ].filter(Boolean)
  doc.text(`Yolcu: ${pax.length ? pax.join(', ') : '—'}`, margin, y)
  y += 14

  // Toplam
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(margin, y, pageW - 2 * margin, 14, 2, 2, 'F')
  doc.setFontSize(11)
  doc.setTextColor(...TEXT_MUTED)
  doc.text('Toplam', margin + 8, y + 8)
  doc.setFontSize(14)
  doc.setTextColor(...PRIMARY_RGB)
  const totalStr = `${data.totalPrice.toLocaleString('tr-TR')} ${data.currency}`
  doc.text(totalStr, pageW - margin - 8 - doc.getTextWidth(totalStr), y + 8)
  y += 22

  // Footer
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_MUTED)
  doc.text(
    'Bu bilet rezervasyonunuzun onayıdır. Tur günü yanınızda bulundurun.',
    margin,
    y
  )
  y += 6
  doc.text(`${process.env.NEXT_PUBLIC_SITE_NAME || 'Booking'} — Tekne turları`, margin, y)

  const fileName = `bilet_${data.bookingId}_${data.date.replace(/\D/g, '')}.pdf`
  doc.save(fileName)
}
