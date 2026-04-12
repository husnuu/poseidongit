'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
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
            className="text-[34px] font-black uppercase leading-[1.15] mb-3 sm:text-[38px] md:text-[42px] lg:text-[46px]"
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

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((yacht, index) => (
            <div
              key={yacht._id}
              className="transition-all duration-500 ease-out"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: visible ? `${index * 100}ms` : '0ms',
              }}
            >
              <HomePopularYachtCard yacht={yacht} locale={locale} />
            </div>
          ))}
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
