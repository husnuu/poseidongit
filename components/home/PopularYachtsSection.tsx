'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import HomePopularYachtCard, { type HomePopularYachtCardData } from '@/components/home/HomePopularYachtCard'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'

export type PopularYachtsSectionData = {
  enabled?: boolean | null
  title?: string | null
  subtitle?: string | null
  ctaButton?: { label?: string | null; href?: string | null } | null
  items?: HomePopularYachtCardData[] | null
}

type PopularYachtsSectionProps = {
  data: PopularYachtsSectionData | null
  locale?: SiteLocale
}

export default function PopularYachtsSection({ data, locale = 'tr' }: PopularYachtsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  const scrollNext = () => {
    scrollRef.current?.scrollBy({ left: 336, behavior: 'smooth' })
  }

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

  const { title, subtitle, items, ctaButton } = data
  const words = (title || 'En popüler tekneler').toUpperCase().trim().split(/\s+/)
  const firstTwo = words.slice(0, 2).join(' ')
  const nextTwo = words.slice(2, 4).join(' ')
  const rest = words.slice(4).join(' ')
  const ctaLabel = ctaButton?.label?.trim() || 'Tüm tekneleri gör'
  const ctaHref = ctaButton?.href?.trim()
    ? ctaButton.href
    : withLocalePath(locale, '/yat-kiralama')

  return (
    <section
      ref={sectionRef}
      className="w-full transition-all duration-700 ease-out pt-14 pb-12 md:pt-20 md:pb-16 bg-zinc-50/60"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
      }}
      aria-labelledby="popular-yachts-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <header className="mb-10 md:mb-12">
          <h2
            id="popular-yachts-heading"
            className="text-[26px] font-black uppercase leading-[1.15] mb-3 sm:text-[30px] md:text-[34px] lg:text-[38px]"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900 }}
          >
            {firstTwo ? <span style={{ color: '#1e3a8a' }}>{firstTwo}</span> : null}
            {nextTwo ? (
              <span style={{ color: '#000' }}>{(firstTwo ? ' ' : '') + nextTwo}</span>
            ) : null}
            {rest ? <span style={{ color: '#000' }}>{' ' + rest}</span> : null}
          </h2>
          {subtitle ? (
            <p className="max-w-3xl text-base font-normal normal-case leading-relaxed tracking-normal text-zinc-900 md:text-lg">
              {subtitle}
            </p>
          ) : null}
        </header>

        <div className="relative">
          <div
            ref={scrollRef}
            role="region"
            aria-label="Özel tekneler listesi"
            tabIndex={0}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pl-0 pr-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:thin] scroll-smooth md:pr-14 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-track]:bg-transparent"
          >
            {items.map((yacht, index) => (
              <div
                key={yacht._id}
                className="w-[min(88vw,320px)] shrink-0 snap-start sm:w-[300px] md:w-[320px]"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(16px)',
                  transitionDelay: visible ? `${Math.min(index, 8) * 60}ms` : '0ms',
                  transitionProperty: 'opacity, transform',
                  transitionDuration: '500ms',
                  transitionTimingFunction: 'ease-out',
                }}
              >
                <HomePopularYachtCard yacht={yacht} locale={locale} />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={scrollNext}
            className="pointer-events-auto absolute right-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 translate-x-1 items-center justify-center rounded-full border border-zinc-200 bg-white text-[#1e3a5f] shadow-md transition hover:bg-zinc-50 md:flex"
            aria-label="Sonraki tekneler"
          >
            <ChevronRight className="h-6 w-6" strokeWidth={2} aria-hidden />
          </button>
        </div>

        {ctaLabel && ctaHref ? (
          <p className="mt-10 text-center md:mt-12">
            <Link
              href={ctaHref}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border-2 border-[#1e3a5f] bg-white px-8 py-3 text-sm font-black uppercase tracking-wide text-[#1e3a5f] shadow-sm transition hover:bg-[#1e3a5f]/[0.06]"
            >
              {ctaLabel}
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  )
}
