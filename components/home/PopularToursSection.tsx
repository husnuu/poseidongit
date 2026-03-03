'use client'

import { useRef, useEffect, useState } from 'react'
import TourCard from '@/components/tours/TourCard'
import type { TourListItem } from '@/components/tours/TourCard'

export type PopularToursSectionData = {
  enabled?: boolean | null
  title?: string | null
  subtitle?: string | null
  items?: TourListItem[] | null
}

type PopularToursSectionProps = {
  data: PopularToursSectionData | null
}

export default function PopularToursSection({ data }: PopularToursSectionProps) {
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

  if (!data?.enabled || !data?.items?.length) return null

  const { title, subtitle, items } = data
  const words = (title || 'Popüler Turlar').toUpperCase().trim().split(/\s+/)
  const firstTwo = words.slice(0, 2).join(' ')
  const nextTwo = words.slice(2, 4).join(' ')
  const rest = words.slice(4).join(' ')

  return (
    <section
      ref={sectionRef}
      className="w-full transition-all duration-700 ease-out py-14 md:py-20"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
      }}
      aria-labelledby="popular-tours-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <header className="mb-12">
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
            className="text-[48px] font-black uppercase leading-[1.1] mb-6"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900 }}
          >
            {firstTwo && <span style={{ color: '#1e3a8a' }}>{firstTwo}</span>}
            {nextTwo && <span style={{ color: '#000' }}>{(firstTwo ? ' ' : '') + nextTwo}</span>}
            {rest && <span style={{ color: '#000' }}>{' ' + rest}</span>}
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((tour, index) => (
            <div
              key={tour._id}
              className="transition-all duration-500 ease-out"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: visible ? `${index * 100}ms` : '0ms',
              }}
            >
              <TourCard tour={tour} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
