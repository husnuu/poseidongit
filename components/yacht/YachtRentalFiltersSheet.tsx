'use client'

import { useEffect, useId } from 'react'
import type { PriceFilterOption } from '@/lib/yachtListFilters'
import type { CapacityFilterId, CabinFilterId } from '@/lib/yachtListFilters'
import { getCapacityOptions, getCabinOptions } from '@/lib/yachtListFilters'

const ACCENT = '#2168b8'
const ACCENT_DARK = '#1e3a5f'

interface YachtRentalFiltersSheetProps {
  open: boolean
  onClose: () => void
  priceMax: number | null
  onPriceMaxChange: (max: number | null) => void
  priceOptions: PriceFilterOption[]
  capacityId: CapacityFilterId
  onCapacityChange: (v: CapacityFilterId) => void
  cabinId: CabinFilterId
  onCabinChange: (v: CabinFilterId) => void
  onApply: () => void
  onClearDraft: () => void
}

function Pill({
  selected,
  children,
  onClick,
  fullWidth,
}: {
  selected: boolean
  children: React.ReactNode
  onClick: () => void
  fullWidth?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
        fullWidth ? 'w-full text-left' : 'shrink-0 text-left'
      } ${
        selected
          ? 'border-transparent text-white shadow-sm'
          : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300'
      }`}
      style={
        selected
          ? { backgroundColor: ACCENT, borderColor: ACCENT }
          : undefined
      }
    >
      {children}
    </button>
  )
}

export default function YachtRentalFiltersSheet({
  open,
  onClose,
  priceMax,
  onPriceMaxChange,
  priceOptions,
  capacityId,
  onCapacityChange,
  cabinId,
  onCabinChange,
  onApply,
  onClearDraft,
}: YachtRentalFiltersSheetProps) {
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

  const capacityOpts = getCapacityOptions()
  const cabinOpts = getCabinOptions()

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end sm:justify-center sm:p-4" role="presentation">
      <button
        type="button"
        aria-label="Filtreleri kapat"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[81] flex max-h-[min(88dvh,720px)] w-full flex-col rounded-t-3xl bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.12)] sm:mx-auto sm:max-w-lg sm:rounded-3xl"
        style={{ fontFamily: 'var(--font-family)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 flex-col items-center border-b border-zinc-100 px-4 pb-3 pt-2">
          <span
            className="mb-2 h-1 w-10 rounded-full bg-zinc-300"
            aria-hidden
          />
          <h2 id={titleId} className="m-0 text-lg font-black tracking-tight" style={{ color: ACCENT_DARK }}>
            Filtreler
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
          <section className="mb-8">
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-900">Günlük fiyat</h3>
            <div className="flex flex-wrap gap-2">
              {priceOptions.map((opt) => {
                const selected =
                  opt.maxPrice === null
                    ? priceMax === null
                    : priceMax === opt.maxPrice
                return (
                  <Pill
                    key={opt.id}
                    selected={selected}
                    onClick={() => onPriceMaxChange(opt.maxPrice)}
                  >
                    {opt.label}
                  </Pill>
                )
              })}
            </div>
          </section>

          <section className="mb-8">
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-900">Kişi kapasitesi</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {capacityOpts.map((o) => (
                <Pill
                  key={o.id}
                  fullWidth
                  selected={capacityId === o.id}
                  onClick={() => onCapacityChange(o.id)}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        capacityId === o.id
                          ? 'border-white bg-white/20'
                          : 'border-zinc-300 bg-white'
                      }`}
                    >
                      {capacityId === o.id ? (
                        <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" aria-hidden>
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </span>
                    {o.label}
                  </span>
                </Pill>
              ))}
            </div>
          </section>

          <section className="mb-2">
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-900">Kabin sayısı</h3>
            <div className="flex flex-wrap gap-2">
              {cabinOpts.map((o) => (
                <Pill
                  key={o.id}
                  selected={cabinId === o.id}
                  onClick={() => onCabinChange(o.id)}
                >
                  {o.label}
                </Pill>
              ))}
            </div>
          </section>
        </div>

        <div className="shrink-0 border-t border-zinc-100 bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClearDraft}
              className="flex-1 rounded-xl border-2 border-zinc-200 py-3.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
            >
              Temizle
            </button>
            <button
              type="button"
              onClick={onApply}
              className="flex-1 rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition hover:opacity-95"
              style={{ backgroundColor: ACCENT }}
            >
              Uygula
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
