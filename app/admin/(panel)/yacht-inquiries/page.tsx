'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ADMIN_EMAIL_HEADER } from '@/lib/adminAuth'

type InquiryStatus = 'new' | 'read' | 'contacted' | 'closed'

interface AdminYachtInquiry {
  id: string
  yachtSlug: string
  yachtName: string
  location: string | null
  date: string | null
  guestCount: number | null
  firstName: string
  lastName: string
  email: string
  phone: string
  message: string
  priceFrom: number | null
  currency: string | null
  status: InquiryStatus
  source: string
  adminNote: string | null
  isRead: boolean
  contactedAt: string | null
  readAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

const ADMIN_TOKEN_STORAGE_KEY = 'poseidon_admin_token'
const ADMIN_EMAIL_STORAGE_KEY = 'poseidon_admin_email'

const FETCH_TIMEOUT_MS = 20_000
const PAGE_SIZE = 20

const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: 'Yeni',
  read: 'Okundu',
  contacted: 'İletişime Geçildi',
  closed: 'Kapatıldı',
}

const STATUS_BADGES: Record<InquiryStatus, string> = {
  new: 'bg-amber-100 text-amber-800 border-amber-200',
  read: 'bg-sky-100 text-sky-800 border-sky-200',
  contacted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  closed: 'bg-slate-100 text-slate-700 border-slate-200',
}

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

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('tr-TR')
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return value
}

function formatPrice(value: number | null, currency: string | null): string {
  if (value == null || Number.isNaN(value)) return '—'
  const curr = currency?.trim() || 'TRY'
  return `${value.toLocaleString('tr-TR')} ${curr}`
}

