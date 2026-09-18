'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import FirstClassSeatSelector from '@/components/booking/FirstClassSeatSelector'
import type { CalendarDayAvailability } from '@/app/api/availability/calendar/route'
import styles from '@/components/booking/booking.module.css'
import { ticketPagePath } from '@/lib/siteUrls'
import { withLocalePath } from '@/lib/i18n/paths'
import type { SiteLocale } from '@/lib/i18n/config'
import { getBookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import {
  computeRefundEligibility,
  refundEligibilityMessage,
  REFUND_REQUEST_MIN_HOURS,
} from '@/lib/bookings/refundEligibility'
import { getEarliestBookableDateStr } from '@/lib/booking/bookingWindow'

type Booking = {
  id: string
  status: string
  tourId?: string
  tourTitle: string
  date: string
  time?: string
  meetingPoint?: string
  mealPreference?: { key: string; label: string; counts?: Array<{ key: string; label: string; count: number }> }
  classId?: string
  className: string
  firstClassLocas?: string[]
  totalPrice: number
  currency: string
  counts: { adult: number; child: number; infant: number }
  customer: { firstName: string; lastName: string; email: string }
  additionalTravelers?: { firstName: string; lastName: string; mealPreference?: { key: string; label: string } }[]
  canCancel: boolean
  hoursUntilTour: number | null
  accessToken?: string
  paymentStatus?: string
  nestpayTransId?: string
  paidNow?: number
  refundStatus?: string | null
  refundAmount?: number | null
  refundRequestedAt?: string | null
}

function buildVoucherPdfUrl(bookingId: string, accessToken?: string): string {
  if (!bookingId) return '#'
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  if (accessToken?.trim()) {
    const params = new URLSearchParams()
    params.set('bookingId', bookingId)
    params.set('token', accessToken.trim())
    params.set('download', '1')
    return `${base}/api/voucher/access?${params.toString()}`
  }
  const params = new URLSearchParams()
  params.set('bookingId', bookingId)
  params.set('download', '1')
  return `${base}/api/voucher?${params.toString()}`
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-zinc-500">{label}</dt>
      <dd className="m-0 text-right font-semibold text-[#131719]">{value}</dd>
    </div>
  )
}

