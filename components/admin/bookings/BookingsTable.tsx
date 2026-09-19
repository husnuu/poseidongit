'use client'

import { useState, useMemo } from 'react'
import type { AdminBookingRow, BookingStatus } from '@/types/adminBookings'
import { MANUAL_SOURCE_LABELS } from '@/types/adminBookings'

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Beklemede',
  paid: 'Ödendi',
  failed: 'Ödeme başarısız',
  cancelled: 'İptal',
}

const STATUS_BADGE_CLASS: Record<BookingStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-rose-50 text-rose-700',
  cancelled: 'bg-red-50 text-red-700',
}

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE_CLASS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function SourceBadge({ source, manualSource }: { source?: string; manualSource?: string | null }) {
  const isManual = source === 'manual'
  const label = isManual
    ? (MANUAL_SOURCE_LABELS[manualSource ?? ''] ?? manualSource ?? 'Manuel')
    : (MANUAL_SOURCE_LABELS.web ?? 'Web')
  const bg = isManual ? 'bg-orange-50 text-[#fc6c4f]' : 'bg-zinc-100 text-zinc-600'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${bg}`}>
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
      <span className="font-bold text-[#131719]">{total} kişi</span>
      {parts.length > 0 && (
        <div className="mt-0.5 text-xs text-zinc-400">
          {parts.join(' · ')}
        </div>
      )}
    </div>
  )
}

const STATUS_SELECT_CLASS =
  'rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-[#131719] focus:border-[#2168b8] focus:outline-none disabled:opacity-60'

function ThumbImage({ url }: { url?: string | null }) {
  return (
    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" width={56} height={56} />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-zinc-300">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
          </svg>
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
    <th className={`sticky top-0 z-10 bg-zinc-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-500 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(keyName)}
        className="hover:text-[#2168b8] focus:outline-none"
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
      <div className="space-y-3 rounded-2xl border border-[#f1f5f9] bg-white p-3 shadow-[0_2px_8px_rgba(19,23,25,0.06)] md:hidden">
        {sorted.map((b) => (
          <div
            key={b.id}
            className="rounded-xl border border-[#f1f5f9] bg-zinc-50/50 p-3"
          >
            <div className="flex gap-3">
              <ThumbImage url={b.tourCoverImageUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-[#131719]">{b.tourTitle}</p>
                <p className="text-xs text-zinc-500">{b.date}{b.className ? ` · Sınıf: ${b.className}${(b.firstClassLocas?.length ? ` (${b.firstClassLocas.join(', ')})` : b.firstClassLoca ? ` (${b.firstClassLoca})` : '')}` : ''}</p>
                <p className="mt-0.5 text-sm text-zinc-700">
                  {b.customer.firstName} {b.customer.lastName}
                  {b.customer.phone ? ` · ${b.customer.phone}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={b.status} />
                  <span className="text-xs font-semibold text-zinc-500">
                    {b.totalPrice > 0 ? `${b.totalPrice.toLocaleString('tr-TR')} ${b.currency}` : ''}
                  </span>
                  {(b.selectedExtras?.length ?? 0) > 0 && (
                    <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2168b8]">
                      +{b.selectedExtras!.length} ekstra
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => onDetail(b)}
                    className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-[#2168b8] hover:bg-blue-100"
                  >
                    Detay
                  </button>
                  <a
                    href={getVoucherPdfUrl(b.id, b.accessToken)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-200"
                  >
                    PDF
                  </a>
                  <select
                    value={b.status}
                    onChange={(e) => onStatusChange(b.id, e.target.value as BookingStatus)}
                    disabled={updatingId === b.id}
                    className={STATUS_SELECT_CLASS}
                  >
                    <option value="pending">Beklemede</option>
                    <option value="paid">Ödendi</option>
                    <option value="failed">Ödeme başarısız</option>
                    <option value="cancelled">İptal</option>
                  </select>
                  {b.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => onStatusChange(b.id, 'cancelled')}
                      disabled={updatingId === b.id}
                      className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      İptal
                    </button>
                  )}
                </div>
                {(b.nestpayAuthCode || b.nestpayHostRefNum || b.nestpayTransId || b.paidAt) && (
                  <p className="mt-1 truncate font-mono text-[11px] text-zinc-400" title={`${b.nestpayTransId ?? ''}`}>
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
      <div className="hidden overflow-x-auto rounded-2xl border border-[#f1f5f9] bg-white shadow-[0_2px_8px_rgba(19,23,25,0.06)] md:block">
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#f1f5f9]">
            <th className="sticky top-0 z-10 w-[56px] bg-zinc-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Görsel
            </th>
            <Th label="Tur" keyName="tourTitle" />
            <Th label="Tarih" keyName="date" />
            <th className="sticky top-0 z-10 bg-zinc-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Müşteri
            </th>
            <th className="sticky top-0 z-10 bg-zinc-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Telefon
            </th>
            <th className="sticky top-0 z-10 bg-zinc-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Katılımcılar
            </th>
            <th className="sticky top-0 z-10 bg-zinc-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Sınıf
            </th>
            <th className="sticky top-0 z-10 bg-zinc-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Kaynak
            </th>
            <Th label="Toplam" keyName="totalPrice" />
            <th className="sticky top-0 z-10 bg-zinc-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Durum
            </th>
            <Th label="Oluşturulma" keyName="createdAt" />
            <th className="sticky top-0 z-10 w-[150px] bg-zinc-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((b) => (
            <tr
              key={b.id}
              className="border-b border-[#f1f5f9] transition-colors hover:bg-zinc-50/80"
            >
              <td className="px-4 py-3">
                <ThumbImage url={b.tourCoverImageUrl} />
              </td>
              <td className="px-4 py-3">
                <span className="font-bold text-[#131719]">{b.tourTitle}</span>
              </td>
              <td className="px-4 py-3 text-zinc-600">{b.date}</td>
              <td className="px-4 py-3 font-semibold text-[#131719]">
                {b.customer.firstName} {b.customer.lastName}
              </td>
              <td className="px-4 py-3 text-zinc-500">{b.customer.phone || '—'}</td>
              <td className="px-4 py-3">
                <ParticipantsBreakdown counts={b.counts} />
              </td>
              <td className="px-4 py-3 text-zinc-600">
                {b.className}{(b.firstClassLocas?.length ? ` · ${b.firstClassLocas.join(', ')}` : b.firstClassLoca ? ` · ${b.firstClassLoca}` : '')}
                {(b.selectedExtras?.length ?? 0) > 0 && (
                  <span className="ml-1.5 inline-flex rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-[#2168b8]">
                    +{b.selectedExtras!.length}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <SourceBadge source={b.source} manualSource={b.manualSource} />
              </td>
              <td className="px-4 py-3 font-bold text-[#131719]">
                {b.totalPrice > 0 ? `${b.totalPrice.toLocaleString('tr-TR')} ${b.currency}` : 'Fiyat belirtilmedi'}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={b.status} />
                  <select
                    value={b.status}
                    onChange={(e) => onStatusChange(b.id, e.target.value as BookingStatus)}
                    disabled={updatingId === b.id}
                    className={`min-w-[100px] ${STATUS_SELECT_CLASS}`}
                  >
                    <option value="pending">Beklemede</option>
                    <option value="paid">Ödendi</option>
                    <option value="failed">Ödeme başarısız</option>
                    <option value="cancelled">İptal</option>
                  </select>
                  {updatingId === b.id && (
                    <span className="text-xs text-zinc-400">Kaydediliyor…</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-zinc-400">
                {b.createdAt ? new Date(b.createdAt).toLocaleString('tr-TR') : '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onDetail(b)}
                    className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-[#2168b8] hover:bg-blue-100"
                  >
                    Detay
                  </button>
                  <a
                    href={getVoucherPdfUrl(b.id, b.accessToken)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-600 hover:bg-zinc-200"
                  >
                    PDF
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(b)}
                    className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-600 hover:bg-zinc-200"
                  >
                    {copiedId === b.id ? 'Kopyalandı' : 'Link'}
                  </button>
                  {b.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => onStatusChange(b.id, 'cancelled')}
                      disabled={updatingId === b.id}
                      className="rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
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
