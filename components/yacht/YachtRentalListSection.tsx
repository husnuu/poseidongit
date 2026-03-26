'use client'

import { useMemo, useState } from 'react'
import YachtCard, { type YachtListItem } from '@/components/yacht/YachtCard'
import YachtRentalFiltersSheet from '@/components/yacht/YachtRentalFiltersSheet'
import YachtRentalSortSheet from '@/components/yacht/YachtRentalSortSheet'
import { sortYachtList, type YachtSortMode } from '@/lib/yachtListSort'
import {
  buildPriceFilterOptions,
  countActiveFilters,
  filterYachtList,
  type CapacityFilterId,
  type CabinFilterId,
} from '@/lib/yachtListFilters'

interface YachtRentalListSectionProps {
  yachts: YachtListItem[]
  emptyStateMessage: string
}

export default function YachtRentalListSection({
  yachts,
  emptyStateMessage,
}: YachtRentalListSectionProps) {
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [sortSheetOpen, setSortSheetOpen] = useState(false)

  const [appliedSort, setAppliedSort] = useState<YachtSortMode>('default')
  const [appliedPriceMax, setAppliedPriceMax] = useState<number | null>(null)
  const [appliedCap, setAppliedCap] = useState<CapacityFilterId>('all')
  const [appliedCab, setAppliedCab] = useState<CabinFilterId>('all')

  const [draftPriceMax, setDraftPriceMax] = useState<number | null>(null)
  const [draftCap, setDraftCap] = useState<CapacityFilterId>('all')
  const [draftCab, setDraftCab] = useState<CabinFilterId>('all')

  const priceOptions = useMemo(() => buildPriceFilterOptions(yachts), [yachts])

  const openFilterSheet = () => {
    setSortSheetOpen(false)
    setDraftPriceMax(appliedPriceMax)
    setDraftCap(appliedCap)
    setDraftCab(appliedCab)
    setFilterSheetOpen(true)
  }

  const applyFilters = () => {
    setAppliedPriceMax(draftPriceMax)
    setAppliedCap(draftCap)
    setAppliedCab(draftCab)
    setFilterSheetOpen(false)
  }

  const clearFilterDraft = () => {
    setDraftPriceMax(null)
    setDraftCap('all')
    setDraftCab('all')
  }

  const filtered = useMemo(
    () => filterYachtList(yachts, appliedPriceMax, appliedCap, appliedCab),
    [yachts, appliedPriceMax, appliedCap, appliedCab]
  )

  const sorted = useMemo(
    () => sortYachtList(filtered, appliedSort),
    [filtered, appliedSort]
  )

  const filterActiveCount = countActiveFilters(appliedPriceMax, appliedCap, appliedCab)

  return (
    <>
      {yachts.length > 0 && (
        <div
          className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          style={{ fontFamily: 'var(--font-family)' }}
        >
          <p className="m-0 text-sm font-semibold text-black/60">
            {sorted.length} yat listeleniyor
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setFilterSheetOpen(false)
                setSortSheetOpen(true)
              }}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border-2 border-zinc-200 bg-white px-5 py-2.5 text-sm font-black uppercase tracking-wide text-zinc-800 shadow-sm transition hover:border-[#1e3a5f]/30 hover:bg-zinc-50 sm:flex-initial"
            >
              <svg className="h-5 w-5 text-[#1e3a5f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
              Sırala
              {appliedSort !== 'default' ? (
                <span className="h-2 w-2 shrink-0 rounded-full bg-teal-600" aria-hidden />
              ) : null}
            </button>
            <button
              type="button"
              onClick={openFilterSheet}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#1e3a5f] bg-white px-5 py-2.5 text-sm font-black uppercase tracking-wide text-[#1e3a5f] shadow-sm transition hover:bg-[#1e3a5f]/[0.06] sm:flex-initial"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filtreler
              {filterActiveCount > 0 ? (
                <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#2168b8] px-1.5 text-xs font-black text-white">
                  {filterActiveCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      )}

      {yachts.length > 0 && sorted.length === 0 ? (
        <p
          className="py-12 text-center text-black/60"
          style={{ fontFamily: 'var(--font-family)' }}
        >
          Seçtiğiniz filtrelere uygun yat bulunamadı. Filtreleri temizleyip tekrar deneyin.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {sorted.map((y) => (
            <YachtCard key={y._id} yacht={y} />
          ))}
        </div>
      )}

      {yachts.length === 0 && (
        <p
          className="py-12 text-center text-black/60"
          style={{ fontFamily: 'var(--font-family)' }}
        >
          {emptyStateMessage}
        </p>
      )}

      <YachtRentalFiltersSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        priceMax={draftPriceMax}
        onPriceMaxChange={setDraftPriceMax}
        priceOptions={priceOptions}
        capacityId={draftCap}
        onCapacityChange={setDraftCap}
        cabinId={draftCab}
        onCabinChange={setDraftCab}
        onApply={applyFilters}
        onClearDraft={clearFilterDraft}
      />

      <YachtRentalSortSheet
        open={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        value={appliedSort}
        onChange={setAppliedSort}
      />
    </>
  )
}
