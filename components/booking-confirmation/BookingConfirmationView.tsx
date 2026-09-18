'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  PartyPopper,
  Maximize2,
  CalendarPlus,
  CalendarDays,
  CalendarClock,
  XCircle,
  MapPin,
  Clock,
  Wine,
  UtensilsCrossed,
  Backpack,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import type { BookingConfirmationData } from '@/lib/bookingConfirmation'
import { getBookingConfirmationUi } from './bookingConfirmationUi'
import BoardingPassModal from './BoardingPassModal'

function money(amount: number, currency: string): string {
  const symbol = currency === 'TRY' ? '₺' : currency
  return `${amount.toLocaleString('tr-TR')} ${symbol}`
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.5c-2 1.5-4.6 2.5-7.5 2.5-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.3 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.5C39.9 37 44 31.5 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  )
}

function StatusOnlyCard({
  title,
  desc,
  homeUrl,
  backHomeLabel,
  tone,
}: {
  title: string
  desc: string
  homeUrl: string
  backHomeLabel: string
  tone: 'error' | 'neutral'
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6" style={{ fontFamily: 'var(--font-family)' }}>
      <div className="w-full max-w-sm rounded-2xl border border-[#f1f5f9] bg-white p-8 text-center shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
            tone === 'error' ? 'bg-red-50 text-red-500' : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          <AlertCircle className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-base font-bold text-[#131719]">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{desc}</p>
        <Link href={homeUrl} className="mt-6 inline-block text-sm font-semibold text-[#2168b8] hover:underline">
          {backHomeLabel}
        </Link>
      </div>
    </div>
  )
}

export default function BookingConfirmationView({ data }: { data: BookingConfirmationData }) {
  const ui = getBookingConfirmationUi(data.locale)
  const [cancelled, setCancelled] = useState(data.isCancelled)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancelResultMsg, setCancelResultMsg] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [boardingPassOpen, setBoardingPassOpen] = useState(false)

  if (data.isFailed) {
    return (
      <StatusOnlyCard title={ui.failedTitle} desc={ui.failedSubtitle} homeUrl={data.homeUrl} backHomeLabel={ui.backHome} tone="error" />
    )
  }

  const customerName = data.guests[0]?.name ?? '—'

  const handleCancel = async () => {
    setCancelling(true)
    setCancelError(null)
    try {
      const res = await fetch('/api/booking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: data.bookingId, email: data.customerEmail }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.ok) {
        setCancelError(json.error ?? 'İşlem başarısız oldu.')
        setCancelling(false)
        return
      }
      setCancelResultMsg(String(json.message ?? ui.cancelledNotice))
      setCancelled(true)
      setShowCancelConfirm(false)
    } catch {
      setCancelError('Bağlantı hatası.')
    } finally {
      setCancelling(false)
    }
  }

  const title = cancelled
    ? ui.cancelledTitle
    : data.isPaid
      ? ui.paidTitle(data.customerFirstName)
      : data.isPendingCash
        ? ui.pendingCashTitle(data.customerFirstName)
        : ui.pendingTitle(data.customerFirstName)

  const subtitle = cancelled
    ? cancelResultMsg ?? ui.cancelledSubtitle
    : data.isPaid
      ? ui.paidSubtitle
      : data.isPendingCash
        ? ui.pendingCashSubtitle
        : ui.pendingSubtitle

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-family)' }}>
      {/* Hero */}
      <div
        className="flex flex-col items-center px-4 pb-12 pt-10 text-center"
        style={{ background: 'linear-gradient(180deg, #e3f0fb 0%, #ffffff 100%)' }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
          <PartyPopper className="h-8 w-8 text-[#2168b8]" aria-hidden />
        </div>
        <h1 className="mt-5 max-w-md text-2xl font-black leading-snug text-[#131719] sm:text-[28px]">{title}</h1>
        <p className="mt-2 max-w-sm text-sm text-zinc-600">{subtitle}</p>
        {!cancelled && (
          <p className="mt-3 text-sm font-semibold text-zinc-500">
            {data.tourTitle} · {data.dateFormatted}
            {data.time ? ` · ${data.time}` : ''}
          </p>
        )}
      </div>

      <div className="mx-auto -mt-8 max-w-xl px-4 pb-16">
        {/* Kod + QR kartı */}
        <div className="rounded-2xl border border-[#f1f5f9] bg-white p-6 shadow-[0_4px_20px_rgba(19,23,25,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500">{ui.reservationCode}</p>
              <p className="m-0 mt-1 font-mono text-2xl font-black tracking-wide text-[#131719] sm:text-3xl">
                #{data.reference}
              </p>
            </div>
            {data.qrUrl && !cancelled && (
              <button
                type="button"
                onClick={() => setBoardingPassOpen(true)}
                aria-label={ui.expandBoardingPass}
                className="group relative shrink-0 rounded-xl border border-[#f1f5f9] p-1.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.qrUrl} alt="QR" width={64} height={64} className="h-16 w-16 object-contain" />
                <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#2168b8] text-white shadow-sm">
                  <Maximize2 className="h-3.5 w-3.5" aria-hidden />
                </span>
              </button>
            )}
          </div>
          {data.qrUrl && !cancelled && <p className="mt-2 text-xs text-zinc-500">{ui.scanHint}</p>}

          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#f1f5f9] pt-4 text-sm">
            <div>
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500">{ui.guestLabel}</p>
              <p className="m-0 mt-0.5 font-bold text-[#131719]">{customerName}</p>
              <p className="m-0 mt-0.5 text-zinc-500">{data.dateFormatted}</p>
            </div>
            <div>
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500">{ui.tourLabel}</p>
              <p className="m-0 mt-0.5 font-bold leading-snug text-[#131719]">{data.tourTitle}</p>
              <p className="m-0 mt-0.5 text-zinc-500">
                {ui.guestCountLabel(data.totalPax)}
                {data.className ? ` · ${data.className}` : ''}
              </p>
              {data.mealCounts.length > 0 && (
                <p className="m-0 mt-0.5 text-zinc-500">
                  {ui.mealLabel}: {data.mealCounts.map((m) => `${m.label} × ${m.count}`).join(', ')}
                </p>
              )}
            </div>
          </div>

          {!cancelled && (
            <div className="mt-5 border-t border-[#f1f5f9] pt-4">
              <div className="flex items-center justify-between gap-3">
                <p className="m-0 text-xl font-black text-[#131719]">{money(data.totalPrice, data.currency)}</p>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                    data.isPaid && !data.hasDepositRemaining
                      ? 'bg-emerald-50 text-emerald-700'
                      : data.isPaid && data.hasDepositRemaining
                        ? 'bg-blue-50 text-[#2168b8]'
                        : data.isPendingCash
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  {data.isPaid && !data.hasDepositRemaining
                    ? ui.paidBadge
                    : data.isPaid && data.hasDepositRemaining
                      ? ui.depositPaidBadge
                      : data.isPendingCash
                        ? ui.cashDueBadge
                        : ui.pendingBadge}
                </span>
              </div>
              {data.isPaid && data.hasDepositRemaining && (
                <>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                    <p className="m-0 font-semibold text-zinc-600">{ui.remainingCashLabel}</p>
                    <p className="m-0 font-bold text-[#131719]">{money(data.remainingAtDoor, data.currency)}</p>
                  </div>
                  <p className="m-0 mt-1.5 text-xs text-zinc-500">{ui.remainingCashNote}</p>
                </>
              )}
            </div>
          )}

          {!cancelled && (
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#f1f5f9] pt-5">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCalendarOpen((v) => !v)}
                  className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-zinc-200 px-2 py-3 text-center text-xs font-semibold text-[#131719] hover:bg-zinc-50"
                >
                  <CalendarPlus className="h-[18px] w-[18px]" aria-hidden />
                  {ui.addToCalendar}
                </button>
                {calendarOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setCalendarOpen(false)} />
                    <div className="absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-xl border border-[#f1f5f9] bg-white p-1.5 shadow-lg">
                      {data.icsUrl && (
                        <a
                          href={data.icsUrl}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-[#131719] hover:bg-zinc-50"
                          onClick={() => setCalendarOpen(false)}
                        >
                          <CalendarDays className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                          {ui.appleOutlookCalendar}
                        </a>
                      )}
                      {data.googleCalendarUrl && (
                        <a
                          href={data.googleCalendarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-[#131719] hover:bg-zinc-50"
                          onClick={() => setCalendarOpen(false)}
                        >
                          <GoogleLogo className="h-4 w-4 shrink-0" />
                          {ui.googleCalendar}
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>

              <Link
                href={data.manageUrl}
                className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-zinc-200 px-2 py-3 text-center text-xs font-semibold text-[#131719] hover:bg-zinc-50"
              >
                <CalendarClock className="h-[18px] w-[18px]" aria-hidden />
                {ui.changeDate}
              </Link>

              {data.canCancel ? (
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-red-200 px-2 py-3 text-center text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-[18px] w-[18px]" aria-hidden />
                  {ui.cancelBooking}
                </button>
              ) : (
                <span className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-zinc-100 px-2 py-3 text-center text-xs font-semibold text-zinc-300">
                  <XCircle className="h-[18px] w-[18px]" aria-hidden />
                  {ui.cancelBooking}
                </span>
              )}
            </div>
          )}
        </div>

        {/* İptal politikası */}
        {!cancelled && !data.isYachtDeposit && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#2168b8]" aria-hidden />
            <p className="m-0 text-sm text-[#1e429f]">
              {data.canCancel && data.cancelDeadlineLabel
                ? ui.cancelPolicyText(data.cancelDeadlineLabel, money(data.paidAmount ?? data.totalPrice, data.currency))
                : ui.cancelUnavailableText}
            </p>
          </div>
        )}

        {cancelError && (
          <p className="mt-3 text-sm font-medium text-red-600" role="alert">
            {cancelError}
          </p>
        )}

        {/* Misafir listesi */}
        {!cancelled && data.guests.length > 0 && (
          <div className="mt-4 rounded-2xl border border-[#f1f5f9] bg-white p-5 shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
            <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500">{ui.guestListTitle}</p>
            <ul className="m-0 mt-3 list-none space-y-3 p-0">
              {data.guests.map((g, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-[#131719]">{g.name}</span>
                  {g.mealLabel && (
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
                      {g.mealLabel}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <Link
              href={data.manageUrl}
              className="mt-4 inline-block text-sm font-semibold text-[#2168b8] hover:underline"
            >
              {ui.editInfoLink}
            </Link>
          </div>
        )}

        {/* Tekne barı */}
        {!cancelled && !data.isYachtDeposit && (
          <div className="mt-4 flex items-center gap-4 rounded-2xl border border-[#f1f5f9] bg-white p-5 shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2168b8]/10 text-[#2168b8]">
              <Wine className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="m-0 font-bold text-[#131719]">{ui.boatBarTitle}</p>
              <p className="m-0 mt-0.5 text-sm text-zinc-500">{ui.boatBarDesc}</p>
            </div>
            <Link
              href={data.menuUrl}
              className="shrink-0 text-xs font-bold uppercase tracking-wide text-[#2168b8] hover:underline"
            >
              {ui.boatBarCta}
            </Link>
          </div>
        )}

        {/* Toplanma noktası / biniş bilgisi */}
        {!cancelled && !data.isYachtDeposit && (
          <div className="mt-4 rounded-2xl border border-[#f1f5f9] bg-white p-5 shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
            <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500">{ui.whereTitle}</p>
            <div className="mt-2 flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
              <p className="m-0 text-sm font-medium text-[#131719]">{data.meetingPoint}</p>
            </div>
            {data.mapLink && (
              <a
                href={data.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-semibold text-[#2168b8] hover:underline"
              >
                {ui.viewOnMap}
              </a>
            )}
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#f1f5f9] pt-4 text-center">
              <div>
                <p className="m-0 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                  <Clock className="h-3 w-3" aria-hidden />
                  {ui.boardingStartLabel}
                </p>
                <p className="m-0 mt-1 font-bold text-[#131719]">{data.boardingStartTime ?? '—'}</p>
              </div>
              <div>
                <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                  {ui.latestBoardingLabel}
                </p>
                <p className="m-0 mt-1 font-bold text-[#131719]">{data.latestBoardingTime ?? '—'}</p>
              </div>
              <div>
                <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                  {ui.departureTimeLabel}
                </p>
                <p className="m-0 mt-1 font-bold text-[#131719]">{data.time ?? '—'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Yiyecek & İçecek */}
        {!cancelled && !data.isYachtDeposit && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#f1f5f9] bg-white p-5 shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
              <UtensilsCrossed className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500">{ui.foodDrinkTitle}</p>
              <p className="m-0 mt-1 text-sm font-medium text-[#131719]">{ui.foodDrinkPolicyText}</p>
            </div>
          </div>
        )}

        {/* Getirmeniz gerekenler */}
        {!cancelled && !data.isYachtDeposit && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#f1f5f9] bg-white p-5 shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
              <Backpack className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500">{ui.whatToBringTitle}</p>
              <p className="m-0 mt-1 text-sm font-medium text-[#131719]">{ui.whatToBringText}</p>
              <p className="m-0 mt-2 text-sm text-zinc-500">{ui.equipmentProvidedText}</p>
            </div>
          </div>
        )}

        {/* Bilet / PDF */}
        {!cancelled && data.ticketPath && (
          <div className="mt-4 flex flex-col gap-3">
            <a
              href={data.ticketPath}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white"
              style={{ background: '#fc6c4f' }}
            >
              {ui.viewTicket}
            </a>
            {data.pdfPath && (
              <a
                href={data.pdfPath}
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-[#131719] hover:bg-zinc-50"
              >
                {ui.downloadPdf}
              </a>
            )}
          </div>
        )}

        {/* WhatsApp yardım */}
        {data.whatsappHref && (
          <div className="mt-4 rounded-2xl border border-[#f1f5f9] bg-white p-5 shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
            <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500">{ui.needHelpTitle}</p>
            <a
              href={data.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white"
              style={{ background: 'linear-gradient(90deg, #25d366 0%, #128c7e 100%)' }}
            >
              <MessageCircle className="h-[18px] w-[18px]" aria-hidden />
              {ui.whatsappCta}
            </a>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href={data.homeUrl} className="text-sm text-zinc-500 hover:text-zinc-700 hover:underline">
            {ui.backHome}
          </Link>
        </div>
      </div>

      {/* İptal onay modalı */}
      {showCancelConfirm && (
        <div
          className="fixed inset-0 z-[10003] flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !cancelling && setShowCancelConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            style={{ fontFamily: 'var(--font-family)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="m-0 text-lg font-bold text-[#131719]">{ui.cancelConfirmTitle}</h2>
            <p className="mt-2 text-sm text-zinc-600">{ui.cancelConfirmBody}</p>
            {cancelError && <p className="mt-2 text-sm font-medium text-red-600">{cancelError}</p>}
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {cancelling ? ui.cancelling : ui.cancelConfirmYes}
              </button>
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
                className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-[#131719] hover:bg-zinc-50"
              >
                {ui.cancelConfirmNo}
              </button>
            </div>
          </div>
        </div>
      )}

      <BoardingPassModal
        open={boardingPassOpen}
        onClose={() => setBoardingPassOpen(false)}
        reference={data.reference}
        tourTitle={data.tourTitle}
        dateFormatted={data.dateFormatted}
        time={data.time}
        customerName={customerName}
        guestCountLabel={ui.guestCountLabel(data.totalPax)}
        qrUrl={data.qrUrl}
        ticketPath={data.ticketPath}
        ui={ui}
      />
    </div>
  )
}
