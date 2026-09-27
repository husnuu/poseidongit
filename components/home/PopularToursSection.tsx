'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import TourCard from '@/components/tours/TourCard'
import type { TourListItem } from '@/components/tours/TourCard'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'

const VIEW_ALL_LABEL: Record<SiteLocale, string> = {
  tr: 'Tüm Turları Görüntüle',
  en: 'View All Tours',
  de: 'Alle Touren anzeigen',
}

export type PopularToursSectionData = {
  enabled?: boolean | null
  title?: string | null
  subtitle?: string | null
  items?: TourListItem[] | null
}

type PopularToursSectionProps = {
  data: PopularToursSectionData | null
  locale?: SiteLocale
  /** Başlık boyutunu geçersiz kılmak için (varsayılan: ana sayfadaki büyük başlık). */
  headingClassName?: string
}

const DEFAULT_HEADING_CLASS =
  'text-[32px] font-black uppercase leading-[1.15] mb-6 sm:text-[38px] md:text-[42px] lg:text-[46px]'

export default function PopularToursSection({ data, locale = 'tr', headingClassName }: PopularToursSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.08, rootMargin: '0px 0px 150px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const itemCount = data?.items?.length ?? 0

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el || itemCount <= 1) return
    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll <= 0) return
    const ratio = el.scrollLeft / maxScroll
    const idx = Math.round(ratio * (itemCount - 1))
    setActiveIndex(Math.max(0, Math.min(itemCount - 1, idx)))
  }

  if (!data?.enabled || !data?.items?.length) return null

  const { title, items } = data
  const localeUpper = locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US'
  const titleUpper = (title || 'Popüler Turlar').trim().toLocaleUpperCase(localeUpper)

  return (
    <section
      ref={sectionRef}
      // Referans: bölümün kendi açık nane zemini (rgb 234,251,247) + altta "Tüm turları görüntüle"
      className="w-full bg-[#eafbf7] transition-all duration-300 ease-out pt-14 pb-12 md:pt-20 md:pb-16"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
      }}
      aria-labelledby="popular-tours-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <header className="mb-6 text-center md:mb-12">
          <h2
            id="popular-tours-heading"
            className={headingClassName ?? DEFAULT_HEADING_CLASS}
            style={{
              fontFamily: 'var(--font-family-title, var(--font-family))',
              fontWeight: 900,
              color: 'var(--primary, #2168b8)',
            }}
          >
            {titleUpper}
          </h2>
        </header>

        {/* MOBİL: yan yana kaydırmalı (swipe) kart şeridi + altta nokta göstergesi
            (referans siteki gibi) — desktop'ta klasik grid kullanılıyor. */}
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

        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((tour, index) => (
            <div
              key={tour._id}
              className="transition-all duration-300 ease-out"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(10px)',
                transitionDelay: visible ? `${Math.min(index, 8) * 60}ms` : '0ms',
              }}
            >
              <TourCard tour={tour} locale={locale} />
            </div>
          ))}
        </div>

        {/* Referans siteki gibi bölümün altında çerçeveli "Tüm turları görüntüle" */}
        <div className="mt-8 flex justify-center md:mt-12">
          <Link
            href={withLocalePath(locale, '/turlar')}
            className="inline-flex h-14 w-auto min-w-[220px] items-center justify-center rounded-lg border-2 bg-transparent px-8 text-[17px] font-bold uppercase tracking-wide no-underline transition hover:bg-[var(--primary)]/[0.06] sm:h-16 sm:w-[260px] sm:px-0"
            style={{ borderColor: 'var(--primary, #2168b8)', color: 'var(--primary, #2168b8)' }}
          >
            {VIEW_ALL_LABEL[locale]}
          </Link>
        </div>
      </div>
    </section>
  )
}