export default function AdminYachtInquiriesPage() {
  const [hydrated, setHydrated] = useState(false)
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [submittedToken, setSubmittedToken] = useState('')
  const [loginChecking, setLoginChecking] = useState(false)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inquiries, setInquiries] = useState<AdminYachtInquiry[]>([])

  const [statusFilter, setStatusFilter] = useState<InquiryStatus | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInquiry, setSelectedInquiry] = useState<AdminYachtInquiry | null>(null)

  const stats = useMemo(() => {
    const total = inquiries.length
    const newCount = inquiries.filter((x) => x.status === 'new').length
    const contactedCount = inquiries.filter((x) => x.status === 'contacted').length
    const closedCount = inquiries.filter((x) => x.status === 'closed').length
    return { total, newCount, contactedCount, closedCount }
  }, [inquiries])

  const filtered = useMemo(() => {
    let list = [...inquiries]

    if (statusFilter) {
      list = list.filter((x) => x.status === statusFilter)
    }
    if (dateFrom) {
      list = list.filter((x) => (x.createdAt ?? '') >= `${dateFrom}T00:00:00`)
    }
    if (dateTo) {
      list = list.filter((x) => (x.createdAt ?? '') <= `${dateTo}T23:59:59`)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter((x) => {
        const fullName = `${x.firstName} ${x.lastName}`.toLowerCase()
        return (
          fullName.includes(q) ||
          (x.email ?? '').toLowerCase().includes(q) ||
          (x.phone ?? '').toLowerCase().includes(q) ||
          (x.yachtName ?? '').toLowerCase().includes(q) ||
          (x.message ?? '').toLowerCase().includes(q)
        )
      })
    }
    return list
  }, [inquiries, statusFilter, dateFrom, dateTo, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, dateFrom, dateTo, searchQuery])

  const fetchInquiries = useCallback(async () => {
    if (!submittedToken) return
    setLoading(true)
    setError(null)
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${submittedToken}`,
      }
      if (submittedEmail) headers[ADMIN_EMAIL_HEADER] = submittedEmail
      const res = await fetchWithTimeout('/api/admin/yacht-inquiries?limit=500', { headers })
      if (!res.ok) {
        if (res.status === 401) {
          setError('E-posta veya şifre hatalı.')
          setSubmittedToken('')
          setSubmittedEmail('')
          if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
            window.sessionStorage.removeItem(ADMIN_EMAIL_STORAGE_KEY)
          }
        } else {
          setError('Motoryat talepleri alınamadı.')
        }
        return
      }
      const data = (await res.json()) as { inquiries?: AdminYachtInquiry[] }
      setInquiries(Array.isArray(data.inquiries) ? data.inquiries : [])
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError'
      setError(isAbort ? 'Bağlantı zaman aşımı.' : 'Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }, [submittedToken, submittedEmail])

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedToken = window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ?? ''
    const savedEmail = (window.sessionStorage.getItem(ADMIN_EMAIL_STORAGE_KEY) ?? '').toLowerCase()
    if (!savedToken) return
    setToken(savedToken)
    setEmail(savedEmail)
    setSubmittedToken(savedToken)
    setSubmittedEmail(savedEmail)
  }, [])

  useEffect(() => {
    if (submittedToken) fetchInquiries()
  }, [submittedToken, fetchInquiries])

  const updateInquiry = useCallback(async (
    inquiryId: string,
    payload: { status?: InquiryStatus; adminNote?: string; markRead?: boolean }
  ) => {
    if (!submittedToken) return false
    setSaving(true)
    setError(null)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${submittedToken}`,
      }
      if (submittedEmail) headers[ADMIN_EMAIL_HEADER] = submittedEmail
      const res = await fetch('/api/admin/yacht-inquiries', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ inquiryId, ...payload }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Güncelleme yapılamadı.')
        return false
      }
      await fetchInquiries()
      return true
    } catch {
      setError('Bağlantı hatası.')
      return false
    } finally {
      setSaving(false)
    }
  }, [submittedToken, submittedEmail, fetchInquiries])

  const handleOpenDetail = async (item: AdminYachtInquiry) => {
    setSelectedInquiry(item)
    if (!item.isRead) {
      await updateInquiry(item.id, { markRead: true, status: item.status === 'new' ? 'read' : item.status })
    }
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
      const res = await fetchWithTimeout('/api/admin/yacht-inquiries?limit=1', { headers })
      if (res.status === 401) {
        setError('E-posta veya şifre hatalı.')
        return
      }
      if (!res.ok) {
        setError('Giriş yapılamadı.')
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
        <div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/50">
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 text-white">
            <h1 className="text-lg font-bold tracking-tight">Admin Girişi</h1>
            <p className="mt-0.5 text-xs text-teal-100">Motoryat mesaj paneli</p>
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
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/80 px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Şifreniz</label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/80 px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
                />
              </div>
              <button
                type="submit"
                disabled={!token.trim() || loginChecking}
                className="w-full rounded-xl bg-teal-600 py-3.5 font-semibold text-white shadow-md hover:bg-teal-700 disabled:opacity-50"
              >
                {loginChecking ? 'Kontrol ediliyor…' : 'Giriş yap'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-slate-800 sm:text-xl">Motoryat Mesajları</h1>
          <button
            type="button"
            onClick={fetchInquiries}
            disabled={loading}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? 'Yenileniyor…' : 'Yenile'}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            {error}
          </div>
        )}

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Toplam</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Yeni</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">{stats.newCount}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">İletişime Geçilen</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">{stats.contactedCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-600">Kapatılan</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{stats.closedCount}</p>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ad, e-posta, telefon, yat, mesaj ara…"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter((e.target.value as InquiryStatus) || '')}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Tüm durumlar</option>
              <option value="new">Yeni</option>
              <option value="read">Okundu</option>
              <option value="contacted">İletişime geçildi</option>
              <option value="closed">Kapatıldı</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('')
                setDateFrom('')
                setDateTo('')
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Filtreyi sıfırla
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Kişi</th>
                  <th className="px-4 py-3">Yat</th>
                  <th className="px-4 py-3">Tur Tarihi</th>
                  <th className="px-4 py-3">Kişi Sayısı</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && inquiries.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>Yükleniyor…</td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>Kayıt bulunamadı.</td>
                  </tr>
                ) : (
                  paginated.map((item) => (
                    <tr key={item.id} className={!item.isRead ? 'bg-amber-50/40' : ''}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{formatDateTime(item.createdAt)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-slate-900">{item.firstName} {item.lastName}</div>
                        <div className="text-slate-500">{item.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.yachtName || item.yachtSlug}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{formatDate(item.date)}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.guestCount ?? '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_BADGES[item.status]}`}>
                          {STATUS_LABELS[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(item)}
                          className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                        >
                          Detay
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row">
            <span className="text-xs text-slate-600 sm:text-sm">
              {filtered.length} kayıt · Sayfa {currentPage} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Önceki
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-800">Mesaj Detayı</h2>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Kapat
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Ad Soyad</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedInquiry.firstName} {selectedInquiry.lastName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">İletişim</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedInquiry.email}</p>
                <p className="text-sm text-slate-700">{selectedInquiry.phone}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Yat</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedInquiry.yachtName || selectedInquiry.yachtSlug}</p>
                <p className="text-sm text-slate-700">{selectedInquiry.location || 'Konum yok'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Tur Bilgisi</p>
                <p className="mt-1 text-sm text-slate-700">Tarih: {formatDate(selectedInquiry.date)}</p>
                <p className="text-sm text-slate-700">Misafir: {selectedInquiry.guestCount ?? '—'}</p>
                <p className="text-sm text-slate-700">Başlangıç: {formatPrice(selectedInquiry.priceFrom, selectedInquiry.currency)}</p>
              </div>
            </div>

            <div className="px-5 pb-5">
              <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Mesaj</p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{selectedInquiry.message || 'Mesaj yok.'}</p>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    const ok = await updateInquiry(selectedInquiry.id, { status: 'read', markRead: true })
                    if (ok) setSelectedInquiry((prev) => (prev ? { ...prev, status: 'read', isRead: true } : prev))
                  }}
                  className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800 hover:bg-sky-100 disabled:opacity-60"
                >
                  Okundu Olarak İşaretle
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    const ok = await updateInquiry(selectedInquiry.id, { status: 'contacted', markRead: true })
                    if (ok) setSelectedInquiry((prev) => (prev ? { ...prev, status: 'contacted', isRead: true } : prev))
                  }}
                  className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                >
                  İletişime Geçildi
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    const ok = await updateInquiry(selectedInquiry.id, { status: 'closed', markRead: true })
                    if (ok) setSelectedInquiry((prev) => (prev ? { ...prev, status: 'closed', isRead: true } : prev))
                  }}
                  className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200 disabled:opacity-60"
                >
                  Talebi Kapat
                </button>
              </div>

              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Admin Notu
              </label>
              <textarea
                defaultValue={selectedInquiry.adminNote ?? ''}
                placeholder="Müşteri ile konuşma notu, geri dönüş zamanı vb."
                className="min-h-[110px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                onBlur={async (e) => {
                  const next = e.target.value
                  if (next === (selectedInquiry.adminNote ?? '')) return
                  const ok = await updateInquiry(selectedInquiry.id, { adminNote: next })
                  if (ok) setSelectedInquiry((prev) => (prev ? { ...prev, adminNote: next || null } : prev))
                }}
              />
              <p className="mt-2 text-xs text-slate-500">
                Oluşturulma: {formatDateTime(selectedInquiry.createdAt)} · Okunma: {formatDateTime(selectedInquiry.readAt)} · İletişim: {formatDateTime(selectedInquiry.contactedAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
