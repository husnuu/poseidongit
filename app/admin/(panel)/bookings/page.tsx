'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import BookingsSummaryCards from '@/components/admin/bookings/BookingsSummaryCards'
import BookingsFilterBar from '@/components/admin/bookings/BookingsFilterBar'
import BookingsTable from '@/components/admin/bookings/BookingsTable'
import OccupancyCalendar from '@/components/admin/bookings/OccupancyCalendar'
import DayOccupancyDrawer from '@/components/admin/bookings/DayOccupancyDrawer'
import BookingDetailModal from '@/components/admin/bookings/BookingDetailModal'
import ManualBookingDrawer from '@/components/admin/bookings/ManualBookingDrawer'
import type {
  AdminBookingRow,
  BookingsStats,
  TourOption,
  DayOccupancyData,
  BookingStatus,
} from '@/types/adminBookings'

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

async function loadTurkishFont(doc: jsPDF, authToken: string, adminEmail?: string): Promise<void> {
  if (cachedFontBase64) {
    doc.addFileToVFS(FONT_VFS_NAME, cachedFontBase64)
    doc.addFont(FONT_VFS_NAME, FONT_DISPLAY_NAME, 'normal', undefined, 'Identity-H')
    doc.setFont(FONT_DISPLAY_NAME, 'normal')
    return
  }
  const headers: Record<string, string> = { Authorization: `Bearer ${authToken}` }
  if (adminEmail) headers['X-Admin-Email'] = adminEmail
  const res = await fetch(DEJA_VU_SANS_URL, { headers })
  if (!res.ok) throw new Error('Font yüklenemedi')
  const ab = await res.arrayBuffer()
  cachedFontBase64 = arrayBufferToBase64(ab)
  doc.addFileToVFS(FONT_VFS_NAME, cachedFontBase64)
  doc.addFont(FONT_VFS_NAME, FONT_DISPLAY_NAME, 'normal', undefined, 'Identity-H')
  doc.setFont(FONT_DISPLAY_NAME, 'normal')
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Beklemede',
  paid: 'Ödendi',
  cancelled: 'İptal',
}

function getUniqueClassNames(bookings: AdminBookingRow[]): string[] {
  const set = new Set(bookings.map((b) => b.className).filter(Boolean))
  return Array.from(set).sort()
}

async function exportToPdf(
  bookings: AdminBookingRow[],
  dateLabel: string,
  classLabel: string,
  tourLabel: string,
  authToken: string,
  adminEmail?: string
): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  await loadTurkishFont(doc, authToken, adminEmail)

  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  const headerH = 22

  // Üst başlık bandı
  doc.setFillColor(30, 58, 138)
  doc.rect(0, 0, pageW, headerH, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont(FONT_DISPLAY_NAME, 'normal')
  doc.setFontSize(16)
  doc.text('Rezervasyon Listesi', margin, 14)
  doc.setFontSize(9)
  const siteNamePdf = process.env.NEXT_PUBLIC_SITE_NAME || 'Site'
  doc.text(siteNamePdf, pageW - margin - doc.getTextWidth(siteNamePdf), 14)

  // Filtre satırı
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(9)
  const filterText = `Tarih: ${dateLabel || 'Tümü'}  ·  Tur: ${tourLabel || 'Tümü'}  ·  Sınıf: ${classLabel || 'Tümü'}  ·  Toplam: ${bookings.length} kayıt`
  doc.text(filterText, margin, headerH + 8)

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

  const startY = headerH + 14
  doc.setFont(FONT_DISPLAY_NAME, 'normal')

  autoTable(doc, {
    head,
    body,
    startY,
    theme: 'striped',
    styles: {
      fontSize: 9,
      font: FONT_DISPLAY_NAME,
      fontStyle: 'normal',
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
    },
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      font: FONT_DISPLAY_NAME,
      fontStyle: 'normal',
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 38 },
      2: { cellWidth: 32 },
      3: { cellWidth: 42 },
      4: { cellWidth: 28 },
      5: { cellWidth: 12 },
      6: { cellWidth: 22 },
      7: { cellWidth: 24 },
      8: { cellWidth: 20 },
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      const pageH = doc.internal.pageSize.getHeight()
      doc.text(
        `Dışa aktarma: ${new Date().toLocaleDateString('tr-TR')}  ·  Sayfa ${data.pageNumber}`,
        margin,
        pageH - 8
      )
    },
    willDrawCell: () => {
      doc.setFont(FONT_DISPLAY_NAME, 'normal')
    },
  })

  const dateStr = new Date().toISOString().slice(0, 10)
  doc.save(`rezervasyonlar_${dateStr}.pdf`)
}

