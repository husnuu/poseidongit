'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import ChangeDateInline from '@/components/booking-confirmation/ChangeDateInline'
import { ticketPagePath } from '@/lib/siteUrls'
import { withLocalePath } from '@/lib/i18n/paths'
import type { SiteLocale } from '@/lib/i18n/config'
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
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<Booking | null | 'cancelled'>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [changeDateOpen, setChangeDateOpen] = useState(false)

  const isFirstClass =
    !!booking &&
    booking !== 'cancelled' &&
    (String((booking as Booking).classId ?? '').toLowerCase().includes('first') ||
      String((booking as Booking).className ?? '').toLowerCase().includes('first'))
  const totalPax =
    booking && booking !== 'cancelled'
      ? (booking as Booking).counts.adult + (booking as Booking).counts.child + (booking as Booking).counts.infant
      : 0

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

          {!changeDateOpen && (
            <div className="mt-4 rounded-2xl border border-[#f1f5f9] bg-white p-5 shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="m-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500">Tarihi değiştir</h3>
                <button
                  type="button"
                  onClick={() => setChangeDateOpen(true)}
                  disabled={refundAlreadyRequested}
                  className="rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ borderColor: 'var(--primary, #2168b8)', color: 'var(--primary, #2168b8)' }}
                >
                  Tarihi Değiştir
                </button>
              </div>
              {refundAlreadyRequested && (
                <p className="mb-0 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  İade talebiniz veya iade süreciniz devam ettiği için bilet tarihini buradan
                  güncelleyemezsiniz.
                </p>
              )}
            </div>
          )}

          {changeDateOpen && (
            <ChangeDateInline
              bookingId={booking.id}
              email={booking.customer.email}
              tourId={booking.tourId ?? ''}
              classId={booking.classId ?? ''}
              className={booking.className}
              currentDate={booking.date}
              currentFirstClassLocas={booking.firstClassLocas ?? []}
              totalPax={totalPax}
              refundStatus={booking.refundStatus ?? null}
              locale={locale}
              onCancel={() => setChangeDateOpen(false)}
              onSuccess={(newDate, newFirstClassLocas) => {
                setBooking((prev) => {
                  if (!prev || prev === 'cancelled') return prev
                  return {
                    ...prev,
                    date: newDate,
                    ...(newFirstClassLocas && newFirstClassLocas.length > 0
                      ? { firstClassLocas: newFirstClassLocas }
                      : {}),
                  }
                })
                setChangeDateOpen(false)
                setSuccess('Rezervasyon tarihiniz güncellendi.')
              }}
            />
          )}

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
