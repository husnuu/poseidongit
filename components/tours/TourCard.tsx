'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import styles from './TourCard.module.css'
import { SANITY_DISPLAY_IMAGE_PROPS } from '@/lib/sanityImage'
import { useWishlist } from '@/lib/wishlist/WishlistContext'

const ICON_MUTED = 'var(--muted, #81848b)'

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

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      focusable="false"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  )
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
}

function formatPriceFrom(price: number | null | undefined): string {
  if (price == null) return ''
  return `${price} ₺`
}

const PER_PERSON_LABEL: Record<SiteLocale, string> = {
  tr: 'Kişi başı',
  en: 'Per person',
  de: 'Pro Person',
}

const FAVORITE_LABEL: Record<SiteLocale, string> = {
  tr: 'Favorilere ekle',
  en: 'Add to favorites',
  de: 'Zu Favoriten hinzufügen',
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

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle({
      id: tour._id,
      type: 'tour',
      title: titlePlain,
      imageUrl: tour.coverImageUrl,
      priceLabel: tour.priceFrom != null ? formatPriceFrom(tour.priceFrom) : null,
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
          {rating > 0 && <span className="text-[15px] font-bold text-[#131719]">{rating.toFixed(1)}</span>}
          {tour.reviewCount != null && tour.reviewCount > 0 && (
            <span className="text-[13px] font-medium" style={{ color: ICON_MUTED }}>
              ({tour.reviewCount})
            </span>
          )}
        </button>
      ) : (
        <span className="mt-0.5 flex shrink-0 items-center gap-1">
          <StarIcon className="h-4 w-4 text-[#f5a623]" />
          {rating > 0 && <span className="text-[15px] font-bold text-[#131719]">{rating.toFixed(1)}</span>}
          {tour.reviewCount != null && tour.reviewCount > 0 && (
            <span className="text-[13px] font-medium" style={{ color: ICON_MUTED }}>
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
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          {...SANITY_DISPLAY_IMAGE_PROPS}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
          {tourUi.tourCardNoImage}
        </div>
      )}
      {tour.isPopular && (
        <div
          className="absolute left-3 top-3 z-10 rounded-md px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-[#1a1a1a] shadow-sm"
          style={{ background: '#ffc736' }}
        >
          {tourUi.tourCardPopularBadge}
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
    <div className="mt-3 space-y-2">
      {tour.durationLabel && (
        <div className={`${styles.metaRow} flex items-center gap-2 text-[15px] leading-snug`} style={{ color: ICON_MUTED }}>
          <ClockIcon className="size-4 shrink-0" />
          <span>
            {tourUi.tourCardDurationPrefix}
            {tour.durationLabel}
          </span>
        </div>
      )}
      {tour.departureLabel && (
        <div className={`${styles.metaRow} flex items-center gap-2 text-[15px] leading-snug`} style={{ color: ICON_MUTED }}>
          <PinIcon className="size-4 shrink-0" />
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
      className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-5 py-2.5 text-center text-sm font-bold uppercase tracking-wide text-white transition hover:brightness-110 sm:text-[15px]"
      style={{ background: 'var(--primary, #2168b8)' }}
    >
      {tourUi.tourCardViewTour}
    </span>
  )

  const priceFormatted = tour.priceFrom != null ? formatPriceFrom(tour.priceFrom) : ''
  const priceBlock =
    tour.priceFrom != null ? (
      <p className="leading-tight" aria-label={tourUi.tourCardPerPersonFrom(priceFormatted)}>
        <span className="block whitespace-nowrap text-[26px] font-extrabold tabular-nums tracking-tight text-[#131719] sm:text-[32px]">
          {priceFormatted}
        </span>
        <span className="mt-0.5 block text-[12px] font-semibold uppercase tracking-wide" style={{ color: ICON_MUTED }}>
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
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#f1f5f9] bg-white shadow-[0_2px_8px_rgba(19,23,25,0.06)] transition-shadow duration-300 hover:shadow-[0_12px_28px_-8px_rgba(19,23,25,0.12)]">
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
                <p className={`${styles.description} mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-zinc-500`}>
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
                <p className={`${styles.description} mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-zinc-500`}>
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
