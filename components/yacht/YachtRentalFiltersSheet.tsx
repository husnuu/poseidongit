'use client'

import { useEffect, useId } from 'react'
import { X } from 'lucide-react'
import type { PriceFilterOption } from '@/lib/yachtListFilters'
import type { CapacityFilterId, CabinFilterId } from '@/lib/yachtListFilters'
import { getCapacityOptions, getCabinOptions, countActiveFilters } from '@/lib/yachtListFilters'
import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtUi } from '@/lib/i18n/yachtUi'

const ACCENT = '#2168b8'

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
  /** Taslak (henüz uygulanmamış) seçimlerle kaç sonuç kalacağı — "Sonuçları göster (N)" butonunda. */
  resultCount: number
  locale?: SiteLocale
}

/** Seçim çipi: grup içinde tek seçim (davranış eskisiyle aynı). Seçili çip
    marka mavisi dolgu + beyaz yazı + onay işareti; seçili değilse ince
    kenarlıklı beyaz hap. */
function CheckboxOption({
  selected,
  label,
  onClick,
}: {
  selected: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-[14px] font-bold leading-none transition duration-150 ${
        selected
          ? 'border-[var(--primary,#2168b8)] bg-[var(--primary,#2168b8)] text-white'
          : 'border-[#d3dce6] bg-white text-[var(--secondary,#131719)] hover:border-[#8a9db3]'
      }`}
    >
      {selected ? (
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
      {label}
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
  resultCount,
  locale = 'tr',
}: YachtRentalFiltersSheetProps) {
  const ui = getYachtUi(locale)
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

  const capacityOpts = getCapacityOptions(locale)
  const cabinOpts = getCabinOptions(locale)
  const hasDraftFilters = countActiveFilters(priceMax, capacityId, cabinId) > 0

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end sm:justify-center sm:p-4" role="presentation">
      <button
        type="button"
        aria-label={ui.filtersCloseAria}
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
        <div className="flex shrink-0 flex-col border-b border-zinc-100 px-5 pt-4 pb-4 sm:px-6">
          <span className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-zinc-300 sm:hidden" aria-hidden />
          <div className="flex items-center justify-between gap-3">
            <h2 id={titleId} className="m-0 text-[18px] font-extrabold uppercase tracking-tight text-[var(--secondary,#131719)]">
              {ui.filtersTitle}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={ui.filtersCloseAria}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <section className="mb-6 border-b border-zinc-100 pb-6">
            <h3 className="mb-3 text-[13px] font-extrabold uppercase tracking-wide text-[var(--secondary,#131719)]">
              {ui.filtersDailyPriceTitle}
            </h3>
            <div className="flex flex-wrap gap-2">
              {priceOptions.map((opt) => {
                const selected =
                  opt.maxPrice === null
                    ? priceMax === null
                    : priceMax === opt.maxPrice
                return (
                  <CheckboxOption
                    key={opt.id}
                    selected={selected}
                    label={opt.label}
                    onClick={() => onPriceMaxChange(selected ? null : opt.maxPrice)}
                  />
                )
              })}
            </div>
          </section>

          <section className="mb-6 border-b border-zinc-100 pb-6">
            <h3 className="mb-3 text-[13px] font-extrabold uppercase tracking-wide text-[var(--secondary,#131719)]">
              {ui.filtersCapacityTitle}
            </h3>
            <div className="flex flex-wrap gap-2">
              {capacityOpts.map((o) => (
                <CheckboxOption
                  key={o.id}
                  selected={capacityId === o.id}
                  label={o.label}
                  onClick={() => onCapacityChange(capacityId === o.id ? 'all' : o.id)}
                />
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-[13px] font-extrabold uppercase tracking-wide text-[var(--secondary,#131719)]">
              {ui.filtersCabinsTitle}
            </h3>
            <div className="flex flex-wrap gap-2">
              {cabinOpts.map((o) => (
                <CheckboxOption
                  key={o.id}
                  selected={cabinId === o.id}
                  label={o.label}
                  onClick={() => onCabinChange(cabinId === o.id ? 'all' : o.id)}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-zinc-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          <button
            type="button"
            onClick={onClearDraft}
            disabled={!hasDraftFilters}
            className="h-12 shrink-0 rounded-lg border-2 border-[var(--primary,#2168b8)] bg-white px-4 text-[13px] font-extrabold uppercase tracking-wide text-[var(--primary,#2168b8)] transition hover:bg-[var(--primary,#2168b8)]/[0.06] disabled:cursor-not-allowed disabled:border-[#d3dce6] disabled:text-zinc-400 disabled:hover:bg-white"
          >
            {ui.filtersClearButton}
          </button>
          <button
            type="button"
            onClick={onApply}
            className="h-12 flex-1 rounded-lg text-[13px] font-extrabold uppercase tracking-wide text-white transition duration-200 hover:brightness-110 sm:flex-initial sm:px-8"
            style={{ backgroundColor: ACCENT }}
          >
            {ui.filtersApplyButtonWithCount(resultCount)}
          </button>
        </div>
      </div>
    </div>
  )
}
