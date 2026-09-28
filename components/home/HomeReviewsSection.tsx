'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'

export type HomeReviewItem = {
  id: string
  name: string
  dateLabel?: string | null
  description: string
  /** Çeviri öncesi orijinal (Türkçe) metin — sadece gerçekten çevrilmişse dolu. */
  originalDescription?: string | null
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
  tr: 'SİZDEN GELENLER',
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

const TRANSLATED_FROM_LABEL: Record<SiteLocale, string> = {
  tr: '',
  en: 'Translated from Turkish',
  de: 'Aus dem Türkischen übersetzt',
}

const SHOW_ORIGINAL_LABEL: Record<SiteLocale, string> = {
  tr: '',
  en: 'Show original',
  de: 'Original anzeigen',
}

const SHOW_TRANSLATION_LABEL: Record<SiteLocale, string> = {
  tr: '',
  en: 'Show translation',
  de: 'Übersetzung anzeigen',
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

function StarRow({ value, size = 'sm' }: { value: number; size?: 'sm' | 'lg' }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)))
  // Referanstaki üst yıldız sırası ~24px/yıldız, sıkı aralıklı
  const starClass = size === 'lg' ? 'h-6 w-6 sm:h-[26px] sm:w-[26px]' : 'h-4 w-4'
  const gapClass = size === 'lg' ? 'gap-0.5' : 'gap-0.5'
  return (
    <span className={`inline-flex items-center ${gapClass}`} aria-label={`${filled} / 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={starClass}
          fill={i < filled ? '#eaaa45' : 'none'}
          stroke={i < filled ? '#eaaa45' : '#d4d4d8'}
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
  const [revealedOriginal, setRevealedOriginal] = useState<ReadonlySet<string>>(() => new Set())

  const toggleOriginal = (id: string) => {
    setRevealedOriginal((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
      // Referans siteden birebir örneklenen yatay gradyan: solda nane yeşili, sağda turkuaz
      style={{ background: 'linear-gradient(to right, #7afbc9 0%, #6de8e8 100%)' }}
      aria-labelledby="home-reviews-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <header className="mb-10 text-center">
          <h2
            id="home-reviews-heading"
            className="text-[24px] font-black uppercase leading-[1.15] sm:text-[27px] md:text-[30px] lg:text-[33px]"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))', color: 'var(--secondary, #131719)' }}
          >
            {HEADING[locale]}
          </h2>
          <div className="mt-4 flex justify-center">
            <StarRow value={avgRating} size="lg" />
          </div>
          <p className="mx-auto mt-2 max-w-2xl text-center text-base font-normal leading-relaxed md:text-lg" style={{ color: 'var(--secondary, #131719)' }}>
            {SUBTEXT[locale](totalCount.toLocaleString(numLocale), avgRating.toFixed(1))}
          </p>
          {googleReviewsUrl && (
            <div className="mt-5 flex justify-center">
              <a
                href={googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                // Referans: şeffaf zemin (gradyan görünür), 2px #366deb çerçeve, aynı mavi
                // büyük harf metin, küçük köşe yuvarlaklığı — beyaz "hap" değil. Üstüne
                // gelince dolgu maviye dönüyor + hafif büyüme efekti.
                className="inline-flex items-center gap-2.5 rounded-lg border-2 border-[#366deb] bg-transparent px-6 py-2.5 text-[15px] font-bold uppercase tracking-wide text-[#366deb] transition duration-200 hover:scale-105 hover:bg-[#366deb] hover:text-white"
              >
                <GoogleMark size={21} />
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
              const isRevealed = revealedOriginal.has(review.id)
              const shownDescription = isRevealed && review.originalDescription ? review.originalDescription : review.description
              return (
                <div
                  key={review.id}
                  // Referans: ~360px genişlik, ~400px yükseklik, krem zemin, kalın mavi sol kenar;
                  // alıntı üst satır ile alt (isim) bloğu arasında dikeyde ortalanır.
                  className="flex min-h-[400px] w-[78vw] max-w-[360px] shrink-0 snap-start flex-col rounded-2xl border-l-[5px] p-7 shadow-sm sm:w-[360px]"
                  style={{ borderLeftColor: '#5384ed', background: '#fefaf1' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <StarRow value={review.rating} />
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold"
                      style={{ color: 'var(--primary, #2168b8)' }}
                    >
                      <VerifiedMark />
                      {VERIFIED_LABEL[locale]}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-center py-6">
                    <p
                      className="line-clamp-6 text-[17px] italic leading-relaxed"
                      style={{ color: 'var(--text-color, #58595b)' }}
                    >
                      “{shownDescription}”
                    </p>

                    {review.originalDescription && (
                      <button
                        type="button"
                        onClick={() => toggleOriginal(review.id)}
                        className="mt-2 self-start text-xs font-medium underline decoration-dotted underline-offset-2 transition hover:opacity-70"
                        style={{ color: 'var(--muted, #81848b)' }}
                      >
                        {TRANSLATED_FROM_LABEL[locale]} · {isRevealed ? SHOW_TRANSLATION_LABEL[locale] : SHOW_ORIGINAL_LABEL[locale]}
                      </button>
                    )}
                  </div>

                  <div className="mt-auto flex items-center gap-4">
                    {review.avatarUrl ? (
                      <Image
                        src={review.avatarUrl}
                        alt={review.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                        placeholder={review.avatarLqip ? 'blur' : 'empty'}
                        blurDataURL={review.avatarLqip ?? undefined}
                      />
                    ) : (
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold"
                        style={{ background: palette.bg, color: palette.fg }}
                        aria-hidden
                      >
                        {initial}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[17px] font-bold uppercase tracking-wide" style={{ color: 'var(--secondary, #131719)' }}>
                        {review.name}
                      </p>
                      <Link
                        href={tourHref}
                        className="block truncate text-[13px] no-underline hover:underline"
                        style={{ color: 'var(--muted, #81848b)' }}
                      >
                        {review.tourTitle}
                      </Link>
                    </div>
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
                  background: i === activeDot ? 'rgba(19,23,25,0.55)' : 'rgba(255,255,255,0.6)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
