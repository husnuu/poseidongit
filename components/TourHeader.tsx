'use client'

import { useMemo } from 'react'
import type { SiteLocale } from '@/lib/i18n/config'
import { resolveTourRatingLabel } from '@/lib/i18n/ratingLabels'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import styles from './TourHeader.module.css'

/* ── Modern outline ikonlar ── */
function ThumbIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="10" r="3"/>
      <path d="M12 2a8 8 0 0 1 8 8c0 5.25-8 13-8 13S4 15.25 4 10a8 8 0 0 1 8-8z"/>
    </svg>
  )
}

function VoucherIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <path d="M9 7h6M9 11h6M9 15h4"/>
    </svg>
  )
}

function ShieldCheckIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18l6-6-6-6"/>
    </svg>
  )
}

/** 5 yeşil daire — Tripadvisor tarzı puan göstergesi */
function RatingDots({ score }: { score?: number | null }) {
  const filled = score != null ? Math.round(score) : 5
  return (
    <span className={styles.ratingDots} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= filled ? styles.dotFilled : styles.dotEmpty}
        />
      ))}
    </span>
  )
}

export interface TourHeaderProps {
  title: string
  ratingLabel?: string | null
  score?: number | null
  reviewCount?: number | null
  reviewsUrl?: string | null
  durationText?: string | null
  meetingLocation?: string | null
  meetingLocationUrl?: string | null
  locale: SiteLocale
}

export function TourHeader({
  title,
  ratingLabel,
  score,
  reviewCount,
  reviewsUrl,
  durationText,
  meetingLocation,
  meetingLocationUrl,
  locale,
}: TourHeaderProps) {
  const tourUi = useMemo(() => getTourPageUi(locale), [locale])
  const displayRatingLabel = resolveTourRatingLabel(
    ratingLabel,
    locale,
    tourUi.defaultRatingLabel
  )

  const reviewHref   = reviewsUrl?.startsWith('http') ? reviewsUrl : '#reviews'
  const reviewTarget = reviewsUrl?.startsWith('http') ? '_blank' : undefined
  const reviewRel    = reviewsUrl?.startsWith('http') ? 'noopener noreferrer' : undefined

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>
        <span className={styles.titlePrimary}>{title}</span>
      </h1>

      <div className={styles.metaBlock}>

        {/* ── Satır 1: puan + daireler + yorum sayısı ── */}
        {(ratingLabel || score != null || reviewCount != null) && (
          <div className={styles.metaItem}>
            <span className={styles.metaIcon}><ThumbIcon /></span>
            <span className={styles.metaText}>
              {displayRatingLabel}
            </span>
            <RatingDots score={score} />
            {reviewCount != null && (
              <a
                href={reviewHref}
                target={reviewTarget}
                rel={reviewRel}
                className={styles.reviewsLink}
              >
                {reviewCount.toLocaleString(tourUi.numberLocale)} {tourUi.reviewsCountSuffix}
              </a>
            )}
          </div>
        )}

        {/* ── Satır 2: süre ── */}
        {durationText && (
          <div className={styles.metaItem}>
            <span className={styles.metaIcon}><ClockIcon /></span>
            <span className={styles.metaText}>{durationText}</span>
          </div>
        )}

        {/* ── Satır 3: kalkış ── */}
        {meetingLocation && (
          <div className={styles.metaItem}>
            <span className={styles.metaIcon}><PinIcon /></span>
            <span className={styles.metaText}>
              {tourUi.departureMetaLabel}{' '}
              {meetingLocationUrl ? (
                <a href={meetingLocationUrl} target="_blank" rel="noopener noreferrer" className={styles.factLink}>
                  {meetingLocation}
                </a>
              ) : meetingLocation}
            </span>
          </div>
        )}

        {/* ── Alt çizgi + iki özellik pill ── */}
        <div className={styles.featuresRow}>
          <div className={styles.pill}>
            <span className={styles.pillIcon}><VoucherIcon /></span>
            <span className={styles.pillLabel}>{tourUi.headerMobileTicket}</span>
          </div>
          <div className={styles.pill}>
            <span className={styles.pillIcon}><ShieldCheckIcon /></span>
            <span className={styles.pillLabel}>{tourUi.headerInstantConfirmation}</span>
            <span className={styles.pillArrow}><ChevronRightIcon /></span>
          </div>
        </div>

      </div>
    </header>
  )
}
