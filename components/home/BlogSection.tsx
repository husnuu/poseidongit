'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'

export type BlogPostItem = {
  _id: string
  title: string | null
  slug: string | null
  excerpt?: string | null
  publishDate?: string | null
  coverImageUrl?: string | null
  coverImageAlt?: string | null
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
}

function seeAllPostsLabel(locale: SiteLocale): string {
  if (locale === 'en') return 'View all posts'
  if (locale === 'de') return 'Alle Artikel ansehen'
  return 'Tüm yazıları gör'
}

/** Yatay şerit: üstte görsel, altta yalnızca başlık (ince gövde tipi) */
function BlogCard({
  post,
  locale = 'tr',
  noImageLabel,
}: {
  post: BlogPostItem
  locale?: SiteLocale
  noImageLabel: string
}) {
  const href = post.slug ? withLocalePath(locale, `/blog/${post.slug}`) : '#'
  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.07)] transition-shadow duration-300 hover:shadow-[0_12px_36px_rgba(0,0,0,0.1)]">
      <Link
        href={href}
        className="flex min-h-0 flex-1 flex-col rounded-2xl outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#1e3a5f]"
      >
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-zinc-100">
          {post.coverImageUrl ? (
            <Image
              src={post.coverImageUrl}
              alt={post.coverImageAlt || post.title || 'Blog'}
              fill
              className="object-cover"
              sizes="300px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">{noImageLabel}</div>
          )}
        </div>
        <div className="flex flex-1 flex-col px-5 pb-5 pt-5 md:px-6 md:pb-6 md:pt-6">
          <h3
            className="line-clamp-4 text-[15px] font-semibold leading-snug tracking-tight text-zinc-900 md:text-base"
            style={{ fontFamily: 'var(--font-family)' }}
          >
            {post.title}
          </h3>
        </div>
      </Link>
    </article>
  )
}

export default function BlogSection({
  data,
  locale = 'tr',
  noImageLabel = 'Görsel yok',
}: BlogSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const scrollNext = () => {
    scrollRef.current?.scrollBy({ left: 316, behavior: 'smooth' })
  }

  if (!data?.enabled || !data?.posts?.length) return null

  const { heading, subtitle, posts, ctaButton } = data
  const words = (heading || 'Blog').toUpperCase().trim().split(/\s+/)
  const firstTwo = words.slice(0, 2).join(' ')
  const nextTwo = words.slice(2, 4).join(' ')
  const rest = words.slice(4).join(' ')

  const blogIndexPath = withLocalePath(locale, '/blog')
  const seeAllHref = (ctaButton?.href?.trim() || blogIndexPath) as string
  const seeAllLabel =
    (ctaButton?.label?.trim() || seeAllPostsLabel(locale)) as string

  return (
    <section
      ref={sectionRef}
      className="w-full bg-zinc-50/60 py-14 transition-all duration-700 ease-out md:py-20"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
      }}
      aria-labelledby="blog-section-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <header className="mb-8 md:mb-10">
          <h2
            id="blog-section-heading"
            className="mb-4 text-[30px] font-black uppercase leading-[1.15] sm:text-[34px] md:mb-3 md:text-[38px] lg:text-[42px]"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900 }}
          >
            {firstTwo && <span style={{ color: '#1e3a8a' }}>{firstTwo}</span>}
            {nextTwo && <span style={{ color: '#000' }}>{(firstTwo ? ' ' : '') + nextTwo}</span>}
            {rest && <span style={{ color: '#000' }}>{' ' + rest}</span>}
          </h2>
          {subtitle ? (
            <p className="max-w-2xl text-base font-semibold leading-relaxed text-black md:text-lg">{subtitle}</p>
          ) : null}
        </header>

        <div className="relative">
          <div
            ref={scrollRef}
            role="region"
            aria-label="Blog yazıları listesi"
            tabIndex={0}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pl-0 pr-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:thin] scroll-smooth md:pr-14 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-track]:bg-transparent"
          >
            {posts.map((post, index) => (
              <div
                key={post._id}
                className="w-[min(86vw,300px)] shrink-0 snap-start sm:w-[280px] md:w-[300px]"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(16px)',
                  transitionDelay: visible ? `${Math.min(index, 6) * 60}ms` : '0ms',
                  transitionProperty: 'opacity, transform',
                  transitionDuration: '500ms',
                  transitionTimingFunction: 'ease-out',
                }}
              >
                <BlogCard post={post} locale={locale} noImageLabel={noImageLabel} />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={scrollNext}
            className="pointer-events-auto absolute right-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 translate-x-1 items-center justify-center rounded-full border border-zinc-200 bg-white text-[#1e3a5f] shadow-md transition hover:bg-zinc-50 md:flex"
            aria-label="Sonraki yazılar"
          >
            <ChevronRight className="h-6 w-6" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="mt-8 flex justify-center md:mt-10">
          <Link
            href={seeAllHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border-2 px-8 py-2.5 text-xs font-bold uppercase tracking-wide transition hover:bg-zinc-50"
            style={{ background: '#fff', color: '#1e3a8a', borderColor: '#1e3a8a' }}
          >
            {seeAllLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}
