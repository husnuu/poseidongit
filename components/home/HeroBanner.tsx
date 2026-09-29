import Image from 'next/image'
import Link from 'next/link'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'

const DEFAULT_TOP_BADGE_TEXT = 'Hantal Turizm - Belge No: 18888'

function resolveTopBadgeText(raw?: string | null): string {
  const trimmed = raw?.trim()
  if (!trimmed) return DEFAULT_TOP_BADGE_TEXT
  if (trimmed.toLocaleLowerCase('tr-TR').includes('en çok tercih edilen')) {
    return DEFAULT_TOP_BADGE_TEXT
  }
  return trimmed
}

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
      className={`relative w-full min-h-[560px] h-[74vh] md:min-h-[520px] md:h-[72vh] overflow-hidden ${!hasImage ? 'bg-[var(--secondary)]' : ''}`}
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
                fetchPriority="high"
                sizes="(max-width: 767px) 100vw, 1px"
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
                fetchPriority="high"
                sizes={
                  mobileImageUrl
                    ? '(min-width: 768px) 100vw, 1px'
                    : '(max-width: 1024px) 100vw, min(100vw, 1920px)'
                }
              />
            </div>
          )}
        </div>
      )}

      {/* Overlay: metin okunabilir olsun */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-black/5"
        aria-hidden
      />

      {(hero.topBadgeText?.trim() || hero.heroBadgeEnabled) && (
        <div className="pointer-events-none absolute left-4 top-[12px] z-10 md:left-6 md:top-[24px]">
          <span
            className="hero-creds-badge"
            style={{ fontFamily: 'var(--font-family)', fontWeight: 500 }}
          >
            {resolveTopBadgeText(hero.topBadgeText)}
          </span>
        </div>
      )}

      {/* Metin + CTA: CTA alta sabit; başlık mobilde translate ile yukarı */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end">
        <div className="w-full max-w-full pl-5 pr-5 py-8 sm:max-w-[min(1000px,65vw)] sm:pr-6 md:pl-10 md:pr-16 md:py-16">
          <div className="relative -translate-y-24 sm:-translate-y-8 md:translate-y-0">
            {hero.eyebrow && (
              <p
                className="hero-reveal hero-reveal-1 mb-2 text-xs uppercase tracking-widest text-white/80"
                style={{ fontWeight: 500 }}
              >
                {hero.eyebrow}
              </p>
            )}
            <h1
              className="hero-reveal hero-reveal-2 max-w-[98%] text-[40px] font-black uppercase leading-[1.12] text-white [text-shadow:none] sm:text-[44px] md:text-[50px] md:leading-[1.2] md:[text-shadow:0_12px_24px_rgba(0,0,0,0.45),0_6px_18px_rgba(17,24,39,0.25)] lg:max-w-[96%] lg:text-[62px]"
              style={{
                fontFamily: 'var(--font-family)',
                fontWeight: 900,
                WebkitTextStroke: '0.6px currentColor',
                // Gölge className'de: mobilde YOK (telefonda koyu hale/leke yapıyordu —
                // yazı bembeyaz kalsın), md+ 'da referans sitenin yumuşak gölgesi.
                marginBottom: '0.5em',
              }}
            >
              {line1}
              <br />
              {line2 || ' '}
            </h1>
            {hero.subheading && (
              <p className="hero-reveal hero-reveal-3 mt-4 max-w-[540px] text-base text-white/85 md:text-lg">
                {hero.subheading}
              </p>
            )}
          </div>
          {/* CTA: birincil gradyanlı mavi + ince beyaz parıltı kenarlığı, ikincil beyaz — mobilde tam genişlik */}
          <div className="hero-reveal hero-reveal-4 mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <span className="hero-primary-btn-wrap inline-flex h-14 w-full flex-shrink-0 items-center justify-center rounded-lg transition duration-200 hover:scale-105 sm:h-16 sm:w-[260px]">
              <span className="hero-primary-glow" aria-hidden="true" />
              <Link
                href={primaryHref}
                className="hero-primary-inner hero-btn-shine flex h-full w-full items-center justify-center rounded-lg text-white no-underline transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                style={{
                  fontFamily: 'var(--font-family)',
                  fontWeight: 700,
                  WebkitTextStroke: '0.5px currentColor',
                  fontSize: '18px',
                  textTransform: 'uppercase',
                  background: 'linear-gradient(to right, var(--primary, #2168b8) 0%, #4f8dc7 51%, var(--primary, #2168b8) 100%)',
                }}
              >
                {hero.primaryCta?.label || 'Turları Gör'}
              </Link>
            </span>
            <Link
              href={secondaryHref}
              className="flex h-14 w-full items-center justify-center rounded-lg bg-white no-underline transition duration-200 hover:scale-105 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent sm:h-16 sm:w-[260px]"
              style={{
                fontFamily: 'var(--font-family)',
                fontWeight: 700,
                fontSize: '17px',
                textTransform: 'uppercase',
                color: 'var(--primary, #2168b8)',
              }}
            >
              {hero.secondaryCta?.label || 'İletişim'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
