'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

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
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

function BlogCard({ post }: { post: BlogPostItem }) {
  const href = post.slug ? `/blog/${post.slug}` : '#'
  return (
    <article className="h-full flex flex-col rounded-2xl overflow-hidden bg-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] border border-black/5 transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
      <Link href={href} className="flex flex-col h-full">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
          {post.coverImageUrl ? (
            <Image
              src={post.coverImageUrl}
              alt={post.coverImageAlt || post.title || 'Blog'}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm">
              Görsel yok
            </div>
          )}
        </div>
        <div className="flex flex-col flex-1 p-6 md:p-8">
          <h3
            className="font-black text-xl md:text-2xl uppercase leading-tight line-clamp-2 mb-3"
            style={{ color: 'var(--secondary)', fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900 }}
          >
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-base text-black font-medium leading-relaxed line-clamp-3 mb-3">
              {post.excerpt}
            </p>
          )}
          {post.publishDate && (
            <time className="text-sm text-black/70 mb-5 block" dateTime={post.publishDate}>
              {formatDate(post.publishDate)}
            </time>
          )}
          <span
            className="tour-card-cta hero-btn-shine relative mt-auto w-full rounded-xl py-3 md:py-3.5 font-black uppercase text-white text-center text-lg flex items-center justify-center overflow-hidden"
            style={{ background: '#1e3a8a', boxShadow: '0 4px 14px rgba(30, 58, 138, 0.4)' }}
          >
            Yazıyı oku
          </span>
        </div>
      </Link>
    </article>
  )
}

export default function BlogSection({ data }: BlogSectionProps) {
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

  if (!data?.enabled || !data?.posts?.length) return null

  const { heading, subtitle, posts, ctaButton } = data
  const words = (heading || 'Blog').toUpperCase().trim().split(/\s+/)
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
      aria-labelledby="blog-section-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <header className="mb-12">
          <h2
            id="blog-section-heading"
            className="text-[48px] font-black uppercase leading-[1.1] mb-4"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900 }}
          >
            {firstTwo && <span style={{ color: '#1e3a8a' }}>{firstTwo}</span>}
            {nextTwo && <span style={{ color: '#000' }}>{(firstTwo ? ' ' : '') + nextTwo}</span>}
            {rest && <span style={{ color: '#000' }}>{' ' + rest}</span>}
          </h2>
          {subtitle && (
            <p className="text-base md:text-lg text-black font-semibold leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <div
              key={post._id}
              className="transition-all duration-500 ease-out"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: visible ? `${index * 100}ms` : '0ms',
              }}
            >
              <BlogCard post={post} />
            </div>
          ))}
        </div>

        {ctaButton?.href && ctaButton?.label && (
          <div className="mt-12 flex justify-center">
            <Link
              href={ctaButton.href}
              className="rounded-xl py-2.5 px-6 font-bold uppercase text-sm inline-flex items-center justify-center transition hover:bg-zinc-50 border-2"
              style={{ background: '#fff', color: '#1e3a8a', borderColor: '#1e3a8a' }}
            >
              {ctaButton.label}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