export default function ManageBookingClient({
  initialBookingId,
  locale = 'tr',
}: {
  initialBookingId: string
  locale?: SiteLocale
}) {
  const locaUi = getBookingWizardUi(locale).firstClassLoca
  const minBookableStr = useMemo(() => getEarliestBookableDateStr(), [])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<Booking | null | 'cancelled'>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [newDate, setNewDate] = useState('')
  const [changeDateLoading, setChangeDateLoading] = useState(false)
  const [changeDateError, setChangeDateError] = useState<string | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [calendarDays, setCalendarDays] = useState<CalendarDayAvailability[]>([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [selectedNewDate, setSelectedNewDate] = useState<string | null>(null)
  const [selectedFirstClassLocas, setSelectedFirstClassLocas] = useState<string[]>([])

  const isFirstClass =
    !!booking &&
    booking !== 'cancelled' &&
    (String((booking as Booking).classId ?? '').toLowerCase().includes('first') ||
      String((booking as Booking).className ?? '').toLowerCase().includes('first'))
  const bookingTourId = booking && booking !== 'cancelled' ? (booking as Booking).tourId : ''
  const bookingIdForCalendar =
    booking && booking !== 'cancelled' ? (booking as Booking).id : ''
  const bookingDateStr =
    booking && booking !== 'cancelled' ? (booking as Booking).date.slice(0, 10) : ''
  const bookingLocasSig =
    booking && booking !== 'cancelled'
      ? ((booking as Booking).firstClassLocas ?? []).join(',')
      : ''
  const totalPax =
    booking && booking !== 'cancelled'
      ? (booking as Booking).counts.adult + (booking as Booking).counts.child + (booking as Booking).counts.infant
      : 0
  const requiredLocas = isFirstClass ? Math.ceil(totalPax / 2) : 0

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!initialBookingId.trim() || !email.trim()) return
      setLoading(true)
      setError(null)
      setBooking(null)
      try {
        const res = await fetch(
          `/api/booking?bookingId=${encodeURIComponent(initialBookingId)}&email=${encodeURIComponent(email.trim())}`
        )
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(data.error || 'Rezervasyon yüklenemedi.')
          return
        }
        if (data.cancelled) {
          setBooking('cancelled')
          return
        }
        setBooking(data.booking)
      } catch {
        setError('Bağlantı hatası.')
      } finally {
        setLoading(false)
      }
    },
    [initialBookingId, email]
  )

  const refundEligibility = useMemo(() => {
    if (!booking || booking === 'cancelled') return null
    const b = booking as Booking
    return computeRefundEligibility(b.date, b.time)
  }, [booking])

  const isOnlinePaid = useMemo(() => {
    if (!booking || booking === 'cancelled') return false
    const b = booking as Booking
    return b.paymentStatus === 'paid' && !!b.nestpayTransId?.trim()
  }, [booking])

  const refundAlreadyRequested = useMemo(() => {
    if (!booking || booking === 'cancelled') return false
    const status = (booking as Booking).refundStatus
    return !!status && status !== 'request_rejected' && status !== 'refund_failed'
  }, [booking])

  const canRequestRefund =
    isOnlinePaid && !refundAlreadyRequested && refundEligibility?.eligible === true

  const handleRefundClick = useCallback(() => {
    if (!canRequestRefund) return
    setRefundReason('')
    setShowRefundModal(true)
  }, [canRequestRefund])

  const handleRefundConfirm = useCallback(async () => {
    if (!booking || booking === 'cancelled' || !canRequestRefund) return
    setShowRefundModal(false)
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/booking/refund-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: (booking as Booking).id,
          email: (booking as Booking).customer.email,
          reason: refundReason.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'İade talebi gönderilemedi.')
        return
      }
      setBooking((prev) => {
        if (!prev || prev === 'cancelled') return prev
        return {
          ...prev,
          refundStatus: 'requested',
          refundAmount: typeof data.refundAmount === 'number' ? data.refundAmount : null,
          refundRequestedAt: new Date().toISOString(),
        }
      })
      setSuccess(
        data.message ||
          'İade talebiniz yöneticilerimize iletildi, 24 saat içinde sonuçlanacaktır.'
      )
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }, [booking, canRequestRefund, refundReason])

  useEffect(() => {
    if (booking && booking !== 'cancelled' && isFirstClass && (booking as Booking).date) {
      const d = (booking as Booking).date.slice(0, 7)
      setCalendarMonth(d)
    }
  }, [booking, isFirstClass])

  useEffect(() => {
    if (!isFirstClass || !bookingTourId || !calendarMonth) {
      setCalendarDays([])
      return
    }
    const exclude =
      bookingIdForCalendar !== ''
        ? `&excludeBookingId=${encodeURIComponent(bookingIdForCalendar)}`
        : ''
    setCalendarLoading(true)
    fetch(
      `/api/availability/calendar?tourId=${encodeURIComponent(bookingTourId)}&month=${encodeURIComponent(calendarMonth)}${exclude}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.days) setCalendarDays(data.days)
        else setCalendarDays([])
      })
      .catch(() => setCalendarDays([]))
      .finally(() => setCalendarLoading(false))
  }, [isFirstClass, bookingTourId, calendarMonth, bookingIdForCalendar, bookingLocasSig])

  /** Tarih seçilince: kendi tur gününüzde mevcut localarınızı forma yükle; başka günde seçimi sıfırla. */
  useEffect(() => {
    // isFirstClass true iken booking zaten 'cancelled' değildir (bkz. isFirstClass tanımı).
    if (!isFirstClass || !booking) return
    const b = booking as Booking
    const bd = (b.date ?? '').slice(0, 10)
    if (!selectedNewDate) return
    if (selectedNewDate === bd) {
      setSelectedFirstClassLocas((b.firstClassLocas ?? []).map((x) => String(x).trim().toUpperCase()))
    } else {
      setSelectedFirstClassLocas([])
    }
  }, [selectedNewDate, booking, isFirstClass])

  const handleChangeDate = useCallback(async () => {
    if (!booking || booking === 'cancelled') return
    const b = booking as Booking
    const rs = (b.refundStatus ?? '').trim()
    if (rs && rs !== 'request_rejected' && rs !== 'refund_failed') {
      setChangeDateError('İade talebiniz veya iade süreciniz devam ettiği için tarih değiştirilemez.')
      return
    }
    const dateToUse = isFirstClass && selectedNewDate ? selectedNewDate : newDate.trim().slice(0, 10)
    if (!dateToUse) return
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateToUse)) {
      setChangeDateError('Geçerli bir tarih seçin (YYYY-AA-GG).')
      return
    }
    if (isFirstClass && requiredLocas > 0 && selectedFirstClassLocas.length !== requiredLocas) {
      setChangeDateError(`First Class için ${requiredLocas} loca seçin (${totalPax} kişi).`)
      return
    }
    setChangeDateLoading(true)
    setChangeDateError(null)
    setSuccess(null)
    setError(null)
    try {
      const body: { bookingId: string; email: string; newDate: string; firstClassLocas?: string[] } = {
        bookingId: (booking as Booking).id,
        email: (booking as Booking).customer.email,
        newDate: dateToUse,
      }
      if (isFirstClass && requiredLocas > 0) {
        body.firstClassLocas = selectedFirstClassLocas.map((id) => id.trim().toUpperCase())
      }
      const res = await fetch('/api/booking/change-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setChangeDateError(data.error || 'Tarih güncellenemedi.')
        return
      }
      const locasFromServer = Array.isArray(data.firstClassLocas)
        ? (data.firstClassLocas as string[]).map((x) => String(x).trim().toUpperCase())
        : null
      const newLocas =
        isFirstClass && requiredLocas > 0
          ? locasFromServer && locasFromServer.length === requiredLocas
            ? locasFromServer
            : selectedFirstClassLocas.map((id) => id.trim().toUpperCase())
          : null
      setBooking((prev) => {
        if (!prev || prev === 'cancelled') return prev
        return {
          ...prev,
          date: dateToUse,
          ...(newLocas && newLocas.length > 0 ? { firstClassLocas: newLocas } : {}),
        }
      })
      setNewDate('')
      setSelectedNewDate(null)
      setSelectedFirstClassLocas([])
      setSuccess('Rezervasyon tarihiniz güncellendi.')
    } catch {
      setChangeDateError('Bağlantı hatası.')
    } finally {
      setChangeDateLoading(false)
    }
  }, [booking, newDate, isFirstClass, selectedNewDate, selectedFirstClassLocas, requiredLocas, totalPax])

  return (
    <div className="mx-auto max-w-xl px-4" style={{ fontFamily: 'var(--font-family)' }}>
      <h1 className="text-2xl font-black text-[#131719] sm:text-[28px]">Rezervasyonumu Yönet</h1>
      <p className="mt-2 text-sm text-zinc-500">Rezervasyonunuza erişmek için e-posta adresinizi girin.</p>

      {!booking && booking !== 'cancelled' && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-[#f1f5f9] bg-white p-6 shadow-[0_2px_8px_rgba(19,23,25,0.06)]"
        >
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">
              Rezervasyon No
            </label>
            <input
              type="text"
              readOnly
              value={initialBookingId}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-sm text-zinc-600"
            />
          </div>
          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">E-posta</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rezervasyonda kullandığınız e-posta"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm focus:border-[#2168b8] focus:outline-none"
            />
          </div>
          {error && <p className="mb-3 text-sm font-medium text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl px-6 py-3.5 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: 'var(--primary, #2168b8)' }}
          >
            {loading ? 'Yükleniyor...' : 'Rezervasyonu Görüntüle'}
          </button>
        </form>
      )}

      {booking === 'cancelled' && (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5">
          <p className="m-0 font-bold text-red-800">Bu rezervasyon iptal edilmiştir.</p>
        </div>
      )}

      {booking && booking !== 'cancelled' && (
        <>
          <div className="mt-6 rounded-2xl border border-[#f1f5f9] bg-white p-6 shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
            <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500">Rezervasyon No</p>
            <p className="m-0 mt-1 font-mono text-2xl font-black tracking-wide text-[#131719]">
              #{booking.id.slice(0, 8).toUpperCase()}
            </p>

            <dl className="m-0 mt-5 space-y-3 border-t border-[#f1f5f9] pt-4 text-sm">
              <DetailRow label="Yolcu" value={`${booking.customer.firstName} ${booking.customer.lastName}`} />
              {booking.additionalTravelers && booking.additionalTravelers.length > 0 && (
                <DetailRow
                  label="Diğer yolcular"
                  value={
                    <div className="space-y-1.5 text-right">
                      {booking.additionalTravelers.map((t, iRow) => (
                        <div key={`${t.firstName}-${t.lastName}-${iRow}`}>
                          <span className="font-semibold text-[#131719]">
                            {t.firstName} {t.lastName}
                          </span>
                          {t.mealPreference?.label?.trim() && (
                            <span className="block text-xs text-zinc-500">
                              Yemek: {t.mealPreference.label.trim()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  }
                />
              )}
              <DetailRow
                label="Durum"
                value={booking.status === 'paid' ? 'Ödendi' : booking.status === 'confirmed' ? 'Onaylandı' : 'Beklemede'}
              />
              <DetailRow label="Tur" value={booking.tourTitle} />
              <DetailRow label="Tarih" value={booking.date} />
              <DetailRow label="Kalkış" value={booking.time || '—'} />
              {booking.meetingPoint != null && booking.meetingPoint !== '' && (
                <DetailRow label="Toplanma noktası" value={booking.meetingPoint} />
              )}
              {booking.mealPreference?.label?.trim() && (
                <DetailRow
                  label="Yemek tercihi"
                  value={
                    <>
                      {booking.mealPreference.label.trim()}
                      {booking.mealPreference.counts?.length ? (
                        <span className="mt-1 block text-xs font-normal text-zinc-500">
                          {booking.mealPreference.counts
                            .filter((x) => x.count > 0)
                            .map((x) => `${x.label} (${x.count})`)
                            .join(' · ')}
                        </span>
                      ) : null}
                    </>
                  }
                />
              )}
              <DetailRow label="Sınıf" value={booking.className} />
              {isFirstClass && (
                <DetailRow
                  label="Loca"
                  value={
                    <span className="font-mono">
                      {booking.firstClassLocas?.length ? booking.firstClassLocas.join(', ') : '—'}
                    </span>
                  }
                />
              )}
              <DetailRow
                label="Misafirler"
                value={`${booking.counts.adult} Yetişkin${
                  booking.counts.child || booking.counts.infant
                    ? `, ${booking.counts.child || 0} Çocuk, ${booking.counts.infant || 0} Bebek`
                    : ''
                }`}
              />
            </dl>

            <div className="mt-5 flex items-center justify-between border-t border-[#f1f5f9] pt-4">
              <p className="m-0 text-sm font-bold uppercase tracking-wide text-zinc-500">Toplam</p>
              <p className="m-0 text-xl font-black text-[#131719]">
                {booking.totalPrice.toLocaleString('tr-TR')} {booking.currency === 'TRY' ? '₺' : booking.currency}
              </p>
            </div>
          </div>

          {success && (
            <div
              className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
              role="alert"
            >
              {success}
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-[#f1f5f9] bg-white p-5 shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
            <h3 className="m-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500">Tarihi değiştir</h3>
            {refundAlreadyRequested && (
              <p className="mb-3 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                İade talebiniz veya iade süreciniz devam ettiği için bilet tarihini buradan
                güncelleyemezsiniz.
              </p>
            )}
            {isFirstClass ? (
              <>
                <p className="mb-3 mt-3 text-xs text-zinc-500">
                  Aynı gün sadece loca değiştirmek için tur tarihinizi tekrar seçin. Takvimde{' '}
                  <strong>müsait loca sayısı</strong> (L1–L10) gösterilir; dolu localar seçicide kilitlidir.
                </p>
                <div className={styles.card}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        const [y, m] = calendarMonth.split('-').map(Number)
                        const d = new Date(y, m - 2, 1)
                        setCalendarMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
                      }}
                      disabled={refundAlreadyRequested}
                      className="min-h-[36px] min-w-[36px] rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ‹
                    </button>
                    <span className="text-sm font-semibold text-zinc-900">
                      {new Date(calendarMonth + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const [y, m] = calendarMonth.split('-').map(Number)
                        const d = new Date(y, m, 1)
                        setCalendarMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
                      }}
                      disabled={refundAlreadyRequested}
                      className="min-h-[36px] min-w-[36px] rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ›
                    </button>
                  </div>
                  {calendarLoading ? (
                    <div className="py-8 text-center text-zinc-500 text-sm">Yükleniyor…</div>
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
                            const isOwnTourDate = dateStr === bookingDateStr
                            const locaSlotsOk =
                              isOwnTourDate || (requiredLocas > 0 ? locasFree >= requiredLocas : locasFree > 0)
                            const hasCapacity = info && info.firstRemaining > 0 && locaSlotsOk
                            const available = !isPast && hasCapacity
                            const selected = selectedNewDate === dateStr
                            dayCells.push(
                              <button
                                key={dateStr}
                                type="button"
                                className={`${styles.dayCell} ${selected ? styles.dayCellSelected : ''} ${!available || refundAlreadyRequested ? styles.dayCellDisabled : ''}`}
                                onClick={() => available && !refundAlreadyRequested && setSelectedNewDate(dateStr)}
                                disabled={!available || refundAlreadyRequested}
                              >
                                <span className={styles.dayNum}>{day}</span>
                                {info && !isPast && (
                                  <span className={styles.dayPrice}>
                                    {locasFree} loca
                                  </span>
                                )}
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
                  <div
                    className={`mt-4 ${refundAlreadyRequested ? 'pointer-events-none opacity-55' : ''}`}
                  >
                    <p className="mb-2 text-sm font-semibold text-[#131719]">
                      {selectedNewDate} için loca seçin ({requiredLocas} loca gerekli)
                    </p>
                    <FirstClassSeatSelector
                      selectedLocaIds={selectedFirstClassLocas}
                      reservedLocaIds={
                        calendarDays.find((d) => d.date === selectedNewDate)?.firstClassLocasReserved ?? []
                      }
                      currentBookingLocaIds={
                        selectedNewDate === bookingDateStr
                          ? ((booking as Booking).firstClassLocas ?? []).map((x) => x.trim().toUpperCase())
                          : []
                      }
                      requiredCount={requiredLocas}
                      onToggle={(id) => {
                        setSelectedFirstClassLocas((prev) =>
                          prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < requiredLocas ? [...prev, id] : prev
                        )
                      }}
                      onReplace={(removeId, addId) =>
                        setSelectedFirstClassLocas((prev) =>
                          prev.filter((x) => x !== removeId).concat(addId)
                        )
                      }
                      locaUi={locaUi}
                    />
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={handleChangeDate}
                    disabled={
                      refundAlreadyRequested ||
                      changeDateLoading ||
                      !selectedNewDate ||
                      (requiredLocas > 0 && selectedFirstClassLocas.length !== requiredLocas)
                    }
                    className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: 'var(--primary, #2168b8)' }}
                  >
                    {changeDateLoading ? 'Güncelleniyor...' : 'Tarihi Güncelle'}
                  </button>
                  {selectedNewDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNewDate(null)
                        setSelectedFirstClassLocas([])
                      }}
                      disabled={refundAlreadyRequested}
                      className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-[#131719] hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Seçimi temizle
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[140px] flex-1">
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Yeni tarih</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    min={minBookableStr}
                    disabled={refundAlreadyRequested}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-[#2168b8] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleChangeDate}
                  disabled={refundAlreadyRequested || changeDateLoading || !newDate.trim()}
                  className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: 'var(--primary, #2168b8)' }}
                >
                  {changeDateLoading ? 'Güncelleniyor...' : 'Tarihi Güncelle'}
                </button>
              </div>
            )}
            {changeDateError && (
              <p className="mt-2 text-sm text-red-600">{changeDateError}</p>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <a
              href={withLocalePath(locale, ticketPagePath(booking.id, booking.accessToken))}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl px-5 py-3.5 text-center font-bold text-white"
              style={{ background: '#fc6c4f' }}
            >
              Biletimi Görüntüle
            </a>
            {isOnlinePaid && refundAlreadyRequested ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">İade talebi yöneticilerimize iletildi.</p>
                <p className="mt-1 text-amber-800">
                  Talebiniz 24 saat içinde sonuçlanacaktır. Onaylanma anında size e-posta gönderilecektir.
                </p>
              </div>
            ) : isOnlinePaid ? (
              <>
                <button
                  type="button"
                  onClick={handleRefundClick}
                  disabled={loading || !canRequestRefund}
                  className="rounded-xl border-2 px-5 py-3.5 font-bold disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ borderColor: '#fc6c4f', color: '#fc6c4f' }}
                >
                  İade Talebi Gönder
                </button>
                {!canRequestRefund && (
                  <p className="text-sm text-zinc-500">
                    {refundEligibility && !refundEligibility.eligible
                      ? refundEligibilityMessage(refundEligibility) ??
                        `Tur kalkışına ${REFUND_REQUEST_MIN_HOURS} saatten az kaldı.`
                      : 'Bu rezervasyon için iade talebi gönderilemez.'}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-zinc-500">
                Bu rezervasyon online ödenmediği için sadece iletişim kanalları üzerinden işlem yapılabilir.
              </p>
            )}
          </div>
        </>
      )}

      <p className="mt-8 pb-12 text-center text-sm text-zinc-500">
        <Link href={withLocalePath(locale, '/')} className="font-semibold text-[#2168b8] hover:underline">
          Ana sayfaya dön
        </Link>
      </p>

      {showRefundModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="refund-modal-title"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h2 id="refund-modal-title" className="text-lg font-bold text-zinc-900 mb-2">
              İade Talebi Gönder
            </h2>
            <p className="text-zinc-600 text-sm mb-4">
              Talebiniz yöneticilerimize iletilecek ve <strong>24 saat içinde</strong> sonuçlanacaktır.
              Onaylanma anında ödemeniz kartınıza iade edilir.
            </p>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              İade nedeni (opsiyonel)
            </label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Örn. tarih değişikliği yapamadım, hava koşulları, vb."
              className="w-full mb-5 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#fc6c4f] focus:outline-none"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="flex-1 py-2.5 rounded-xl border-2 border-zinc-300 font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleRefundConfirm}
                disabled={loading}
                className="flex-1 rounded-xl py-2.5 font-bold text-white disabled:opacity-50"
                style={{ background: '#fc6c4f' }}
              >
                {loading ? 'Gönderiliyor...' : 'Talebi Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
