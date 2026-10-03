'use client'

import { useMemo, useState } from 'react'
import { ArrowUpDown, SlidersHorizontal } from 'lucide-react'
import HomePopularYachtCard from '@/components/home/HomePopularYachtCard'
import ScrollReveal from '@/components/ui/ScrollReveal'
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

  // Filtre popup'ı açıkken "Sonuçları göster (N)" butonunda canlı önizleme —
  // henüz uygulanmamış taslak seçimlerle kaç tekne kalacağını gösterir.
  const draftFilteredCount = useMemo(
    () => filterYachtList(yachts, draftPriceMax, draftCap, draftCab).length,
    [yachts, draftPriceMax, draftCap, draftCab]
  )

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
          <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
            {/* Menü ve Yardım Merkezi kategori sekmeleriyle birebir aynı buton dili:
                rounded-lg + border-2, aktifken dolu mavi, pasifken beyaz/mavi kontur. */}
            <button
              type="button"
              onClick={() => {
                setFilterSheetOpen(false)
                setSortSheetOpen(true)
              }}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition duration-200 hover:scale-105"
              style={
                appliedSort !== 'default'
                  ? { background: 'var(--primary, #2168b8)', borderColor: 'var(--primary, #2168b8)', color: '#fff' }
                  : { background: '#fff', borderColor: 'var(--primary, #2168b8)', color: 'var(--primary, #2168b8)' }
              }
            >
              <ArrowUpDown className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              {ui.sortButton}
            </button>
            <button
              type="button"
              onClick={openFilterSheet}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition duration-200 hover:scale-105"
              style={
                filterActiveCount > 0
                  ? { background: 'var(--primary, #2168b8)', borderColor: 'var(--primary, #2168b8)', color: '#fff' }
                  : { background: '#fff', borderColor: 'var(--primary, #2168b8)', color: 'var(--primary, #2168b8)' }
              }
            >
              <SlidersHorizontal className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              {ui.filtersButton}
              {filterActiveCount > 0 ? (
                <span
                  className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold"
                  style={{ color: 'var(--primary, #2168b8)' }}
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
          {sorted.map((y, i) => (
            <ScrollReveal key={y._id} delayMs={(i % 3) * 80}>
              <HomePopularYachtCard yacht={y} locale={locale} />
            </ScrollReveal>
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
        resultCount={draftFilteredCount}
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
