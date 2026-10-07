'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, MapPin } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import styles from './TourCard.module.css'
import { SANITY_DISPLAY_IMAGE_PROPS } from '@/lib/sanityImage'
import { useWishlist } from '@/lib/wishlist/WishlistContext'

const ICON_MUTED = 'var(--muted, #81848b)'
/** Süre/kalkış satırındaki çizgi ikonlar (saat, konum) — referans örnekteki
    mavimsi gri ton. */
const META_ICON_COLOR = '#8a99ad'

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path d="M12 2.5l2.9 6.14 6.6.63-5 4.53 1.46 6.7L12 17.1l-5.96 3.4 1.46-6.7-5-4.53 6.6-.63L12 2.5z" />
    </svg>
  )
}

function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path d="M20.8 4.6c-1.7-1.7-4.5-1.7-6.2 0L12 7.2 9.4 4.6c-1.7-1.7-4.5-1.7-6.2 0-1.7 1.7-1.7 4.5 0 6.2L12 19.4l8.8-8.6c1.7-1.7 1.7-4.5 0-6.2z" />
    </svg>
  )
}

export type TourCardDiscount = {
  enabled?: boolean | null
  /** Örn. 15 → "%15 İndirim", fiyat kartta %15 düşürülmüş gösterilir. */
  percentage?: number | null
}

export type TourListItem = {
  _id: string
  title: string | null
  slug: string | null
  shortDescription?: string | null
  coverImageUrl?: string | null
  coverImageAlt?: string | null
  departureLabel?: string | null
  durationLabel?: string | null
  rating?: number | null
  reviewCount?: number | null
  reviewsUrl?: string | null
  priceFrom?: number | null
  isPopular?: boolean | null
  /** Sanity'de "İndirim Rozeti" alanı — sadece kart görünümünü etkiler. */
  cardDiscount?: TourCardDiscount | null
}

function formatPriceFrom(price: number | null | undefined, numberLocale: string): string {
  if (price == null) return ''
  return `${price.toLocaleString(numberLocale)} ₺`
}

/** İndirimli fiyatı en yakın 10'a yuvarlar — Türkiye'deki tur fiyatlandırmasında
    yaygın olan "yuvarlak sayı" alışkanlığıyla tutarlı (ör. 2.553 yerine 2.550). */
function computeDiscountedPrice(price: number, percentage: number): number {
  return Math.round((price * (1 - percentage / 100)) / 10) * 10
}

const DISCOUNT_BADGE_LABEL: Record<SiteLocale, (percentage: number) => string> = {
  tr: (p) => `-%${p} İndirim`,
  en: (p) => `-${p}% Off`,
  de: (p) => `-${p}% Rabatt`,
  ru: (p) => `-${p}% Скидка`,
}

const PER_PERSON_LABEL: Record<SiteLocale, string> = {
  tr: 'Kişi başı',
  en: 'Per person',
  de: 'Pro Person',
  ru: 'За человека',
}

const FAVORITE_LABEL: Record<SiteLocale, string> = {
  tr: 'Favorilere ekle',
  en: 'Add to favorites',
  de: 'Zu Favoriten hinzufügen',
  ru: 'Добавить в избранное',
}

type TourCardProps = {
  tour: TourListItem
  locale?: SiteLocale
}

