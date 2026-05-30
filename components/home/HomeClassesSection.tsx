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
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (!data || data.enabled === false) return null
  const items = (data.items ?? []).filter((i) => i && i.key && i.label)
  if (items.length === 0) return null

  const localeUpper = locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US'
  const titleUpper = (data.heading?.trim() || 'BİLET SINIFLARI')
    .trim()
    .toLocaleUpperCase(localeUpper)
  const words = titleUpper.split(/\s+/).filter(Boolean)
  const firstTwo = words.slice(0, 2).join(' ')
  const nextTwo = words.slice(2, 4).join(' ')
  const rest = words.slice(4).join(' ')

  return (
    <section
      ref={sectionRef}
      className="w-full transition-all duration-700 ease-out pt-8 pb-6 md:pt-10 md:pb-8"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
      }}
      aria-labelledby="home-classes-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <header className="mb-8 md:mb-10">
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
            className="text-[22px] font-black uppercase leading-[1.15] mb-5 sm:text-[24px] md:text-[26px] lg:text-[28px]"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900 }}
          >
            {firstTwo && <span style={{ color: '#1e3a8a' }}>{firstTwo}</span>}
            {nextTwo && <span style={{ color: '#000' }}>{(firstTwo ? ' ' : '') + nextTwo}</span>}
            {rest && <span style={{ color: '#000' }}>{' ' + rest}</span>}
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
