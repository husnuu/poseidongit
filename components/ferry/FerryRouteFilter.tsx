'use client'

import { useEffect, useMemo, useState } from 'react'
import type { SiteLocale } from '@/lib/i18n/config'
import FerryRouteCard, { type FerryRouteListItem } from '@/components/ferry/FerryRouteCard'
import { TOUR_RESULTS_COUNT } from '@/lib/tourCategories'
import type { IslandKey } from '@/lib/ferry/islandGuides'

type Filter = IslandKey | 'all'

const ISLAND_ORDER: IslandKey[] = ['sakiz', 'midilli', 'kos']

const LABELS: Record<SiteLocale, Record<Filter, string>> = {
  tr: { all: 'Tümü', sakiz: 'Sakız Adası', midilli: 'Midilli Adası', kos: 'Kos Adası' },
  en: { all: 'All', sakiz: 'Chios', midilli: 'Lesvos', kos: 'Kos' },
  de: { all: 'Alle', sakiz: 'Chios', midilli: 'Lesbos', kos: 'Kos' },
  ru: { all: 'Все', sakiz: 'Хиос', midilli: 'Лесбос', kos: 'Кос' },
}

const FILTER_ARIA: Record<SiteLocale, string> = {
  tr: 'Varış adası',
  en: 'Destination island',
  de: 'Zielinsel',
  ru: 'Остров назначения',
}

/** URL'de seçili ada: /feribot?ada=midilli — paylaşılabilir, sayfa önbellekli kalır. */
const QUERY_KEY = 'ada'

function isIslandKey(v: string | null): v is IslandKey {
  return v != null && (ISLAND_ORDER as string[]).includes(v)
}

/**
 * Feribot biletleri sayfası: varış adasına göre butonlar (Tümü / Sakız / Midilli / Kos)
 * + sonuç sayısı + kart ızgarası — turlar sayfasındaki TourCategoryFilter ile aynı görünüm.
 * Yalnızca en az bir hattı olan adaların butonu gösterilir.
 */
export default function FerryRouteFilter({ routes, locale }: { routes: FerryRouteListItem[]; locale: SiteLocale }) {
  const labels = LABELS[locale]
  const [filter, setFilter] = useState<Filter>('all')

  const available = useMemo(() => ISLAND_ORDER.filter((key) => routes.some((r) => r.island === key)), [routes])

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get(QUERY_KEY)
    if (isIslandKey(fromUrl) && available.includes(fromUrl)) setFilter(fromUrl)
  }, [available])

  const select = (next: Filter) => {
    setFilter(next)
    const url = new URL(window.location.href)
    if (next === 'all') url.searchParams.delete(QUERY_KEY)
    else url.searchParams.set(QUERY_KEY, next)
    window.history.replaceState(null, '', url.toString())
  }

  const visible = filter === 'all' ? routes : routes.filter((r) => r.island === filter)
  const options: Filter[] = ['all', ...available]

  return (
    <>
      {available.length > 1 && (
        /* Mobilde tek sıra: sığmazsa yatay kaydırılır (turlar sayfasıyla aynı). */
        <div
          role="group"
          aria-label={FILTER_ARIA[locale]}
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
        {visible.map((route) => (
          <FerryRouteCard key={route._id} route={route} locale={locale} />
        ))}
      </div>
    </>
  )
}
