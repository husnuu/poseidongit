'use client'

import React from 'react'
import Link from 'next/link'
import { Ship, Printer } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import {
  boardingPassPageCopy,
  boardingPassTicketActions,
  numberLocaleForBooking,
  voucherPdfUiStrings,
} from '@/lib/i18n/bookingFlowLocale'

export type BoardingPassTicketProps = {
  bookingId: string
  tourTitle: string
  tourImageUrl: string | null
  dateFormatted: string
  time: string | undefined
  /** Sanity quickFacts.returnTime (limana dönüş). */
  arrivalTime?: string
  durationLabel: string | null
  meetingPoint: string
  customerName: string
  participants: string
  className: string
  totalPrice: number
  currency: string
  /** Ödeme onaylı / kayıtlı ödenen tutar; yoksa gösterilmez. */
  paidAmount?: number | null
  status: string
  manageUrl: string
  homeUrl: string
  qrImageUrl?: string
  locale?: SiteLocale
}

const BLUE = '#1e3a8a'
const BLUE_LIGHT = '#2563eb'

function boardingTimeBefore(time: string | undefined): string | null {
  if (!time?.trim()) return null
  const m = time.trim().match(/^(\d{1,2})\s*:\s*(\d{2})/)
  if (!m) return null
  let h = parseInt(m[1], 10)
  let min = parseInt(m[2], 10)
  min -= 30
  if (min < 0) {
    min += 60
    h -= 1
  }
  if (h < 0) h += 24
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 print:text-[10px] print:tracking-[0.12em]">
      {children}
    </p>
  )
}

