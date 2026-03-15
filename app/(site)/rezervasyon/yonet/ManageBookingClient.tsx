'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'

type Booking = {
  id: string
  status: string
  tourTitle: string
  date: string
  time?: string
  meetingPoint?: string
  className: string
  totalPrice: number
  currency: string
  counts: { adult: number; child: number; infant: number }
  customer: { firstName: string; lastName: string; email: string }
  canCancel: boolean
  hoursUntilTour: number | null
}

export default function ManageBookingClient({
  initialBookingId,
  ticketPageUrl,
  voucherPdfUrl,
}: {
  initialBookingId: string
  ticketPageUrl: string
  voucherPdfUrl: string
}) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<Booking | null | 'cancelled'>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [changeDateLoading, setChangeDateLoading] = useState(false)
  const [changeDateError, setChangeDateError] = useState<string | null>(null)

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

  const handleCancelClick = useCallback(() => {
    if (booking && booking !== 'cancelled' && (booking as Booking).canCancel) setShowCancelModal(true)
  }, [booking])

  const handleCancelConfirm = useCallback(async () => {
    if (!booking || booking === 'cancelled' || !(booking as Booking).canCancel) return
    setShowCancelModal(false)
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/booking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: (booking as Booking).id,
          email: (booking as Booking).customer.email,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'İptal işlemi başarısız.')
        return
      }
      setBooking('cancelled')
      setSuccess('Rezervasyonunuz iptal edildi.')
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }, [booking])

  const handleChangeDate = useCallback(async () => {
    if (!booking || booking === 'cancelled' || !newDate.trim()) return
    const dateNorm = newDate.trim().slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateNorm)) {
      setChangeDateError('Geçerli bir tarih seçin (YYYY-AA-GG).')
      return
    }
    setChangeDateLoading(true)
    setChangeDateError(null)
    setSuccess(null)
    setError(null)
    try {
      const res = await fetch('/api/booking/change-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: (booking as Booking).id,
          email: (booking as Booking).customer.email,
          newDate: dateNorm,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setChangeDateError(data.error || 'Tarih güncellenemedi.')
        return
      }
      setBooking((prev) =>
        prev && prev !== 'cancelled' ? { ...prev, date: dateNorm } : prev
      )
      setNewDate('')
      setSuccess('Rezervasyon tarihiniz güncellendi.')
    } catch {
      setChangeDateError('Bağlantı hatası.')
    } finally {
      setChangeDateLoading(false)
    }
  }, [booking, newDate])

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
                <tr>
                  <td style={{ color: '#6b7280', padding: '8px 0' }}>Sınıf</td>
                  <td style={{ textAlign: 'right' }}>{booking.className}</td>
                </tr>
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
            {changeDateError && (
              <p className="mt-2 text-sm text-red-600">{changeDateError}</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={ticketPageUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-3.5 px-5 rounded-xl border-2 border-[#1f3c88] text-[#1f3c88] font-semibold hover:bg-[#1f3c88] hover:text-white transition-colors"
            >
              Biletimi Görüntüle
            </a>
            <a
              href={voucherPdfUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-3.5 px-5 rounded-xl border-2 border-zinc-300 text-zinc-700 font-semibold hover:bg-zinc-100 transition-colors"
            >
              PDF Bilet İndir
            </a>
            {booking.canCancel && (
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={loading}
                className="py-3.5 px-5 rounded-xl border-2 border-red-500 text-red-600 font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Rezervasyonu İptal Et
              </button>
            )}
            {!booking.canCancel && booking.hoursUntilTour != null && booking.hoursUntilTour <= 24 && (
              <p className="text-sm text-zinc-500">
                Tura 24 saatten az kaldığı için iptal işlemi yapılamaz. Değişiklik için lütfen bizimle iletişime geçin.
              </p>
            )}
          </div>
        </>
      )}

      <p style={{ marginTop: 32, fontSize: 13, color: '#9ca3af' }}>
        <Link href="/" style={{ color: '#1f3c88' }}>Ana sayfaya dön</Link>
      </p>

      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h2 id="cancel-modal-title" className="text-lg font-bold text-zinc-900 mb-2">
              Rezervasyonu iptal et
            </h2>
            <p className="text-zinc-600 text-sm mb-6">
              Rezervasyonunuzu iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl border-2 border-zinc-300 font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'İşleniyor...' : 'İptal et'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
