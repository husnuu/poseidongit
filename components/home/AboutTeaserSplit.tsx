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
      <p className="mb-3 text-base font-normal leading-relaxed text-white last:mb-0 md:text-lg">
        {children}
      </p>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-3 text-base font-normal italic leading-relaxed text-white/90 md:text-lg">
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

  return (
    <section
      /* Blog bölümüyle aynı dil: marka mavisi zemin + aynı mavinin bir ton
         açığıyla çizilmiş yumuşak kavisler. Önceki sarı-turuncu gradyan
         sitenin hiçbir yerinde kullanılmıyordu. */
      className="relative w-full overflow-hidden bg-[var(--section-sky,#4facd8)]"
      aria-labelledby="about-teaser-heading"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <span className="absolute -left-[38%] -top-[18%] block h-[420px] w-[420px] rounded-full bg-white/[0.07] md:-left-[18%] md:-top-[55%] md:h-[760px] md:w-[760px] md:bg-white/[0.05]" />
        <span className="absolute -bottom-[26%] -left-[42%] block h-[460px] w-[460px] rounded-full bg-white/[0.06] md:-bottom-[62%] md:-left-[6%] md:h-[820px] md:w-[820px] md:bg-white/[0.045]" />
        <span className="absolute -right-[36%] top-[26%] block h-[360px] w-[360px] rounded-full border-[40px] border-white/[0.07] md:-right-[24%] md:top-[18%] md:h-[680px] md:w-[680px] md:border-[60px] md:border-white/[0.05]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-6 py-14 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-20">
        {/* Metin - solda (referans: koyu başlık, sol hizalı, iki buton) */}
        <div
          ref={contentRef}
          className="order-2 w-full text-left transition-all duration-300 ease-out lg:order-1"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(8px)',
          }}
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3.5 py-1.5 text-[12px] font-extrabold uppercase tracking-wider text-white backdrop-blur-sm">
            <Anchor className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
            {EYEBROW[locale]}
          </span>
          {heading && (
            <h2
              id="about-teaser-heading"
              className="mb-4 text-left text-[28px] font-black uppercase leading-[1.15] text-white sm:text-[32px] md:text-[36px] lg:text-[40px]"
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
          {stats.length > 0 && (
            <dl className="mt-7 flex flex-wrap gap-x-7 gap-y-4 border-t border-white/25 pt-6">
              {stats.map((st, i) => (
                <div key={st.label} className={`flex flex-col-reverse ${i > 0 ? 'border-l border-white/25 pl-7' : ''}`}>
                  <dt className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white/80">{st.label}</dt>
                  <dd
                    className="m-0 text-[30px] font-black leading-none tabular-nums text-white sm:text-[34px]"
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
              {primaryCta?.label && (
                <>
                  {primaryPath ? (
                    <Link
                      href={primaryPath}
                      className="inline-flex h-[50px] items-center justify-center rounded-lg border-2 border-white bg-white px-7 text-[15px] font-extrabold uppercase text-[var(--primary,#2168b8)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)]"
                      style={{ fontFamily: 'var(--font-family)' }}
                    >
                      {primaryCta.label}
                      <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2.4} aria-hidden />
                    </Link>
                  ) : (
                    <a
                      href={primaryCta.href || '#'}
                      target={primaryCta.href?.startsWith('http') ? '_blank' : undefined}
                      rel={primaryCta.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="inline-flex h-[50px] items-center justify-center rounded-lg border-2 border-white bg-white px-7 text-[15px] font-extrabold uppercase text-[var(--primary,#2168b8)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)]"
                      style={{ fontFamily: 'var(--font-family)' }}
                    >
                      {primaryCta.label}
                      <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2.4} aria-hidden />
                    </a>
                  )}
                </>
              )}
              {secondaryCta?.label && (
                <>
                  {secondaryPath ? (
                    <Link
                      href={secondaryPath}
                      className="inline-flex h-[50px] items-center justify-center rounded-lg border-2 border-white px-7 text-[15px] font-extrabold uppercase text-white transition duration-200 hover:bg-white/10"
                      style={{ fontFamily: 'var(--font-family)' }}
                    >
                      {secondaryCta.label}
                    </Link>
                  ) : (
                    <a
                      href={secondaryCta.href || '#'}
                      target={secondaryCta.href?.startsWith('http') ? '_blank' : undefined}
                      rel={secondaryCta.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="inline-flex h-[50px] items-center justify-center rounded-lg border-2 border-white px-7 text-[15px] font-extrabold uppercase text-white transition duration-200 hover:bg-white/10"
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
        <div className="order-1 w-full lg:order-2">
          <div
            className="relative w-full overflow-hidden rounded-[28px] bg-white/10 shadow-[0_24px_50px_-20px_rgba(10,32,60,0.55)] ring-[6px] ring-white/20"
            style={{ aspectRatio: naturalRatio ?? 4 / 3 }}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={imageAlt || heading || 'Hakkımızda'}
                fill
                // object-contain: fotoğraf hiç kırpılmadan, tamamı görünecek
                // şekilde kutuya sığdırılıyor (gerçek oran zaten kutuyla
                // eşleştiği için pratikte boşluk da kalmıyor).
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-white/10 text-white/90">
                Görsel yok
              </div>
            )}
            {imageUrl && (
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-md sm:bottom-4 sm:left-4">
                <Camera className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
                {PHOTO_CAPTION[locale]}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