export default function BoardingPassTicket({
  bookingId,
  tourTitle,
  tourImageUrl: _tourImageUrl,
  dateFormatted,
  time,
  arrivalTime,
  durationLabel,
  meetingPoint,
  customerName,
  participants,
  className,
  totalPrice,
  currency,
  paidAmount,
  status: _status,
  manageUrl,
  homeUrl,
  qrImageUrl,
  locale = 'tr',
}: BoardingPassTicketProps) {
  void _tourImageUrl
  void _status
  const s = voucherPdfUiStrings(locale)
  const a = boardingPassTicketActions(locale)
  const pageCopy = boardingPassPageCopy(locale)
  const nloc = numberLocaleForBooking(locale)
  const totalPriceLabel = `${totalPrice.toLocaleString(nloc)} ${currency}`
  const paidAmountLabel =
    paidAmount != null && paidAmount > 0 ? `${paidAmount.toLocaleString(nloc)} ${currency}` : null
  const depTime = time?.trim() || '—'
  const boardingTime = boardingTimeBefore(time) ?? depTime
  const arr = arrivalTime?.trim()

  const scheduleLine =
    depTime !== '—' ? s.estDeparture(depTime, boardingTime) : s.boardingTimeOnly(boardingTime)

  return (
    <div
      className="min-h-screen bg-slate-200/90 px-4 py-6 sm:px-6 sm:py-8 print:min-h-0 print:h-auto print:bg-white print:px-0 print:py-0 [-webkit-print-color-adjust:exact] [print-color-adjust:exact]"
      style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <div className="mx-auto w-full max-w-[min(100%,36rem)] print:max-w-none print:w-full">
        {/* Yazdırmada tam A4 (210×297mm), dikeyde esneyen orta bölüm */}
        <article
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.08)] print:break-inside-avoid print:flex print:h-[297mm] print:max-h-[297mm] print:w-[210mm] print:flex-col print:overflow-hidden print:rounded-none print:border-0 print:shadow-none"
          aria-label={pageCopy.ariaTicket}
        >
          {/* —— HEADER —— */}
          <header
            className="px-5 pb-6 pt-6 sm:px-8 sm:pb-7 sm:pt-7 print:shrink-0 print:px-7 print:pb-5 print:pt-6"
            style={{ backgroundColor: BLUE }}
          >
            <div className="flex flex-col gap-5 print:gap-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3 print:gap-3">
                <span className="inline-flex max-w-full items-center rounded-lg border border-white/35 bg-white/15 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white sm:text-[11px] print:px-3 print:py-1.5 print:text-[10px]">
                  {s.ebiletBadge}
                </span>
                {durationLabel ? (
                  <span className="text-xs font-semibold text-white/85 print:text-sm">
                    {s.durationPrefix} {durationLabel}
                  </span>
                ) : null}
              </div>

              {/* Rota */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 print:flex-row print:items-center print:gap-6">
                <div className="flex min-w-0 flex-1 items-center gap-3 text-white print:gap-4">
                  <span className="shrink-0 text-lg font-extrabold uppercase tracking-tight sm:text-xl print:text-xl">
                    {s.cesme}
                  </span>
                  <div className="relative flex min-w-[3rem] flex-1 items-center justify-center px-1">
                    <div className="h-px w-full border-t border-dashed border-white/50" aria-hidden />
                    <Ship
                      className="absolute h-5 w-5 rounded-full bg-[#1e3a8a] p-0.5 text-white print:h-6 print:w-6"
                      strokeWidth={2.2}
                      aria-hidden
                    />
                  </div>
                  <span className="min-w-0 flex-1 text-right text-base font-extrabold uppercase leading-snug text-white sm:text-left sm:text-lg print:text-left print:text-lg print:leading-snug print:line-clamp-4">
                    {tourTitle}
                  </span>
                </div>
              </div>

              {/* Tarih + tek satır zaman özeti */}
              <div className="rounded-xl border border-white/20 bg-black/10 px-4 py-3 sm:px-5 print:px-5 print:py-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/75 print:text-[11px]">
                  {s.tourDate}
                </p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl print:text-2xl print:leading-tight">
                  {dateFormatted}
                </p>
                <p className="mt-2 text-sm font-semibold text-white/95 print:mt-2 print:text-sm print:leading-snug">
                  {scheduleLine}
                </p>
                {arr ? (
                  <p className="mt-1.5 text-sm font-semibold text-white/90 print:mt-1.5 print:text-sm">
                    {s.estArrival(arr)}
                  </p>
                ) : null}
              </div>
            </div>
          </header>

          {/* —— DETAY IZGARASI —— kalan yüksekliği doldurur */}
          <section className="space-y-6 px-5 py-6 sm:px-8 sm:py-8 print:flex print:min-h-0 print:flex-1 print:flex-col print:gap-5 print:space-y-0 print:overflow-hidden print:px-7 print:py-5">
            <div className="grid shrink-0 gap-6 sm:grid-cols-2 print:grid-cols-2 print:gap-6">
              <div className="space-y-1.5 print:space-y-1">
                <Label>{s.passenger}</Label>
                <p
                  className="text-lg font-bold leading-snug text-slate-900 print:text-lg print:leading-snug"
                  style={{ color: BLUE_LIGHT }}
                >
                  {customerName}
                </p>
                {participants ? (
                  <p className="text-sm font-medium text-slate-600 print:text-sm">{participants}</p>
                ) : null}
              </div>
              <div className="space-y-1.5 print:space-y-1">
                <Label>{s.classLabel}</Label>
                <p className="text-lg font-bold text-slate-900 print:text-lg print:leading-snug">{className}</p>
              </div>
            </div>

            <div className="shrink-0 space-y-1.5 rounded-xl bg-slate-50 px-4 py-3 sm:px-5 print:space-y-1 print:px-5 print:py-2.5">
              <Label>{s.refNumber}</Label>
              <p className="font-mono text-base font-bold tracking-wide text-slate-900 sm:text-lg print:text-base print:leading-snug">
                {bookingId}
              </p>
            </div>

            {/* —— QR: kalan yükseklik burada esner; taşmayı önlemek için min-h-0 —— */}
            <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/80 px-4 py-6 sm:px-8 sm:py-8 print:flex print:min-h-0 print:flex-1 print:flex-col print:justify-center print:overflow-hidden print:px-6 print:py-4">
              <div className="mx-auto flex min-h-0 w-full max-w-sm flex-col items-center justify-center text-center print:max-w-none">
                <Label>{s.boardingVerify}</Label>
                <h2 className="mt-2 text-lg font-extrabold text-slate-900 sm:text-xl print:mt-1 print:text-xl">
                  {s.qrCode}
                </h2>
                <p className="mt-1 max-w-xs text-sm font-medium leading-relaxed text-slate-600 print:mt-1 print:max-w-md print:text-sm">
                  {s.qrHint}
                </p>
                {qrImageUrl ? (
                  <div className="mt-5 rounded-2xl border-2 border-white bg-white p-4 shadow-sm print:mt-3 print:rounded-xl print:p-3 print:border-slate-200">
                    <img
                      src={qrImageUrl}
                      alt={a.qrAlt}
                      width={224}
                      height={224}
                      className="h-52 w-52 object-contain sm:h-56 sm:w-56 print:h-[46mm] print:w-[46mm] print:max-h-[46mm] print:max-w-[46mm]"
                      style={{ imageRendering: 'crisp-edges' }}
                    />
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500 print:mt-2 print:text-sm">{a.qrLoadFail}</p>
                )}
              </div>
            </div>
          </section>

          {/* —— FOOTER —— */}
          <footer className="border-t border-slate-200 bg-slate-50 px-5 py-5 sm:px-8 print:shrink-0 print:px-7 print:py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:flex-row print:items-start print:gap-x-8 print:gap-y-1">
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-10 print:flex-row print:gap-8">
                <div>
                  <Label>{s.total}</Label>
                  <p className="mt-1 text-xl font-extrabold text-slate-900 print:text-xl">{totalPriceLabel}</p>
                </div>
                {paidAmountLabel ? (
                  <div>
                    <Label>{s.paid}</Label>
                    <p className="mt-1 text-lg font-bold text-emerald-800 print:text-lg">{paidAmountLabel}</p>
                  </div>
                ) : null}
              </div>
              <div className="max-w-md sm:text-right print:max-w-[50%] print:text-right">
                <Label>{s.meeting}</Label>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-800 print:text-sm print:leading-snug">
                  {meetingPoint}
                </p>
              </div>
            </div>
          </footer>
        </article>

        {/* Aksiyonlar — yazdırmada gizli */}
        <div className="mt-6 flex flex-col gap-3 print:hidden sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3.5 text-center text-sm font-bold transition-colors hover:bg-slate-50 sm:max-w-xs"
            style={{ borderColor: BLUE, color: BLUE }}
          >
            <Printer className="h-5 w-5 shrink-0" aria-hidden />
            {a.printSave}
          </button>
          <Link
            href={manageUrl}
            className="flex-1 rounded-xl py-3.5 text-center text-sm font-bold text-white transition-opacity hover:opacity-95 sm:max-w-xs"
            style={{ backgroundColor: BLUE }}
          >
            {a.manageBooking}
          </Link>
        </div>
        <p className="mt-4 text-center text-sm text-slate-600 print:hidden">
          <Link href={homeUrl} className="font-semibold underline decoration-slate-400 underline-offset-2 hover:text-slate-900">
            {a.backHome}
          </Link>
        </p>
      </div>
    </div>
  )
}
