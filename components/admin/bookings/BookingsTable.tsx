'use client'

import { useState, useMemo } from 'react'
import { ImageOff } from 'lucide-react'
import type { AdminBookingRow, BookingStatus } from '@/types/adminBookings'
import { MANUAL_SOURCE_LABELS } from '@/types/adminBookings'
import StatusDropdown from './StatusDropdown'
import BookingRowActions from './BookingRowActions'

/** "Çeşme " ön ekini (idari ekranda zaten hepsi Çeşme, tekrar bilgi taşımıyor)
    ve " – Pazarlama Alt Başlığı" kuyruğunu atarak kısa, tek satırlık bir
    tur adı üretir — tam başlık yine de `title` tooltip'inde kayboluyor. */
function shortTourTitle(title: string): string {
  let t = (title || '').trim()
  t = t.replace(/^Çeşme\s+/i, '')
  t = t.split(/\s+[–-]\s+/)[0]
  return t.trim() || title
}

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' })

/** "2026-10-09" → "09 Eki" — rezervasyon satırında tarih sütunu yerine
    tur adının hemen altında, sınıfla birlikte tek satırda gösteriliyor. */
function shortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return SHORT_DATE_FORMATTER.format(d)
}

/** refundStatus gerçek, ayrı bir alan (status enum'ında yok) — iptal/ödendi
    durumundan bağımsız olarak "İade edildi" gibi ikinci bir bilgi taşıyor,
    bu yüzden ayrı, gri/mor bir rozet olarak gösteriliyor. */
