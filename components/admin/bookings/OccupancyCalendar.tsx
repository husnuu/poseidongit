'use client'

import { useMemo } from 'react'
import type { DayOccupancyData } from '@/types/adminBookings'
import type { TourOption } from '@/types/adminBookings'

function percentColor(percent: number): string {
  if (percent >= 100) return 'bg-red-500 text-white'
  if (percent >= 70) return 'bg-orange-600 text-white'
  if (percent >= 40) return 'bg-amber-500 text-white'
  return 'bg-emerald-500 text-white'
}

interface OccupancyCalendarProps {
  days: DayOccupancyData[]
  month: string
  tourId: string
  classFilter: string
  tours: TourOption[]
  loading: boolean
  occupancyError?: string | null
  onTourIdChange: (v: string) => void
  onClassFilterChange: (v: string) => void
  onMonthChange: (v: string) => void
  onDayClick: (day: DayOccupancyData) => void
}

const CLASS_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'eco', label: 'Eco' },
  { value: 'premium', label: 'Premium' },
  { value: 'first', label: 'First' },
]

const CLASS_LABELS_SHORT: Record<string, string> = {
  eco: 'Eco',
  premium: 'Prem',
  first: 'First',
}

export default function OccupancyCalendar({
  days,
  month,
  tourId,
  classFilter,
  tours,
  loading,
  occupancyError = null,
  onTourIdChange,
  onClassFilterChange,
  onMonthChange,
  onDayClick,
}: OccupancyCalendarProps) {
  const [year, monthNum] = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    return [y, m]
  }, [month])

  const firstWeekday = useMemo(() => {
    return new Date(year, monthNum - 1, 1).getDay()
  }, [year, monthNum])

  const dayLabels = useMemo(() => {
    const d = new Date(year, monthNum - 1, 1)
    const last = new Date(year, monthNum, 0)
    const labels: { date: string; dayNum: number }[] = []
    const pad = firstWeekday === 0 ? 6 : firstWeekday - 1
    for (let i = 0; i < pad; i++) labels.push({ date: '', dayNum: 0 })
    for (let i = 1; i <= last.getDate(); i++) {
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      labels.push({ date: dateStr, dayNum: i })
    }
    return labels
  }, [year, monthNum, firstWeekday])

  const dayMap = useMemo(() => {
    const m: Record<string, DayOccupancyData> = {}
    days.forEach((d) => {
      m[d.date] = d
    })
    return m
  }, [days])

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const monthOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = []
    const now = new Date()
    for (let i = -3; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
      opts.push({ value: v, label })
    }
    return opts
  }, [])

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4">
      <h2 className="mb-3 text-base font-semibold text-zinc-900 sm:mb-4 sm:text-lg">Kapasite ve Doluluk Takvimi</h2>
      <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <label className="text-sm font-medium text-zinc-600">Tur</label>
          <select
            value={tourId}
            onChange={(e) => onTourIdChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 sm:min-w-[160px]"
          >
            <option value="">Tur seçin</option>
            {tours.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <label className="text-sm font-medium text-zinc-600">Sınıf</label>
          <select
            value={classFilter}
            onChange={(e) => onClassFilterChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 sm:min-w-[90px]"
          >
            {CLASS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <label className="text-sm font-medium text-zinc-600">Ay</label>
          <select
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 sm:min-w-[140px]"
          >
            {monthOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-zinc-500">Yükleniyor…</div>
      ) : !tourId ? (
        <div className="flex h-64 items-center justify-center rounded-lg bg-zinc-50 text-zinc-500">
          Tur seçin
        </div>
      ) : occupancyError ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <p className="text-sm font-medium">Doluluk verisi alınamadı</p>
          <p className="text-xs text-amber-700">{occupancyError}</p>
          <p className="text-xs text-zinc-500">Turun Sanity’de kapasite tanımlı olduğundan emin olun.</p>
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs text-zinc-500">
            Gösterilen: {classFilter === 'all' ? 'Tüm sınıflar (toplam)' : `${CLASS_OPTIONS.find((o) => o.value === classFilter)?.label ?? classFilter} sınıfı`}
          </p>
          <div className="grid grid-cols-7 gap-0.5 text-center sm:gap-1">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((w) => (
              <div key={w} className="py-0.5 text-[10px] font-medium text-zinc-500 sm:py-1 sm:text-xs">
                {w}
              </div>
            ))}
            {dayLabels.map(({ date, dayNum }, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="min-h-[52px] sm:min-h-[80px]" />
              }
              const data = dayMap[date]
              const isToday = date === today
              const hasCapacity = data && data.capacity > 0
              const hasBooked = data && data.booked > 0
              const hasByClass = data?.byClass && Object.keys(data.byClass).length > 0
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => data && onDayClick(data)}
                  className={`min-h-[52px] rounded border p-1 text-left transition hover:ring-2 hover:ring-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:min-h-[80px] sm:rounded-lg sm:p-1.5 ${
                    data ? 'cursor-pointer border-zinc-200 bg-zinc-50/50' : 'cursor-default border-transparent'
                  } ${isToday ? 'ring-2 ring-indigo-400' : ''}`}
                >
                  {data ? (
                    <>
                      <div className="text-xs font-medium text-zinc-700">
                        {dayNum} {new Date(date + 'T12:00:00').toLocaleDateString('tr-TR', { month: 'short' })}
                      </div>
                      {hasCapacity ? (
                        <>
                          <div className="mt-0.5 text-xs text-zinc-600">
                            Dolu: {data.booked} · Kalan: {data.remaining}
                          </div>
                          <div className={`mt-0.5 rounded px-1 py-0.5 text-xs font-medium ${percentColor(data.percent)}`}>
                            %{data.percent}
                            {data.percent >= 100 ? ' DOLU' : ''}
                          </div>
                          {hasByClass && classFilter === 'all' && (
                            <div className="mt-1 space-y-0.5 border-t border-zinc-200/80 pt-0.5 text-[10px] text-zinc-600">
                              {Object.entries(data.byClass!).map(([k, v]) => (
                                <div key={k} className="truncate">
                                  {CLASS_LABELS_SHORT[k] ?? k}: {v.booked}/{v.capacity || '—'}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : hasBooked ? (
                        <>
                          <div className="mt-0.5 text-xs text-zinc-600">
                            Dolu: {data.booked} kişi
                          </div>
                          {hasByClass && (
                            <div className="mt-0.5 space-y-0.5 text-[10px] text-zinc-500">
                              {Object.entries(data.byClass!).map(([k, v]) =>
                                v.booked > 0 ? (
                                  <div key={k}>{CLASS_LABELS_SHORT[k] ?? k}: {v.booked}</div>
                                ) : null
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="mt-0.5 text-xs text-zinc-500">
                          {hasByClass && classFilter === 'all' ? (
                            <div className="space-y-0.5 text-[10px]">
                              {Object.entries(data.byClass!).map(([k, v]) => (
                                <div key={k} className="truncate">
                                  {CLASS_LABELS_SHORT[k] ?? k}: 0/{v.capacity || '—'}
                                </div>
                              ))}
                            </div>
                          ) : (
                            '0 kişi'
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-zinc-400 text-xs">{dayNum}</span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
