'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import { Anchor, ArrowRight, Camera } from 'lucide-react'
import { sameSitePathFromHref } from '@/lib/siteUrls'
import type { PortableTextBlock } from '@portabletext/react'
import type { SiteLocale } from '@/lib/i18n/config'

/** Fotoğrafın üstündeki arşiv notu — gerçek tarih/ekip adı sabit, sadece
    bağlaç kelimesi dile göre çevriliyor. */
const PHOTO_CAPTION: Record<SiteLocale, string> = {
  tr: 'Arşivden · Poseidon Ekibi, 2011',
  en: 'From the archive · Poseidon Team, 2011',
  de: 'Aus dem Archiv · Poseidon Team, 2011',
  ru: 'Из архива · команда Poseidon, 2011',
}

const EYEBROW: Record<SiteLocale, string> = {
  tr: 'Hikayemiz',
  en: 'Our story',
  de: 'Unsere Geschichte',
  ru: 'Наша история',
}

/** İstatistik etiketleri — değerler Hakkımızda sayfasındaki gerçek filo
    verisinden (en eski teknenin yılı, tekne sayısı) hesaplanıyor. */
const STAT_LABELS: Record<SiteLocale, { founded: string; fleet: string; years: string }> = {
  tr: { founded: 'Kuruluş', fleet: 'Tekne', years: 'Yıllık deneyim' },
  en: { founded: 'Founded', fleet: 'Boats', years: 'Years at sea' },
  de: { founded: 'Gegründet', fleet: 'Boote', years: 'Jahre Erfahrung' },
  ru: { founded: 'Основание', fleet: 'Лодок', years: 'Лет опыта' },
}

export type AboutTeaserData = {
  enabled?: boolean | null
  heading?: string | null
  body?: PortableTextBlock[] | null
  imageUrl?: string | null
  imageAlt?: string | null
  /** Fotoğrafın gerçek en-boy oranı — kırpılmadan, orijinal haliyle göstermek için. */
  imageWidth?: number | null
  imageHeight?: number | null
  primaryCta?: { label?: string | null; href?: string | null } | null
  secondaryCta?: { label?: string | null; href?: string | null } | null
  /** Filodaki en eski teknenin yılı (Hakkımızda sayfası verisi). */
  foundingYear?: number | null
  fleetCount?: number | null
}

type AboutTeaserSplitProps = {
  data: AboutTeaserData | null
  locale?: SiteLocale
}

function isInternalHref(href: string | null | undefined): boolean {
  if (!href) return false
  return href.startsWith('/') && !href.startsWith('//')
}

const bodyComponents = {
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-3 text-base font-normal leading-relaxed text-[#3b3a33] last:mb-0 md:text-lg">
        {children}
      </p>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-3 text-base font-normal italic leading-relaxed text-[#3b3a33] md:text-lg">
        {children}
      </p>
    ),
  },
}

