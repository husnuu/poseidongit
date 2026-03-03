import Image from 'next/image'
import Link from 'next/link'

export type HeroData = {
  eyebrow?: string | null
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

export default function HeroBanner({ hero }: { hero: HeroData | null }) {
  if (!hero?.heading) return null

  const desktopImageUrl = hero.heroImageUrl ?? ''
  const mobileImageUrl = hero.heroImageMobileUrl ?? hero.heroImageUrl ?? ''
  const alt = hero.heroImageAlt ?? 'Hero image'
  const [line1, line2] = splitHeadingIntoTwoLines(hero.heading)

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

      {/* Badge (sol üst) */}
      {hero.heroBadgeEnabled && (
        <div
          className="absolute left-6 top-6 z-10 md:left-16 md:top-12 rounded-[10px] bg-white/20 px-4 py-2.5 backdrop-blur-md border border-white/20"
          aria-label="Değerlendirme"
        >
          <span className="text-sm font-medium text-white whitespace-nowrap">
            MÜKEMMEL • 2,017 yorum
          </span>
        </div>
      )}

      {/* Metin + CTA (sol alt) - başlık ortaya kadar genişleyebilir */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end">
        <div className="w-full max-w-[min(1000px,65vw)] pl-5 pr-6 py-8 md:pl-10 md:pr-16 md:py-16">
          {hero.eyebrow && (
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-white/80">
              {hero.eyebrow}
            </p>
          )}
          <h1
            className="max-w-[98%] text-[48px] font-black uppercase leading-[1.25] text-white lg:max-w-[96%] lg:text-[74px]"
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
          {/* CTA: birincil 220×54 lacivert + hareketli kenar; ikincil 220×54 tamamen beyaz, Inter-Bold */}
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            {/* Birincil: lacivert, etrafında dönen kenar (conic-gradient + rotate) */}
            <span className="hero-primary-btn-wrap inline-flex h-[58px] w-[224px] flex-shrink-0 items-center justify-center rounded p-[2px]">
              <Link
                href={hero.primaryCta?.href || '/turlar'}
                className="hero-primary-inner hero-btn-shine flex h-[54px] w-[220px] items-center justify-center rounded bg-[#1e3a5f] text-white no-underline transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                style={{ fontFamily: '"Inter-Bold", var(--font-family), sans-serif', fontWeight: 700, fontSize: '20px', textTransform: 'uppercase' }}
              >
                {hero.primaryCta?.label || 'Turları Gör'}
              </Link>
            </span>
            {/* İkincil: tamamen beyaz, kenar yok */}
            <Link
              href={hero.secondaryCta?.href || '/contact'}
              className="hero-btn-shine hero-cta-secondary inline-flex h-[54px] w-[220px] flex-shrink-0 items-center justify-center rounded bg-white text-[#1e3a5f] no-underline transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
              style={{ fontFamily: '"Inter-Bold", var(--font-family), sans-serif', fontWeight: 700, fontSize: '20px', textTransform: 'uppercase' }}
            >
              {hero.secondaryCta?.label || 'İletişim'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
