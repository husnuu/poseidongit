'use client'

import { useMemo, useState } from 'react'
import type { AdminBookingRow } from '@/types/adminBookings'

type Props = {
  bookings: AdminBookingRow[]
  onApprove: (booking: AdminBookingRow) => Promise<void> | void
  onReject: (booking: AdminBookingRow, reason: string) => Promise<void> | void
  onOpenDetail: (booking: AdminBookingRow) => void
  busyId?: string | null
}

function formatRefundRequestSentAt(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      timeZone: 'Europe/Istanbul',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function PendingRefundRequestsCard({
  bookings,
  onApprove,
  onReject,
  onOpenDetail,
  busyId = null,
}: Props) {
  const pending = useMemo(
    () => bookings.filter((b) => b.refundStatus === 'requested'),
    [bookings]
  )
  const [rejectFor, setRejectFor] = useState<AdminBookingRow | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  if (pending.length === 0) return null

  return (
    <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50/60 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-orange-200 bg-orange-100/70 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-900">
            Bekleyen İade Talepleri
          </h2>
          <p className="text-xs text-orange-800/80">
            Müşteri tarafından gönderilen iade talepleri. Onayda Payten ile iade tetiklenir.
          </p>
        </div>
        <span className="rounded-full bg-orange-600 px-2.5 py-0.5 text-xs font-bold text-white">
          {pending.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-white/60 text-xs uppercase tracking-wide text-orange-900/80">
            <tr>
              <th className="px-3 py-2">Tarih / Tur</th>
              <th className="px-3 py-2">Müşteri</th>
              <th className="px-3 py-2 text-right">Talep Tutarı</th>
              <th className="px-3 py-2">Talep gönderildi (tarih / saat)</th>
              <th className="px-3 py-2">Sebep</th>
              <th className="px-3 py-2 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((b) => {
              const amount =
                b.refundAmount != null && b.refundAmount > 0 ? b.refundAmount : b.totalPrice
              return (
                <tr key={b.id} className="border-t border-orange-100">
                  <td className="px-3 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(b)}
                      className="text-left text-zinc-900 hover:text-orange-700"
                    >
                      <div className="font-semibold">{b.tourTitle}</div>
                      <div className="text-xs text-zinc-500">
                        {b.date}
                        {b.time ? ` · ${b.time}` : ''}
                      </div>
                    </button>
                  </td>
                  <td className="px-3 py-3 align-top text-zinc-800">
                    <div className="font-medium">
                      {b.customer.firstName} {b.customer.lastName}
                    </div>
                    <div className="text-xs text-zinc-500">{b.customer.email}</div>
                  </td>
                  <td className="px-3 py-3 align-top text-right font-semibold text-orange-800">
                    {amount.toLocaleString('tr-TR')} {b.currency}
                  </td>
                  <td className="px-3 py-3 align-top text-sm tabular-nums text-zinc-700">
                    {formatRefundRequestSentAt(b.refundRequestedAt)}
                  </td>
                  <td className="px-3 py-3 align-top text-xs text-zinc-600">
                    {b.refundReason?.trim() ? (
                      <span title={b.refundReason}>
                        {b.refundReason.length > 80
                          ? `${b.refundReason.slice(0, 80)}…`
                          : b.refundReason}
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onApprove(b)}
                        disabled={busyId === b.id}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {busyId === b.id ? 'İşleniyor…' : 'İadeyi Onayla'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectFor(b)
                          setRejectReason('')
                        }}
                        disabled={busyId === b.id}
                        className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        Reddet
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {rejectFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-zinc-900">İade Talebini Reddet</h3>
            <p className="mb-4 text-sm text-zinc-600">
              <span className="font-semibold">{rejectFor.customer.firstName} {rejectFor.customer.lastName}</span>{' '}
              müşterisine iade ret e-postası gönderilecektir.
            </p>
            <label className="mb-1 block text-xs font-semibold text-zinc-700">
              Ret nedeni (müşteriye gösterilir)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Örn. iptal koşulları gereği iade yapılamamaktadır."
              className="mb-5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRejectFor(null)}
                className="flex-1 rounded-xl border-2 border-zinc-300 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = rejectFor
                  setRejectFor(null)
                  await onReject(target, rejectReason.trim())
                }}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Talebi Reddet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
