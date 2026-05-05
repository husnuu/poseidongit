import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import type { TourPageUi } from '@/lib/i18n/tourPageUi'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import ReviewCardExpand from './ReviewCardExpand'
import styles from './ReviewsSection.module.css'

interface ReviewItemAvatar {
  asset?: { _ref?: string; _type?: string }
  url?: string
  metadata?: { lqip?: string; dimensions?: { width: number; height: number } }
}

interface ReviewItem {
  name: string
  title: string
  description: string
  rating?: number
  avatar?: ReviewItemAvatar
}

export interface ReviewsSectionProps {
  tourUi?: TourPageUi
  reviewsUrl?: string
  reviewsSection?: {
    enabled?: boolean
    reviewCount?: number
    ratingValue?: number
    ratingDots?: number
    sourceLabel?: string
    moreLinkText?: string
    moreLinkUrl?: string
    items?: ReviewItem[]
  }
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)))
}

function localeTagForNumbers(locale: TourPageUi['locale']): string {
  if (locale === 'de') return 'de-DE'
  if (locale === 'en') return 'en-US'
  return 'tr-TR'
}

/** Sayıdan sonra: "120+ …" cümlesi (locale). */
function verifiedReviewsPhrase(locale: TourPageUi['locale']): string {
  if (locale === 'en') return 'verified user reviews'
  if (locale === 'de') return 'verifizierte Nutzerbewertungen'
  return 'doğrulanmış kullanıcı yorumu'
}

/** Trustpilot-style: green rounded-square with white star cutout */
function TpStar({ filled }: { filled: boolean }) {
  return (
    <span
      className={styles.tpStar}
      style={{ background: filled ? '#00b67a' : '#dcdce6' }}
      aria-hidden
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </span>
  )
}

function StarRow({ value, max = 5, size = 'md' }: { value: number; max?: number; size?: 'sm' | 'md' | 'lg' }) {
  const filled = clampInt(value, 0, max)
  return (
    <span className={`${styles.starRow} ${styles[`starRow_${size}`]}`} aria-label={`${filled} / ${max} yıldız`}>
      {Array.from({ length: max }).map((_, i) => (
        <TpStar key={i} filled={i < filled} />
      ))}
    </span>
  )
}

/** Küçük renkli Google simgesi (24×24 viewBox). */
function GoogleMark({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={styles.googleMarkSvg}
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

/** Trustpilot-style shield checkmark */
function ShieldCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
        stroke="#6b7280"
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="#6b7280"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ReviewsSection({
  tourUi: tourUiProp,
  reviewsUrl,
  reviewsSection,
}: ReviewsSectionProps) {
  const tourUi = tourUiProp ?? getTourPageUi('tr')
  if (!reviewsSection) return null
  if (reviewsSection.enabled === false) return null

  const items = (reviewsSection.items || []).slice(0, 4)
  if (items.length < 1) return null

  const ratingValue =
    typeof reviewsSection.ratingValue === 'number' ? reviewsSection.ratingValue : 4.9
  const reviewCount =
    typeof reviewsSection.reviewCount === 'number' ? reviewsSection.reviewCount : undefined
  const moreText = reviewsSection.moreLinkText || tourUi.reviewsMoreDefault
  const reviewsLink = reviewsSection.moreLinkUrl || reviewsUrl || undefined

  const numLocale = localeTagForNumbers(tourUi.locale)
  const verifiedPhrase = verifiedReviewsPhrase(tourUi.locale)
  const headingUpperTag =
    tourUi.locale === 'tr' ? 'tr-TR' : tourUi.locale === 'de' ? 'de-DE' : 'en-US'
  const reviewsHeadingDisplay = tourUi.reviewsSectionTitle.trim().toLocaleUpperCase(headingUpperTag)

  return (
    <section className={styles.sectionWrapper} aria-labelledby="tour-reviews-heading">
      <div className={styles.sectionHeadingBlock}>
        <div className={styles.sectionTitleRow}>
          <h2 id="tour-reviews-heading" className={styles.sectionHeading}>
            {reviewsHeadingDisplay}
          </h2>
          <span className={styles.googleMarkWrap} title="Google">
            <GoogleMark size={17} />
          </span>
        </div>
        <p className={styles.googleAttribution}>{tourUi.reviewsGoogleAttribution}</p>
      </div>

      {/* ── Özet (Mükemmel + büyük yıldızlar kaldırıldı) ── */}
      <div className={styles.header}>
        <p className={styles.ratingMeta}>
          <strong>{ratingValue.toFixed(1)}</strong>
          {' / 5'}
          {reviewCount != null && (
            <>
              {' '}
              · {reviewCount.toLocaleString(numLocale)}+ {verifiedPhrase}
            </>
          )}
        </p>
        {reviewsLink && (
          <a
            href={reviewsLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.allReviewsLink}
          >
            {moreText}
          </a>
        )}
      </div>

      {/* ── Cards ── */}
      <ul className={styles.grid}>
        {items.map((it, idx) => {
          const rating = typeof it.rating === 'number' ? it.rating : 5
          const initial = (it.name || '?').trim().charAt(0).toUpperCase()
          const avatarSrc = it.avatar?.asset
            ? urlFor(it.avatar.asset).width(88).height(88).url()
            : it.avatar?.url ?? null

          return (
            <li key={`${it.name}-${idx}`} className={styles.card}>
              {/* Top: stars + verified */}
              <div className={styles.cardTop}>
                <StarRow value={rating} size="sm" />
                <span className={styles.verifiedBadge}>
                  <ShieldCheck />
                  <span>Doğrulanmış</span>
                </span>
              </div>

              {/* Reviewer name + date */}
              <div className={styles.cardMeta}>
                <span className={styles.reviewerName}>{it.name}</span>
                {it.title && <span className={styles.reviewDate}>{it.title}</span>}
              </div>

              {/* Review text with expand */}
              <ReviewCardExpand text={it.description} />

              {/* Footer */}
              <div className={styles.cardDivider} />
              <div className={styles.cardFooter}>
                <div className={styles.footerAvatarWrap}>
                  {avatarSrc ? (
                    <Image
                      src={avatarSrc}
                      alt={it.name}
                      width={48}
                      height={48}
                      className={styles.footerAvatarImg}
                      placeholder={it.avatar?.metadata?.lqip ? 'blur' : 'empty'}
                      blurDataURL={it.avatar?.metadata?.lqip}
                    />
                  ) : (
                    <span className={styles.footerAvatarFallback}>{initial}</span>
                  )}
                </div>
                <div className={styles.footerInfo}>
                  <span className={styles.footerName}>{it.name}</span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
