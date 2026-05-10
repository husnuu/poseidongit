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

export default function ManageBookingClient({
  initialBookingId,
  locale = 'tr',
}: {
  initialBookingId: string
  locale?: SiteLocale
}) {
  const locaUi = getBookingWizardUi(locale).firstClassLoca
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
    const dateToUse = isFirstClass && selectedNewDate ? selectedNewDate : newDate.trim().slice(0, 10)
    if (!booking || booking === 'cancelled' || !dateToUse) return
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
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0c1929', marginBottom: 8 }}>
        Rezervasyonumu Yönet
      </h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Rezervasyonunuza erişmek için e-posta adresinizi girin.
      </p>

      {!booking && booking !== 'cancelled' && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Rezervasyon No
            </label>
            <input
              type="text"
              readOnly
              value={initialBookingId}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 15,
                backgroundColor: '#f9fafb',
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              E-posta
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rezervasyonda kullandığınız e-posta"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 15,
              }}
            />
          </div>
          {error && (
            <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 12 }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: '#1f3c88',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Yükleniyor...' : 'Rezervasyonu Görüntüle'}
          </button>
        </form>
      )}

      {booking === 'cancelled' && (
        <div
          style={{
            padding: 20,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, color: '#991b1b' }}>
            Bu rezervasyon iptal edilmiştir.
          </p>
        </div>
      )}

      {booking && booking !== 'cancelled' && (
        <>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>
              Rezervasyon Detayları
            </h2>
            <table style={{ width: '100%', fontSize: 14 }}>
              <tbody>
                <tr>
                  <td style={{ color: '#6b7280', padding: '8px 0' }}>Rezervasyon No</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>{booking.id}</td>
                </tr>
                <tr>
                  <td style={{ color: '#6b7280', padding: '8px 0' }}>Yolcu</td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>{booking.customer.firstName} {booking.customer.lastName}</td>
                </tr>
                {booking.additionalTravelers && booking.additionalTravelers.length > 0 && (
                  <tr>
                    <td style={{ color: '#6b7280', padding: '8px 0', verticalAlign: 'top' }}>Diğer yolcular</td>
                    <td style={{ textAlign: 'right', fontWeight: 500, lineHeight: 1.5 }}>
                      {booking.additionalTravelers.map((t, iRow) => (
                        <div key={`${t.firstName}-${t.lastName}-${iRow}`}>
                          {t.firstName} {t.lastName}
                          {t.mealPreference?.label?.trim() ? (
                            <span style={{ color: '#6b7280', fontSize: 12, display: 'block' }}>
                              Yemek: {t.mealPreference.label.trim()}
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ color: '#6b7280', padding: '8px 0' }}>Durum</td>
                  <td style={{ textAlign: 'right' }}>{booking.status === 'paid' ? 'Ödendi' : booking.status === 'confirmed' ? 'Onaylandı' : 'Beklemede'}</td>
                </tr>
                <tr>
                  <td style={{ color: '#6b7280', padding: '8px 0' }}>Tur</td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>{booking.tourTitle}</td>
                </tr>
                <tr>
                  <td style={{ color: '#6b7280', padding: '8px 0' }}>Tarih</td>
                  <td style={{ textAlign: 'right' }}>{booking.date}</td>
                </tr>
                <tr>
                  <td style={{ color: '#6b7280', padding: '8px 0' }}>Kalkış</td>
                  <td style={{ textAlign: 'right' }}>{booking.time || '—'}</td>
                </tr>
                {booking.meetingPoint != null && booking.meetingPoint !== '' && (
                  <tr>
                    <td style={{ color: '#6b7280', padding: '8px 0' }}>Toplanma noktası</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{booking.meetingPoint}</td>
                  </tr>
                )}
                {booking.mealPreference?.label?.trim() && (
                  <tr>
                    <td style={{ color: '#6b7280', padding: '8px 0' }}>Yemek tercihi</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>
                      {booking.mealPreference.label.trim()}
                      {booking.mealPreference.counts?.length ? (
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                          {booking.mealPreference.counts
                            .filter((x) => x.count > 0)
                            .map((x) => `${x.label} (${x.count})`)
                            .join(' · ')}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ color: '#6b7280', padding: '8px 0' }}>Sınıf</td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>{booking.className}</td>
                </tr>
                {isFirstClass && (
                  <tr>
                    <td style={{ color: '#6b7280', padding: '8px 0' }}>Loca</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#92400e', fontFamily: 'monospace' }}>
                      {(booking.firstClassLocas?.length ? booking.firstClassLocas.join(', ') : '—')}
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ color: '#6b7280', padding: '8px 0' }}>Misafirler</td>
                  <td style={{ textAlign: 'right' }}>
                    {booking.counts.adult} Yetişkin
                    {(booking.counts.child || booking.counts.infant) &&
                      `, ${booking.counts.child || 0} Çocuk, ${booking.counts.infant || 0} Bebek`}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#6b7280', padding: '12px 0 0', borderTop: '2px solid #e5e7eb' }}>
                    Toplam
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#1f3c88', padding: '12px 0 0', borderTop: '2px solid #e5e7eb' }}>
                    {booking.totalPrice} {booking.currency}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {success && (
            <div
              className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
              role="alert"
            >
              {success}
            </div>
          )}

          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">Tarih değiştir</h3>
            {isFirstClass ? (
              <>
                <p className="text-xs text-amber-800 mb-3">
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
                      className="min-h-[36px] min-w-[36px] rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
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
                      className="min-h-[36px] min-w-[36px] rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
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
                          const todayStr = new Date().toISOString().slice(0, 10)
                          const pads = Array.from({ length: gridStart }, (_, i) => <div key={`pad-${i}`} />)
                          const dayCells = []
                          for (let day = 1; day <= lastDay.getDate(); day++) {
                            const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            const info = dayMap[dateStr]
                            const isPast = dateStr < todayStr
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
                                className={`${styles.dayCell} ${selected ? styles.dayCellSelected : ''} ${!available ? styles.dayCellDisabled : ''}`}
                                onClick={() => available && setSelectedNewDate(dateStr)}
                                disabled={!available}
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
                  <div className="mt-4">
                    <p className="text-sm font-medium text-amber-900 mb-2">
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
                      changeDateLoading ||
                      !selectedNewDate ||
                      (requiredLocas > 0 && selectedFirstClassLocas.length !== requiredLocas)
                    }
                    className="px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="px-4 py-2 rounded-lg border border-amber-300 text-amber-800 text-sm hover:bg-amber-100"
                    >
                      Seçimi temizle
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-amber-800 mb-1">Yeni tarih</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleChangeDate}
                  disabled={changeDateLoading || !newDate.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changeDateLoading ? 'Güncelleniyor...' : 'Tarihi Güncelle'}
                </button>
              </div>
            )}
            {changeDateError && (
              <p className="mt-2 text-sm text-red-600">{changeDateError}</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={withLocalePath(locale, ticketPagePath(booking.id, booking.accessToken))}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-3.5 px-5 rounded-xl border-2 border-[#1f3c88] text-[#1f3c88] font-semibold hover:bg-[#1f3c88] hover:text-white transition-colors"
            >
              Biletimi Görüntüle
            </a>
            {isOnlinePaid && refundAlreadyRequested ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
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
                  className="py-3.5 px-5 rounded-xl border-2 border-orange-500 text-orange-700 font-semibold hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

      <p style={{ marginTop: 32, fontSize: 13, color: '#9ca3af' }}>
        <Link href={withLocalePath(locale, '/')} style={{ color: '#1f3c88' }}>
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
              className="w-full mb-5 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
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
                className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700 disabled:opacity-50"
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
