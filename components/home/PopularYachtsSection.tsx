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

function defaultTitleFallback(locale: SiteLocale): string {
  if (locale === 'en') return 'Our most popular yachts'
  if (locale === 'de') return 'Unsere beliebtesten Yachten'
  return 'En popüler tekneler'
}

function defaultCtaLabel(locale: SiteLocale): string {
  if (locale === 'en') return 'See all yachts'
  if (locale === 'de') return 'Alle Boote ansehen'
  return 'Tüm tekneleri gör'
}

export default function PopularYachtsSection({ data, locale = 'tr' }: PopularYachtsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [activeDot, setActiveDot] = useState(0)

  const scrollNext = () => {
    scrollRef.current?.scrollBy({ left: 336, behavior: 'smooth' })
  }

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current
    const card = el?.children[index] as HTMLElement | undefined
    if (!el || !card) return
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' })
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

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const cards = Array.from(el.children) as HTMLElement[]
      if (cards.length === 0) return
      let closest = 0
      let closestDist = Infinity
      cards.forEach((card, i) => {
        const dist = Math.abs(card.offsetLeft - el.offsetLeft - el.scrollLeft)
        if (dist < closestDist) {
          closestDist = dist
          closest = i
        }
      })
      setActiveDot(closest)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [data?.items?.length])

  if (!data?.enabled || !data?.items?.length) return null

  const { title, subtitle, items, ctaButton } = data
  const titleUpper = (title || defaultTitleFallback(locale)).toUpperCase().trim()
  const ctaLabel = ctaButton?.label?.trim() || defaultCtaLabel(locale)
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
        <header className="mb-10 text-center md:mb-12">
          <h2
            id="popular-yachts-heading"
            className="text-[26px] font-black uppercase leading-[1.15] mb-3 sm:text-[30px] md:text-[34px] lg:text-[38px]"
            style={{
              fontFamily: 'var(--font-family-title, var(--font-family))',
              fontWeight: 900,
              color: 'var(--primary, #2168b8)',
            }}
          >
            {titleUpper}
          </h2>
          {subtitle ? (
            <p
              className="mx-auto max-w-3xl text-base font-normal leading-relaxed md:text-lg"
              style={{ color: 'var(--text-color)' }}
            >
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
            className="pointer-events-auto absolute right-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 translate-x-1 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-md transition hover:bg-zinc-50 md:flex"
            style={{ color: 'var(--primary, #2168b8)' }}
            aria-label="Sonraki tekneler"
          >
            <ChevronRight className="h-6 w-6" strokeWidth={2} aria-hidden />
          </button>
        </div>

        {items.length > 1 ? (
          <div className="mt-5 flex items-center justify-center gap-1.5" role="tablist" aria-label="Tekne sayfaları">
            {items.map((yacht, i) => (
              <button
                key={yacht._id}
                type="button"
                role="tab"
                aria-selected={i === activeDot}
                aria-label={`${i + 1}. tekneye git`}
                onClick={() => scrollToIndex(i)}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === activeDot ? 22 : 8,
                  background: i === activeDot ? 'var(--primary, #2168b8)' : '#d4d4d8',
                }}
              />
            ))}
          </div>
        ) : null}

        {ctaLabel && ctaHref ? (
          <p className="mt-10 text-center md:mt-12">
            <Link
              href={ctaHref}
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg border-2 bg-white px-8 py-3 text-sm font-bold uppercase tracking-wide shadow-sm transition hover:bg-[var(--primary)]/[0.06]"
              style={{ borderColor: 'var(--primary, #2168b8)', color: 'var(--primary, #2168b8)' }}
            >
              {ctaLabel}
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  )
}
