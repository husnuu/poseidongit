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

  const ratingLabel = ratingValue >= 4.5 ? 'Mükemmel' : ratingValue >= 4 ? 'Çok İyi' : 'İyi'

  return (
    <div id="reviews" className={styles.sectionWrapper}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerTitleRow}>
          <p className={styles.ratingLabel}>{ratingLabel}</p>
          <StarRow value={Math.round(ratingValue)} size="lg" />
        </div>
        <p className={styles.ratingMeta}>
          <strong>{ratingValue.toFixed(1)}</strong>
          {' / 5'}
          {reviewCount != null && (
            <> &nbsp;·&nbsp; {reviewCount.toLocaleString('tr-TR')}+ doğrulanmış kullanıcı yorumu</>
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
    </div>
  )
}
