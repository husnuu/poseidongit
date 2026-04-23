'use client'

import { useState, useMemo } from 'react'
import type { AdminBookingRow, BookingStatus } from '@/types/adminBookings'
import { MANUAL_SOURCE_LABELS } from '@/types/adminBookings'

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Beklemede',
  paid: 'Ödendi',
  confirmed: 'Onaylandı',
  failed: 'Ödeme başarısız',
  cancelled: 'İptal',
}

const STATUS_BADGE_CLASS: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-red-100 text-red-800',
}

function SourceBadge({ source, manualSource }: { source?: string; manualSource?: string | null }) {
  const isManual = source === 'manual'
  const label = isManual
    ? (MANUAL_SOURCE_LABELS[manualSource ?? ''] ?? manualSource ?? 'Manuel')
    : (MANUAL_SOURCE_LABELS.web ?? 'Web')
  const bg = isManual ? 'bg-indigo-100 text-indigo-800' : 'bg-zinc-100 text-zinc-700'
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${bg}`}>
      {label}
    </span>
  )
}

type SortKey = 'date' | 'totalPrice' | 'createdAt' | 'tourTitle'

interface BookingsTableProps {
  bookings: AdminBookingRow[]
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onSort: (key: SortKey) => void
  onDetail: (b: AdminBookingRow) => void
  onStatusChange: (bookingId: string, status: BookingStatus) => void
  onCopyLink: (b: AdminBookingRow) => void
  updatingId: string | null
  getManageUrl: (bookingId: string) => string
  getVoucherPdfUrl: (bookingId: string, accessToken?: string | null) => string
}

function ParticipantsBreakdown({ counts }: { counts: { adult: number; child: number; infant: number } }) {
  const parts: string[] = []
  if (counts.adult > 0) parts.push(`${counts.adult} Yetişkin`)
  if (counts.child > 0) parts.push(`${counts.child} Çocuk`)
  if (counts.infant > 0) parts.push(`${counts.infant} Bebek`)
  const total = counts.adult + counts.child + counts.infant
  return (
    <div className="text-zinc-700">
      <span className="font-medium">{total} kişi</span>
      {parts.length > 0 && (
        <div className="text-xs text-zinc-500 mt-0.5">
          {parts.join(' · ')}
        </div>
      )}
    </div>
  )
}

export default function BookingsTable({
  bookings,
  sortKey,
  sortDir,
  onSort,
  onDetail,
  onStatusChange,
  onCopyLink,
  updatingId,
  getManageUrl,
  getVoucherPdfUrl,
}: BookingsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const sorted = useMemo(() => {
    const arr = [...bookings]
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
  }, [bookings, sortKey, sortDir])

  const handleCopy = (b: AdminBookingRow) => {
    const url = getManageUrl(b.id)
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedId(b.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const Th = ({
    label,
    keyName,
    className = '',
  }: {
    label: string
    keyName: SortKey
    className?: string
  }) => (
    <th className={`sticky top-0 z-10 bg-zinc-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(keyName)}
        className="hover:text-indigo-600 focus:outline-none"
      >
        {label}
        {sortKey === keyName && (
          <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </button>
    </th>
  )

  return (
    <>
      {/* Mobil: kart listesi */}
      <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm md:hidden">
        {sorted.map((b) => (
          <div
            key={b.id}
            className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3"
          >
            <div className="flex gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-200">
                {b.tourCoverImageUrl ? (
                  <img src={b.tourCoverImageUrl} alt="" className="h-full w-full object-cover" width={56} height={56} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-400">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-900 truncate">{b.tourTitle}</p>
                <p className="text-xs text-zinc-600">{b.date}{b.className ? ` · Sınıf: ${b.className}${(b.firstClassLocas?.length ? ` (${b.firstClassLocas.join(', ')})` : b.firstClassLoca ? ` (${b.firstClassLoca})` : '')}` : ''}</p>
                <p className="mt-0.5 text-sm text-zinc-800">
                  {b.customer.firstName} {b.customer.lastName}
                  {b.customer.phone ? ` · ${b.customer.phone}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[b.status]}`}>
                    {STATUS_LABELS[b.status]}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {b.totalPrice > 0 ? `${b.totalPrice.toLocaleString('tr-TR')} ${b.currency}` : ''}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => onDetail(b)}
                    className="rounded bg-indigo-100 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200"
                  >
                    Detay
                  </button>
                  <a
                    href={getVoucherPdfUrl(b.id, b.accessToken)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                  >
                    PDF
                  </a>
                  <select
                    value={b.status}
                    onChange={(e) => onStatusChange(b.id, e.target.value as BookingStatus)}
                    disabled={updatingId === b.id}
                    className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 disabled:opacity-60"
                  >
                    <option value="pending">Beklemede</option>
                    <option value="paid">Ödendi</option>
                    <option value="confirmed">Onaylandı</option>
                    <option value="failed">Ödeme başarısız</option>
                    <option value="cancelled">İptal</option>
                  </select>
                  {b.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => onStatusChange(b.id, 'cancelled')}
                      disabled={updatingId === b.id}
                      className="rounded bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      İptal
                    </button>
                  )}
                </div>
                {(b.nestpayAuthCode || b.nestpayHostRefNum || b.nestpayTransId || b.paidAt) && (
                  <p className="mt-1 text-[11px] text-zinc-500 font-mono truncate" title={`${b.nestpayTransId ?? ''}`}>
                    {b.paidAt ? `Ödeme: ${new Date(b.paidAt).toLocaleString('tr-TR')} · ` : ''}
                    {b.nestpayAuthCode ? `Auth ${b.nestpayAuthCode}` : ''}
                    {b.nestpayHostRefNum ? ` · HostRef ${b.nestpayHostRefNum}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Masaüstü: tablo */}
      <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm md:block">
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="sticky top-0 z-10 w-[56px] bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Görsel
            </th>
            <Th label="Tur" keyName="tourTitle" />
            <Th label="Tarih" keyName="date" />
            <th className="sticky top-0 z-10 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Müşteri
            </th>
            <th className="sticky top-0 z-10 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Telefon
            </th>
            <th className="sticky top-0 z-10 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Katılımcılar
            </th>
            <th className="sticky top-0 z-10 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Sınıf
            </th>
            <th className="sticky top-0 z-10 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Kaynak
            </th>
            <Th label="Toplam" keyName="totalPrice" />
            <th className="sticky top-0 z-10 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Durum
            </th>
            <Th label="Oluşturulma" keyName="createdAt" />
            <th className="sticky top-0 z-10 w-[140px] bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((b) => (
            <tr
              key={b.id}
              className="border-b border-zinc-100 transition-colors hover:bg-zinc-50/80"
            >
              <td className="px-4 py-3">
                <div className="h-14 w-14 overflow-hidden rounded-lg bg-zinc-100">
                  {b.tourCoverImageUrl ? (
                    <img
                      src={b.tourCoverImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      width={56}
                      height={56}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                      </svg>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="font-medium text-zinc-900">{b.tourTitle}</span>
              </td>
              <td className="px-4 py-3 text-zinc-700">{b.date}</td>
              <td className="px-4 py-3 text-zinc-900">
                {b.customer.firstName} {b.customer.lastName}
              </td>
              <td className="px-4 py-3 text-zinc-600">{b.customer.phone || '—'}</td>
              <td className="px-4 py-3">
                <ParticipantsBreakdown counts={b.counts} />
              </td>
              <td className="px-4 py-3 text-zinc-600">{b.className}{(b.firstClassLocas?.length ? ` · ${b.firstClassLocas.join(', ')}` : b.firstClassLoca ? ` · ${b.firstClassLoca}` : '')}</td>
              <td className="px-4 py-3">
                <SourceBadge source={b.source} manualSource={b.manualSource} />
              </td>
              <td className="px-4 py-3 font-medium text-zinc-900">
                {b.totalPrice > 0 ? `${b.totalPrice.toLocaleString('tr-TR')} ${b.currency}` : 'Fiyat belirtilmedi'}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[b.status]}`}>
                    {STATUS_LABELS[b.status]}
                  </span>
                  <select
                    value={b.status}
                    onChange={(e) => onStatusChange(b.id, e.target.value as BookingStatus)}
                    disabled={updatingId === b.id}
                    className="min-w-[100px] rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 disabled:opacity-60"
                  >
                    <option value="pending">Beklemede</option>
                    <option value="paid">Ödendi</option>
                    <option value="confirmed">Onaylandı</option>
                    <option value="failed">Ödeme başarısız</option>
                    <option value="cancelled">İptal</option>
                  </select>
                  {updatingId === b.id && (
                    <span className="text-xs text-zinc-400">Kaydediliyor…</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-500 text-xs">
                {b.createdAt ? new Date(b.createdAt).toLocaleString('tr-TR') : '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onDetail(b)}
                    className="rounded bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200"
                  >
                    Detay
                  </button>
                  <a
                    href={getVoucherPdfUrl(b.id, b.accessToken)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                  >
                    PDF
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(b)}
                    className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                  >
                    {copiedId === b.id ? 'Kopyalandı' : 'Link'}
                  </button>
                  {b.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => onStatusChange(b.id, 'cancelled')}
                      disabled={updatingId === b.id}
                      className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      İptal
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  )
}