export default function AboutTeaserSplit({ data, locale = 'tr' }: AboutTeaserSplitProps) {
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

  const { heading, body, imageUrl, imageAlt, imageWidth, imageHeight, primaryCta, secondaryCta } = data
  // Gerçek en-boy oranı biliniyorsa onu kullan — fotoğraf kırpılmadan,
  // orijinal haliyle görünsün diye (önceden sabit 4:3 + object-cover
  // yatayda kenarları kesiyordu). Bilinmiyorsa 4:3'e geri düşer.
  const naturalRatio = imageWidth && imageHeight ? imageWidth / imageHeight : null
  const primaryPath = primaryCta?.href ? sameSitePathFromHref(primaryCta.href) : null
  const secondaryPath = secondaryCta?.href ? sameSitePathFromHref(secondaryCta.href) : null
  const labels = STAT_LABELS[locale]
  const currentYear = new Date().getFullYear()
  const stats = [
    data.foundingYear ? { value: String(data.foundingYear), label: labels.founded } : null,
    data.fleetCount ? { value: `${data.fleetCount}`, label: labels.fleet } : null,
    data.foundingYear && currentYear > data.foundingYear
      ? { value: `${currentYear - data.foundingYear}`, label: labels.years }
      : null,
  ].filter((x): x is { value: string; label: string } => x != null)

  const ctaClass = {
    primary:
      'inline-flex h-[52px] min-w-[180px] items-center justify-center gap-2 rounded-lg bg-[var(--secondary,#131719)] px-8 text-[15px] font-extrabold uppercase tracking-wide text-white transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-12px_rgba(19,23,25,0.6)]',
    secondary:
      'inline-flex h-[52px] min-w-[180px] items-center justify-center rounded-lg bg-white px-8 text-[15px] font-extrabold uppercase tracking-wide text-[var(--secondary,#131719)] shadow-[0_2px_8px_rgba(19,23,25,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-12px_rgba(19,23,25,0.35)]',
  }

  const renderCta = (
    cta: { label?: string | null; href?: string | null } | null | undefined,
    path: string | null,
    kind: 'primary' | 'secondary'
  ) => {
    if (!cta?.label) return null
    const inner = (
      <>
        {cta.label}
        {kind === 'primary' && <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />}
      </>
    )
    if (path) {
      return (
        <Link href={path} className={ctaClass[kind]} style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}>
          {inner}
        </Link>
      )
    }
    const external = cta.href?.startsWith('http')
    return (
      <a
        href={cta.href || '#'}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={ctaClass[kind]}
        style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
      >
        {inner}
      </a>
    )
  }

  return (
    <section
      /* Kum sarısı zemin; ortalı başlık, altında metin + polaroid fotoğraf. */
      className="w-full bg-[#f7e8b0]"
      aria-labelledby="about-teaser-heading"
    >
      <div
        ref={contentRef}
        className="mx-auto max-w-[1200px] px-6 py-14 transition-all duration-300 ease-out lg:px-10 lg:py-20"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(8px)',
        }}
      >
        <header className="mb-10 flex flex-col items-center text-center lg:mb-14">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-1.5 text-[12px] font-extrabold uppercase tracking-wider text-[var(--secondary,#131719)]">
            <Anchor className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
            {EYEBROW[locale]}
          </span>
          {heading && (
            <h2
              id="about-teaser-heading"
              className="m-0 text-[28px] font-black uppercase leading-[1.15] text-[var(--secondary,#131719)] sm:text-[32px] md:text-[36px] lg:text-[40px]"
              style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900, WebkitTextStroke: '0.6px currentColor' }}
            >
              {heading}
            </h2>
          )}
        </header>

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 w-full text-left lg:order-1">
            {body && body.length > 0 && <PortableText value={body} components={bodyComponents} />}
            {stats.length > 0 && (
              <dl className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
                {stats.map((st) => (
                  <div key={st.label} className="flex flex-col-reverse rounded-2xl bg-white/70 px-4 py-4 shadow-[0_2px_10px_rgba(19,23,25,0.05)] sm:px-5">
                    <dt className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b6650]">{st.label}</dt>
                    <dd
                      className="m-0 text-[28px] font-black leading-none tabular-nums text-[var(--secondary,#131719)] sm:text-[34px]"
                      style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
                    >
                      {st.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {(primaryCta?.label || secondaryCta?.label) && (
              <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                {renderCta(primaryCta, primaryPath, 'primary')}
                {renderCta(secondaryCta, secondaryPath, 'secondary')}
              </div>
            )}
          </div>

          {/* Polaroid: beyaz çerçeve, hafif eğik; altta arşiv notu. */}
          <div className="order-1 w-full px-2 lg:order-2">
            <figure className="m-0 rotate-[1.5deg] rounded-md bg-[#fdfcf7] p-3 pb-6 shadow-[0_28px_50px_-24px_rgba(60,50,20,0.55)] transition-transform duration-500 hover:rotate-0 sm:p-4 sm:pb-10">
              <div className="relative w-full overflow-hidden bg-zinc-100" style={{ aspectRatio: naturalRatio ?? 4 / 3 }}>
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={imageAlt || heading || 'Hakkımızda'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-400">Görsel yok</div>
                )}
              </div>
              {imageUrl && (
                <figcaption className="mt-3 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#6b6650] sm:mt-4">
                  <Camera className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
                  {PHOTO_CAPTION[locale]}
                </figcaption>
              )}
            </figure>
          </div>
        </div>
      </div>
    </section>
  )
}
