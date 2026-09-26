'use client'

import { useRef, useEffect, useState } from 'react'
import TourCard from '@/components/tours/TourCard'
import type { TourListItem } from '@/components/tours/TourCard'
import type { SiteLocale } from '@/lib/i18n/config'

export type PopularToursSectionData = {
  enabled?: boolean | null
  title?: string | null
  subtitle?: string | null
  items?: TourListItem[] | null
}

type PopularToursSectionProps = {
  data: PopularToursSectionData | null
  locale?: SiteLocale
}

export default function PopularToursSection({ data, locale = 'tr' }: PopularToursSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

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

  if (!data?.enabled || !data?.items?.length) return null

  const { title, subtitle, items } = data
  const localeUpper = locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US'
  const titleUpper = (title || 'Popüler Turlar').trim().toLocaleUpperCase(localeUpper)

  return (
    <section
      ref={sectionRef}
      className="w-full transition-all duration-300 ease-out pt-14 pb-5 md:pt-20 md:pb-6"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
      }}
      aria-labelledby="popular-tours-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <header className="mb-10 text-center md:mb-12">
          {subtitle && (
            <p
              className="text-sm uppercase tracking-[0.1em] mb-1"
              style={{ color: 'var(--primary)' }}
            >
              {subtitle}
            </p>
          )}
          <h2
            id="popular-tours-heading"
            className="text-[30px] font-black uppercase leading-[1.15] mb-6 sm:text-[36px] md:text-[40px] lg:text-[46px]"
            style={{
              fontFamily: 'var(--font-family-title, var(--font-family))',
              fontWeight: 900,
              color: 'var(--primary, #2168b8)',
            }}
          >
            {titleUpper}
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
      </div>
    </section>
  )
}
