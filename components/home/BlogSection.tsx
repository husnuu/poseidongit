'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import CompactBlogCard, { type CompactBlogCardPost } from '@/components/blog/CompactBlogCard'
import { BLOG_PAGE_LEAD } from '@/lib/i18n/strings/blogPage'

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

  // Referanstaki başlık altı spotu; Sanity'de subtitle boş olduğunda
  // /blog sayfasındaki kısa cümleyle aynı metin kullanılıyor.
  const leadText = compact ? subtitle?.trim() || '' : subtitle?.trim() || BLOG_PAGE_LEAD[locale]

  const blogIndexPath = withLocalePath(locale, '/blog')
  const seeAllHref = (ctaButton?.href?.trim() || blogIndexPath) as string
  const seeAllLabel =
    (ctaButton?.label?.trim() || seeAllPostsLabel(locale)) as string

  return (
    <section
      ref={sectionRef}
      /* Anasayfada referans tasarımdaki tam genişlikte mavi bant; yazı altı
         ("Okumaya devam et") sade beyaz kalıyor. */
      className={
        compact
          ? 'w-full bg-white pb-10 pt-10 transition-all duration-300 ease-out md:pb-14 md:pt-14'
          : 'relative w-full overflow-hidden bg-[var(--section-sky,#4facd8)] pb-14 pt-14 transition-all duration-300 ease-out md:pb-20 md:pt-20'
      }
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
      }}
      aria-labelledby="blog-section-heading"
    >
      {/* Referanstaki gibi düz mavi değil: zeminin üstünde aynı mavinin bir
          ton açığıyla çizilmiş büyük yumuşak kavisler. Beyazın çok düşük
          alfası kullanılıyor, böylece --primary değişirse desen de uyumlu
          kalıyor. */}
      {!compact && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {/* Mobilde bölüm hem dar hem kısa: masaüstü ölçüleri ekranın
              tamamen dışında kalıp desen görünmez oluyordu. Dar ekranda daha
              küçük çaplar, görünür alanı kesen konumlar ve bir tık yüksek
              alfa kullanılıyor. */}
          <span className="absolute -left-[38%] -top-[18%] block h-[420px] w-[420px] rounded-full bg-white/[0.14] md:-left-[18%] md:-top-[55%] md:h-[760px] md:w-[760px] md:bg-white/[0.1]" />
          <span className="absolute -bottom-[26%] -left-[42%] block h-[460px] w-[460px] rounded-full bg-white/[0.12] md:-bottom-[62%] md:-left-[6%] md:h-[820px] md:w-[820px] md:bg-white/[0.085]" />
          <span className="absolute -right-[36%] top-[26%] block h-[360px] w-[360px] rounded-full border-[40px] border-white/[0.13] md:-right-[24%] md:top-[18%] md:h-[680px] md:w-[680px] md:border-[60px] md:border-white/[0.09]" />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-[1200px] px-4">
        <header
          className={
            compact
              ? 'mb-6 text-left md:mb-7'
              /* Başlık ortalı; oklar aynı satırda sağda duruyor (mutlak
                 konum, yoksa flex düzeni başlığı merkezden kaydırıyordu). */
              : 'relative mb-8 flex flex-col items-center text-center md:mb-10'
          }
        >
          <div className={compact ? undefined : 'min-w-0 max-w-2xl'}>
            <h2
              id="blog-section-heading"
              className={
                compact
                  ? 'mb-0 text-[21px] font-extrabold uppercase leading-[1.2] tracking-[0.01em] sm:text-[23px] md:text-[26px]'
                  : 'mb-2 text-[26px] font-black uppercase leading-[1.15] sm:text-[30px] md:text-[34px] lg:text-[38px]'
              }
              style={{
                fontFamily: 'var(--font-family-title, var(--font-family))',
                fontWeight: compact ? 800 : 900,
                WebkitTextStroke: compact ? undefined : '0.6px currentColor',
                color: compact ? 'var(--secondary, #131719)' : '#fff',
              }}
            >
              {titleUpper}
            </h2>
            {leadText ? (
              <p
                className={
                  compact
                    ? 'max-w-2xl text-base font-normal leading-relaxed md:text-lg'
                    : 'mx-auto max-w-2xl text-[15px] font-normal leading-relaxed text-white md:text-base'
                }
                style={compact ? { color: 'var(--text-color)' } : undefined}
              >
                {leadText}
              </p>
            ) : null}
          </div>

          {/* Referansta oklar başlığın sağında, şeridin yanlarında değil. */}
          {!compact && (
            <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 shrink-0 items-center gap-3 md:flex">
              <button
                type="button"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/60 text-white transition duration-200 hover:bg-white hover:text-[var(--primary,#2168b8)] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-white"
                aria-label="Önceki yazılar"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.2} aria-hidden />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                disabled={!canScrollNext}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-white text-[var(--primary,#2168b8)] transition duration-200 hover:scale-105 disabled:cursor-default disabled:opacity-35 disabled:hover:scale-100"
                aria-label="Sonraki yazılar"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2.2} aria-hidden />
              </button>
            </div>
          )}
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
                className="w-[min(86vw,320px)] shrink-0 snap-start sm:w-[320px] md:w-[350px]"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(8px)',
                  transitionDelay: visible ? `${Math.min(index, 6) * 60}ms` : '0ms',
                  transitionProperty: 'opacity, transform',
                  transitionDuration: '500ms',
                  transitionTimingFunction: 'ease-out',
                }}
              >
                <CompactBlogCard post={post} locale={locale} noImageLabel={noImageLabel} imageSizes="350px" />
              </div>
            ))}
          </div>

          {compact && canScrollPrev && (
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

          {compact && canScrollNext && (
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
            /* Sitedeki diğer bölüm butonlarıyla aynı: köşeli, 2px çerçeve,
               aynı punto/boşluk. Zemin mavi olduğu için çerçeve ve dolgu
               beyaz, metin marka mavisi. */
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border-2 border-white bg-white px-8 py-2.5 text-[14px] font-extrabold uppercase tracking-wide shadow-sm transition duration-200 hover:scale-105 sm:text-[15px]"
            style={{ color: 'var(--primary, #2168b8)' }}
          >
            {seeAllLabel}
            <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
