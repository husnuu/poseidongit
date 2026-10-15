'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Star, X } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import InstagramModern from '@/components/icons/InstagramModern'
import modalStyles from './ReviewModal.module.css'

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
  instagramUrl?: string | null
  /** Opsiyonel, Sanity'de (siteFooter > social > Instagram) manuel girilir — ör. "15.2K". */
  instagramFollowerCount?: string | null
}

type HomeReviewsSectionProps = {
  data: HomeReviewsSectionData | null
  locale?: SiteLocale
}

const HEADING: Record<SiteLocale, string> = {
  tr: 'SİZDEN GELENLER',
  en: 'FROM OUR GUESTS',
  de: 'VON UNSEREN GÄSTEN',
  ru: 'ОТ НАШИХ ГОСТЕЙ',
}

const SUBTEXT: Record<SiteLocale, (count: string, rating: string) => string> = {
  tr: (count, rating) => `${count}+ doğrulanmış misafir tarafından ${rating} / 5.0 puan`,
  en: (count, rating) => `Rated ${rating} / 5.0 by ${count}+ verified guests`,
  de: (count, rating) => `Bewertet mit ${rating} / 5.0 von über ${count} verifizierten Gästen`,
  ru: (count, rating) => `Оценка ${rating} / 5.0 от более чем ${count} проверенных гостей`,
}

const GOOGLE_LABEL: Record<SiteLocale, (count: string) => string> = {
  tr: (count) => `Google Yorumları (+${count})`,
  en: (count) => `Google Reviews (+${count})`,
  de: (count) => `Google-Bewertungen (+${count})`,
  ru: (count) => `Отзывы Google (+${count})`,
}

const INSTAGRAM_LABEL: Record<SiteLocale, (count: string) => string> = {
  tr: (count) => `Instagram Takipçi (+${count})`,
  en: (count) => `Instagram Followers (+${count})`,
  de: (count) => `Instagram-Follower (+${count})`,
  ru: (count) => `Подписчики в Instagram (+${count})`,
}

const INSTAGRAM_FOLLOW_LABEL: Record<SiteLocale, string> = {
  tr: "Instagram'da Takip Et",
  en: 'Follow on Instagram',
  de: 'Auf Instagram folgen',
  ru: 'Подписаться в Instagram',
}

const TRANSLATED_FROM_LABEL: Record<SiteLocale, string> = {
  tr: '',
  en: 'Translated from Turkish',
  de: 'Aus dem Türkischen übersetzt',
  ru: 'Перевод с турецкого',
}

const SHOW_ORIGINAL_LABEL: Record<SiteLocale, string> = {
  tr: '',
  en: 'Show original',
  de: 'Original anzeigen',
  ru: 'Показать оригинал',
}

const SHOW_TRANSLATION_LABEL: Record<SiteLocale, string> = {
  tr: '',
  en: 'Show translation',
  de: 'Übersetzung anzeigen',
  ru: 'Показать перевод',
}

const READ_FULL_LABEL: Record<SiteLocale, string> = {
  tr: 'Yorumun tamamını oku',
  en: 'Read the full review',
  de: 'Ganze Bewertung lesen',
  ru: 'Читать отзыв полностью',
}

const CLOSE_LABEL: Record<SiteLocale, string> = {
  tr: 'Kapat',
  en: 'Close',
  de: 'Schließen',
  ru: 'Закрыть',
}

/** İsimden deterministik pastel avatar rengi (kart üzerinde — referans siteyle aynı görünüm). */
function avatarPalette(name: string): { bg: string; fg: string } {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360
  const hue = hash
  return {
    bg: `linear-gradient(135deg, hsl(${hue}, 70%, 94%), hsl(${hue}, 60%, 89%))`,
    fg: `hsl(${hue}, 55%, 28%)`,
  }
}

/** İsimden deterministik DOLU (koyu doygun) avatar rengi — "yorumun tamamı"
 * popup'ında Google'ın kendi yorum kutusundaki gibi bold renkli daire + beyaz harf. */
function modalAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360
  return `hsl(${hash}, 62%, 46%)`
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
  // "lg" = özet/ortalama puan satırı (örn. "Sizden Gelenler" başlığının
  // altındaki genel puan) — referans: font-size 1.5rem (=24px), gap .25rem,
  // renk #f5a623.
  const starClass = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
  const gapClass = size === 'lg' ? 'gap-1' : 'gap-0.5'
  const color = size === 'lg' ? '#f5a623' : '#eaaa45'
  return (
    <span className={`inline-flex items-center ${gapClass}`} aria-label={`${filled} / 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={starClass}
          fill={i < filled ? color : 'none'}
          stroke={i < filled ? color : '#d4d4d8'}
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
  const [openReviewId, setOpenReviewId] = useState<string | null>(null)
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)

  const toggleOriginal = (id: string) => {
    setRevealedOriginal((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    const el = document.createElement('div')
    el.id = 'home-review-portal'
    document.body.appendChild(el)
    setPortalEl(el)
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el)
    }
  }, [])

  useEffect(() => {
    if (!openReviewId) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenReviewId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [openReviewId])

  if (!data?.enabled || !data.items?.length) return null

  const { items, avgRating, totalCount, googleReviewsUrl, instagramUrl, instagramFollowerCount } = data
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

  const openReview = openReviewId ? items.find((r) => r.id === openReviewId) ?? null : null
  const openReviewRevealed = openReview ? revealedOriginal.has(openReview.id) : false
  const openReviewText =
    openReview && openReviewRevealed && openReview.originalDescription
      ? openReview.originalDescription
      : openReview?.description ?? ''

  const modal =
    portalEl && openReview
      ? createPortal(
          <div
            className={`${modalStyles.overlay} ${modalStyles.overlayVisible}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpenReviewId(null)
            }}
            role="dialog"
            aria-modal
            aria-label={openReview.name}
          >
            <div className={modalStyles.sheet}>
              <div className={modalStyles.sheetHandle} aria-hidden />
              <div className={modalStyles.sheetBody}>
                <div className={modalStyles.topRow}>
                  {openReview.avatarUrl ? (
                    <Image
                      src={openReview.avatarUrl}
                      alt={openReview.name}
                      width={56}
                      height={56}
                      className="h-14 w-14 shrink-0 rounded-full object-cover"
                      placeholder={openReview.avatarLqip ? 'blur' : 'empty'}
                      blurDataURL={openReview.avatarLqip ?? undefined}
                    />
                  ) : (
                    <span
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
                      style={{ background: modalAvatarColor(openReview.name || 'A') }}
                      aria-hidden
                    >
                      {(openReview.name || '?').trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className={modalStyles.reviewerText}>
                    <p className={modalStyles.reviewerName}>{openReview.name}</p>
                    <StarRow value={openReview.rating} />
                    {openReview.dateLabel && (
                      <span className={modalStyles.dateLabel}>{openReview.dateLabel}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className={modalStyles.closeBtn}
                    onClick={() => setOpenReviewId(null)}
                    aria-label={CLOSE_LABEL[locale]}
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>

                <p className={modalStyles.fullText}>{openReviewText}</p>

                {openReview.originalDescription && (
                  <p className={modalStyles.translatedRow}>
                    {TRANSLATED_FROM_LABEL[locale]} ·{' '}
                    <button type="button" onClick={() => toggleOriginal(openReview.id)}>
                      {openReviewRevealed ? SHOW_TRANSLATION_LABEL[locale] : SHOW_ORIGINAL_LABEL[locale]}
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>,
          portalEl
        )
      : null

  return (
    <>
    <section
      className="w-full py-16 md:py-20"
      style={{ background: 'linear-gradient(90deg, #29ffc6, #20e3b2, #0cebeb)' }}
      aria-labelledby="home-reviews-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <header className="mb-10 text-center">
          <h2
            id="home-reviews-heading"
            className="text-[28px] font-black uppercase leading-[1.15] sm:text-[32px] md:text-[36px] lg:text-[40px]"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))', color: 'var(--secondary, #131719)', WebkitTextStroke: '0.6px currentColor' }}
          >
            {HEADING[locale]}
          </h2>
          <div className="mt-4 flex justify-center">
            <StarRow value={avgRating} size="lg" />
          </div>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm font-normal leading-relaxed md:text-base" style={{ color: 'var(--secondary, #131719)' }}>
            {SUBTEXT[locale](totalCount.toLocaleString(numLocale), avgRating.toFixed(1))}
          </p>
          {(googleReviewsUrl || instagramUrl) && (
            /* gap 12→16px mobil, 16→20px masaüstü: iki buton birbirine fazla yakındı. */
            <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-5">
              {googleReviewsUrl && (
                <a
                  href={googleReviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  // Referans: şeffaf zemin (gradyan görünür), 2px #366deb çerçeve, aynı mavi
                  // büyük harf metin, küçük köşe yuvarlaklığı — beyaz "hap" değil. Üstüne
                  // gelince dolgu maviye dönüyor + hafif büyüme efekti.
                  className="inline-flex items-center gap-2.5 rounded-lg border-2 border-[#366deb] bg-transparent px-6 py-2.5 text-[16px] font-extrabold uppercase tracking-wide text-[#366deb] transition duration-200 hover:scale-105 hover:bg-[#366deb] hover:text-white"
                >
                  <GoogleMark size={21} />
                  {GOOGLE_LABEL[locale](totalCount.toLocaleString(numLocale))}
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  // Google butonuyla birebir aynı dil: şeffaf zemin + 2px tek renk (Instagram
                  // pembesi) çerçeve, üstüne gelince/basınca dolgu AYNI pembeye dönüyor + beyaz
                  // metin (gradyan yok — Google butonundaki gibi tek renk). Mobilde Google
                  // butonunun altında, hâlâ biraz daha küçük ama eskisinden bir tık büyük
                  // (px-4/py-1.5/12px → px-5/py-2/13px, ikon 15→17); masaüstünde yan yana
                  // ve aynı boyutta.
                  className="inline-flex max-w-full items-center gap-2 overflow-hidden rounded-lg border-2 border-[#d62976] bg-transparent px-5 py-2 text-[14px] font-extrabold uppercase tracking-wide text-[#d62976] transition duration-200 hover:scale-105 hover:bg-[#d62976] hover:text-white sm:gap-2.5 sm:px-6 sm:py-2.5 sm:text-[16px]"
                >
                  <InstagramModern className="h-[17px] w-[17px] sm:h-[21px] sm:w-[21px]" />
                  {instagramFollowerCount
                    ? INSTAGRAM_LABEL[locale](instagramFollowerCount)
                    : INSTAGRAM_FOLLOW_LABEL[locale]}
                </a>
              )}
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
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
                      aria-label="Google"
                    >
                      <GoogleMark size={19} />
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-center gap-3 py-6">
                    <p
                      className="line-clamp-6 text-[17px] italic leading-relaxed"
                      style={{ color: 'var(--text-color, #58595b)' }}
                    >
                      “{shownDescription}”
                    </p>

                    {shownDescription.length > 180 && (
                      <button
                        type="button"
                        onClick={() => setOpenReviewId(review.id)}
                        className="inline-flex w-fit items-center gap-1.5 text-[15px] font-bold transition hover:opacity-75"
                        style={{ color: 'var(--primary, #2168b8)' }}
                      >
                        {READ_FULL_LABEL[locale]}
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </button>
                    )}

                    {review.originalDescription && (
                      <button
                        type="button"
                        onClick={() => toggleOriginal(review.id)}
                        className="self-start text-xs font-medium underline decoration-dotted underline-offset-2 transition hover:opacity-70"
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
    {modal}
    </>
  )
}
