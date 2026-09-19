'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import { sameSitePathFromHref } from '@/lib/siteUrls'
import type { PortableTextBlock } from '@portabletext/react'

export type AboutTeaserData = {
  enabled?: boolean | null
  heading?: string | null
  body?: PortableTextBlock[] | null
  imageUrl?: string | null
  imageAlt?: string | null
  primaryCta?: { label?: string | null; href?: string | null } | null
  secondaryCta?: { label?: string | null; href?: string | null } | null
}

type AboutTeaserSplitProps = {
  data: AboutTeaserData | null
}

function isInternalHref(href: string | null | undefined): boolean {
  if (!href) return false
  return href.startsWith('/') && !href.startsWith('//')
}

const bodyComponents = {
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p
        className="text-base font-normal leading-relaxed md:text-lg mb-3 last:mb-0"
        style={{ color: 'var(--text-color, #58595b)' }}
      >
        {children}
      </p>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <p
        className="text-base italic font-normal leading-relaxed md:text-lg mb-3"
        style={{ color: 'var(--muted, #81848b)' }}
      >
        {children}
      </p>
    ),
  },
}

export default function AboutTeaserSplit({ data }: AboutTeaserSplitProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (!data?.enabled) return null

  const { heading, body, imageUrl, imageAlt, primaryCta, secondaryCta } = data
  const primaryPath = primaryCta?.href ? sameSitePathFromHref(primaryCta.href) : null
  const secondaryPath = secondaryCta?.href ? sameSitePathFromHref(secondaryCta.href) : null

  return (
    <section className="w-full bg-white" aria-labelledby="about-teaser-heading">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-6 py-14 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-20">
        {/* Görsel - mobil ve masaüstünde solda/üstte */}
        <div className="relative order-1 aspect-[4/3] w-full overflow-hidden rounded-[28px] shadow-[0_20px_45px_-20px_rgba(19,23,25,0.35)] sm:aspect-[5/4] lg:aspect-[4/5]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt || heading || 'Hakkımızda'}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={false}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-200 text-zinc-400">
              Görsel yok
            </div>
          )}
        </div>

        {/* Metin - sağda */}
        <div
          ref={contentRef}
          className="order-2 w-full text-left transition-all duration-700 ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
          }}
        >
          {heading && (
            <h2
              id="about-teaser-heading"
              className="text-center font-black uppercase text-[26px] leading-[1.15] sm:text-[30px] md:text-[34px] lg:text-[38px] mb-4"
              style={{
                fontFamily: 'var(--font-family-title, var(--font-family))',
                fontWeight: 900,
                color: 'var(--primary, #2168b8)',
              }}
            >
              {heading}
            </h2>
          )}
          {body && body.length > 0 && (
            <div>
              <PortableText value={body} components={bodyComponents} />
            </div>
          )}
          {(primaryCta?.label || secondaryCta?.label) && (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {primaryCta?.label && (
                <>
                  {primaryPath ? (
                    <Link
                      href={primaryPath}
                      className="inline-flex h-[50px] items-center justify-center rounded-lg px-8 text-[15px] font-bold uppercase text-white transition hover:brightness-110"
                      style={{ fontFamily: 'var(--font-family)', background: 'var(--primary, #2168b8)' }}
                    >
                      {primaryCta.label}
                    </Link>
                  ) : (
                    <a
                      href={primaryCta.href || '#'}
                      target={primaryCta.href?.startsWith('http') ? '_blank' : undefined}
                      rel={primaryCta.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="inline-flex h-[50px] items-center justify-center rounded-lg px-8 text-[15px] font-bold uppercase text-white transition hover:brightness-110"
                      style={{ fontFamily: 'var(--font-family)', background: 'var(--primary, #2168b8)' }}
                    >
                      {primaryCta.label}
                    </a>
                  )}
                </>
              )}
              {secondaryCta?.label && (
                <>
                  {secondaryPath ? (
                    <Link
                      href={secondaryPath}
                      className="inline-flex h-[50px] items-center justify-center rounded-lg border-2 bg-white px-8 text-[15px] font-bold uppercase transition hover:bg-[var(--primary)]/[0.06]"
                      style={{ fontFamily: 'var(--font-family)', borderColor: 'var(--primary, #2168b8)', color: 'var(--primary, #2168b8)' }}
                    >
                      {secondaryCta.label}
                    </Link>
                  ) : (
                    <a
                      href={secondaryCta.href || '#'}
                      target={secondaryCta.href?.startsWith('http') ? '_blank' : undefined}
                      rel={secondaryCta.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="inline-flex h-[50px] items-center justify-center rounded-lg border-2 bg-white px-8 text-[15px] font-bold uppercase transition hover:bg-[var(--primary)]/[0.06]"
                      style={{ fontFamily: 'var(--font-family)', borderColor: 'var(--primary, #2168b8)', color: 'var(--primary, #2168b8)' }}
                    >
                      {secondaryCta.label}
                    </a>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
