'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { X } from 'lucide-react'
import type { BookingConfirmationUi } from './bookingConfirmationUi'

interface BoardingPassModalProps {
  open: boolean
  onClose: () => void
  reference: string
  tourTitle: string
  dateFormatted: string
  time?: string
  customerName: string
  guestCountLabel: string
  qrUrl: string | null
  ticketPath: string | null
  ui: BookingConfirmationUi
}

export default function BoardingPassModal({
  open,
  onClose,
  reference,
  tourTitle,
  dateFormatted,
  time,
  customerName,
  guestCountLabel,
  qrUrl,
  ticketPath,
  ui,
}: BoardingPassModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="boarding-pass-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        style={{ fontFamily: 'var(--font-family)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="boarding-pass-title" className="text-lg font-black uppercase tracking-wide text-[#131719] m-0">
            {ui.boardingPassTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={ui.close}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="text-center">
          <p className="m-0 text-base font-bold text-[#131719]">{tourTitle}</p>
          <p className="m-0 mt-1 text-sm text-zinc-500">
            {dateFormatted}
            {time ? ` · ${time}` : ''}
          </p>
        </div>

        <div className="mt-5 flex flex-col items-center rounded-2xl border border-[#f1f5f9] bg-zinc-50/60 p-5">
          {qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl} alt="QR" width={200} height={200} className="h-[200px] w-[200px] object-contain" />
          ) : (
            <div className="flex h-[200px] w-[200px] items-center justify-center text-sm text-zinc-400">QR yok</div>
          )}
          <p className="mt-4 font-mono text-xl font-black tracking-wide text-[#131719]">#{reference}</p>
          <div className="mt-3 flex w-full items-center justify-center gap-8 text-sm">
            <div className="text-center">
              <p className="m-0 text-[11px] uppercase tracking-wide text-zinc-500">{ui.reservationOwner}</p>
              <p className="m-0 mt-0.5 font-semibold text-[#131719]">{customerName}</p>
            </div>
            <div className="text-center">
              <p className="m-0 text-[11px] uppercase tracking-wide text-zinc-500">{ui.guestsCount}</p>
              <p className="m-0 mt-0.5 font-semibold text-[#131719]">{guestCountLabel}</p>
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-[#2168b8]">{ui.boardingPassHint}</p>
        </div>

        {ticketPath && (
          <Link
            href={ticketPath}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center justify-center rounded-xl px-4 py-3 text-center text-sm font-bold text-white"
            style={{ background: 'var(--primary, #2168b8)' }}
          >
            {ui.viewFullTicket}
          </Link>
        )}
      </div>
    </div>,
    document.body
  )
}
