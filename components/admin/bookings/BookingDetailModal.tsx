'use client'

import { useState, useEffect } from 'react'
import type { AdminBookingRow, BookingStatus } from '@/types/adminBookings'
import { MANUAL_SOURCE_LABELS } from '@/types/adminBookings'
import { additionalTravelerLabels } from '@/lib/bookingAdditionalTravelers'
import { extractMealPreferenceCountsFromBookingLike } from '@/lib/mealPreferenceCounts'

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Beklemede',
  paid: 'Ödendi',
  failed: 'Ödeme başarısız',
  cancelled: 'İptal',
}

interface BookingDetailModalProps {
  open: boolean
  onClose: () => void
  booking: AdminBookingRow | null
  getManageUrl: (bookingId: string) => string
  getVoucherPdfUrl: (bookingId: string, accessToken?: string | null) => string
  onStatusChange: (bookingId: string, status: BookingStatus) => void
  onAdminNoteSave: (bookingId: string, adminNote: string) => Promise<void>
  updating: boolean
}

export default function BookingDetailModal({
  open,
  onClose,
  booking,
  getManageUrl,
  getVoucherPdfUrl,
  onStatusChange,
  onAdminNoteSave,
  updating,
}: BookingDetailModalProps) {
  const [adminNote, setAdminNote] = useState(booking?.adminNote ?? '')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    if (booking) setAdminNote(booking.adminNote ?? '')
  }, [booking?.id, booking?.adminNote])

  if (!open) return null
  if (!booking) return null

  const totalPax = booking.counts.adult + booking.counts.child + booking.counts.infant
  const extraTravelers = booking.additionalTravelers ?? []
  const mealCounts = extractMealPreferenceCountsFromBookingLike({
    counts: booking.counts,
    mealPreference: booking.mealPreference,
    additionalTravelers: booking.additionalTravelers,
  })
  const extraLabels = additionalTravelerLabels({
    adult: booking.counts.adult,
    child: booking.counts.child,
    infant: booking.counts.infant,
  })

  const handleSaveNote = async () => {
    setSavingNote(true)
    try {
      await onAdminNoteSave(booking.id, adminNote)
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-zinc-900/30"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200 bg-white shadow-xl sm:w-full"
        role="dialog"
        aria-modal
        aria-label="Rezervasyon detayı"
      >
        <div className="max-h-[85vh] overflow-y-auto sm:max-h-[90vh]">
          <div className="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white px-3 py-3 sm:px-4">
            <h3 className="text-base font-semibold text-zinc-900 sm:text-lg">Rezervasyon Detayı</h3>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
              aria-label="Kapat"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                {booking.tourCoverImageUrl ? (
                  <img
                    src={booking.tourCoverImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-400">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900">{booking.tourTitle}</h4>
                <p className="text-sm text-zinc-600">{booking.date}{booking.time ? ` · ${booking.time}` : ''}</p>
                <p className="text-sm text-zinc-600">
                  {booking.className}
                  {booking.firstClassLocas?.length ? ` · Loca ${booking.firstClassLocas.join(', ')}` : booking.firstClassLoca ? ` · Loca ${booking.firstClassLoca}` : ''}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-zinc-50 p-3">
              <p className="text-xs font-medium uppercase text-zinc-500">Rezervasyonu yapan</p>
              <p className="font-medium text-zinc-900">{booking.customer.firstName} {booking.customer.lastName}</p>
              <p className="text-sm text-zinc-600">{booking.customer.email}</p>
              {booking.customer.phone && (
                <p className="text-sm text-zinc-600">{booking.customer.phone}</p>
              )}
            </div>

            {(booking.mealPreference?.label?.trim() || mealCounts.length > 0) && (
              <div className="rounded-lg border border-amber-100 bg-amber-50/80 p-3">
                <p className="text-xs font-medium uppercase text-amber-800/90">Yemek tercihi</p>
                {booking.mealPreference?.label?.trim() ? (
                  <p className="mt-1 text-sm font-medium text-zinc-900">{booking.mealPreference.label.trim()}</p>
                ) : null}
                {mealCounts.length > 0 && (
                  <p className="mt-1 text-xs text-zinc-600">
                    Dağılım:{' '}
                    {mealCounts
                      .map((x) => `${x.label} (${x.count})`)
                      .join(' · ')}
                  </p>
                )}
              </div>
            )}

            {extraTravelers.length > 0 && (
              <div className="rounded-lg border border-zinc-100 bg-white p-3">
                <p className="text-xs font-medium uppercase text-zinc-500">Diğer yolcular</p>
                <ul className="mt-2 space-y-1.5 text-sm text-zinc-800">
                  {extraTravelers.map((t, i) => (
                    <li key={`${t.firstName}-${t.lastName}-${i}`}>
                      <span className="text-zinc-500">{extraLabels[i] ?? `Yolcu ${i + 2}`}: </span>
                      <span className="font-medium">{t.firstName} {t.lastName}</span>
                      {t.mealPreference?.label?.trim() ? (
                        <span className="text-zinc-500"> · Yemek: {t.mealPreference.label.trim()}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-xs font-medium uppercase text-zinc-500">Katılımcılar</p>
              <div className="mt-1 text-sm text-zinc-700">
                {booking.counts.adult > 0 && <span>{booking.counts.adult} Yetişkin</span>}
                {booking.counts.child > 0 && <span className="ml-2">{booking.counts.child} Çocuk</span>}
                {booking.counts.infant > 0 && <span className="ml-2">{booking.counts.infant} Bebek</span>}
                <span className="ml-2 text-zinc-500">Toplam {totalPax} kişi</span>
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Birim fiyat</span>
              <span className="text-zinc-900">
                {booking.totalPrice > 0
                  ? `${(booking.unitPrice ?? booking.totalPrice / (totalPax || 1)).toLocaleString('tr-TR')} ${booking.currency}`
                  : 'Fiyat belirtilmedi'}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-zinc-700">Toplam</span>
              <span className="text-zinc-900">
                {booking.totalPrice > 0 ? `${booking.totalPrice.toLocaleString('tr-TR')} ${booking.currency}` : 'Fiyat belirtilmedi'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">Durum</span>
              <select
                value={booking.status}
                onChange={(e) => onStatusChange(booking.id, e.target.value as BookingStatus)}
                disabled={updating}
                className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm disabled:opacity-60"
              >
                <option value="pending">Beklemede</option>
                <option value="paid">Ödendi</option>
                <option value="failed">Ödeme başarısız</option>
                <option value="cancelled">İptal</option>
              </select>
              <span className="text-xs text-zinc-400">Referans: {booking.reference ?? booking.id.slice(0, 8)}…</span>
            </div>

            {(booking.paymentStatus ||
              booking.nestpayAuthCode ||
              booking.nestpayHostRefNum ||
              booking.nestpayTransId ||
              booking.paidAt ||
              booking.paymentLastError ||
              booking.paymentVerificationStatus) && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 text-sm">
                <p className="text-xs font-medium uppercase text-emerald-900/80">Ödeme (NestPay)</p>
                <dl className="mt-2 space-y-1 text-zinc-800">
                  {booking.paymentStatus ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-zinc-500">payment_status</dt>
                      <dd className="font-medium">{booking.paymentStatus}</dd>
                    </div>
                  ) : null}
                  {booking.paymentVerificationStatus ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-zinc-500">HASH doğrulama</dt>
                      <dd className="font-medium">{booking.paymentVerificationStatus}</dd>
                    </div>
                  ) : null}
                  {booking.nestpayAuthCode ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-zinc-500">AuthCode</dt>
                      <dd className="font-mono text-xs">{booking.nestpayAuthCode}</dd>
                    </div>
                  ) : null}
                  {booking.nestpayHostRefNum ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-zinc-500">HostRefNum</dt>
                      <dd className="font-mono text-xs break-all">{booking.nestpayHostRefNum}</dd>
                    </div>
                  ) : null}
                  {booking.nestpayTransId ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-zinc-500">TransId</dt>
                      <dd className="font-mono text-xs break-all">{booking.nestpayTransId}</dd>
                    </div>
                  ) : null}
                  {booking.paidAt ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-zinc-500">paidAt</dt>
                      <dd>{new Date(booking.paidAt).toLocaleString('tr-TR')}</dd>
                    </div>
                  ) : null}
                  {booking.paymentLastError ? (
                    <div>
                      <dt className="text-zinc-500">Son hata</dt>
                      <dd className="mt-0.5 text-xs text-rose-800 break-words">{booking.paymentLastError}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            )}

            <div className="text-sm">
              <span className="text-zinc-500">Kaynak: </span>
              <span className="text-zinc-900">
                {booking.source === 'manual'
                  ? `Manuel · ${MANUAL_SOURCE_LABELS[booking.manualSource ?? ''] ?? booking.manualSource ?? 'Manuel'}`
                  : (MANUAL_SOURCE_LABELS.web ?? 'Web')}
              </span>
              {booking.createdByAdmin && (
                <span className="ml-2 text-zinc-500">(Admin tarafından oluşturuldu)</span>
              )}
            </div>

            {booking.createdAt && (
              <p className="text-xs text-zinc-500">
                Oluşturulma: {new Date(booking.createdAt).toLocaleString('tr-TR')}
              </p>
            )}

            <div className="flex flex-wrap gap-2 border-t border-zinc-200 pt-4">
              <a
                href={getVoucherPdfUrl(booking.id, booking.accessToken)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                PDF Bilet İndir
              </a>
              <a
                href={getManageUrl(booking.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Rezervasyonu Yönet
              </a>
            </div>

            <div className="border-t border-zinc-200 pt-4">
              <label className="block text-sm font-medium text-zinc-700">Admin notu</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                placeholder="İç not..."
              />
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={savingNote}
                className="mt-2 rounded-lg bg-zinc-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-600 disabled:opacity-50"
              >
                {savingNote ? 'Kaydediliyor…' : 'Notu kaydet'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
