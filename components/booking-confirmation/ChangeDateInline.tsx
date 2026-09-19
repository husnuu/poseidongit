'use client'

import { useEffect, useMemo, useState } from 'react'
import FirstClassSeatSelector from '@/components/booking/FirstClassSeatSelector'
import type { CalendarDayAvailability } from '@/app/api/availability/calendar/route'
import styles from '@/components/booking/booking.module.css'
import { getEarliestBookableDateStr } from '@/lib/booking/bookingWindow'
import { getBookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import type { SiteLocale } from '@/lib/i18n/config'

interface ChangeDateInlineProps {
  bookingId: string
  email: string
  tourId: string
  classId: string
  className: string
  currentDate: string
  currentFirstClassLocas: string[]
  totalPax: number
  refundStatus: string | null
  locale: SiteLocale
  onSuccess: (newDate: string, newFirstClassLocas?: string[]) => void
  onCancel: () => void
}

export default function ChangeDateInline({
  bookingId,
  email,
  tourId,
  classId,
  className,
  currentDate,
  currentFirstClassLocas,
  totalPax,
  refundStatus,
  locale,
  onSuccess,
  onCancel,
}: ChangeDateInlineProps) {
  const locaUi = getBookingWizardUi(locale).firstClassLoca
  const minBookableStr = useMemo(() => getEarliestBookableDateStr(), [])
  const isFirstClass = classId.toLowerCase().includes('first') || className.toLowerCase().includes('first')
  const requiredLocas = isFirstClass ? Math.ceil(totalPax / 2) : 0
  const blocked = !!refundStatus && refundStatus !== 'request_rejected' && refundStatus !== 'refund_failed'

  const [newDate, setNewDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(blocked ? 'İade talebiniz veya iade süreciniz devam ettiği için tarih değiştirilemez.' : null)
  const [calendarMonth, setCalendarMonth] = useState(() => currentDate.slice(0, 7) || new Date().toISOString().slice(0, 7))
  const [calendarDays, setCalendarDays] = useState<CalendarDayAvailability[]>([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [selectedNewDate, setSelectedNewDate] = useState<string | null>(null)
  const [selectedLocas, setSelectedLocas] = useState<string[]>([])

  useEffect(() => {
    if (!isFirstClass || !tourId || !calendarMonth) {
      setCalendarDays([])
      return
    }
    setCalendarLoading(true)
    fetch(
      `/api/availability/calendar?tourId=${encodeURIComponent(tourId)}&month=${encodeURIComponent(calendarMonth)}&excludeBookingId=${encodeURIComponent(bookingId)}`
    )
      .then((r) => r.json())
      .then((data) => setCalendarDays(Array.isArray(data.days) ? data.days : []))
      .catch(() => setCalendarDays([]))
      .finally(() => setCalendarLoading(false))
  }, [isFirstClass, tourId, calendarMonth, bookingId])

  useEffect(() => {
    if (!isFirstClass || !selectedNewDate) return
    if (selectedNewDate === currentDate.slice(0, 10)) {
      setSelectedLocas(currentFirstClassLocas.map((x) => x.trim().toUpperCase()))
    } else {
      setSelectedLocas([])
    }
  }, [selectedNewDate, isFirstClass, currentDate, currentFirstClassLocas])

  const handleSubmit = async () => {
    const dateToUse = isFirstClass && selectedNewDate ? selectedNewDate : newDate.trim().slice(0, 10)
    if (!dateToUse || !/^\d{4}-\d{2}-\d{2}$/.test(dateToUse)) {
      setError('Geçerli bir tarih seçin.')
      return
    }
    if (isFirstClass && requiredLocas > 0 && selectedLocas.length !== requiredLocas) {
      setError(`First Class için ${requiredLocas} loca seçin (${totalPax} kişi).`)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const body: { bookingId: string; email: string; newDate: string; firstClassLocas?: string[] } = {
        bookingId,
        email,
        newDate: dateToUse,
      }
      if (isFirstClass && requiredLocas > 0) {
        body.firstClassLocas = selectedLocas.map((id) => id.trim().toUpperCase())
      }
      const res = await fetch('/api/booking/change-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Tarih güncellenemedi.')
        return
      }
      const newLocas = Array.isArray(data.firstClassLocas)
        ? (data.firstClassLocas as string[]).map((x) => x.trim().toUpperCase())
        : isFirstClass && requiredLocas > 0
          ? selectedLocas.map((id) => id.trim().toUpperCase())
          : undefined
      onSuccess(dateToUse, newLocas)
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-[#f1f5f9] bg-white p-5 shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
      <div className="flex items-center justify-between">
        <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500">Tarihi Değiştir</p>
        <button type="button" onClick={onCancel} className="text-xs font-bold text-zinc-400 hover:text-zinc-600">
          Vazgeç
        </button>
      </div>

      {isFirstClass ? (
        <>
          <p className="mb-3 mt-3 text-xs text-zinc-500">
            Aynı gün sadece loca değiştirmek için tur tarihinizi tekrar seçin. Takvimde <strong>müsait loca sayısı</strong> gösterilir.
          </p>
          <div className={styles.card}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const [y, m] = calendarMonth.split('-').map(Number)
                  const d = new Date(y, m - 2, 1)
                  setCalendarMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
                }}
                disabled={blocked}
                className="min-h-[36px] min-w-[36px] rounded-lg border border-zinc-200 bg-white text-[#131719] hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ‹
              </button>
              <span className="text-sm font-bold text-[#131719]">
                {new Date(calendarMonth + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
              </span>
              <button
                type="button"
                onClick={() => {
                  const [y, m] = calendarMonth.split('-').map(Number)
                  const d = new Date(y, m, 1)
                  setCalendarMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
                }}
                disabled={blocked}
                className="min-h-[36px] min-w-[36px] rounded-lg border border-zinc-200 bg-white text-[#131719] hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ›
              </button>
            </div>
            {calendarLoading ? (
              <div className="py-8 text-center text-sm text-zinc-500">Yükleniyor…</div>
            ) : (
              <div className={styles.calendarWrap}>
                <div className={styles.calendarGrid}>
                  {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((w) => (
                    <div key={w} className={styles.weekday}>{w}</div>
                  ))}
                  {(() => {
                    const [y, m] = calendarMonth.split('-').map(Number)
                    const firstDay = new Date(y, m - 1, 1)
                    const lastDay = new Date(y, m, 0)
                    const gridStart = (firstDay.getDay() + 6) % 7
                    const dayMap = Object.fromEntries(calendarDays.map((d) => [d.date, d]))
                    const pads = Array.from({ length: gridStart }, (_, i) => <div key={`pad-${i}`} />)
                    const dayCells = []
                    for (let day = 1; day <= lastDay.getDate(); day++) {
                      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                      const info = dayMap[dateStr]
                      const isPast = dateStr < minBookableStr
                      const locasFree =
                        info && typeof info.firstRemainingLocas === 'number'
                          ? info.firstRemainingLocas
                          : info
                            ? Math.min(10, Math.max(0, Math.ceil((info.firstRemaining ?? 0) / 2)))
                            : 0
                      const isOwnTourDate = dateStr === currentDate.slice(0, 10)
                      const locaSlotsOk = isOwnTourDate || (requiredLocas > 0 ? locasFree >= requiredLocas : locasFree > 0)
                      const hasCapacity = info && info.firstRemaining > 0 && locaSlotsOk
                      const available = !isPast && hasCapacity
                      const selected = selectedNewDate === dateStr
                      dayCells.push(
                        <button
                          key={dateStr}
                          type="button"
                          className={`${styles.dayCell} ${selected ? styles.dayCellSelected : ''} ${!available || blocked ? styles.dayCellDisabled : ''}`}
                          onClick={() => available && !blocked && setSelectedNewDate(dateStr)}
                          disabled={!available || blocked}
                        >
                          <span className={styles.dayNum}>{day}</span>
                          {info && !isPast && <span className={styles.dayPrice}>{locasFree} loca</span>}
                        </button>
                      )
                    }
                    return [...pads, ...dayCells]
                  })()}
                </div>
              </div>
            )}
          </div>
          {selectedNewDate && (
            <div className={`mt-4 ${blocked ? 'pointer-events-none opacity-55' : ''}`}>
              <p className="mb-2 text-sm font-bold text-[#131719]">
                {selectedNewDate} için loca seçin ({requiredLocas} loca gerekli)
              </p>
              <FirstClassSeatSelector
                selectedLocaIds={selectedLocas}
                reservedLocaIds={calendarDays.find((d) => d.date === selectedNewDate)?.firstClassLocasReserved ?? []}
                currentBookingLocaIds={
                  selectedNewDate === currentDate.slice(0, 10)
                    ? currentFirstClassLocas.map((x) => x.trim().toUpperCase())
                    : []
                }
                requiredCount={requiredLocas}
                onToggle={(id) =>
                  setSelectedLocas((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < requiredLocas ? [...prev, id] : prev
                  )
                }
                onReplace={(removeId, addId) =>
                  setSelectedLocas((prev) => prev.filter((x) => x !== removeId).concat(addId))
                }
                locaUi={locaUi}
              />
            </div>
          )}
        </>
      ) : (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-[140px] flex-1">
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Yeni tarih</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={minBookableStr}
              disabled={blocked}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:border-[#2168b8] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={blocked || loading || (isFirstClass ? !selectedNewDate : !newDate.trim())}
        className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: 'var(--primary, #2168b8)' }}
      >
        {loading ? 'Güncelleniyor…' : 'Tarihi Güncelle'}
      </button>
    </div>
  )
}
