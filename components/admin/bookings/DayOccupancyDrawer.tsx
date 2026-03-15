'use client'

import type { DayOccupancyData } from '@/types/adminBookings'
import type { AdminBookingRow } from '@/types/adminBookings'

interface DayOccupancyDrawerProps {
  open: boolean
  onClose: () => void
  day: DayOccupancyData | null
  tourTitle: string
  bookingsForDay: AdminBookingRow[]
}

const CLASS_LABELS: Record<string, string> = {
  eco: 'Eco',
  premium: 'Premium',
  first: 'First',
}

export default function DayOccupancyDrawer({
  open,
  onClose,
  day,
  tourTitle,
  bookingsForDay,
}: DayOccupancyDrawerProps) {
  if (!open) return null

  const dateLabel = day?.date
    ? new Date(day.date + 'T12:00:00').toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-zinc-900/30 transition-opacity"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-xl"
        role="dialog"
        aria-modal
        aria-label="Gün detayı"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-3 sm:px-4">
          <h3 className="text-base font-semibold text-zinc-900 sm:text-lg">Gün Detayı</h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Kapat"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {day && (
            <>
              <p className="text-sm font-medium text-zinc-700">{tourTitle}</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">{dateLabel}</p>

              <div className="mt-4 rounded-lg bg-zinc-50 p-3">
                <p className="text-sm font-medium text-zinc-600">Özet</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <span className="text-zinc-500">Toplam kapasite</span>
                  <span className="font-medium text-zinc-900">{day.capacity}</span>
                  <span className="text-zinc-500">Satılan</span>
                  <span className="font-medium text-zinc-900">{day.booked}</span>
                  <span className="text-zinc-500">Kalan</span>
                  <span className="font-medium text-zinc-900">{day.remaining}</span>
                  <span className="text-zinc-500">Doluluk</span>
                  <span className="font-medium text-zinc-900">%{day.percent}</span>
                </div>
              </div>

              {day.byClass && Object.keys(day.byClass).length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-zinc-600">Sınıf bazında</p>
                  {Object.entries(day.byClass).map(([key, v]) => (
                    <div
                      key={key}
                      className="rounded-lg border border-zinc-200 bg-white p-3 text-sm"
                    >
                      <span className="font-medium text-zinc-900">{CLASS_LABELS[key] ?? key}</span>
                      <div className="mt-1 flex gap-4 text-zinc-600">
                        <span>Kapasite: {v.capacity}</span>
                        <span>Satılan: {v.booked}</span>
                        <span>Kalan: {v.remaining}</span>
                        {v.remaining === 0 && v.capacity > 0 && (
                          <span className="font-medium text-red-600">Tam dolu</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <p className="text-sm font-medium text-zinc-600">
                  O günkü rezervasyonlar ({bookingsForDay.length})
                </p>
                <ul className="mt-2 space-y-2">
                  {bookingsForDay.map((b) => (
                    <li
                      key={b.id}
                      className="rounded-lg border border-zinc-200 bg-white p-2 text-sm"
                    >
                      <span className="font-medium text-zinc-900">
                        {b.customer.firstName} {b.customer.lastName}
                      </span>
                      <span className="ml-2 text-zinc-500">
                        {b.counts.adult + b.counts.child + b.counts.infant} kişi · {b.className}
                      </span>
                      <span className="ml-2 text-zinc-500">
                        {b.totalPrice > 0 ? `${b.totalPrice.toLocaleString('tr-TR')} ${b.currency}` : 'Fiyat belirtilmedi'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
