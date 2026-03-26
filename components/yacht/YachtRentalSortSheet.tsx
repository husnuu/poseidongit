'use client'

import { useEffect, useId } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowDownCircle,
  ArrowDownNarrowWide,
  ArrowUpCircle,
  ArrowUpNarrowWide,
  BedDouble,
  BadgeCheck,
  X,
} from 'lucide-react'
import type { YachtSortMode } from '@/lib/yachtListSort'

const ACCENT = '#0f766e'
const ACCENT_RING = 'rgba(15, 118, 110, 0.35)'

const ROWS: { value: YachtSortMode; label: string; Icon: LucideIcon }[] = [
  { value: 'default', label: 'Önerilen', Icon: BadgeCheck },
  { value: 'price_asc', label: 'Fiyat: düşükten yükseğe', Icon: ArrowDownCircle },
  { value: 'price_desc', label: 'Fiyat: yüksekten düşüğe', Icon: ArrowUpCircle },
  { value: 'capacity_asc', label: 'Kapasite: azdan çoğa', Icon: ArrowDownNarrowWide },
  { value: 'capacity_desc', label: 'Kapasite: çoktan aza', Icon: ArrowUpNarrowWide },
  { value: 'cabins_asc', label: 'Kabin: azdan çoğa', Icon: BedDouble },
  { value: 'cabins_desc', label: 'Kabin: çoktan aza', Icon: BedDouble },
]

interface YachtRentalSortSheetProps {
  open: boolean
  onClose: () => void
  value: YachtSortMode
  onChange: (mode: YachtSortMode) => void
}

export default function YachtRentalSortSheet({
  open,
  onClose,
  value,
  onChange,
}: YachtRentalSortSheetProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const handlePick = (mode: YachtSortMode) => {
    onChange(mode)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[85] flex flex-col justify-end sm:justify-center sm:p-4" role="presentation">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[86] flex max-h-[min(85dvh,640px)] w-full flex-col rounded-t-3xl bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.12)] sm:mx-auto sm:max-w-lg sm:rounded-3xl"
        style={{ fontFamily: 'var(--font-family)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex shrink-0 items-center justify-center border-b border-zinc-100 px-4 py-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100"
            aria-label="Kapat"
          >
            <X className="h-6 w-6" strokeWidth={2} />
          </button>
          <h2 id={titleId} className="m-0 text-center text-base font-bold text-zinc-900">
            Sıralama
          </h2>
        </div>

        <ul className="m-0 list-none overflow-y-auto overscroll-contain p-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {ROWS.map(({ value: v, label, Icon }) => {
            const selected = value === v
            return (
              <li key={v} className="border-b border-zinc-100 last:border-b-0">
                <button
                  type="button"
                  onClick={() => handlePick(v)}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-zinc-50 active:bg-zinc-100"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                      selected ? 'bg-teal-50 text-teal-700' : 'bg-zinc-100 text-zinc-600'
                    }`}
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-zinc-900">
                    {label}
                  </span>
                  <span
                    className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition"
                    style={
                      selected
                        ? {
                            borderColor: ACCENT,
                            boxShadow: `0 0 0 3px ${ACCENT_RING}`,
                          }
                        : { borderColor: '#d4d4d8' }
                    }
                    aria-hidden
                  >
                    {selected ? (
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: ACCENT }}
                      />
                    ) : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
