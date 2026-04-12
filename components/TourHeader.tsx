'use client'

import { useMemo } from 'react'
import type { SiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import styles from './TourHeader.module.css'

function LikeIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.3334 9.99926C18.3334 8.59719 17.3914 7.49926 15.8334 7.49926H13.2726L13.2957 7.43615C13.3189 7.37365 13.3839 7.20224 13.4471 7.03551L13.4476 7.03434C13.5037 6.88647 13.5583 6.7425 13.581 6.68168C13.7394 6.25639 13.855 5.91372 13.9486 5.57436C14.09 5.06145 14.1667 4.59935 14.1667 4.16592C14.1667 2.93925 13.41 2.17736 12.2903 1.85133C11.7853 1.70428 11.3457 1.66585 10.8334 1.66592H10.4338L10.1836 1.97749C9.90102 2.32946 9.34591 2.96378 8.70592 3.69509L8.70589 3.69512C7.52528 5.04421 6.05583 6.72334 5.47538 7.56875C5.32476 7.52402 5.16522 7.5 5.00008 7.5H3.33341C2.41294 7.5 1.66675 8.24619 1.66675 9.16667V16.6667C1.66675 17.5871 2.41294 18.3333 3.33341 18.3333H5.00008C5.57269 18.3333 6.07784 18.0446 6.37788 17.6047C6.63069 17.7682 6.91276 17.9047 7.21935 18.0144C7.92128 18.2655 8.61745 18.3427 9.19542 18.3321L15.0001 18.3326C17.296 18.3326 18.3334 14.9522 18.3334 9.99926ZM7.78081 16.4452C7.04339 16.1813 6.66675 15.7511 6.66675 14.9993V9.16667V9.16592C6.66675 8.96576 6.70377 8.78851 6.78484 8.59924C6.93046 8.25926 8.25169 6.75187 9.50398 5.32315C10.1503 4.58578 10.7782 3.86936 11.2167 3.3452C11.4262 3.36091 11.6237 3.39311 11.8244 3.45154C12.3019 3.59059 12.5001 3.79011 12.5001 4.16592C12.5001 4.42974 12.4467 4.75119 12.3419 5.13143C12.2635 5.41557 12.1621 5.71623 12.0192 6.09981C11.999 6.15408 11.9486 6.28683 11.895 6.42819L11.8948 6.42868L11.8945 6.42943L11.8942 6.43022L11.8939 6.43109C11.8285 6.60347 11.7585 6.78791 11.7325 6.85805C11.6242 7.15106 11.5528 7.36681 11.504 7.56285C11.2964 8.39622 11.5046 9.16592 12.5001 9.16592H15.8334C16.4094 9.16592 16.6667 9.46583 16.6667 9.99926C16.6667 13.9915 15.846 16.6659 15.0001 16.6659H9.16675L9.13597 16.6664C8.77123 16.673 8.25893 16.6162 7.78081 16.4452ZM3.33341 16.6667V9.16667H5.00008V16.6667H3.33341Z"
        fill="#181818"
      />
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
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  )
}

