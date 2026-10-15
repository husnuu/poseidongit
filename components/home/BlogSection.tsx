'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import CompactBlogCard, { type CompactBlogCardPost } from '@/components/blog/CompactBlogCard'

export type BlogPostItem = CompactBlogCardPost & {
  excerpt?: string | null
  publishDate?: string | null
}

export type BlogSectionData = {
  enabled?: boolean | null
  heading?: string | null
  subtitle?: string | null
  posts?: BlogPostItem[] | null
  ctaButton?: { label?: string | null; href?: string | null } | null
}

type BlogSectionProps = {
  data: BlogSectionData | null
  locale?: SiteLocale
  noImageLabel?: string
  /** Başlık override — blog yazısı altındaki "Okumaya devam et" bölümü aynı
      carousel'i kullanıyor. Verilmezse ana sayfadaki sabit başlık. */
  heading?: string
  /** 'home' = ana sayfadaki büyük ortalı mavi başlık + "tüm yazılar" butonu.
      'compact' = blog yazısı altı: sola yaslı, küçük, koyu başlık; CTA yok. */
  variant?: 'home' | 'compact'
}

function seeAllPostsLabel(locale: SiteLocale): string {
  if (locale === 'en') return 'View all posts'
  if (locale === 'de') return 'Alle Artikel ansehen'
  if (locale === 'ru') return 'Посмотреть все публикации'
  return 'Tüm yazıları gör'
}

const SECTION_TITLE: Record<SiteLocale, string> = {
  tr: 'MAVİ HİKAYELER',
  en: 'FROM OUR LOGBOOK',
  de: 'AUS UNSEREM LOGBUCH',
  ru: 'ИЗ НАШЕГО БОРТОВОГО ЖУРНАЛА',
}

export default function BlogSection({
  data,
  locale = 'tr',
  noImageLabel = 'Görsel yok',
  heading,
  variant = 'home',
}: BlogSectionProps) {
  const compact = variant === 'compact'
  const sectionRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(true)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.08, rootMargin: '0px 0px 150px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    handleRailScroll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.posts?.length])

  const scrollNext = () => {
    scrollRef.current?.scrollBy({ left: 316, behavior: 'smooth' })
  }

  const scrollPrev = () => {
    scrollRef.current?.scrollBy({ left: -316, behavior: 'smooth' })
  }

  const handleRailScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanScrollPrev(el.scrollLeft > 4)
    setCanScrollNext(el.scrollLeft < maxScroll - 4)
  }

  if (!data?.enabled || !data?.posts?.length) return null

  const { subtitle, posts, ctaButton } = data
  const titleUpper = heading?.trim() || SECTION_TITLE[locale]

  const blogIndexPath = withLocalePath(locale, '/blog')
  const seeAllHref = (ctaButton?.href?.trim() || blogIndexPath) as string
  const seeAllLabel =
    (ctaButton?.label?.trim() || seeAllPostsLabel(locale)) as string

  return (
    <section
      ref={sectionRef}
      className={
        compact
          ? 'w-full bg-white pb-10 pt-10 transition-all duration-300 ease-out md:pb-14 md:pt-14'
          : 'w-full bg-zinc-50/60 pt-14 pb-6 transition-all duration-300 ease-out md:pt-20 md:pb-8'
      }
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
      }}
      aria-labelledby="blog-section-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <header className={compact ? 'mb-6 text-left md:mb-7' : 'mb-8 text-center md:mb-10'}>
          <h2
            id="blog-section-heading"
            className={
              compact
                ? 'mb-0 text-[21px] font-extrabold uppercase leading-[1.2] tracking-[0.01em] sm:text-[23px] md:text-[26px]'
                : 'mb-4 text-[28px] font-black uppercase leading-[1.15] sm:text-[32px] md:mb-3 md:text-[36px] lg:text-[40px]'
            }
            style={{
              fontFamily: 'var(--font-family-title, var(--font-family))',
              fontWeight: compact ? 800 : 900,
              WebkitTextStroke: compact ? undefined : '0.6px currentColor',
              color: compact ? 'var(--secondary, #131719)' : 'var(--primary, #2168b8)',
            }}
          >
            {titleUpper}
          </h2>
          {subtitle ? (
            <p
              className="mx-auto max-w-2xl text-base font-normal leading-relaxed md:text-lg"
              style={{ color: 'var(--text-color)' }}
            >
              {subtitle}
            </p>
          ) : null}
        </header>

        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={handleRailScroll}
            role="region"
            aria-label="Blog yazıları listesi"
            tabIndex={0}
            /* Yatay kaydırma çubuğu gizli (kaydırma aynen duruyor) — kartların
               altındaki ince gri çizgi istenmedi; PopularYachtsSection ile aynı. */
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pl-0 pr-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth md:pr-14 [&::-webkit-scrollbar]:hidden"
          >
            {posts.map((post, index) => (
              <div
                key={post._id}
                className="w-[min(86vw,300px)] shrink-0 snap-start sm:w-[280px] md:w-[300px]"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(8px)',
                  transitionDelay: visible ? `${Math.min(index, 6) * 60}ms` : '0ms',
                  transitionProperty: 'opacity, transform',
                  transitionDuration: '500ms',
                  transitionTimingFunction: 'ease-out',
                }}
              >
                <CompactBlogCard post={post} locale={locale} noImageLabel={noImageLabel} imageSizes="300px" />
              </div>
            ))}
          </div>

          {canScrollPrev && (
            <button
              type="button"
              onClick={scrollPrev}
              className="pointer-events-auto absolute left-0 top-1/2 z-10 hidden h-11 w-11 -translate-x-1 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-md transition hover:bg-zinc-50 md:flex"
              style={{ color: 'var(--primary, #2168b8)' }}
              aria-label="Önceki yazılar"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={2} aria-hidden />
            </button>
          )}

          {canScrollNext && (
            <button
              type="button"
              onClick={scrollNext}
              className="pointer-events-auto absolute right-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 translate-x-1 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-md transition hover:bg-zinc-50 md:flex"
              style={{ color: 'var(--primary, #2168b8)' }}
              aria-label="Sonraki yazılar"
            >
              <ChevronRight className="h-6 w-6" strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>

        {/* Referans tasarımda yazı altındaki bölüm kartlarla bitiyor; ayrıca
            sayfa başında zaten "← Blog" bağlantısı var. */}
        <div className={compact ? 'hidden' : 'mt-8 flex justify-center md:mt-10'}>
          <Link
            href={seeAllHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border-2 px-8 py-2.5 text-[13px] font-extrabold uppercase tracking-wide transition duration-200 hover:scale-105 hover:bg-[var(--primary)]/[0.06] sm:text-[14px]"
            style={{ background: '#fff', color: 'var(--primary, #2168b8)', borderColor: 'var(--primary, #2168b8)' }}
          >
            {seeAllLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}
