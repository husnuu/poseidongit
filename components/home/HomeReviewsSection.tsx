'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Star } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'

export type HomeReviewItem = {
  id: string
  name: string
  dateLabel?: string | null
  description: string
  rating: number
  avatarUrl?: string | null
  avatarLqip?: string | null
  tourTitle: string
  tourSlug: string
}

export type HomeReviewsSectionData = {
  enabled?: boolean | null
  items: HomeReviewItem[]
  avgRating: number
  totalCount: number
  googleReviewsUrl?: string | null
}

type HomeReviewsSectionProps = {
  data: HomeReviewsSectionData | null
  locale?: SiteLocale
}

const HEADING: Record<SiteLocale, string> = {
  tr: 'MİSAFİRLERİMİZİN KALEMİNDEN',
  en: 'FROM OUR GUESTS',
  de: 'VON UNSEREN GÄSTEN',
}

const SUBTEXT: Record<SiteLocale, (count: string, rating: string) => string> = {
  tr: (count, rating) => `${count}+ doğrulanmış misafir tarafından ${rating} / 5.0 puan`,
  en: (count, rating) => `Rated ${rating} / 5.0 by ${count}+ verified guests`,
  de: (count, rating) => `Bewertet mit ${rating} / 5.0 von über ${count} verifizierten Gästen`,
}

const GOOGLE_LABEL: Record<SiteLocale, (count: string) => string> = {
  tr: (count) => `Google Yorumları (+${count})`,
  en: (count) => `Google Reviews (+${count})`,
  de: (count) => `Google-Bewertungen (+${count})`,
}

const VERIFIED_LABEL: Record<SiteLocale, string> = {
  tr: 'Doğrulanmış misafir',
  en: 'Verified guest',
  de: 'Verifizierter Gast',
}

/** Google'ın doğrulanmış-yorum mavi rozeti (referans site ile aynı ikon). */
function VerifiedMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden focusable="false">
      <path
        fill="#1d9bf0"
        d="M20.396 11a3.49 3.49 0 0 0-2.008-3.062 3.47 3.47 0 0 0-.742-3.584 3.474 3.474 0 0 0-3.584-.742A3.47 3.47 0 0 0 11 1.604a3.46 3.46 0 0 0-3.053 2.008 3.47 3.47 0 0 0-1.902-.14c-.635.13-1.22.436-1.69.882a3.461 3.461 0 0 0-.734 3.584A3.49 3.49 0 0 0 1.604 11a3.496 3.496 0 0 0 2.017 3.062 3.471 3.471 0 0 0 .733 3.584 3.49 3.49 0 0 0 3.584.742A3.49 3.49 0 0 0 11 20.396a3.48 3.48 0 0 0 3.062-2.007 3.335 3.335 0 0 0 4.326-4.327A3.49 3.49 0 0 0 20.396 11M9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
      />
    </svg>
  )
}

/** İsimden deterministik pastel avatar rengi (referans siteyle aynı görünüm). */
function avatarPalette(name: string): { bg: string; fg: string } {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360
  const hue = hash
  return {
    bg: `linear-gradient(135deg, hsl(${hue}, 70%, 94%), hsl(${hue}, 60%, 89%))`,
    fg: `hsl(${hue}, 55%, 28%)`,
  }
}

function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function StarRow({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)))
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${filled} / 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className="h-4 w-4"
          fill={i < filled ? '#f5a623' : 'none'}
          stroke={i < filled ? '#f5a623' : '#d4d4d8'}
          strokeWidth={2}
          aria-hidden
        />
      ))}
    </span>
  )
}

