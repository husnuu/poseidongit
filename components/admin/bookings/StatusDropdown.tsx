'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { BookingStatus } from '@/types/adminBookings'

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Beklemede',
  paid: 'Ödendi',
  failed: 'Ödeme başarısız',
  cancelled: 'İptal',
}

/** Tutarlı renk sistemi: ödendi yeşil, beklemede amber, iptal/başarısız kırmızı. */
export const STATUS_DOT_CLASS: Record<BookingStatus, string> = {
  pending: 'bg-amber-500',
  paid: 'bg-emerald-500',
  failed: 'bg-rose-500',
  cancelled: 'bg-red-500',
}

const STATUS_TEXT_CLASS: Record<BookingStatus, string> = {
  pending: 'text-amber-700',
  paid: 'text-emerald-700',
  failed: 'text-rose-700',
  cancelled: 'text-red-700',
}

const ORDER: BookingStatus[] = ['pending', 'paid', 'failed', 'cancelled']

interface StatusDropdownProps {
  status: BookingStatus
  onChange: (status: BookingStatus) => void
  disabled?: boolean
  compact?: boolean
}

/** Önceden ayrı ayrı gösterilen rozet + native select tek bir "● Ödendi ▾"
    tetikleyicisine indirildi — aynı bilginin iki kez gösterilmesini önler. */
export default function StatusDropdown({ status, onChange, disabled, compact }: StatusDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-bold hover:border-zinc-300 focus:border-[#2168b8] focus:outline-none disabled:opacity-50 ${STATUS_TEXT_CLASS[status]} ${compact ? 'w-full justify-between' : ''}`}
      >
        <span className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT_CLASS[status]}`} aria-hidden />
        {STATUS_LABELS[status]}
        <ChevronDown className="size-3 shrink-0 opacity-60" aria-hidden />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-[calc(100%+4px)] z-20 min-w-[160px] overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-[0_8px_24px_rgba(19,23,25,0.12)]"
        >
          {ORDER.map((s) => (
            <button
              key={s}
              type="button"
              role="option"
              aria-selected={s === status}
              onClick={() => {
                setOpen(false)
                if (s !== status) onChange(s)
              }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-semibold hover:bg-zinc-50 ${s === status ? 'bg-zinc-50' : ''}`}
            >
              <span className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT_CLASS[s]}`} aria-hidden />
              <span className={STATUS_TEXT_CLASS[s]}>{STATUS_LABELS[s]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