function exportToCsv(bookings: AdminBookingRow[]): void {
  const headers = [
    'Tarih',
    'Tur',
    'Ad',
    'Soyad',
    'E-posta',
    'Telefon',
    'Yetişkin',
    'Çocuk',
    'Bebek',
    'Sınıf',
    'Toplam',
    'Para Birimi',
    'Durum',
    'Yemek tercihi',
    'Oluşturulma',
  ]
  const rows = bookings.map((b) => [
    b.date,
    b.tourTitle,
    b.customer.firstName,
    b.customer.lastName,
    b.customer.email ?? '',
    b.customer.phone ?? '',
    String(b.counts.adult),
    String(b.counts.child),
    String(b.counts.infant),
    b.className,
    String(b.totalPrice),
    b.currency,
    STATUS_LABELS[b.status] ?? b.status,
    b.mealPreference?.label?.trim() ?? '',
    b.createdAt ?? '',
  ])
  const escape = (s: string) => {
    const t = String(s).replace(/"/g, '""')
    return t.includes(',') || t.includes('"') || t.includes('\n') ? `"${t}"` : t
  }
  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rezervasyonlar_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function getManageUrl(bookingId: string): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/rezervasyon/yonet?bookingId=${encodeURIComponent(bookingId)}`
}

function getVoucherPdfUrl(bookingId: string, accessToken?: string | null): string {
  if (typeof window === 'undefined') return ''
  const base = window.location.origin
  if (accessToken?.trim()) {
    const params = new URLSearchParams()
    params.set('bookingId', bookingId)
    params.set('token', accessToken.trim())
    params.set('download', '1')
    return `${base}/api/voucher/access?${params.toString()}`
  }
  const params = new URLSearchParams()
  params.set('bookingId', bookingId)
  params.set('download', '1')
  return `${base}/api/voucher?${params.toString()}`
}

type SortKey = 'date' | 'totalPrice' | 'createdAt' | 'tourTitle'

const PAGE_SIZE = 20
const FETCH_TIMEOUT_MS = 20_000

const ADMIN_TOKEN_STORAGE_KEY = 'poseidon_admin_token'
const ADMIN_EMAIL_STORAGE_KEY = 'poseidon_admin_email'
const ADMIN_EMAIL_HEADER = 'X-Admin-Email'

function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = FETCH_TIMEOUT_MS, ...fetchOptions } = options
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  return fetch(url, { ...fetchOptions, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  )
}

export default function AdminBookingsPage() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [submittedToken, setSubmittedToken] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [bookings, setBookings] = useState<AdminBookingRow[]>([])
  const [stats, setStats] = useState<BookingsStats | null>(null)
  const [tours, setTours] = useState<TourOption[]>([])
  const [occupancyDays, setOccupancyDays] = useState<DayOccupancyData[]>([])
  const [occupancyError, setOccupancyError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [occupancyLoading, setOccupancyLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [tourIdFilter, setTourIdFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [manualDrawerOpen, setManualDrawerOpen] = useState(false)
  const [nextStartAfter, setNextStartAfter] = useState<string | null>(null)
  const [pdfExporting, setPdfExporting] = useState(false)
  const [csvExporting, setCsvExporting] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [detailBooking, setDetailBooking] = useState<AdminBookingRow | null>(null)
  const [dayDrawerOpen, setDayDrawerOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<DayOccupancyData | null>(null)
  const [occupancyTourId, setOccupancyTourId] = useState('')
  const [occupancyClassFilter, setOccupancyClassFilter] = useState('all')
  const [occupancyMonth, setOccupancyMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [loginChecking, setLoginChecking] = useState(false)

  const uniqueClassNames = useMemo(() => getUniqueClassNames(bookings), [bookings])

  const filteredBookings = useMemo(() => {
    let list = bookings
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (b) =>
          `${b.customer.firstName} ${b.customer.lastName}`.toLowerCase().includes(q) ||
          (b.customer.phone ?? '').toLowerCase().includes(q) ||
          b.tourTitle.toLowerCase().includes(q) ||
          (b.customer.email ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [bookings, searchQuery])

  const sortedFilteredBookings = useMemo(() => {
    const arr = [...filteredBookings]
    arr.sort((a, b) => {
      let va: string | number = 0
      let vb: string | number = 0
      switch (sortKey) {
        case 'date':
          va = a.date
          vb = b.date
          break
        case 'totalPrice':
          va = a.totalPrice
          vb = b.totalPrice
          break
        case 'createdAt':
          va = a.createdAt || ''
          vb = b.createdAt || ''
          break
        case 'tourTitle':
          va = a.tourTitle
          vb = b.tourTitle
          break
        default:
          return 0
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [filteredBookings, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sortedFilteredBookings.length / PAGE_SIZE))
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedFilteredBookings.slice(start, start + PAGE_SIZE)
  }, [sortedFilteredBookings, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, dateFrom, dateTo, classFilter, tourIdFilter, sourceFilter, searchQuery])

  const bookingsForSelectedDay = useMemo(() => {
    if (!selectedDay?.date || !occupancyTourId) return []
    return bookings.filter(
      (b) => b.date === selectedDay.date && (b.tourId === occupancyTourId || !occupancyTourId)
    )
  }, [bookings, selectedDay?.date, occupancyTourId])

  const selectedTourTitle = useMemo(
    () => tours.find((t) => t.id === occupancyTourId)?.title ?? '',
    [tours, occupancyTourId]
  )

  const fetchBookings = useCallback(
    async (startAfter?: string) => {
      if (!submittedToken) return
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('limit', dateFrom || dateTo || classFilter || tourIdFilter || sourceFilter ? '500' : '200')
        if (statusFilter) params.set('status', statusFilter)
        if (dateFrom) params.set('dateFrom', dateFrom)
        if (dateTo) params.set('dateTo', dateTo)
        if (classFilter) params.set('className', classFilter)
        if (tourIdFilter)         params.set('tourId', tourIdFilter)
        if (sourceFilter) params.set('source', sourceFilter)
        if (startAfter) params.set('startAfter', startAfter)
        const headers: Record<string, string> = { Authorization: `Bearer ${submittedToken}` }
        if (submittedEmail) headers[ADMIN_EMAIL_HEADER] = submittedEmail
        const res = await fetchWithTimeout(`/api/admin/bookings?${params}`, { headers })
        if (!res.ok) {
          if (res.status === 401) {
            setError('E-posta veya şifre hatalı.')
            setSubmittedToken('')
            setSubmittedEmail('')
            if (typeof window !== 'undefined') {
              window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
              window.sessionStorage.removeItem(ADMIN_EMAIL_STORAGE_KEY)
            }
          } else setError('Liste alınamadı.')
          return
        }
        const data = await res.json()
        const list = (data.bookings ?? []).map((b: Record<string, unknown>) => ({
          id: b.id,
          tourId: b.tourId,
          tourTitle: b.tourTitle,
          tourCoverImageUrl: b.tourCoverImageUrl ?? null,
          date: b.date,
          time: b.time,
          customer: b.customer ?? {},
          additionalTravelers: Array.isArray(b.additionalTravelers)
            ? b.additionalTravelers
                .filter((t: unknown) => t && typeof t === 'object')
                .map((t) => {
                  const row = t as Record<string, unknown>
                  const rowMealPreference =
                    row.mealPreference &&
                    typeof row.mealPreference === 'object' &&
                    typeof (row.mealPreference as { key?: unknown }).key === 'string' &&
                    typeof (row.mealPreference as { label?: unknown }).label === 'string'
                      ? {
                          key: String((row.mealPreference as { key: string }).key),
                          label: String((row.mealPreference as { label: string }).label),
                        }
                      : undefined
                  return {
                    firstName: String(row.firstName ?? ''),
                    lastName: String(row.lastName ?? ''),
                    ...(rowMealPreference ? { mealPreference: rowMealPreference } : {}),
                  }
                })
            : undefined,
          counts: b.counts ?? { adult: 0, child: 0, infant: 0 },
          classId: b.classId,
          className: b.className,
          firstClassLocas: Array.isArray(b.firstClassLocas) ? b.firstClassLocas : undefined,
          firstClassLoca: typeof b.firstClassLoca === 'string' ? b.firstClassLoca : undefined,
          totalPrice: Number(b.totalPrice ?? 0),
          unitPrice: typeof b.unitPrice === 'number' ? b.unitPrice : undefined,
          currency: b.currency ?? 'TRY',
          status: b.status ?? 'pending',
          createdAt: b.createdAt ?? null,
          adminNote: b.adminNote ?? null,
          meetingPoint: b.meetingPoint,
          mealPreference:
            b.mealPreference &&
            typeof b.mealPreference === 'object' &&
            typeof (b.mealPreference as { key?: string }).key === 'string' &&
            typeof (b.mealPreference as { label?: string }).label === 'string'
              ? {
                  key: String((b.mealPreference as { key: string }).key),
                  label: String((b.mealPreference as { label: string }).label),
                }
              : undefined,
          source: b.source,
          manualSource: b.manualSource ?? null,
          createdByAdmin: b.createdByAdmin ?? false,
          reference: b.reference ?? null,
        }))
        setBookings(startAfter ? (prev) => [...prev, ...list] : list)
        setNextStartAfter(data.nextStartAfter ?? null)
      } catch (err) {
        const isAbort = err instanceof Error && err.name === 'AbortError'
        setError(isAbort ? 'Bağlantı zaman aşımı. Sunucu yanıt vermiyor; .env ve Firebase ayarlarını kontrol edin.' : 'Bağlantı hatası.')
      } finally {
        setLoading(false)
      }
    },
    [submittedToken, submittedEmail, statusFilter, dateFrom, dateTo, classFilter, tourIdFilter, sourceFilter]
  )

  const fetchStats = useCallback(async () => {
    if (!submittedToken) return
    setStatsLoading(true)
    try {
      const headers: Record<string, string> = { Authorization: `Bearer ${submittedToken}` }
      if (submittedEmail) headers[ADMIN_EMAIL_HEADER] = submittedEmail
      const res = await fetchWithTimeout('/api/admin/bookings/stats', { headers })
      if (res.ok) {
        const data = await res.json()
        setStats({
          totalBookings: data.totalBookings ?? 0,
          todayBookings: data.todayBookings ?? 0,
          totalRevenue: data.totalRevenue ?? 0,
          todayOccupancy: data.todayOccupancy ?? 0,
          currency: data.currency ?? 'TRY',
          onlineBookings: data.onlineBookings,
          manualBookings: data.manualBookings,
        })
      }
    } catch {
      // ignore (stats are non-critical)
    } finally {
      setStatsLoading(false)
    }
  }, [submittedToken, submittedEmail])

  const fetchTours = useCallback(async () => {
    if (!submittedToken) return
    try {
      const headers: Record<string, string> = { Authorization: `Bearer ${submittedToken}` }
      if (submittedEmail) headers[ADMIN_EMAIL_HEADER] = submittedEmail
      const res = await fetchWithTimeout('/api/admin/tours', { headers })
      if (res.ok) {
        const data = await res.json()
        setTours(data.tours ?? [])
      }
    } catch {
      // ignore (tours dropdown can be empty)
    }
  }, [submittedToken, submittedEmail])

  const fetchOccupancy = useCallback(async () => {
    if (!submittedToken || !occupancyTourId) {
      setOccupancyDays([])
      setOccupancyError(null)
      return
    }
    setOccupancyLoading(true)
    setOccupancyError(null)
    try {
      const params = new URLSearchParams()
      params.set('tourId', occupancyTourId)
      params.set('classId', occupancyClassFilter)
      params.set('month', occupancyMonth)
      const headers: Record<string, string> = { Authorization: `Bearer ${submittedToken}` }
      if (submittedEmail) headers[ADMIN_EMAIL_HEADER] = submittedEmail
      const res = await fetchWithTimeout(`/api/admin/occupancy?${params}`, { headers })
      const text = await res.text()
      let data: { days?: DayOccupancyData[]; message?: string; error?: string; detail?: string } = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        data = {}
      }
      if (res.ok) {
        const daysList = data.days ?? []
        setOccupancyDays(daysList)
        setOccupancyError(data.message ?? null)
      } else {
        setOccupancyDays([])
        const errMsg = data.error ?? 'Doluluk verisi alınamadı.'
        const detail = data.detail ? ` — ${data.detail}` : ''
        const statusInfo = res.status !== 200 ? ` [${res.status}]` : ''
        setOccupancyError(errMsg + detail + statusInfo)
      }
    } catch (err) {
      setOccupancyDays([])
      const msg = err instanceof Error ? err.message : 'Bağlantı hatası.'
      setOccupancyError(msg === 'The operation was aborted.' ? 'İstek zaman aşımına uğradı.' : `Bağlantı hatası: ${msg}`)
    } finally {
      setOccupancyLoading(false)
    }
  }, [submittedToken, submittedEmail, occupancyTourId, occupancyClassFilter, occupancyMonth])

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (submittedToken) {
      fetchBookings()
      fetchStats()
      fetchTours()
    }
  }, [submittedToken, fetchBookings, fetchStats, fetchTours])

  useEffect(() => {
    if (submittedToken && occupancyTourId) fetchOccupancy()
    else setOccupancyDays([])
  }, [submittedToken, occupancyTourId, occupancyClassFilter, occupancyMonth, fetchOccupancy])

  function handleManualSuccess() {
    fetchBookings()
    fetchStats()
  }

  const handleSort = (key: SortKey) => {
    setSortKey(key)
    setSortDir((d) => (sortKey === key && d === 'desc' ? 'asc' : 'desc'))
  }

  const handleExportPdf = async () => {
    if (filteredBookings.length === 0 || !submittedToken) return
    setPdfExporting(true)
    try {
      const dateLabel = [dateFrom, dateTo].filter(Boolean).join(' – ') || ''
      const tourLabel = tourIdFilter ? tours.find((t) => t.id === tourIdFilter)?.title ?? '' : ''
      await exportToPdf(filteredBookings, dateLabel, classFilter, tourLabel, submittedToken, submittedEmail || undefined)
    } catch (e) {
      console.error('PDF export error:', e)
      setError('PDF oluşturulurken hata oluştu.')
    } finally {
      setPdfExporting(false)
    }
  }

  const handleExportCsv = () => {
    if (filteredBookings.length === 0) return
    setCsvExporting(true)
    try {
      exportToCsv(filteredBookings)
    } finally {
      setCsvExporting(false)
    }
  }

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    if (!submittedToken) return
    setUpdatingId(bookingId)
    setError(null)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${submittedToken}`,
      }
      if (submittedEmail) headers[ADMIN_EMAIL_HEADER] = submittedEmail
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers,
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
      if (detailBooking?.id === bookingId) {
        setDetailBooking((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleAdminNoteSave = async (bookingId: string, adminNote: string) => {
    if (!submittedToken) return
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${submittedToken}`,
      }
      if (submittedEmail) headers[ADMIN_EMAIL_HEADER] = submittedEmail
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ bookingId, adminNote }),
      })
      if (!res.ok) throw new Error('Not kaydedilemedi')
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, adminNote } : b))
      )
      if (detailBooking?.id === bookingId) {
        setDetailBooking((prev) => (prev ? { ...prev, adminNote } : null))
      }
    } catch {
      setError('Not kaydedilemedi.')
    }
  }

  const handleDayClick = (day: DayOccupancyData) => {
    setSelectedDay(day)
    setDayDrawerOpen(true)
  }

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = token.trim()
    const eMail = email.trim().toLowerCase()
    if (!t) return
    setError(null)
    setLoginChecking(true)
    try {
      const headers: Record<string, string> = { Authorization: `Bearer ${t}` }
      if (eMail) headers[ADMIN_EMAIL_HEADER] = eMail
      const res = await fetchWithTimeout('/api/admin/bookings/stats', { headers })
      if (res.status === 401) {
        setError('E-posta veya şifre hatalı.')
        setLoginChecking(false)
        return
      }
      if (!res.ok) {
        setError('Giriş yapılamadı.')
        setLoginChecking(false)
        return
      }
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, t)
        if (eMail) window.sessionStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, eMail)
      }
      setSubmittedToken(t)
      setSubmittedEmail(eMail)
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoginChecking(false)
    }
  }

  const handleLogout = () => {
    setSubmittedToken('')
    setSubmittedEmail('')
    setToken('')
    setEmail('')
    setError(null)
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
      window.sessionStorage.removeItem(ADMIN_EMAIL_STORAGE_KEY)
    }
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    )
  }

  if (!submittedToken) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 p-6">
        <div className="w-full max-w-[420px]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/50">
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight">Admin Girişi</h1>
                  <p className="mt-0.5 text-xs text-teal-100">Rezervasyon paneli</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              {error && (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {error}
                </div>
              )}
              <form onSubmit={handleTokenSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">E-posta adresiniz</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-posta adresinizi girin"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/80 px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Şifreniz</label>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Şifrenizi girin"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/80 px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!token.trim() || loginChecking}
                  className="w-full rounded-xl bg-teal-600 py-3.5 font-semibold text-white shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:bg-teal-600"
                >
                  {loginChecking ? 'Kontrol ediliyor…' : 'Giriş yap'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-bold text-slate-800 sm:text-xl">Rezervasyonlar & Kapasite</h1>
          <button
            type="button"
            onClick={() => setManualDrawerOpen(true)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-teal-700 sm:w-auto"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Manuel Rezervasyon Ekle
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            {error}
          </div>
        )}

        {stats && !statsLoading && (
          <div className="mb-4 sm:mb-6">
            <BookingsSummaryCards stats={stats} />
          </div>
        )}

        <div className="mb-4 sm:mb-6">
          <BookingsFilterBar
            dateFrom={dateFrom}
            dateTo={dateTo}
            tourId={tourIdFilter}
            classFilter={classFilter}
            statusFilter={statusFilter}
            sourceFilter={sourceFilter}
            searchQuery={searchQuery}
            uniqueClassNames={uniqueClassNames}
            tours={tours}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onTourIdChange={setTourIdFilter}
            onClassFilterChange={setClassFilter}
            onStatusFilterChange={setStatusFilter}
            onSourceFilterChange={setSourceFilter}
            onSearchQueryChange={setSearchQuery}
            onExportPdf={handleExportPdf}
            onExportCsv={handleExportCsv}
            pdfExporting={pdfExporting}
            csvExporting={csvExporting}
            exportDisabled={filteredBookings.length === 0}
            onLogout={handleLogout}
          />
        </div>

        <div className="mb-6 sm:mb-8">
          <OccupancyCalendar
            days={occupancyDays}
            month={occupancyMonth}
            tourId={occupancyTourId}
            classFilter={occupancyClassFilter}
            tours={tours}
            loading={occupancyLoading}
            occupancyError={occupancyError}
            onTourIdChange={setOccupancyTourId}
            onClassFilterChange={setOccupancyClassFilter}
            onMonthChange={setOccupancyMonth}
            onDayClick={handleDayClick}
          />
        </div>

        <div className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-slate-800 sm:text-lg">Rezervasyon Listesi</h2>
          {loading && bookings.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              Yükleniyor…
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              Kayıt yok.
            </div>
          ) : (
            <>
              <BookingsTable
                bookings={paginatedBookings}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                onDetail={setDetailBooking}
                onStatusChange={handleStatusChange}
                onCopyLink={() => {}}
                updatingId={updatingId}
                getManageUrl={getManageUrl}
                getVoucherPdfUrl={getVoucherPdfUrl}
              />
              <div className="mt-4 flex flex-col items-center justify-center gap-3 border-t border-slate-200 bg-white px-3 py-3 sm:flex-row sm:flex-wrap sm:gap-2">
                <span className="text-xs text-slate-600 sm:text-sm">
                  {filteredBookings.length} kayıt · Sayfa {currentPage} / {totalPages}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="min-h-[40px] min-w-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
                  >
                    Önceki
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`min-h-[40px] min-w-[40px] rounded-lg px-3 py-2 text-sm font-medium ${
                        p === currentPage
                          ? 'bg-teal-600 text-white'
                          : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="min-h-[40px] min-w-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <DayOccupancyDrawer
        open={dayDrawerOpen}
        onClose={() => setDayDrawerOpen(false)}
        day={selectedDay}
        tourTitle={selectedTourTitle}
        bookingsForDay={bookingsForSelectedDay}
      />

      <BookingDetailModal
        open={!!detailBooking}
        onClose={() => setDetailBooking(null)}
        booking={detailBooking}
        getManageUrl={getManageUrl}
        getVoucherPdfUrl={getVoucherPdfUrl}
        onStatusChange={handleStatusChange}
        onAdminNoteSave={handleAdminNoteSave}
        updating={updatingId !== null}
      />

      <ManualBookingDrawer
        open={manualDrawerOpen}
        onClose={() => setManualDrawerOpen(false)}
        onSuccess={handleManualSuccess}
        tours={tours}
        authToken={submittedToken}
        adminEmail={submittedEmail || undefined}
      />
    </div>
  )
}
