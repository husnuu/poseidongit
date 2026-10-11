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
      <p className="mb-3 text-base font-normal leading-relaxed text-[#2b1d05]/80 last:mb-0 md:text-lg">
        {children}
      </p>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-3 text-base font-normal italic leading-relaxed text-[#2b1d05]/70 md:text-lg">
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
      { threshold: 0.12, rootMargin: '0px 0px 150px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (!data?.enabled) return null

  const { heading, body, imageUrl, imageAlt, primaryCta, secondaryCta } = data
  const primaryPath = primaryCta?.href ? sameSitePathFromHref(primaryCta.href) : null
  const secondaryPath = secondaryCta?.href ? sameSitePathFromHref(secondaryCta.href) : null

  return (
    <section
      className="w-full"
      style={{ background: 'linear-gradient(90deg, #ffd200, #f7971e)' }}
      aria-labelledby="about-teaser-heading"
    >
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-6 py-14 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-20">
        {/* Metin - solda (referans: koyu başlık, sol hizalı, iki buton) */}
        <div
          ref={contentRef}
          className="order-2 w-full text-center transition-all duration-300 ease-out lg:order-1 lg:text-left"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(8px)',
          }}
        >
          {heading && (
            <h2
              id="about-teaser-heading"
              className="mb-4 text-center text-[28px] font-black uppercase leading-[1.15] text-[#1a1305] sm:text-[32px] md:text-[36px] lg:text-[40px]"
              style={{
                fontFamily: 'var(--font-family-title, var(--font-family))',
                fontWeight: 900,
                WebkitTextStroke: '0.6px currentColor',
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
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              {primaryCta?.label && (
                <>
                  {primaryPath ? (
                    <Link
                      href={primaryPath}
                      className="inline-flex h-[50px] items-center justify-center rounded-lg bg-[#1a1305] px-8 text-[15px] font-bold uppercase text-white transition duration-200 hover:scale-105 hover:brightness-110"
                      style={{ fontFamily: 'var(--font-family)' }}
                    >
                      {primaryCta.label}
                    </Link>
                  ) : (
                    <a
                      href={primaryCta.href || '#'}
                      target={primaryCta.href?.startsWith('http') ? '_blank' : undefined}
                      rel={primaryCta.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="inline-flex h-[50px] items-center justify-center rounded-lg bg-[#1a1305] px-8 text-[15px] font-bold uppercase text-white transition duration-200 hover:scale-105 hover:brightness-110"
                      style={{ fontFamily: 'var(--font-family)' }}
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
                      className="inline-flex h-[50px] items-center justify-center rounded-lg bg-white px-8 text-[15px] font-bold uppercase text-[#1a1305] transition duration-200 hover:scale-105 hover:brightness-95"
                      style={{ fontFamily: 'var(--font-family)' }}
                    >
                      {secondaryCta.label}
                    </Link>
                  ) : (
                    <a
                      href={secondaryCta.href || '#'}
                      target={secondaryCta.href?.startsWith('http') ? '_blank' : undefined}
                      rel={secondaryCta.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="inline-flex h-[50px] items-center justify-center rounded-lg bg-white px-8 text-[15px] font-bold uppercase text-[#1a1305] transition duration-200 hover:scale-105 hover:brightness-95"
                      style={{ fontFamily: 'var(--font-family)' }}
                    >
                      {secondaryCta.label}
                    </a>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Görsel - sağda (referans: yuvarlak köşeli tek fotoğraf) */}
        <div className="relative order-1 aspect-[4/3] w-full overflow-hidden rounded-[28px] shadow-[0_20px_45px_-20px_rgba(26,19,5,0.35)] lg:order-2">
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
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 text-[#1a1305]/60">
              Görsel yok
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
