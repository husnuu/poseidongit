'use client'

import { useState, useEffect, useCallback } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

type BookingStatus = 'pending' | 'paid' | 'cancelled'

interface BookingRow {
  id: string
  tourTitle: string
  date: string
  time?: string
  customer: { firstName: string; lastName: string; email: string; phone: string }
  counts: { adult: number; child: number; infant: number }
  classId?: string
  className: string
  totalPrice: number
  currency: string
  status: BookingStatus
  createdAt: string | null
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Beklemede',
  paid: 'Ödendi',
  cancelled: 'İptal',
}

const STATUS_CLASS: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-zinc-200 text-zinc-600',
}

const DEJA_VU_SANS_URL = '/api/admin/font/dejavu-sans'
let cachedFontBase64: string | null = null

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

const FONT_VFS_NAME = 'DejaVuSans.ttf'
const FONT_DISPLAY_NAME = 'DejaVuSans'

async function loadTurkishFont(doc: jsPDF): Promise<void> {
  if (cachedFontBase64) {
    doc.addFileToVFS(FONT_VFS_NAME, cachedFontBase64)
    doc.addFont(FONT_VFS_NAME, FONT_DISPLAY_NAME, 'normal', undefined, 'Identity-H')
    doc.setFont(FONT_DISPLAY_NAME, 'normal')
    return
  }
  const res = await fetch(DEJA_VU_SANS_URL)
  if (!res.ok) throw new Error('Font yüklenemedi')
  const ab = await res.arrayBuffer()
  cachedFontBase64 = arrayBufferToBase64(ab)
  doc.addFileToVFS(FONT_VFS_NAME, cachedFontBase64)
  doc.addFont(FONT_VFS_NAME, FONT_DISPLAY_NAME, 'normal', undefined, 'Identity-H')
  doc.setFont(FONT_DISPLAY_NAME, 'normal')
}

function getUniqueClassNames(bookings: BookingRow[]): string[] {
  const set = new Set(bookings.map((b) => b.className).filter(Boolean))
  return Array.from(set).sort()
}

async function exportToPdf(
  bookings: BookingRow[],
  dateLabel: string,
  classLabel: string
): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  await loadTurkishFont(doc)

  const title = 'Rezervasyon Listesi'
  doc.setFontSize(14)
  doc.text(title, 14, 12)
  doc.setFontSize(9)
  doc.text(
    `Tarih: ${dateLabel || 'Tümü'} | Sınıf: ${classLabel || 'Tümü'} | Kayıt: ${bookings.length}`,
    14,
    18
  )

  const head = [
    ['Tarih', 'Tur', 'Ad Soyad', 'E-posta', 'Telefon', 'Kişi', 'Sınıf', 'Toplam', 'Durum'],
  ]
  const body = bookings.map((b) => [
    b.date,
    b.tourTitle,
    `${b.customer.firstName} ${b.customer.lastName}`,
    b.customer.email || '—',
    b.customer.phone || '—',
    String(b.counts.adult + b.counts.child + b.counts.infant),
    b.className,
    `${b.totalPrice.toLocaleString('tr-TR')} ${b.currency}`,
    STATUS_LABELS[b.status] ?? b.status,
  ])

  const fontName = FONT_DISPLAY_NAME
  const fontStyle = 'normal'
  doc.setFont(fontName, fontStyle)

  autoTable(doc, {
    head,
    body,
    startY: 24,
    theme: 'plain',
    styles: { fontSize: 8, font: fontName, fontStyle },
    headStyles: { fillColor: [82, 82, 90], font: fontName, fontStyle },
    bodyStyles: { font: fontName, fontStyle },
    margin: { left: 14, right: 14 },
    willDrawCell: () => {
      doc.setFont(fontName, fontStyle)
    },
  })

  const dateStr = new Date().toISOString().slice(0, 10)
  doc.save(`rezervasyonlar_${dateStr}.pdf`)
}

