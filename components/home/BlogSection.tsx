'use client'

import { useRef, useEffect, useState } from 'react'
import CoverImage from '@/components/ui/CoverImage'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
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

const READ_POST: Record<SiteLocale, string> = {
  tr: 'Yazıyı oku',
  en: 'Read post',
  de: 'Weiterlesen',
  ru: 'Читать',
}

const MIN_READ: Record<SiteLocale, (n: number) => string> = {
  tr: (n) => `${n} dk okuma`,
  en: (n) => `${n} min read`,
  de: (n) => `${n} Min. Lesezeit`,
  ru: (n) => `${n} мин чтения`,
}

function formatPostDate(dateStr: string | null | undefined, locale: SiteLocale): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  const tag = locale === 'de' ? 'de-DE' : locale === 'en' ? 'en-GB' : locale === 'ru' ? 'ru-RU' : 'tr-TR'
  return new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
}

/** Ana sayfa kartı (referans): görsel, tarih · okuma süresi, başlık, özet, "Yazıyı oku". */
function HomeBlogCard({ post, locale, noImageLabel }: { post: BlogPostItem; locale: SiteLocale; noImageLabel: string }) {
  const href = post.slug ? withLocalePath(locale, `/blog/${post.slug}`) : '#'
  const minutes = post.readingTime ?? (post.readTime ? Number.parseInt(post.readTime, 10) || null : null)
  const meta = [formatPostDate(post.publishDate, locale), minutes ? MIN_READ[locale](minutes) : null].filter(Boolean).join(' · ')
  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white outline-none transition-colors duration-300 hover:border-[#9dbfe6] focus-visible:ring-2 focus-visible:ring-[var(--primary,#2168b8)]"
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-zinc-100">
        {post.coverImageUrl ? (
          <CoverImage
            src={post.coverImageUrl}
            alt={post.coverImageAlt || post.title || 'Blog'}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 86vw, 380px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">{noImageLabel}</div>
        )}
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        {meta && <p className="mb-1.5 text-[12px] text-zinc-500">{meta}</p>}
        <h3
          className="line-clamp-2 text-[16px] font-bold leading-snug text-[var(--secondary,#131719)] transition-colors group-hover:text-[var(--primary,#2168b8)]"
          style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
        >
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-[var(--text-color,#58595b)]">{post.excerpt}</p>
        )}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[13px] font-extrabold uppercase tracking-wide text-[var(--primary,#2168b8)]">
          {READ_POST[locale]}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.4} aria-hidden />
        </span>
      </div>
    </Link>
  )
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

  const scrollStep = () => {
    const card = scrollRef.current?.querySelector<HTMLElement>('[data-blog-card]')
    return (card?.offsetWidth ?? 300) + 24
  }

  const scrollNext = () => {
    scrollRef.current?.scrollBy({ left: scrollStep(), behavior: 'smooth' })
  }

  const scrollPrev = () => {
    scrollRef.current?.scrollBy({ left: -scrollStep(), behavior: 'smooth' })
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
  // Ana sayfada referanstaki gibi yalnızca başlık; spot Sanity'de girilirse gösterilir.
  const leadText = subtitle?.trim() || ''

  const blogIndexPath = withLocalePath(locale, '/blog')
  const seeAllHref = (ctaButton?.href?.trim() || blogIndexPath) as string
  const seeAllLabel =
    (ctaButton?.label?.trim() || seeAllPostsLabel(locale)) as string

  return (
    <section
      ref={sectionRef}
      /* Ana sayfa: açık gri-mavi zemin (beyaz kartlar öne çıksın), ortalı mavi başlık. */
      className={
        compact
          ? 'w-full bg-white pb-10 pt-10 transition-all duration-300 ease-out md:pb-14 md:pt-14'
          : 'w-full bg-[#f3f6fa] pb-14 pt-14 transition-all duration-300 ease-out md:pb-20 md:pt-20'
      }
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
      }}
      aria-labelledby="blog-section-heading"
    >
      <div className="relative z-10 mx-auto max-w-[1200px] px-4">
        <header
          className={
            compact
              ? 'mb-6 text-left md:mb-7'
              : 'mb-8 text-center md:mb-12'
          }
        >
          <div>
            <h2
              id="blog-section-heading"
              className={
                compact
                  ? 'mb-0 text-[21px] font-extrabold uppercase leading-[1.2] tracking-[0.01em] sm:text-[23px] md:text-[26px]'
                  : 'm-0 text-[28px] font-black uppercase leading-[1.15] sm:text-[32px] md:text-[36px] lg:text-[40px]'
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
            {leadText ? (
              <p
                className={
                  compact
                    ? 'max-w-2xl text-base font-normal leading-relaxed md:text-lg'
                    : 'mx-auto mt-3 max-w-2xl text-[15px] font-normal leading-relaxed md:text-base'
                }
                style={{ color: 'var(--text-color)' }}
              >
                {leadText}
              </p>
            ) : null}
          </div>

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
            className={`flex snap-x snap-mandatory overflow-x-auto pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth [&::-webkit-scrollbar]:hidden ${
              compact ? 'gap-4 pl-0 pr-2 md:pr-14' : '-mx-4 scroll-px-4 gap-6 px-4 md:mx-0 md:scroll-px-0 md:px-0'
            }`}
          >
            {posts.map((post, index) => (
              <div
                key={post._id}
                data-blog-card
                className={
                  compact
                    ? 'w-[min(86vw,320px)] shrink-0 snap-start sm:w-[320px] md:w-[350px]'
                    : `w-[84%] shrink-0 snap-start sm:w-[46%] ${
                        // 3 veya daha az yazıda şerit kaydırılmaz: kartlar genişliği doldurur.
                        posts.length > 3 ? 'lg:w-[calc((100%-3rem)/3.4)]' : 'lg:w-[calc((100%-3rem)/3)]'
                      }`
                }
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(8px)',
                  transitionDelay: visible ? `${Math.min(index, 6) * 60}ms` : '0ms',
                  transitionProperty: 'opacity, transform',
                  transitionDuration: '500ms',
                  transitionTimingFunction: 'ease-out',
                }}
              >
                {compact ? (
                  <CompactBlogCard post={post} locale={locale} noImageLabel={noImageLabel} imageSizes="350px" />
                ) : (
                  <HomeBlogCard post={post} locale={locale} noImageLabel={noImageLabel} />
                )}
              </div>
            ))}
          </div>

          {canScrollPrev && (
            <button
              type="button"
              onClick={scrollPrev}
              className={`pointer-events-auto absolute top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white transition hover:bg-zinc-50 md:flex ${compact ? 'left-0 h-11 w-11 -translate-x-1 border border-zinc-200 shadow-md' : '-left-7 h-14 w-14 shadow-[0_6px_20px_rgba(19,23,25,0.18)]'}`}
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
              className={`pointer-events-auto absolute top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white transition hover:bg-zinc-50 md:flex ${compact ? 'right-0 h-11 w-11 translate-x-1 border border-zinc-200 shadow-md' : '-right-7 h-14 w-14 shadow-[0_6px_20px_rgba(19,23,25,0.18)]'}`}
              style={{ color: 'var(--primary, #2168b8)' }}
              aria-label="Sonraki yazılar"
            >
              <ChevronRight className="h-6 w-6" strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>

        {/* Referans tasarımda yazı altındaki bölüm kartlarla bitiyor; ayrıca
            sayfa başında zaten "← Blog" bağlantısı var. */}
        <div className={compact ? 'hidden' : 'mt-10 flex justify-center md:mt-12'}>
          <Link
            href={seeAllHref}
            /* Instagram ve yorumlar bölümündeki butonlarla aynı: 2px mavi çerçeve. */
            className="inline-flex items-center justify-center rounded-lg border-2 border-[var(--primary,#2168b8)] bg-transparent px-6 py-2.5 text-[16px] font-extrabold uppercase tracking-wide text-[var(--primary,#2168b8)] transition duration-200 hover:scale-105 hover:bg-[var(--primary,#2168b8)] hover:text-white"
          >
            {seeAllLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}
