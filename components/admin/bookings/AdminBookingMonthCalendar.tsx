'use client'

import { useMemo, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface AdminBookingMonthCalendarProps {
  /** YYYY-MM-DD */
  value: string
  onChange: (date: string) => void
  /** Varsayılan: bugün (YYYY-MM-DD); bu tarihten önceki günler seçilemez. */
  minDate?: string
  disabled?: boolean
  /** Biletçi tam sayfa: daha büyük dokunma alanı ve başlık */
  variant?: 'default' | 'biletci'
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

export default function AdminBookingMonthCalendar({
  value,
  onChange,
  minDate,
  disabled = false,
  variant = 'default',
}: AdminBookingMonthCalendarProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const floor = (minDate && /^\d{4}-\d{2}-\d{2}$/.test(minDate) ? minDate : today).slice(0, 10)

  const [viewMonth, setViewMonth] = useState(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value.slice(0, 7)
    return monthKey(new Date())
  })

  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const ym = value.slice(0, 7)
      setViewMonth((prev) => (prev !== ym ? ym : prev))
    }
  }, [value])

  const [y, m] = viewMonth.split('-').map(Number)
  const year = y || new Date().getFullYear()
  const monthNum = m || new Date().getMonth() + 1

  const { labels, monthTitle } = useMemo(() => {
    const first = new Date(year, monthNum - 1, 1)
    const last = new Date(year, monthNum, 0)
    const gridStart = (first.getDay() + 6) % 7
    const pads = Array.from({ length: gridStart }, (_, i) => ({ key: `pad-${i}`, date: '' as const }))
    const cells: { key: string; date: string }[] = [...pads]
    for (let day = 1; day <= last.getDate(); day++) {
      const dateStr = `${year}-${pad2(monthNum)}-${pad2(day)}`
      cells.push({ key: dateStr, date: dateStr })
    }
    const title = first.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    return { labels: cells, monthTitle: title }
  }, [year, monthNum])

  const isBiletci = variant === 'biletci'
  const cellBase = isBiletci
    ? 'relative flex w-full flex-col items-center justify-center rounded-lg border text-center font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fc6c4f] focus-visible:ring-offset-2 disabled:cursor-not-allowed'
    : 'relative flex w-full flex-col items-center justify-center rounded-lg border text-center font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed'
  const cellSize = isBiletci
    ? 'min-h-[44px] sm:min-h-[48px] py-1.5 text-sm sm:text-base'
    : 'min-h-[40px] py-1 text-sm'

  const shiftMonth = (delta: number) => {
    const d = new Date(year, monthNum - 1 + delta, 1)
    setViewMonth(monthKey(d))
  }

  const lastDayPrev = new Date(year, monthNum - 1, 0)
  const lastDayPrevStr = `${lastDayPrev.getFullYear()}-${pad2(lastDayPrev.getMonth() + 1)}-${pad2(lastDayPrev.getDate())}`
  const prevDisabled = disabled || lastDayPrevStr < floor

  return (
    <div
      className={
        isBiletci
          ? 'overflow-hidden rounded-xl border border-zinc-100 bg-white p-3 shadow-sm sm:p-4'
          : 'rounded-xl border border-[#f1f5f9] bg-white p-3 shadow-[0_2px_8px_rgba(19,23,25,0.06)] sm:p-4'
      }
    >
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={prevDisabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-[#fc6c4f]/40 hover:bg-[#fff0ed] disabled:pointer-events-none disabled:opacity-40"
          aria-label="Önceki ay"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className={`truncate text-sm font-black sm:text-base ${isBiletci ? 'text-slate-900' : 'text-[#131719]'}`}>{monthTitle}</p>
          {isBiletci && (
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">Tarih seçin</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          disabled={disabled}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition ${
            isBiletci
              ? 'hover:border-[#fc6c4f]/40 hover:bg-[#fff0ed] disabled:opacity-40'
              : 'hover:border-blue-200 hover:bg-blue-50/50 hover:text-primary disabled:opacity-40'
          } disabled:pointer-events-none`}
          aria-label="Sonraki ay"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((w) => (
          <div
            key={w}
            className={`py-1 text-center text-[10px] font-bold uppercase tracking-wide sm:text-xs ${isBiletci ? 'text-slate-500' : 'text-zinc-400'}`}
          >
            {w}
          </div>
        ))}
        {labels.map(({ key, date }) => {
          if (!date) {
            return <div key={key} className={isBiletci ? 'min-h-[44px] sm:min-h-[48px]' : 'min-h-[40px]'} />
          }
          const dayNum = parseInt(date.slice(8, 10), 10)
          const isPast = date < floor
          const isSelected = value === date
          const isToday = date === today

          return (
            <button
              key={key}
              type="button"
              disabled={disabled || isPast}
              onClick={() => onChange(date)}
              className={`${cellBase} ${cellSize} ${
                isSelected
                  ? isBiletci
                    ? 'border-[#fc6c4f] bg-[#fc6c4f] text-white shadow-md shadow-[#fc6c4f]/25'
                    : 'border-primary bg-primary text-white shadow-md shadow-primary/25'
                  : isPast
                    ? isBiletci
                      ? 'border-transparent bg-zinc-50 text-zinc-300'
                      : 'border-transparent bg-zinc-50/50 text-zinc-300'
                    : isBiletci
                      ? 'border-zinc-100 bg-white text-zinc-800 hover:border-[#fc6c4f]/30 hover:bg-[#fff0ed]'
                      : 'border-[#f1f5f9] bg-white text-[#131719] hover:border-blue-200 hover:bg-blue-50/60'
              } ${
                isToday && !isSelected
                  ? isBiletci
                    ? 'ring-2 ring-[#fc6c4f] ring-offset-1'
                    : 'ring-2 ring-primary ring-offset-1'
                  : ''
              }`}
            >
              <span className="tabular-nums">{dayNum}</span>
              {isToday && !isSelected && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${isBiletci ? 'bg-[#fc6c4f]' : 'bg-primary'}`}
                  aria-hidden
                />
              )}
            </button>
          )
        })}
      </div>

      {value && (
        <p className={`mt-3 text-center text-xs font-semibold sm:text-sm ${isBiletci ? 'text-slate-600' : 'text-zinc-500'}`}>
          Seçili:{' '}
          <time dateTime={value} className={isBiletci ? 'text-slate-900' : 'font-bold text-[#131719]'}>
            {new Date(value + 'T12:00:00').toLocaleDateString('tr-TR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </time>
        </p>
      )}
    </div>
  )
}