export default function AdminBookingsPage() {
  const [token, setToken] = useState('')
  const [submittedToken, setSubmittedToken] = useState('')
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [nextStartAfter, setNextStartAfter] = useState<string | null>(null)
  const [pdfExporting, setPdfExporting] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const uniqueClassNames = getUniqueClassNames(bookings)
  const dateLabel = [dateFrom, dateTo].filter(Boolean).join(' – ') || ''
  const classLabel = classFilter || ''

  const fetchBookings = useCallback(
    async (startAfter?: string) => {
      if (!submittedToken) return
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('limit', dateFrom || dateTo || classFilter ? '200' : '50')
        if (statusFilter) params.set('status', statusFilter)
        if (dateFrom) params.set('dateFrom', dateFrom)
        if (dateTo) params.set('dateTo', dateTo)
        if (classFilter) params.set('className', classFilter)
        if (startAfter) params.set('startAfter', startAfter)
        const res = await fetch(`/api/admin/bookings?${params}`, {
          headers: { Authorization: `Bearer ${submittedToken}` },
        })
        if (!res.ok) {
          if (res.status === 401) setError('Yetkisiz. Token geçersiz.')
          else setError('Liste alınamadı.')
          return
        }
        const data = await res.json()
        setBookings(startAfter ? (prev) => [...prev, ...data.bookings] : data.bookings)
        setNextStartAfter(data.nextStartAfter ?? null)
      } catch {
        setError('Bağlantı hatası.')
      } finally {
        setLoading(false)
      }
    },
    [submittedToken, statusFilter, dateFrom, dateTo, classFilter]
  )

  useEffect(() => {
    if (submittedToken) fetchBookings()
  }, [submittedToken, statusFilter, dateFrom, dateTo, classFilter, fetchBookings])

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (token.trim()) setSubmittedToken(token.trim())
  }

  const handleExportPdf = async () => {
    if (bookings.length === 0) return
    setPdfExporting(true)
    try {
      await exportToPdf(bookings, dateLabel, classLabel)
    } catch (e) {
      console.error('PDF export error:', e)
      setError('PDF oluşturulurken hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setPdfExporting(false)
    }
  }

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    if (!submittedToken) return
    setUpdatingId(bookingId)
    setError(null)
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${submittedToken}`,
        },
        body: JSON.stringify({ bookingId, status: newStatus }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Durum güncellenemedi.')
        return
      }
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      )
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setUpdatingId(null)
    }
  }

  if (!submittedToken) {
    return (
      <div className="min-h-screen bg-zinc-50 p-8">
        <div className="mx-auto max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-xl font-bold text-zinc-900">Admin Girişi</h1>
          <form onSubmit={handleTokenSubmit} className="space-y-3">
            <label className="block text-sm font-medium text-zinc-700">
              Admin token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Token"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-900 py-2.5 font-medium text-white hover:bg-zinc-800"
            >
              Giriş
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-zinc-900">Rezervasyonlar</h1>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-zinc-600">Tarih:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              title="Başlangıç tarihi"
            />
            <span className="text-zinc-400">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              title="Bitiş tarihi"
            />
            <label className="ml-2 text-sm font-medium text-zinc-600">Sınıf:</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 min-w-[120px]"
            >
              <option value="">Tümü</option>
              {uniqueClassNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <label className="text-sm font-medium text-zinc-600">Durum:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BookingStatus | '')}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              <option value="">Tümü</option>
              <option value="pending">Beklemede</option>
              <option value="paid">Ödendi</option>
              <option value="cancelled">İptal</option>
            </select>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={bookings.length === 0 || pdfExporting}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {pdfExporting ? 'PDF hazırlanıyor…' : 'PDF İndir'}
            </button>
            <button
              type="button"
              onClick={() => setSubmittedToken('')}
              className="text-sm text-zinc-500 underline hover:text-zinc-700"
            >
              Çıkış
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          {loading && bookings.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">Yükleniyor…</div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">Kayıt yok.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="px-4 py-3 font-semibold text-zinc-700">Tarih</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Tur</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Ad Soyad</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Telefon</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Kişi</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Sınıf</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Toplam</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Durum</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Oluşturulma</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-zinc-100 hover:bg-zinc-50/50">
                      <td className="px-4 py-3 text-zinc-900">{b.date}</td>
                      <td className="px-4 py-3 text-zinc-900">{b.tourTitle}</td>
                      <td className="px-4 py-3 text-zinc-900">
                        {b.customer.firstName} {b.customer.lastName}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{b.customer.phone || '—'}</td>
                      <td className="px-4 py-3 text-zinc-600">
                        {b.counts.adult + b.counts.child + b.counts.infant}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{b.className}</td>
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {b.totalPrice.toLocaleString('tr-TR')} {b.currency}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={b.status}
                            onChange={(e) => handleStatusChange(b.id, e.target.value as BookingStatus)}
                            disabled={updatingId === b.id}
                            className="min-w-[110px] rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-60"
                            title="Durumu değiştir"
                          >
                            <option value="pending">Beklemede</option>
                            <option value="paid">Ödendi</option>
                            <option value="cancelled">İptal</option>
                          </select>
                          {updatingId === b.id && (
                            <span className="text-xs text-zinc-400">Kaydediliyor…</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {b.createdAt
                          ? new Date(b.createdAt).toLocaleString('tr-TR')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {nextStartAfter && !dateFrom && !dateTo && !classFilter && (
            <div className="border-t border-zinc-200 px-4 py-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => fetchBookings(nextStartAfter)}
                className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-300 disabled:opacity-50"
              >
                {loading ? 'Yükleniyor…' : 'Sonraki sayfa'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
