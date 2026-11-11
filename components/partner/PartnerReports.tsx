'use client'

import type { ReactNode } from 'react'
import {
  COMMISSION_STATE_LABELS,
  formatMoney,
  formatPeriod,
  type CommissionState,
  type PartnerBookingView,
  type PartnerPeriodSummary,
  type PartnerSummary,
} from '@/lib/partner/commission'

const STATE_BADGES: Record<CommissionState, string> = {
  earned: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  upcoming: 'bg-blue-50 text-primary border-blue-100',
  awaiting_payment: 'bg-amber-50 text-amber-700 border-amber-200',
  on_hold: 'bg-amber-50 text-amber-700 border-amber-200',
  void: 'bg-zinc-100 text-zinc-500 border-zinc-200',
}

const CHANNEL_LABELS: Record<string, string> = { qr: 'QR', link: 'Bağlantı', reception: 'Resepsiyon', widget: 'Web sitesi widget' }

export function PartnerCard({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white">
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
          <h2 className="text-sm font-black text-[#131719]">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function PartnerStats({ totals }: { totals: PartnerSummary['totals'] }) {
  const tiles = [
    { label: 'Ödenecek komisyon', value: formatMoney(totals.due), strong: true },
    { label: 'Toplam kazanılan', value: formatMoney(totals.earned) },
    { label: 'Ödenen', value: formatMoney(totals.paid) },
    { label: 'Yaklaşan turlardan', value: formatMoney(totals.upcoming) },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-bold text-zinc-500">{t.label}</p>
          <p className={`mt-1 break-words text-xl font-black ${t.strong ? 'text-primary' : 'text-[#131719]'}`}>{t.value}</p>
        </div>
      ))}
    </div>
  )
}

export function PartnerMonths({
  months,
  renderAction,
}: {
  months: PartnerPeriodSummary[]
  renderAction?: (m: PartnerPeriodSummary) => ReactNode
}) {
  if (months.length === 0) {
    return <p className="py-4 text-sm text-zinc-500">Henüz gerçekleşmiş tur yok. Tur tarihi geçince komisyon burada görünür.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-xs font-bold text-zinc-500">
            <th className="py-2 pr-3">Ay</th>
            <th className="hidden py-2 pr-3 sm:table-cell">Rezervasyon</th>
            <th className="hidden py-2 pr-3 sm:table-cell">Misafir</th>
            <th className="hidden py-2 pr-3 sm:table-cell">Satış</th>
            <th className="py-2 pr-3">Komisyon</th>
            <th className="py-2 pr-3">Durum</th>
            {renderAction && <th className="py-2" />}
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.period} className="border-b border-zinc-50 last:border-0">
              <td className="py-2.5 pr-3 font-bold capitalize text-[#131719]">{formatPeriod(m.period)}</td>
              <td className="hidden py-2.5 pr-3 sm:table-cell">{m.bookings}</td>
              <td className="hidden py-2.5 pr-3 sm:table-cell">{m.guests}</td>
              <td className="hidden py-2.5 pr-3 sm:table-cell">{formatMoney(m.sales)}</td>
              <td className="py-2.5 pr-3 font-bold">{formatMoney(m.commission)}</td>
              <td className="py-2.5 pr-3">
                {m.due <= 0 && m.paid > 0 ? (
                  <span className="font-bold text-emerald-700">Ödendi</span>
                ) : m.paid > 0 ? (
                  <span className="font-bold text-amber-700">Fark: {formatMoney(m.due)}</span>
                ) : (
                  <span className="font-bold text-amber-700">Ödeme bekliyor</span>
                )}
              </td>
              {renderAction && <td className="py-2.5 text-right">{renderAction(m)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PartnerBookings({ bookings }: { bookings: PartnerBookingView[] }) {
  if (bookings.length === 0) {
    return <p className="py-4 text-sm text-zinc-500">Henüz rezervasyon yok. QR kodunuz veya bağlantınızdan gelen rezervasyonlar burada listelenir.</p>
  }
  return (
    <ul className="divide-y divide-zinc-100">
      {bookings.map((b) => (
        <li key={b.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5 py-3">
          <div className="min-w-0 flex-1 basis-56">
            <p className="break-words text-sm font-bold text-[#131719]">{b.tourTitle}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {b.date} · {b.guestLabel} · {b.guests} kişi
              {b.channel ? ` · ${CHANNEL_LABELS[b.channel] ?? b.channel}` : ''}
            </p>
          </div>
          <div className="sm:text-right">
            <span className={`inline-block rounded border px-2 py-0.5 text-[11px] font-bold ${STATE_BADGES[b.state]}`}>
              {COMMISSION_STATE_LABELS[b.state]}
            </span>
            <p className="mt-1 text-xs text-zinc-500">
              {formatMoney(b.saleAmount)} · %{b.rate} ={' '}
              <span className={`font-bold ${b.state === 'void' ? 'text-zinc-400 line-through' : 'text-[#131719]'}`}>
                {formatMoney(b.commission)}
              </span>
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
