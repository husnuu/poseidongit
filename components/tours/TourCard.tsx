'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'

const ICON_BLUE = '#1e3a8a'

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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
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

function RatingDots({ value }: { value: number }) {
  const full = Math.min(5, Math.round(value))
  const empty = 5 - full
  return (
    <span className="inline-flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: full }, (_, i) => (
        <span key={`f-${i}`} className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <span key={`e-${i}`} className="h-2.5 w-2.5 shrink-0 rounded-full bg-black/15" />
      ))}
    </span>
  )
}

type TourCardProps = {
  tour: TourListItem
  locale?: SiteLocale
}

export default function TourCard({ tour, locale = 'tr' }: TourCardProps) {
  const tourUi = useMemo(() => getTourPageUi(locale), [locale])
  const href = tour.slug ? withLocalePath(locale, `/tur/${tour.slug}`) : null
  const rating = tour.rating ?? 0
  const titlePlain = tour.title?.trim() || tourUi.tourCardCoverAltFallback
  const mainLinkLabel = `${titlePlain} — ${tourUi.tourCardViewTour}`

  const reviewsLine =
    tour.reviewCount != null && tour.reviewCount > 0
      ? tourUi.tourCardReviews(tour.reviewCount)
      : rating > 0
        ? tourUi.tourCardRatingPoints(rating)
        : ''

  const reviewsBlock =
    (rating > 0 || (tour.reviewCount != null && tour.reviewCount > 0)) && reviewsLine ? (
      <div className="flex flex-wrap items-center gap-2.5 text-sm sm:text-base">
        <RatingDots value={rating} />
        {tour.reviewsUrl ? (
          <button
            type="button"
            onClick={() => window.open(tour.reviewsUrl!, '_blank', 'noopener,noreferrer')}
            className="inline-flex items-center gap-2 rounded text-left font-semibold text-emerald-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
            title={tourUi.tourCardGoogleReviewsTitle}
            aria-label={tourUi.tourCardGoogleReviewsTitle}
          >
            <GoogleIcon />
            <span>{reviewsLine}</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-2 font-semibold text-emerald-600">
            <GoogleIcon />
            <span>{reviewsLine}</span>
          </span>
        )}
      </div>
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
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
          {tourUi.tourCardNoImage}
        </div>
      )}
      {tour.isPopular && (
        <div
          className="absolute left-0 top-3 z-10 flex items-center py-2 pl-3 pr-8 text-[11px] font-bold uppercase tracking-[0.12em] text-white sm:text-xs"
          style={{
            background: 'linear-gradient(90deg, #e8892e 0%, #d97a1f 100%)',
            clipPath: 'polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.22)',
          }}
        >
          {tourUi.tourCardPopularBadge}
        </div>
      )}
    </div>
  )

  const metaRows = (tour.departureLabel || tour.durationLabel) && (
    <div className="mt-4 space-y-2.5">
      {tour.departureLabel && (
        <div className="flex items-start gap-3 text-sm font-semibold leading-snug text-zinc-800 sm:text-[15px]">
          <span className="mt-0.5 shrink-0" style={{ color: ICON_BLUE }}>
            <PinIcon className="size-5" />
          </span>
          <span>
            {tourUi.tourCardDeparturePrefix}
            {tour.departureLabel}
          </span>
        </div>
      )}
      {tour.durationLabel && (
        <div className="flex items-start gap-3 text-sm font-semibold leading-snug text-zinc-800 sm:text-[15px]">
          <span className="mt-0.5 shrink-0" style={{ color: ICON_BLUE }}>
            <ClockIcon className="size-5" />
          </span>
          <span>
            {tourUi.tourCardDurationPrefix}
            {tour.durationLabel}
          </span>
        </div>
      )}
    </div>
  )

  const ctaInner = (
    <span className="hero-primary-btn-wrap tour-card-cta-shimmer flex w-full rounded-xl p-[2px]">
      <span
        className="hero-primary-inner hero-btn-shine flex w-full min-h-[48px] items-center justify-center overflow-hidden rounded-[11px] py-3.5 text-center text-[15px] font-black uppercase tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(15,23,42,0.18)] ring-1 ring-inset ring-white/20 transition hover:brightness-110 sm:min-h-[52px] sm:py-4 sm:text-[17px]"
        style={{
          background: 'linear-gradient(180deg, #3558b0 0%, #1e3a8a 42%, #172e6e 100%)',
        }}
      >
        {tourUi.tourCardViewTour}
      </span>
    </span>
  )

  const priceBlock =
    tour.priceFrom != null ? (
      <p className="text-sm font-black uppercase leading-snug text-black sm:text-base">
        {tourUi.tourCardPerPersonFrom(formatPriceFrom(tour.priceFrom))}
      </p>
    ) : null

  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.1)] transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
      {href ? (
        <>
          <Link
            href={href}
            className="flex shrink-0 flex-col text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#1e3a8a]"
            aria-label={mainLinkLabel}
          >
            {imageSection}
            <div className="px-5 pt-5 sm:px-6">
              <h3
                className="line-clamp-2 text-lg font-black uppercase leading-tight tracking-tight text-black sm:text-xl"
                style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900 }}
              >
                {tour.title}
              </h3>
              {tour.shortDescription && (
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600 sm:text-[15px]">
                  {tour.shortDescription}
                </p>
              )}
              {metaRows}
            </div>
          </Link>

          <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-3 sm:px-6">
            {reviewsBlock ? <div className="mb-1">{reviewsBlock}</div> : null}
            <Link
              href={href}
              className="mt-auto flex flex-col gap-3 pt-2 text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#1e3a8a]"
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
              <h3
                className="line-clamp-2 text-lg font-black uppercase leading-tight tracking-tight text-black sm:text-xl"
                style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900 }}
              >
                {tour.title}
              </h3>
              {tour.shortDescription && (
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600 sm:text-[15px]">
                  {tour.shortDescription}
                </p>
              )}
              {metaRows}
            </div>
          </div>
          <div className="flex flex-1 flex-col px-5 pb-5 pt-3 sm:px-6">
            {reviewsBlock ? <div className="mb-1">{reviewsBlock}</div> : null}
            <div className="mt-auto flex flex-col gap-3 pt-2">
              {priceBlock}
              {ctaInner}
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
