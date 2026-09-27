'use client'

import { useMemo, useState } from 'react'
import HomePopularYachtCard from '@/components/home/HomePopularYachtCard'
import type { YachtListCardItem } from '@/lib/yachtListPrice'
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
import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtUi } from '@/lib/i18n/yachtUi'

interface YachtRentalListSectionProps {
  yachts: YachtListCardItem[]
  emptyStateMessage: string
  locale?: SiteLocale
}

export default function YachtRentalListSection({
  yachts,
  emptyStateMessage,
  locale = 'tr',
}: YachtRentalListSectionProps) {
  const ui = getYachtUi(locale)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [sortSheetOpen, setSortSheetOpen] = useState(false)

  const [appliedSort, setAppliedSort] = useState<YachtSortMode>('default')
  const [appliedPriceMax, setAppliedPriceMax] = useState<number | null>(null)
  const [appliedCap, setAppliedCap] = useState<CapacityFilterId>('all')
  const [appliedCab, setAppliedCab] = useState<CabinFilterId>('all')

  const [draftPriceMax, setDraftPriceMax] = useState<number | null>(null)
  const [draftCap, setDraftCap] = useState<CapacityFilterId>('all')
  const [draftCab, setDraftCab] = useState<CabinFilterId>('all')

  const priceOptions = useMemo(() => buildPriceFilterOptions(yachts, locale), [yachts, locale])

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
            {ui.yachtsListedCount(sorted.length)}
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setFilterSheetOpen(false)
                setSortSheetOpen(true)
              }}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg border-2 bg-white px-5 py-2.5 text-sm font-normal uppercase tracking-wide shadow-sm transition duration-200 hover:scale-105 hover:bg-[var(--primary)]/[0.06] sm:flex-initial"
              style={{ borderColor: 'var(--primary, #2168b8)', color: 'var(--primary, #2168b8)' }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
              {ui.sortButton}
              {appliedSort !== 'default' ? (
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: 'var(--primary, #2168b8)' }} aria-hidden />
              ) : null}
            </button>
            <button
              type="button"
              onClick={openFilterSheet}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg border-2 bg-white px-5 py-2.5 text-sm font-normal uppercase tracking-wide shadow-sm transition duration-200 hover:scale-105 hover:bg-[var(--primary)]/[0.06] sm:flex-initial"
              style={{ borderColor: 'var(--primary, #2168b8)', color: 'var(--primary, #2168b8)' }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              {ui.filtersButton}
              {filterActiveCount > 0 ? (
                <span
                  className="flex h-6 min-w-[24px] items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
                  style={{ background: 'var(--primary, #2168b8)' }}
                >
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
          {ui.noResultsMessage}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {sorted.map((y) => (
            <HomePopularYachtCard key={y._id} yacht={y} locale={locale} />
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
        locale={locale}
      />

      <YachtRentalSortSheet
        open={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        value={appliedSort}
        onChange={setAppliedSort}
        locale={locale}
      />
    </>
  )
}
