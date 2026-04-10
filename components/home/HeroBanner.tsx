import Image from 'next/image'
import Link from 'next/link'
import { Crown } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'

export type HeroData = {
  eyebrow?: string | null
  topBadgeText?: string | null
  heading?: string | null
  subheading?: string | null
  heroBadgeEnabled?: boolean
  primaryCta?: { label?: string; href?: string } | null
  secondaryCta?: { label?: string; href?: string } | null
  heroImageUrl?: string | null
  heroImageAlt?: string | null
  heroImageMobileUrl?: string | null
}

function splitHeadingIntoTwoLines(heading: string): [string, string] {
  if (heading.includes('\n')) {
    const parts = heading.split('\n')
    return [parts[0]?.trim() ?? '', parts.slice(1).join(' ').trim() ?? '']
  }
  const words = heading.trim().split(/\s+/)
  if (words.length <= 1) return [heading, '']
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}

export default function HeroBanner({
  hero,
  locale = 'tr',
}: {
  hero: HeroData | null
  locale?: SiteLocale
}) {
  if (!hero?.heading) return null

  const desktopImageUrl = hero.heroImageUrl ?? ''
  const mobileImageUrl = hero.heroImageMobileUrl ?? hero.heroImageUrl ?? ''
  const alt = hero.heroImageAlt ?? 'Hero image'
  const [line1, line2] = splitHeadingIntoTwoLines(hero.heading)

  const primaryHref = hero.primaryCta?.href?.trim()
    ? hero.primaryCta.href
    : withLocalePath(locale, '/turlar')
  const secondaryHref = hero.secondaryCta?.href?.trim()
    ? hero.secondaryCta.href
    : withLocalePath(locale, '/contact')

  const hasImage = !!(desktopImageUrl || mobileImageUrl)

  return (
    <section
      className={`relative w-full min-h-[440px] h-[65vh] md:min-h-[520px] md:h-[72vh] overflow-hidden ${!hasImage ? 'bg-[var(--secondary)]' : ''}`}
      aria-label="Hero"
    >
      {/* Görsel: mobil ve desktop ayrı (responsive), Next/Image fill + priority */}
      {(desktopImageUrl || mobileImageUrl) && (
        <div className="absolute inset-0">
          {mobileImageUrl && (
            <div className="absolute inset-0 md:hidden">
              <Image
                src={mobileImageUrl}
                alt={alt}
                fill
                className="object-cover object-center"
                priority
                sizes="100vw"
              />
            </div>
          )}
          {desktopImageUrl && (
            <div className={mobileImageUrl ? 'absolute inset-0 hidden md:block' : 'absolute inset-0'}>
              <Image
                src={desktopImageUrl}
                alt={alt}
                fill
                className="object-cover object-center"
                priority
                sizes="100vw"
              />
            </div>
          )}
        </div>
      )}

      {/* Overlay: metin okunabilir olsun */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20"
        aria-hidden
      />

      {(hero.topBadgeText?.trim() || hero.heroBadgeEnabled) && (
        <div className="pointer-events-none absolute left-5 top-[12px] z-10 md:left-10 md:top-[24px]">
          <span
            className="relative inline-flex items-center gap-2 overflow-hidden rounded-l-none rounded-r-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white md:px-5 md:py-2 md:text-sm"
            style={{
              fontFamily: 'var(--font-family)',
              background: 'linear-gradient(90deg, #d8832a 0%, #c97622 100%)',
              borderColor: 'rgba(255, 235, 205, 0.7)',
              boxShadow:
                '0 4px 14px rgba(0, 0, 0, 0.22), 0 0 12px rgba(251, 146, 60, 0.5), 0 0 22px rgba(249, 115, 22, 0.35), inset 0 0 0 1px rgba(255, 244, 220, 0.32)',
            }}
          >
            <Crown className="h-4 w-4 text-white md:h-5 md:w-5" aria-hidden />
            <span className="relative z-[1]">
              {hero.topBadgeText?.trim() || 'Çeşme’nin En Çok Tercih Edilen Tekne Turu'}
            </span>
          </span>
        </div>
      )}

      {/* Metin + CTA: CTA alta sabit; başlık mobilde translate ile yukarı */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end">
        <div className="w-full max-w-[min(1000px,65vw)] pl-5 pr-6 py-8 md:pl-10 md:pr-16 md:py-16">
          <div className="relative -translate-y-12 sm:-translate-y-8 md:translate-y-0">
            {hero.eyebrow && (
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-white/80">
                {hero.eyebrow}
              </p>
            )}
            <h1
              className="max-w-[98%] text-[42px] font-black uppercase leading-[1.25] text-white sm:text-[48px] md:text-[60px] lg:max-w-[96%] lg:text-[78px]"
              style={{ fontFamily: 'var(--font-family)', fontWeight: 900, textShadow: '0 6px 12px rgba(0, 0, 0, .16)', marginBottom: '0.5em' }}
            >
              {line1}
              <br />
              {line2 || '\u00A0'}
            </h1>
            {hero.subheading && (
              <p className="mt-4 max-w-[540px] text-base text-white/85 md:text-lg">
                {hero.subheading}
              </p>
            )}
          </div>
          {/* CTA: birincil lacivert + hareketli kenar; ikincil beyaz, Inter-Bold */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            {/* Birincil: lacivert, etrafında dönen kenar (conic-gradient + rotate) */}
            <span className="hero-primary-btn-wrap inline-flex h-[52px] w-[200px] flex-shrink-0 items-center justify-center rounded p-[2px]">
              <Link
                href={primaryHref}
                className="hero-primary-inner hero-btn-shine flex h-[48px] w-[196px] items-center justify-center rounded bg-[#1e3a8a] text-white no-underline transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                style={{ fontFamily: '"Inter-Bold", var(--font-family), sans-serif', fontWeight: 700, fontSize: '17px', textTransform: 'uppercase' }}
              >
                {hero.primaryCta?.label || 'Turları Gör'}
              </Link>
            </span>
            {/* İkincil: tamamen beyaz, kenar yok */}
            <Link
              href={secondaryHref}
              className="hero-btn-shine hero-cta-secondary inline-flex h-[48px] w-[196px] flex-shrink-0 items-center justify-center rounded bg-white text-[#1e3a5f] no-underline transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
              style={{ fontFamily: '"Inter-Bold", var(--font-family), sans-serif', fontWeight: 700, fontSize: '17px', textTransform: 'uppercase' }}
            >
              {hero.secondaryCta?.label || 'İletişim'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
