'use client'

import React from 'react'
import Link from 'next/link'
import { Plane } from 'lucide-react'

export type BoardingPassTicketProps = {
  bookingId: string
  tourTitle: string
  tourImageUrl: string | null
  dateFormatted: string
  time: string | undefined
  durationLabel: string | null
  meetingPoint: string
  customerName: string
  participants: string
  className: string
  totalPrice: number
  currency: string
  status: string
  pdfDownloadUrl: string
  manageUrl: string
  homeUrl: string
  qrImageUrl?: string
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

function arrivalTimeAfter(time: string | undefined): string | null {
  if (!time?.trim()) return null
  const m = time.trim().match(/^(\d{1,2})\s*:\s*(\d{2})/)
  if (!m) return null
  let h = parseInt(m[1], 10)
  let min = parseInt(m[2], 10)
  min += 10
  if (min >= 60) {
    min -= 60
    h += 1
  }
  h += 7
  if (h >= 24) h -= 24
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

export default function BoardingPassTicket({
  bookingId,
  tourTitle,
  tourImageUrl,
  dateFormatted,
  time,
  durationLabel,
  meetingPoint,
  customerName,
  participants,
  className,
  totalPrice,
  currency,
  status,
  pdfDownloadUrl,
  manageUrl,
  homeUrl,
  qrImageUrl,
}: BoardingPassTicketProps) {
  const totalPriceLabel = `${totalPrice.toLocaleString('tr-TR')} ${currency}`
  const boardingTime = boardingTimeBefore(time) ?? time ?? '—'
  const arrivalTime = arrivalTimeAfter(time) ?? '—'

  return (
    <div
      className="min-h-screen bg-[#e5e7eb] px-3 py-6"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <div className="mx-auto w-full max-w-[420px] space-y-4">
        {/* ——— SOL KART (Ana biniş kartı) ——— */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          {/* Mavi başlık: BİNİŞ KARTI + Güzergâh */}
          <div
            className="relative px-5 pt-5 pb-6"
            style={{ backgroundColor: BLUE }}
          >
            <div className="flex justify-center">
              <span
                className="rounded-md border-2 border-white/40 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white"
                style={{ borderColor: 'rgba(255,255,255,0.5)' }}
              >
                Biniş Kartı
              </span>
            </div>

            {/* Güzergâh: Nereden — uçak çizgisi — Nereye */}
            <div className="mt-6 flex items-start justify-between gap-4">
              <div className="flex flex-1 flex-col items-center text-center">
                <p className="text-lg font-extrabold uppercase leading-tight text-white">
                  Çeşme
                </p>
                <p className="mt-1 text-xs font-medium text-white/95">
                  {boardingTime}
                </p>
                <p className="mt-0.5 text-[10px] text-white/80">
                  (biniş, kalkıştan 30 dk önce)
                </p>
              </div>

              <div className="relative flex shrink-0 items-center px-2 pt-6">
                <svg
                  width="48"
                  height="24"
                  viewBox="0 0 48 24"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M2 12 Q 24 2 46 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    fill="none"
                  />
                  <path
                    d="M24 8 L28 12 L24 16 L26 12 Z"
                    fill="currentColor"
                    transform="translate(0,0)"
                  />
                </svg>
                <Plane
                  className="absolute left-1/2 top-6 h-4 w-4 -translate-x-1/2 text-white"
                  strokeWidth={2.5}
                />
              </div>

              <div className="flex flex-1 flex-col items-center text-center">
                <p className="line-clamp-2 text-base font-extrabold uppercase leading-tight text-white md:text-lg">
                  {tourTitle.length > 12 ? tourTitle.slice(0, 10) + '…' : tourTitle}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[10px] font-semibold uppercase tracking-wider text-white/90">
                  {tourTitle}
                </p>
                <p className="mt-1 text-xs font-medium text-white/95">—</p>
              </div>
            </div>
          </div>

          {/* Beyaz alan: satırlar (kesik çizgi ayırıcılı) */}
          <div className="border-t border-dashed border-gray-300 px-5 py-4">
            <CardRow
              leftLabel="Tur"
              leftValue={tourTitle.length > 14 ? tourTitle.slice(0, 12) + '…' : tourTitle}
              leftHighlight
              rightLabel="Tarih"
              rightValue={dateFormatted}
            />
            <div className="my-3 border-t border-dashed border-gray-300" />
            <CardRow
              leftLabel="Toplanma"
              leftValue={meetingPoint}
              rightLabel="Biniş"
              rightValue={boardingTime}
            />
            <div className="my-3 border-t border-dashed border-gray-300" />
            <CardRow
              leftLabel="Sınıf"
              leftValue={className}
              rightLabel="Kalkış"
              rightValue={time ?? '—'}
            />
            <div className="my-3 border-t border-dashed border-gray-300" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Yolcu
                </p>
                <p className="mt-0.5 font-bold text-gray-900" style={{ color: BLUE_LIGHT }}>
                  {customerName}
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Rezervasyon No
                </p>
                <p className="mt-0.5 font-mono text-sm font-bold" style={{ color: BLUE_LIGHT }}>
                  {bookingId}
                </p>
              </div>
              {qrImageUrl && (
                <div className="shrink-0 rounded-lg border border-gray-200 bg-white p-1.5">
                  <img
                    src={qrImageUrl}
                    alt="QR"
                    width={64}
                    height={64}
                    className="h-16 w-16 object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ——— SAĞ KART (QR / Biniş doğrulama) ——— */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="border-b border-dashed border-gray-300 px-5 py-4">
            <div className="flex justify-between text-center">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Kalkış
                </p>
                <p className="mt-1 font-bold text-gray-900">{time ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Biniş
                </p>
                <p className="mt-1 font-bold text-gray-900">{boardingTime}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Varış
                </p>
                <p className="mt-1 font-bold text-gray-900">{arrivalTime}</p>
              </div>
            </div>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Tur
            </p>
            <p className="mt-0.5 font-bold text-gray-900">{tourTitle}</p>
          </div>

          <div className="relative flex justify-center border-b border-dashed border-gray-300 py-3">
            <span className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 border-t border-dashed border-gray-300 bg-white" />
            <Plane
              className="relative z-10 h-5 w-5 rounded-full bg-white px-1 text-gray-400"
              style={{ color: BLUE }}
              strokeWidth={2}
            />
          </div>

          <p className="px-4 py-2 text-center text-[11px] font-semibold uppercase leading-snug text-gray-600">
            Binişte bu QR kodu gösterin
          </p>

          {qrImageUrl && (
            <div className="flex justify-center px-6 pb-4">
              <div className="rounded-xl border-2 border-gray-200 bg-white p-3">
                <img
                  src={qrImageUrl}
                  alt="QR Biniş Kodu"
                  width={160}
                  height={160}
                  className="h-40 w-40 object-contain"
                />
              </div>
            </div>
          )}

          {/* Mavi alt şerit */}
          <div
            className="flex justify-between px-5 py-4 text-white"
            style={{ backgroundColor: BLUE }}
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/85">
                Yolcu
              </p>
              <p className="mt-0.5 font-bold">{customerName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/85">
                Rezervasyon No
              </p>
              <p className="mt-0.5 font-mono text-sm font-bold">{bookingId}</p>
            </div>
          </div>
        </div>

        {/* Toplam & Toplanma (küçük bilgi) */}
        <div className="rounded-2xl bg-white px-5 py-4 shadow-md">
          <div className="flex justify-between">
            <span className="text-sm font-semibold text-gray-500">Toplam</span>
            <span className="font-bold text-gray-900">{totalPriceLabel}</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Toplanma: {meetingPoint}
          </p>
        </div>

        {/* Aksiyonlar */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={pdfDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-xl border-2 py-3.5 text-center text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100"
            style={{ borderColor: BLUE, color: BLUE }}
          >
            PDF İndir
          </a>
          <Link
            href={manageUrl}
            className="flex-1 rounded-xl py-3.5 text-center text-sm font-bold text-white transition-opacity hover:opacity-95"
            style={{ backgroundColor: BLUE }}
          >
            Rezervasyonu Yönet
          </Link>
        </div>
        <p className="text-center text-sm text-gray-500">
          <Link href={homeUrl} className="font-medium underline hover:text-gray-700">
            Ana sayfaya dön
          </Link>
        </p>
      </div>
    </div>
  )
}

function CardRow({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  leftHighlight,
}: {
  leftLabel: string
  leftValue: string
  rightLabel: string
  rightValue: string
  leftHighlight?: boolean
}) {
  return (
    <div className="flex justify-between gap-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          {leftLabel}
        </p>
        <p
          className={`mt-0.5 font-bold ${leftHighlight ? '' : 'text-gray-900'}`}
          style={leftHighlight ? { color: BLUE_LIGHT } : undefined}
        >
          {leftValue}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          {rightLabel}
        </p>
        <p className="mt-0.5 font-bold text-gray-900">{rightValue}</p>
      </div>
    </div>
  )
}