export default function HomeReviewsSection({ data, locale = 'tr' }: HomeReviewsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeDot, setActiveDot] = useState(0)

  if (!data?.enabled || !data.items?.length) return null

  const { items, avgRating, totalCount, googleReviewsUrl } = data
  const numLocale = locale === 'de' ? 'de-DE' : locale === 'en' ? 'en-US' : 'tr-TR'

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current
    const card = el?.children[index] as HTMLElement | undefined
    if (!el || !card) return
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' })
    setActiveDot(index)
  }

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const cards = Array.from(el.children) as HTMLElement[]
    let closest = 0
    let closestDist = Infinity
    cards.forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft - el.offsetLeft - el.scrollLeft)
      if (dist < closestDist) {
        closestDist = dist
        closest = i
      }
    })
    setActiveDot(closest)
  }

  return (
    <section
      className="w-full py-16 md:py-20"
      style={{ background: 'linear-gradient(135deg, #6ee7ca 0%, #34e0a1 100%)' }}
      aria-labelledby="home-reviews-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <header className="mb-8 text-center">
          <h2
            id="home-reviews-heading"
            className="text-[26px] font-black uppercase leading-[1.15] sm:text-[30px] md:text-[34px] lg:text-[38px]"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))', color: 'var(--secondary, #131719)' }}
          >
            {HEADING[locale]}
          </h2>
          <div className="mt-4 flex justify-center">
            <StarRow value={avgRating} />
          </div>
          <p className="mt-2 text-base font-medium" style={{ color: 'var(--secondary, #131719)' }}>
            {SUBTEXT[locale](totalCount.toLocaleString(numLocale), avgRating.toFixed(1))}
          </p>
          {googleReviewsUrl && (
            <div className="mt-5 flex justify-center">
              <a
                href={googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border-2 bg-white px-6 py-2.5 text-sm font-bold uppercase tracking-wide shadow-sm transition hover:bg-[var(--primary)]/[0.06]"
                style={{ borderColor: 'var(--primary, #2168b8)', color: 'var(--primary, #2168b8)' }}
              >
                <GoogleMark />
                {GOOGLE_LABEL[locale](totalCount.toLocaleString(numLocale))}
              </a>
            </div>
          )}
        </header>

        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth [&::-webkit-scrollbar]:hidden"
          >
            {items.map((review) => {
              const initial = (review.name || '?').trim().charAt(0).toUpperCase()
              const tourHref = withLocalePath(locale, `/tur/${review.tourSlug}`)
              const palette = avatarPalette(review.name || 'A')
              return (
                <div
                  key={review.id}
                  className="w-[min(85vw,340px)] shrink-0 snap-start rounded-2xl border-l-4 p-5 shadow-sm sm:w-[300px]"
                  style={{ borderLeftColor: 'var(--primary, #2168b8)', background: '#fdf8f0' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <StarRow value={review.rating} />
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold"
                      style={{ color: 'var(--secondary, #131719)' }}
                    >
                      <VerifiedMark />
                      {VERIFIED_LABEL[locale]}
                    </span>
                  </div>

                  <p
                    className="mt-4 line-clamp-4 text-sm italic leading-relaxed"
                    style={{ color: 'var(--secondary, #131719)' }}
                  >
                    “{review.description}”
                  </p>

                  <div className="mt-4 flex items-center gap-3 border-t pt-4" style={{ borderColor: 'rgba(19,23,25,0.08)' }}>
                    {review.avatarUrl ? (
                      <Image
                        src={review.avatarUrl}
                        alt={review.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                        placeholder={review.avatarLqip ? 'blur' : 'empty'}
                        blurDataURL={review.avatarLqip ?? undefined}
                      />
                    ) : (
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                        style={{ background: palette.bg, color: palette.fg }}
                        aria-hidden
                      >
                        {initial}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold" style={{ color: 'var(--secondary, #131719)' }}>
                        {review.name}
                      </p>
                      <Link
                        href={tourHref}
                        className="truncate text-xs no-underline hover:underline"
                        style={{ color: 'var(--muted, #81848b)' }}
                      >
                        {review.tourTitle}
                      </Link>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--muted, #81848b)' }} aria-hidden />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {items.length > 1 && (
          <div className="mt-6 flex items-center justify-center gap-1.5" role="tablist" aria-label="Yorum sayfaları">
            {items.map((review, i) => (
              <button
                key={review.id}
                type="button"
                role="tab"
                aria-selected={i === activeDot}
                aria-label={`${i + 1}. yoruma git`}
                onClick={() => scrollToIndex(i)}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === activeDot ? 22 : 8,
                  background: i === activeDot ? 'var(--primary, #2168b8)' : 'rgba(255,255,255,0.6)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
