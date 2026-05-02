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
        className="text-[16px] md:text-[17px] leading-[1.65] max-w-[540px] mb-3 last:mb-0"
        style={{ color: 'var(--text-color, #58595b)' }}
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
    <section
      className="w-full grid grid-cols-1 lg:grid-cols-2 min-h-0"
      aria-labelledby="about-teaser-heading"
    >
      {/* Text panel - mobile'da altta (order-2) */}
      <div
        className="flex items-center justify-center px-6 py-14 lg:px-28 lg:py-24 min-h-[380px] lg:min-h-[540px] order-2 lg:order-1"
        style={{ background: 'var(--about-bg, var(--section-turquoise-bg, #dff4fc))' }}
      >
        <div
          ref={contentRef}
          className="w-full max-w-[600px] transition-all duration-700 ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
          }}
        >
          {heading && (
            <h2
              id="about-teaser-heading"
              className="uppercase font-extrabold text-[24px] lg:text-[32px] leading-[1.1] mb-4 -mt-6 text-[#1e3a5f]"
              style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
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
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-8">
              {primaryCta?.label && (
                <>
                  {primaryPath ? (
                    <Link
                      href={primaryPath}
                      className="h-[48px] min-w-[200px] w-full sm:w-[200px] px-5 rounded-md bg-[#111] text-white font-bold uppercase flex items-center justify-center transition-colors duration-200 hover:bg-[#222] text-[17px]"
                      style={{ fontFamily: 'var(--font-family)' }}
                    >
                      {primaryCta.label}
                    </Link>
                  ) : (
                    <a
                      href={primaryCta.href || '#'}
                      target={primaryCta.href?.startsWith('http') ? '_blank' : undefined}
                      rel={primaryCta.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="h-[48px] min-w-[200px] w-full sm:w-[200px] px-5 rounded-md bg-[#111] text-white font-bold uppercase flex items-center justify-center transition-colors duration-200 hover:bg-[#222] text-[17px]"
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
                      className="h-[48px] min-w-[200px] w-full sm:w-[200px] px-5 rounded-md border border-zinc-300 bg-white text-[#111] font-bold uppercase flex items-center justify-center transition-colors duration-200 hover:bg-zinc-50 text-[17px]"
                      style={{ fontFamily: 'var(--font-family)' }}
                    >
                      {secondaryCta.label}
                    </Link>
                  ) : (
                    <a
                      href={secondaryCta.href || '#'}
                      target={secondaryCta.href?.startsWith('http') ? '_blank' : undefined}
                      rel={secondaryCta.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="h-[48px] min-w-[200px] w-full sm:w-[200px] px-5 rounded-md border border-zinc-300 bg-white text-[#111] font-bold uppercase flex items-center justify-center transition-colors duration-200 hover:bg-zinc-50 text-[17px]"
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
      </div>

      {/* Image panel - mobile'da üstte (order-1) */}
      <div className="relative w-full min-h-[380px] lg:min-h-[540px] order-1 lg:order-2 bg-zinc-200">
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
          <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
            Görsel yok
          </div>
        )}
      </div>
    </section>
  )
}