/** Yorum sayısı satırı — konuşma balonu, saat/pin ile aynı çizgi stili */
function ChatReviewIcon({ className }: { className?: string }) {
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
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

function GoogleIconSmall({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M21.2 12.2c0-.6-.05-1.2-.17-1.76H12v3.33h5.16c-.22 1.14-.9 2.1-1.92 2.74v2.16h3.1c1.8-1.65 2.86-4.1 2.86-6.47Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.6 0 4.78-.86 6.37-2.33l-3.1-2.16c-.86.58-1.97.93-3.27.93-2.52 0-4.65-1.7-5.42-3.99H3.4v2.23A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.58 14.45A6.3 6.3 0 0 1 6.23 12c0-.44.07-.86.18-1.26V8.51H3.4A10 10 0 0 0 2 12c0 1.67.41 3.24 1.4 4.74l3.18-2.29Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.56c1.42 0 2.7.49 3.7 1.46l2.78-2.78C16.78 2.78 14.6 2 12 2A10 10 0 0 0 3.4 8.51l3.01 2.23C7.15 7.35 9.38 5.56 12 5.56Z"
        fill="#EA4335"
      />
    </svg>
  )
}

export interface TourHeaderProps {
  title: string
  /** e.g. "EXCELLENT", "Mükemmel" */
  ratingLabel?: string | null
  reviewCount?: number | null
  /** Link for review count (e.g. "#reviews" or external URL) */
  reviewsUrl?: string | null
  /** e.g. "FULL DAY (APPROX. 8 HOURS)" or "Tam gün (Yaklaşık 8 saat)" */
  durationText?: string | null
  /** e.g. "KAŞ MARINA" */
  meetingLocation?: string | null
  /** Optional Google Maps URL for departure location */
  meetingLocationUrl?: string | null
  /** RSC → client: `TourPageUi` fonksiyonlar içerdiği için geçirilemez; locale kullanın. */
  locale: SiteLocale
}

export function TourHeader({
  title,
  ratingLabel,
  reviewCount,
  reviewsUrl,
  durationText,
  meetingLocation,
  meetingLocationUrl,
  locale,
}: TourHeaderProps) {
  const tourUi = useMemo(() => getTourPageUi(locale), [locale])
  const hasRating = ratingLabel != null || reviewCount != null
  const hasDuration = Boolean(durationText)
  const hasDeparture = Boolean(meetingLocation)

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>
        <span className={styles.titlePrimary}>{title}</span>
      </h1>

      {(hasRating || hasDuration || hasDeparture) && (
        <div className={styles.metaRow}>
          {hasRating && (
            <div className={styles.metaRatingStrip}>
              <span className={styles.metaIcon} aria-hidden>
                <LikeIcon />
              </span>
              <div className={`${styles.metaStripText} ${styles.reviewText}`}>
                <span className={styles.metaLabel}>
                  {ratingLabel ?? tourUi.defaultRatingLabel}
                </span>
              </div>
              {reviewCount != null ? (
                <>
                  <span className={styles.metaIcon} aria-hidden>
                    <ChatReviewIcon />
                  </span>
                  <div className={`${styles.metaStripText} ${styles.reviewText}`}>
                    <a
                      href={reviewsUrl?.startsWith('http') ? reviewsUrl : '#reviews'}
                      className={styles.reviewsLink}
                      target={reviewsUrl?.startsWith('http') ? '_blank' : undefined}
                      rel={reviewsUrl?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {reviewCount.toLocaleString(tourUi.numberLocale)} {tourUi.reviewsCountSuffix}
                      <span className={styles.reviewsLinkIcon} aria-hidden>
                        <GoogleIconSmall />
                      </span>
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.metaStripSpacer} aria-hidden />
                  <div className={styles.metaStripSpacer} aria-hidden />
                </>
              )}
            </div>
          )}

          {(hasDuration || hasDeparture) && (
            <div className={styles.metaFactsStrip}>
              {hasDuration ? (
                <>
                  <span className={styles.metaIcon} aria-hidden>
                    <ClockIcon />
                  </span>
                  <div className={styles.metaStripText}>
                    <span className={styles.metaLabel}>{durationText}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.metaStripSpacer} aria-hidden />
                  <div className={styles.metaStripSpacer} aria-hidden />
                </>
              )}
              {hasDeparture ? (
                <>
                  <span className={styles.metaIcon} aria-hidden>
                    <PinIcon />
                  </span>
                  <div className={`${styles.metaStripText} ${styles.metaStripTextWrap}`}>
                    <span className={styles.metaText}>
                      <span className={styles.metaLabel}>{tourUi.departureMetaLabel}</span>{' '}
                      {meetingLocationUrl ? (
                        <a
                          href={meetingLocationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.reviewsLink}
                        >
                          {meetingLocation}
                        </a>
                      ) : (
                        <span className={styles.metaMuted}>{meetingLocation}</span>
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.metaStripSpacer} aria-hidden />
                  <div className={styles.metaStripSpacer} aria-hidden />
                </>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  )
}
