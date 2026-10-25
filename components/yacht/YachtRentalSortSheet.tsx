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
import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtUi, type YachtUi } from '@/lib/i18n/yachtUi'


function sortRows(ui: YachtUi): { value: YachtSortMode; label: string; Icon: LucideIcon }[] {
  return [
    { value: 'default', label: ui.sortDefault, Icon: BadgeCheck },
    { value: 'price_asc', label: ui.sortPriceAsc, Icon: ArrowDownCircle },
    { value: 'price_desc', label: ui.sortPriceDesc, Icon: ArrowUpCircle },
    { value: 'capacity_asc', label: ui.sortCapacityAsc, Icon: ArrowDownNarrowWide },
    { value: 'capacity_desc', label: ui.sortCapacityDesc, Icon: ArrowUpNarrowWide },
    { value: 'cabins_asc', label: ui.sortCabinsAsc, Icon: BedDouble },
    { value: 'cabins_desc', label: ui.sortCabinsDesc, Icon: BedDouble },
  ]
}

interface YachtRentalSortSheetProps {
  open: boolean
  onClose: () => void
  value: YachtSortMode
  onChange: (mode: YachtSortMode) => void
  locale?: SiteLocale
}

export default function YachtRentalSortSheet({
  open,
  onClose,
  value,
  onChange,
  locale = 'tr',
}: YachtRentalSortSheetProps) {
  const ui = getYachtUi(locale)
  const ROWS = sortRows(ui)
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
        aria-label={ui.sortCloseAria}
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
        <div className="flex shrink-0 flex-col border-b border-zinc-100 px-5 pt-4 pb-4 sm:px-6">
          <span className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-zinc-300 sm:hidden" aria-hidden />
          <div className="flex items-center justify-between gap-3">
            <h2 id={titleId} className="m-0 text-[18px] font-extrabold uppercase tracking-tight text-[var(--secondary,#131719)]">
              {ui.sortTitle}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={ui.sortCloseAria}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Seçim satırları: kenarlıklı yuvarlak satırlar, ikonlar sade siyah
            (zemin dairesi yok). Seçili satır mavi kenarlık + hafif mavi zemin
            ve sağda onay işareti. */}
        <ul className="m-0 flex list-none flex-col gap-2 overflow-y-auto overscroll-contain p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6">
          {ROWS.map(({ value: v, label, Icon }) => {
            const selected = value === v
            return (
              <li key={v}>
                <button
                  type="button"
                  onClick={() => handlePick(v)}
                  aria-pressed={selected}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition duration-150 ${
                    selected
                      ? 'border-[var(--primary,#2168b8)] bg-[var(--primary,#2168b8)]/[0.05]'
                      : 'border-[#d3dce6] bg-white hover:border-[#8a9db3]'
                  }`}
                  style={selected ? { boxShadow: 'inset 0 0 0 1px var(--primary, #2168b8)' } : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0 text-[var(--secondary,#131719)]" strokeWidth={2} aria-hidden />
                  <span
                    className={`min-w-0 flex-1 text-[15px] leading-snug text-[var(--secondary,#131719)] ${
                      selected ? 'font-extrabold' : 'font-semibold'
                    }`}
                  >
                    {label}
                  </span>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                      selected ? 'border-[var(--primary,#2168b8)] bg-[var(--primary,#2168b8)] text-white' : 'border-[#d3dce6] bg-white'
                    }`}
                    aria-hidden
                  >
                    {selected ? (
                      <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
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