function RefundBadge({ refundStatus }: { refundStatus?: string | null }) {
  if (!refundStatus) return null
  const map: Record<string, { label: string; cls: string }> = {
    refunded: { label: 'İade edildi', cls: 'bg-violet-50 text-violet-700' },
    partial_refunded: { label: 'Kısmi iade', cls: 'bg-violet-50 text-violet-700' },
    refund_failed: { label: 'İade başarısız', cls: 'bg-zinc-100 text-zinc-500' },
  }
  const entry = map[refundStatus]
  if (!entry) return null
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${entry.cls}`}>
      {entry.label}
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

function ThumbImage({ url, size = 56 }: { url?: string | null; size?: number }) {
  return (
    <div className="shrink-0 overflow-hidden rounded-md bg-zinc-100" style={{ width: size, height: size }}>
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" width={size} height={size} />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-zinc-300">
          <ImageOff className="h-5 w-5" aria-hidden />
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
        className="hover:text-primary focus:outline-none"
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
      <div className="space-y-3 rounded-xl border border-[#f1f5f9] bg-white p-3 shadow-[0_2px_8px_rgba(19,23,25,0.06)] md:hidden">
        {sorted.map((b) => (
          <div
            key={b.id}
            className="rounded-lg border border-[#f1f5f9] bg-zinc-50/50 p-3"
          >
            <div className="flex gap-3">
              <ThumbImage url={b.tourCoverImageUrl} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-[#131719]" title={b.tourTitle}>
                  {shortTourTitle(b.tourTitle)}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {shortDate(b.date)}
                  {b.className ? ` · ${b.className}${b.firstClassLocas?.length ? ` (${b.firstClassLocas.join(', ')})` : b.firstClassLoca ? ` (${b.firstClassLoca})` : ''}` : ''}
                </p>
                <p className="mt-0.5 text-sm text-zinc-700">
                  {b.customer.firstName} {b.customer.lastName}
                  {b.customer.phone ? ` · ${b.customer.phone}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusDropdown
                    status={b.status}
                    onChange={(s) => onStatusChange(b.id, s)}
                    disabled={updatingId === b.id}
                  />
                  <RefundBadge refundStatus={b.refundStatus} />
                  <span className="text-xs font-semibold text-zinc-500">
                    {b.totalPrice > 0 ? `${b.totalPrice.toLocaleString('tr-TR')} ${b.currency}` : ''}
                  </span>
                  {(b.selectedExtras?.length ?? 0) > 0 && (
                    <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      +{b.selectedExtras!.length} ekstra
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <BookingRowActions
                    onDetail={() => onDetail(b)}
                    pdfHref={getVoucherPdfUrl(b.id, b.accessToken)}
                    onCopyLink={() => handleCopy(b)}
                    copied={copiedId === b.id}
                    showCancel={b.status !== 'cancelled'}
                    cancelDisabled={updatingId === b.id}
                    onCancel={() => onStatusChange(b.id, 'cancelled')}
                  />
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
      <div className="hidden overflow-x-auto rounded-xl border border-[#f1f5f9] bg-white shadow-[0_2px_8px_rgba(19,23,25,0.06)] md:block">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#f1f5f9]">
            <th className="sticky top-0 z-10 w-[44px] bg-zinc-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Görsel
            </th>
            <Th label="Tur / Tarih / Sınıf" keyName="tourTitle" className="max-w-[220px]" />
            <th className="sticky top-0 z-10 bg-zinc-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Müşteri
            </th>
            <th className="sticky top-0 z-10 bg-zinc-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Katılımcılar
            </th>
            <th className="sticky top-0 z-10 bg-zinc-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Kaynak
            </th>
            <Th label="Toplam" keyName="totalPrice" />
            <th className="sticky top-0 z-10 bg-zinc-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Durum
            </th>
            <Th label="Oluşturulma" keyName="createdAt" />
            <th className="sticky top-0 z-10 w-[120px] bg-zinc-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
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
              <td className="px-4 py-2.5">
                <ThumbImage url={b.tourCoverImageUrl} size={44} />
              </td>
              <td className="max-w-[220px] px-4 py-2.5">
                <p className="truncate font-bold text-[#131719]" title={b.tourTitle}>
                  {shortTourTitle(b.tourTitle)}
                </p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  {shortDate(b.date)}
                  {b.className ? ` · ${b.className}` : ''}
                  {b.firstClassLocas?.length ? ` (${b.firstClassLocas.join(', ')})` : b.firstClassLoca ? ` (${b.firstClassLoca})` : ''}
                  {(b.selectedExtras?.length ?? 0) > 0 ? ` · +${b.selectedExtras!.length} ekstra` : ''}
                </p>
              </td>
              <td className="px-4 py-2.5">
                <p className="font-semibold text-[#131719]">
                  {b.customer.firstName} {b.customer.lastName}
                </p>
                <p className="text-xs text-zinc-500">{b.customer.phone || '—'}</p>
              </td>
              <td className="px-4 py-2.5">
                <ParticipantsBreakdown counts={b.counts} />
              </td>
              <td className="px-4 py-2.5">
                <SourceBadge source={b.source} manualSource={b.manualSource} />
              </td>
              <td className="px-4 py-2.5 font-bold text-[#131719]">
                {b.totalPrice > 0 ? `${b.totalPrice.toLocaleString('tr-TR')} ${b.currency}` : 'Fiyat belirtilmedi'}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <StatusDropdown
                    status={b.status}
                    onChange={(s) => onStatusChange(b.id, s)}
                    disabled={updatingId === b.id}
                  />
                  <RefundBadge refundStatus={b.refundStatus} />
                  {updatingId === b.id && (
                    <span className="text-xs text-zinc-400">Kaydediliyor…</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-2.5 text-xs text-zinc-400">
                {b.createdAt ? new Date(b.createdAt).toLocaleString('tr-TR') : '—'}
              </td>
              <td className="px-4 py-2.5">
                <BookingRowActions
                  onDetail={() => onDetail(b)}
                  pdfHref={getVoucherPdfUrl(b.id, b.accessToken)}
                  onCopyLink={() => handleCopy(b)}
                  copied={copiedId === b.id}
                  showCancel={b.status !== 'cancelled'}
                  cancelDisabled={updatingId === b.id}
                  onCancel={() => onStatusChange(b.id, 'cancelled')}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  )
}
