'use client'

import { useRef, useEffect, useState } from 'react'
import TourClassShowcase, {
  type TourClassItem,
} from '@/components/tour/TourClassShowcase'
import type { SiteLocale } from '@/lib/i18n/config'

export type HomeClassesSectionData = {
  enabled?: boolean | null
  heading?: string | null
  subtitle?: string | null
  items?: TourClassItem[] | null
}

type Props = {
  data: HomeClassesSectionData | null
  locale: SiteLocale
}

function defaultHeadingFallback(locale: SiteLocale): string {
  if (locale === 'en') return 'Ticket classes'
  if (locale === 'de') return 'Ticketklassen'
  return 'BİLET SINIFLARI'
}

export default function HomeClassesSection({ data, locale }: Props) {
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

  if (!data || data.enabled === false) return null
  const items = (data.items ?? []).filter((i) => i && i.key && i.label)
  if (items.length === 0) return null

  const localeUpper = locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US'
  const titleUpper = (data.heading?.trim() || defaultHeadingFallback(locale))
    .trim()
    .toLocaleUpperCase(localeUpper)

  return (
    <section
      ref={sectionRef}
      className="w-full transition-all duration-300 ease-out pt-8 pb-6 md:pt-10 md:pb-8"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
      }}
      aria-labelledby="home-classes-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <header className="mb-8 text-center md:mb-10">
          {data.subtitle && (
            <p
              className="text-sm uppercase tracking-[0.1em] mb-1"
              style={{ color: 'var(--primary)' }}
            >
              {data.subtitle}
            </p>
          )}
          <h2
            id="home-classes-heading"
            className="text-[24px] font-black uppercase leading-[1.15] mb-5 sm:text-[27px] md:text-[30px] lg:text-[33px]"
            style={{
              fontFamily: 'var(--font-family-title, var(--font-family))',
              fontWeight: 900,
              color: 'var(--primary, #2168b8)',
            }}
          >
            {titleUpper}
          </h2>
        </header>

        <TourClassShowcase
          classes={items}
          locale={locale}
          hideHeading
        />
      </div>
    </section>
  )
}
