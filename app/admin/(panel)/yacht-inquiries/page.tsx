'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/components/admin/AdminAuthContext'
import { adminFetchInit } from '@/lib/adminRequestInit'

type InquiryStatus = 'new' | 'read' | 'contacted' | 'closed'

interface AdminYachtInquiry {
  id: string
  yachtSlug: string
  yachtName: string
  location: string | null
  date: string | null
  rentalType?: 'daily' | 'overnight'
  checkIn: string | null
  checkOut: string | null
  nights: number | null
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

const FETCH_TIMEOUT_MS = 20_000
const PAGE_SIZE = 20

const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: 'Yeni',
  read: 'Okundu',
  contacted: 'İletişime Geçildi',
  closed: 'Kapatıldı',
}

const STATUS_BADGES: Record<InquiryStatus, string> = {
  new: 'bg-amber-50 text-amber-700 border-amber-200',
  read: 'bg-blue-50 text-primary border-blue-100',
  contacted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-zinc-100 text-zinc-600 border-zinc-200',
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
  const router = useRouter()
  const { initializing: authInitializing, isAdmin, signOutAll, user } = useAdminAuth()
  const adminEmailHeader = user?.email?.trim().toLowerCase() ?? ''

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
    if (!isAdmin) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchWithTimeout(
        '/api/admin/yacht-inquiries?limit=500',
        adminFetchInit({}, { adminEmail: adminEmailHeader || null })
      )
      if (!res.ok) {
        if (res.status === 401) {
          setError('Oturum süresi doldu. Tekrar giriş yapın.')
          await signOutAll()
          router.replace('/login')
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
  }, [isAdmin, adminEmailHeader, signOutAll, router])

  useEffect(() => {
    if (isAdmin) fetchInquiries()
  }, [isAdmin, fetchInquiries])

  const updateInquiry = useCallback(async (
    inquiryId: string,
    payload: { status?: InquiryStatus; adminNote?: string; markRead?: boolean }
  ) => {
    if (!isAdmin) return false
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(
        '/api/admin/yacht-inquiries',
        adminFetchInit(
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inquiryId, ...payload }),
          },
          { adminEmail: adminEmailHeader || null }
        )
      )
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
  }, [isAdmin, adminEmailHeader, fetchInquiries])

  const handleOpenDetail = async (item: AdminYachtInquiry) => {
    setSelectedInquiry(item)
    if (!item.isRead) {
      await updateInquiry(item.id, { markRead: true, status: item.status === 'new' ? 'read' : item.status })
    }
  }

  if (authInitializing) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="max-w-md text-zinc-500">Bu sayfa için yönetici girişi gerekir.</p>
        <Link
          href="/login"
          className="rounded-lg bg-primary px-6 py-3 font-bold text-white hover:bg-primary-dark"
        >
          Giriş sayfasına git
        </Link>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-lg font-black text-[#131719] sm:text-xl">Motoryat Mesajları</h1>
          <button
            type="button"
            onClick={fetchInquiries}
            disabled={loading}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-[#131719] hover:bg-zinc-50 disabled:opacity-60"
          >
            {loading ? 'Yenileniyor…' : 'Yenile'}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {error}
          </div>
        )}

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[#f1f5f9] bg-white p-4 shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Toplam</p>
            <p className="mt-1 text-2xl font-black text-[#131719]">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Yeni</p>
            <p className="mt-1 text-2xl font-black text-amber-800">{stats.newCount}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">İletişime Geçilen</p>
            <p className="mt-1 text-2xl font-black text-emerald-800">{stats.contactedCount}</p>
          </div>
          <div className="rounded-xl border border-[#f1f5f9] bg-zinc-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Kapatılan</p>
            <p className="mt-1 text-2xl font-black text-[#131719]">{stats.closedCount}</p>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-[#f1f5f9] bg-white p-4 shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ad, e-posta, telefon, yat, mesaj ara…"
              className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter((e.target.value as InquiryStatus) || '')}
              className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
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
              className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('')
                setDateFrom('')
                setDateTo('')
              }}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-bold text-[#131719] hover:bg-zinc-50"
            >
              Filtreyi sıfırla
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#f1f5f9] bg-white shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#f1f5f9]">
              <thead className="bg-zinc-50">
                <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Kişi</th>
                  <th className="px-4 py-3">Yat</th>
                  <th className="px-4 py-3">Tur Tarihi</th>
                  <th className="px-4 py-3">Kişi Sayısı</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {loading && inquiries.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-zinc-400" colSpan={7}>Yükleniyor…</td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-zinc-400" colSpan={7}>Kayıt bulunamadı.</td>
                  </tr>
                ) : (
                  paginated.map((item) => (
                    <tr key={item.id} className={!item.isRead ? 'bg-amber-50/40' : ''}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{formatDateTime(item.createdAt)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-bold text-[#131719]">{item.firstName} {item.lastName}</div>
                        <div className="text-zinc-400">{item.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">{item.yachtName || item.yachtSlug}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {item.rentalType === 'overnight' && item.checkIn && item.checkOut
                          ? `${item.checkIn} → ${item.checkOut}${item.nights != null ? ` (${item.nights} gece)` : ''}`
                          : formatDate(item.date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">{item.guestCount ?? '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGES[item.status]}`}>
                          {STATUS_LABELS[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(item)}
                          className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-dark"
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
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#f1f5f9] px-4 py-3 sm:flex-row">
            <span className="text-xs font-semibold text-zinc-500 sm:text-sm">
              {filtered.length} kayıt · Sayfa {currentPage} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-bold text-[#131719] disabled:opacity-50"
              >
                Önceki
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-bold text-[#131719] disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#131719]/45 p-3 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-[0_20px_60px_rgba(19,23,25,0.18)]">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] px-5 py-4">
              <h2 className="text-lg font-black text-[#131719]">Mesaj Detayı</h2>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-bold text-[#131719] hover:bg-zinc-50"
              >
                Kapat
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <div className="rounded-lg border border-[#f1f5f9] bg-zinc-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Ad Soyad</p>
                <p className="mt-1 text-sm font-bold text-[#131719]">{selectedInquiry.firstName} {selectedInquiry.lastName}</p>
              </div>
              <div className="rounded-lg border border-[#f1f5f9] bg-zinc-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">İletişim</p>
                <p className="mt-1 text-sm font-bold text-[#131719]">{selectedInquiry.email}</p>
                <p className="text-sm text-zinc-500">{selectedInquiry.phone}</p>
              </div>
              <div className="rounded-lg border border-[#f1f5f9] bg-zinc-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Yat</p>
                <p className="mt-1 text-sm font-bold text-[#131719]">{selectedInquiry.yachtName || selectedInquiry.yachtSlug}</p>
                <p className="text-sm text-zinc-500">{selectedInquiry.location || 'Konum yok'}</p>
              </div>
              <div className="rounded-lg border border-[#f1f5f9] bg-zinc-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Tur Bilgisi</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Tür:{' '}
                  {selectedInquiry.rentalType === 'overnight' ? 'Konaklamalı' : 'Günlük (7 saat)'}
                </p>
                <p className="text-sm text-zinc-600">
                  Tarih:{' '}
                  {selectedInquiry.rentalType === 'overnight' &&
                  selectedInquiry.checkIn &&
                  selectedInquiry.checkOut
                    ? `${selectedInquiry.checkIn} → ${selectedInquiry.checkOut}${selectedInquiry.nights != null ? ` (${selectedInquiry.nights} gece)` : ''}`
                    : formatDate(selectedInquiry.date)}
                </p>
                <p className="text-sm text-zinc-600">Misafir: {selectedInquiry.guestCount ?? '—'}</p>
                <p className="text-sm text-zinc-600">Başlangıç: {formatPrice(selectedInquiry.priceFrom, selectedInquiry.currency)}</p>
              </div>
            </div>

            <div className="px-5 pb-5">
              <div className="mb-4 rounded-lg border border-[#f1f5f9] bg-white p-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-zinc-400">Mesaj</p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-[#131719]">{selectedInquiry.message || 'Mesaj yok.'}</p>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    const ok = await updateInquiry(selectedInquiry.id, { status: 'read', markRead: true })
                    if (ok) setSelectedInquiry((prev) => (prev ? { ...prev, status: 'read', isRead: true } : prev))
                  }}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-primary hover:bg-blue-100 disabled:opacity-60"
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
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
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
                  className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-bold text-[#131719] hover:bg-zinc-200 disabled:opacity-60"
                >
                  Talebi Kapat
                </button>
              </div>

              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                Admin Notu
              </label>
              <textarea
                defaultValue={selectedInquiry.adminNote ?? ''}
                placeholder="Müşteri ile konuşma notu, geri dönüş zamanı vb."
                className="min-h-[110px] w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                onBlur={async (e) => {
                  const next = e.target.value
                  if (next === (selectedInquiry.adminNote ?? '')) return
                  const ok = await updateInquiry(selectedInquiry.id, { adminNote: next })
                  if (ok) setSelectedInquiry((prev) => (prev ? { ...prev, adminNote: next || null } : prev))
                }}
              />
              <p className="mt-2 text-xs text-zinc-400">
                Oluşturulma: {formatDateTime(selectedInquiry.createdAt)} · Okunma: {formatDateTime(selectedInquiry.readAt)} · İletişim: {formatDateTime(selectedInquiry.contactedAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
