'use client'

import { useRef, useState } from 'react'
import TourCard from '@/components/tours/TourCard'
import type { TourListItem } from '@/components/tours/TourCard'
import type { SiteLocale } from '@/lib/i18n/config'

export type OtherToursSectionProps = {
  items: TourListItem[]
  locale?: SiteLocale
}

const HEADING: Record<SiteLocale, string> = {
  tr: 'Diğer Turlarımız',
  en: 'Other Tours',
  de: 'Weitere Touren',
  ru: 'Другие наши туры',
}

/** Tur detay sayfasının en altında (yorumların altında) — mevcut turu hariç
    tutan, kart halinde diğer turları gösteren bölüm. Başlık tur sayfasındaki
    diğer başlıklarla (TUR PROGRAMI vb.) birebir aynı boyut/kalınlık/renk —
    solda, siyah. Kartlar ana sayfadaki "Popüler Turlarımız" bölümüyle aynı:
    nane zemin, mobilde yana kaydırmalı şerit + nokta göstergesi. */
export default function OtherToursSection({ items, locale = 'tr' }: OtherToursSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el || items.length <= 1) return
    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll <= 0) return
    const ratio = el.scrollLeft / maxScroll
    const idx = Math.round(ratio * (items.length - 1))
    setActiveIndex(Math.max(0, Math.min(items.length - 1, idx)))
  }

  if (!items.length) return null

  return (
    <section
      className="bg-white px-4 pt-8 pb-12 sm:px-6 md:pt-10 md:pb-16 lg:px-10"
      aria-labelledby="other-tours-heading"
    >
      <h2 id="other-tours-heading" className="tourSectionHeading">
        {HEADING[locale]}
      </h2>

      {/* MOBİL: ana sayfadaki gibi yana kaydırmalı kart şeridi + nokta göstergesi */}
      <div className="md:hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((tour) => (
            <div key={tour._id} className="w-[86%] flex-shrink-0 snap-center">
              <TourCard tour={tour} locale={locale} />
            </div>
          ))}
        </div>
        {items.length > 1 && (
          <div className="mt-4 flex justify-center gap-1.5" aria-hidden>
            {items.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === activeIndex ? 'w-5 bg-[var(--secondary,#131719)]' : 'w-1.5 bg-zinc-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* DESKTOP: klasik grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((tour) => (
          <TourCard key={tour._id} tour={tour} locale={locale} />
        ))}
      </div>
    </section>
  )
}
