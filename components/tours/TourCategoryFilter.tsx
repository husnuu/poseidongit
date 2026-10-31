'use client'

import { useEffect, useMemo, useState } from 'react'
import type { SiteLocale } from '@/lib/i18n/config'
import TourCard, { type TourListItem } from '@/components/tours/TourCard'
import ScrollReveal from '@/components/ui/ScrollReveal'
import {
  TOUR_CATEGORIES,
  TOUR_CATEGORY_LABELS,
  TOUR_FILTER_ARIA,
  TOUR_RESULTS_COUNT,
  isTourCategory,
  type TourCategory,
} from '@/lib/tourCategories'

type Filter = TourCategory | 'all'

/** URL'de seçili kategori: /turlar?kategori=private — paylaşılabilir, sayfa önbellekli kalır. */
const QUERY_KEY = 'kategori'

/**
 * Turlar sayfası: kategori butonları (Tümü / Günlük / Özel / Özel günler) +
 * sonuç sayısı + kart ızgarası. Yalnızca en az bir turu olan kategorilerin
 * butonu gösterilir; tek kategori varsa butonlar hiç gösterilmez.
 */
export default function TourCategoryFilter({ tours, locale }: { tours: TourListItem[]; locale: SiteLocale }) {
  const labels = TOUR_CATEGORY_LABELS[locale]
  const [filter, setFilter] = useState<Filter>('all')

  const available = useMemo(
    () => TOUR_CATEGORIES.filter((c) => tours.some((t) => (t.category ?? 'daily') === c)),
    [tours]
  )

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get(QUERY_KEY)
    if (isTourCategory(fromUrl) && available.includes(fromUrl)) setFilter(fromUrl)
  }, [available])

  const select = (next: Filter) => {
    setFilter(next)
    const url = new URL(window.location.href)
    if (next === 'all') url.searchParams.delete(QUERY_KEY)
    else url.searchParams.set(QUERY_KEY, next)
    window.history.replaceState(null, '', url.toString())
  }

  const visible = filter === 'all' ? tours : tours.filter((t) => (t.category ?? 'daily') === filter)
  const options: Filter[] = ['all', ...available]

  return (
    <>
      {available.length > 1 && (
        /* Mobilde tek sıra: butonlar alt satıra kaymaz, sığmazsa yatay kaydırılır
           (kenara kadar kaysın diye -mx-4/px-4; kaydırma çubuğu gizli). */
        <div
          role="group"
          aria-label={TOUR_FILTER_ARIA[locale]}
          className="-mx-4 mb-6 flex flex-nowrap gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:gap-3 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {options.map((opt) => {
            const active = filter === opt
            return (
              <button
                key={opt}
                type="button"
                aria-pressed={active}
                onClick={() => select(opt)}
                className={[
                  'h-10 shrink-0 whitespace-nowrap rounded-lg border-2 px-3.5 text-[12px] font-extrabold uppercase tracking-wide transition sm:h-12 sm:px-6 sm:text-[14px]',
                  active
                    ? 'border-[var(--primary,#2168b8)] bg-[var(--primary,#2168b8)] text-white'
                    : 'border-[var(--primary,#2168b8)] bg-white text-[var(--primary,#2168b8)] hover:bg-[var(--primary,#2168b8)]/[0.06]',
                ].join(' ')}
                style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
              >
                {labels[opt]}
              </button>
            )
          })}
        </div>
      )}

      <p className="mb-5 text-[13px] text-zinc-500" aria-live="polite">
        {TOUR_RESULTS_COUNT[locale](visible.length)}
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {visible.map((tour, i) => (
          <ScrollReveal key={tour._id} delayMs={(i % 3) * 80}>
            <TourCard tour={tour} locale={locale} />
          </ScrollReveal>
        ))}
      </div>
    </>
  )
}