export default function TourCard({ tour, locale = 'tr' }: TourCardProps) {
  const tourUi = useMemo(() => getTourPageUi(locale), [locale])
  const { isSaved, toggle } = useWishlist()
  const href = tour.slug ? withLocalePath(locale, `/tur/${tour.slug}`) : null
  const rating = tour.rating ?? 0
  const titlePlain = tour.title?.trim() || tourUi.tourCardCoverAltFallback
  const mainLinkLabel = `${titlePlain} — ${tourUi.tourCardViewTour}`
  const saved = isSaved(tour._id)

  const discountPercent =
    tour.cardDiscount?.enabled && tour.cardDiscount.percentage ? tour.cardDiscount.percentage : null
  const hasDiscount = discountPercent != null && tour.priceFrom != null
  const discountedPrice = hasDiscount
    ? computeDiscountedPrice(tour.priceFrom as number, discountPercent as number)
    : null

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle({
      id: tour._id,
      type: 'tour',
      title: titlePlain,
      imageUrl: tour.coverImageUrl,
      priceLabel:
        hasDiscount
          ? formatPriceFrom(discountedPrice, tourUi.numberLocale)
          : tour.priceFrom != null
            ? formatPriceFrom(tour.priceFrom, tourUi.numberLocale)
            : null,
      href: href ?? '#',
    })
  }

  const reviewsLine =
    tour.reviewCount != null && tour.reviewCount > 0
      ? tourUi.tourCardReviews(tour.reviewCount)
      : rating > 0
        ? tourUi.tourCardRatingPoints(rating)
        : ''

  const ratingBadge =
    (rating > 0 || (tour.reviewCount != null && tour.reviewCount > 0)) && reviewsLine ? (
      tour.reviewsUrl ? (
        <button
          type="button"
          onClick={() => window.open(tour.reviewsUrl!, '_blank', 'noopener,noreferrer')}
          className="mt-0.5 flex shrink-0 items-center gap-1 rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2168b8] focus-visible:ring-offset-1"
          title={tourUi.tourCardGoogleReviewsTitle}
          aria-label={`${reviewsLine} — ${tourUi.tourCardGoogleReviewsTitle}`}
        >
          <StarIcon className="h-4 w-4 text-[#f5a623]" />
          {rating > 0 && <span className="text-[13px] font-bold text-[#131719]">{rating.toFixed(1)}</span>}
          {tour.reviewCount != null && tour.reviewCount > 0 && (
            <span className="text-[12px] font-medium" style={{ color: ICON_MUTED }}>
              ({tour.reviewCount})
            </span>
          )}
        </button>
      ) : (
        <span className="mt-0.5 flex shrink-0 items-center gap-1">
          <StarIcon className="h-4 w-4 text-[#f5a623]" />
          {rating > 0 && <span className="text-[13px] font-bold text-[#131719]">{rating.toFixed(1)}</span>}
          {tour.reviewCount != null && tour.reviewCount > 0 && (
            <span className="text-[12px] font-medium" style={{ color: ICON_MUTED }}>
              ({tour.reviewCount})
            </span>
          )}
        </span>
      )
    ) : null

  const imageSection = (
    <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-zinc-100">
      {tour.coverImageUrl ? (
        <Image
          src={tour.coverImageUrl}
          alt={tour.coverImageAlt || tour.title || tourUi.tourCardCoverAltFallback}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          {...SANITY_DISPLAY_IMAGE_PROPS}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
          {tourUi.tourCardNoImage}
        </div>
      )}
      {(tour.isPopular || hasDiscount) && (
        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
          {tour.isPopular && (
            <span
              className="rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1a1a1a] shadow-sm"
              style={{ background: '#ffc736' }}
            >
              {tourUi.tourCardPopularBadge}
            </span>
          )}
          {hasDiscount && (
            <span
              className="rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm"
              style={{ background: '#e11d48' }}
            >
              {DISCOUNT_BADGE_LABEL[locale](discountPercent as number)}
            </span>
          )}
        </div>
      )}
      <button
        type="button"
        aria-label={FAVORITE_LABEL[locale]}
        aria-pressed={saved}
        onClick={handleToggleWishlist}
        className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition hover:bg-black/40 ${saved ? 'bg-white text-rose-500' : 'bg-black/25 text-white'}`}
      >
        <HeartIcon filled={saved} />
      </button>
    </div>
  )

  const metaRows = (tour.departureLabel || tour.durationLabel) && (
    <div className="mt-2.5 space-y-1.5">
      {tour.durationLabel && (
        <div className={`${styles.metaRow} flex items-center gap-2 text-[13px] leading-snug`} style={{ color: ICON_MUTED }}>
          <Clock className="size-4 shrink-0" style={{ color: META_ICON_COLOR }} strokeWidth={2} aria-hidden />
          <span>
            {tourUi.tourCardDurationPrefix}
            {tour.durationLabel}
          </span>
        </div>
      )}
      {tour.departureLabel && (
        <div className={`${styles.metaRow} flex items-center gap-2 text-[13px] leading-snug`} style={{ color: ICON_MUTED }}>
          <MapPin className="size-4 shrink-0" style={{ color: META_ICON_COLOR }} strokeWidth={2} aria-hidden />
          <span>
            {tourUi.tourCardDeparturePrefix}
            {tour.departureLabel}
          </span>
        </div>
      )}
    </div>
  )

  const ctaInner = (
    <span
      className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-5 py-2.5 text-center text-[13px] font-bold uppercase tracking-wide text-white transition duration-200 hover:scale-105 hover:brightness-110 sm:text-[14px]"
      style={{ background: 'var(--primary, #2168b8)' }}
    >
      {tourUi.tourCardViewTour}
    </span>
  )

  const priceFormatted = tour.priceFrom != null ? formatPriceFrom(tour.priceFrom, tourUi.numberLocale) : ''
  const discountedPriceFormatted = hasDiscount ? formatPriceFrom(discountedPrice, tourUi.numberLocale) : ''
  const priceBlock =
    tour.priceFrom != null ? (
      <p
        className="leading-tight"
        aria-label={tourUi.tourCardPerPersonFrom(hasDiscount ? discountedPriceFormatted : priceFormatted)}
      >
        {hasDiscount ? (
          <span className="flex flex-wrap items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-[14px] font-semibold text-zinc-400 line-through tabular-nums">
              {priceFormatted}
            </span>
            <span className="text-[20px] font-extrabold tabular-nums tracking-tight sm:text-[22px]" style={{ color: '#e11d48' }}>
              {discountedPriceFormatted}
            </span>
          </span>
        ) : (
          <span className="block whitespace-nowrap text-[20px] font-extrabold tabular-nums tracking-tight text-[#131719] sm:text-[22px]">
            {priceFormatted}
          </span>
        )}
        <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: ICON_MUTED }}>
          {PER_PERSON_LABEL[locale]}
        </span>
      </p>
    ) : null

  const titleRow = (
    <div className="flex items-start justify-between gap-3">
      <h3 className={`${styles.title} line-clamp-2 flex-1`}>{tour.title}</h3>
      {ratingBadge}
    </div>
  )

  return (
    <article className="group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#f1f5f9] bg-white shadow-[0_2px_8px_rgba(19,23,25,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_-8px_rgba(19,23,25,0.12)]">
      {href ? (
        <>
          <Link
            href={href}
            className="flex shrink-0 flex-col text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#2168b8]"
            aria-label={mainLinkLabel}
          >
            {imageSection}
            <div className="px-5 pt-5 sm:px-6">
              {titleRow}
              {tour.shortDescription && (
                <p className={`${styles.description} mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-zinc-500`}>
                  {tour.shortDescription}
                </p>
              )}
              {metaRows}
            </div>
          </Link>

          <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-4 sm:px-6">
            <Link
              href={href}
              className="mt-auto flex items-center justify-between gap-3 border-t border-[#f1f5f9] pt-4 text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#2168b8]"
              aria-label={`${tourUi.tourCardViewTour}: ${titlePlain}`}
            >
              {priceBlock}
              {ctaInner}
            </Link>
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col opacity-90">
          <div className="shrink-0">
            {imageSection}
            <div className="px-5 pt-5 sm:px-6">
              {titleRow}
              {tour.shortDescription && (
                <p className={`${styles.description} mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-zinc-500`}>
                  {tour.shortDescription}
                </p>
              )}
              {metaRows}
            </div>
          </div>
          <div className="flex flex-1 flex-col px-5 pb-5 pt-4 sm:px-6">
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#f1f5f9] pt-4">
              {priceBlock}
              {ctaInner}
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
