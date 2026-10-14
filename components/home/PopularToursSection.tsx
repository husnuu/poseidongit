'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import TourCard from '@/components/tours/TourCard'
import type { TourListItem } from '@/components/tours/TourCard'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'

const VIEW_ALL_LABEL: Record<SiteLocale, string> = {
  tr: 'Tüm Turları Görüntüle',
  en: 'View All Tours',
  de: 'Alle Touren anzeigen',
  ru: 'Посмотреть все туры',
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
  /** Başlık hizası (varsayılan: 'center', ana sayfadaki gibi). İletişim sayfasında
      diğer bölüm başlıklarıyla tutarlı olması için 'left' kullanılıyor. */
  headingAlign?: 'center' | 'left'
  /** Başlık rengi (varsayılan: site mavisi). */
  headingColor?: string
  /** Bölümün arka plan sınıfı (varsayılan: ana sayfadaki nane yeşili). */
  sectionBgClassName?: string
  /** Alttaki "Tüm Turları Görüntüle" butonunu gizlemek için (İletişim sayfasında kullanılıyor). */
  hideViewAllButton?: boolean
}

const DEFAULT_HEADING_CLASS =
  'text-[28px] font-black uppercase leading-[1.15] mb-6 sm:text-[32px] md:text-[36px] lg:text-[40px]'

export default function PopularToursSection({
  data,
  locale = 'tr',
  headingClassName,
  headingAlign = 'center',
  headingColor,
  sectionBgClassName,
  hideViewAllButton = false,
}: PopularToursSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const desktopScrollRef = useRef<HTMLDivElement>(null)
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

  const scrollDesktop = (dir: 1 | -1) => {
    const el = desktopScrollRef.current
    if (!el) return
    const card = el.children[0] as HTMLElement | undefined
    const amount = card ? card.offsetWidth + 32 : el.clientWidth * 0.8
    el.scrollBy({ left: amount * dir, behavior: 'smooth' })
  }

  if (!data?.enabled || !data?.items?.length) return null

  const { title, items } = data
  const localeUpper = locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US'
  const titleUpper = (title || 'Popüler Turlar').trim().toLocaleUpperCase(localeUpper)

  return (
    <section
      ref={sectionRef}
      // Referans: bölümün kendi açık nane zemini (rgb 234,251,247) + altta "Tüm turları görüntüle"
      className={`w-full ${sectionBgClassName ?? 'bg-[#eafbf7]'} transition-all duration-300 ease-out pt-14 pb-12 md:pt-20 md:pb-16`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
      }}
      aria-labelledby="popular-tours-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <header className={`mb-6 md:mb-12 ${headingAlign === 'left' ? 'text-left' : 'text-center'}`}>
          <h2
            id="popular-tours-heading"
            className={headingClassName ?? DEFAULT_HEADING_CLASS}
            style={{
              fontFamily: 'var(--font-family-title, var(--font-family))',
              fontWeight: 900,
              WebkitTextStroke: '0.6px currentColor',
              color: headingColor ?? 'var(--primary, #2168b8)',
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
            /* Sayfalama noktaları — PopularYachtsSection ile birebir aynı spec:
               gap 10px (önceden 6, sıkışıktı), 8px nokta, aktif 24px marka
               mavisi pill (önceden koyu siyah, daha ağır duruyordu). */
            <div className="mt-5 flex items-center justify-center gap-2.5" aria-hidden>
              {items.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ease-out ${
                    i === activeIndex ? 'w-6 bg-[var(--primary,#2168b8)]' : 'w-2 bg-[#d4d4d8]'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* MASAÜSTÜ: tek satır, yana kaydırmalı şerit (referans siteki gibi) — grid yok, taşan kartlar sağa doğru kayar. */}
        <div className="relative hidden md:block">
          <div
            ref={desktopScrollRef}
            className="flex snap-x snap-mandatory gap-8 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((tour, index) => (
              <div
                key={tour._id}
                /* Masaüstünde bir tık geniş: 350→380px (kapsayıcı 1200px,
                   32px boşlukla 3 kart + 4.'nün ucu hâlâ görünüyor). */
                className="w-[320px] flex-shrink-0 snap-start transition-all duration-300 ease-out lg:w-[380px]"
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

          {items.length > 3 && (
            <>
              <button
                type="button"
                onClick={() => scrollDesktop(-1)}
                aria-label="Önceki turlar"
                className="absolute left-0 top-[38%] z-10 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-md transition duration-200 hover:scale-110 hover:bg-zinc-50 lg:flex"
                style={{ color: 'var(--primary, #2168b8)' }}
              >
                <ChevronLeft className="h-6 w-6" strokeWidth={2} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => scrollDesktop(1)}
                aria-label="Sonraki turlar"
                className="absolute right-0 top-[38%] z-10 hidden h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-md transition duration-200 hover:scale-110 hover:bg-zinc-50 lg:flex"
                style={{ color: 'var(--primary, #2168b8)' }}
              >
                <ChevronRight className="h-6 w-6" strokeWidth={2} aria-hidden />
              </button>
            </>
          )}
        </div>

        {/* Referans siteki gibi bölümün altında çerçeveli "Tüm turları görüntüle" */}
        {!hideViewAllButton && (
          <div className="mt-8 flex justify-center md:mt-12">
            <Link
              href={withLocalePath(locale, '/turlar')}
              className="inline-flex h-11 w-auto min-w-[180px] items-center justify-center rounded-lg border-2 bg-transparent px-6 text-[13px] font-bold uppercase tracking-wide no-underline transition duration-200 hover:scale-105 hover:bg-[var(--primary)]/[0.06] sm:h-12 sm:w-[210px] sm:px-0"
              style={{ borderColor: 'var(--primary, #2168b8)', color: 'var(--primary, #2168b8)' }}
            >
              {VIEW_ALL_LABEL[locale]}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
