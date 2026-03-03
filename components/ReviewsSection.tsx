import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
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

function RatingDots({ value, max }: { value: number; max: number }) {
  const v = clampInt(value, 0, max)
  return (
    <span className={styles.dots} aria-label={`Puan: ${v} / ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`${styles.dot} ${i < v ? styles.dotOn : ''}`}
        />
      ))}
    </span>
  )
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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

export default function ReviewsSection({
  reviewsUrl,
  reviewsSection,
}: ReviewsSectionProps) {
  if (!reviewsSection) return null
  if (reviewsSection.enabled === false) return null

  const items = (reviewsSection.items || []).slice(0, 4)
  if (items.length < 1) return null

  const headerCount =
    typeof reviewsSection.reviewCount === 'number'
      ? reviewsSection.reviewCount
      : undefined
  const ratingValue =
    typeof reviewsSection.ratingValue === 'number'
      ? reviewsSection.ratingValue
      : undefined
  const dotsMax =
    typeof reviewsSection.ratingDots === 'number'
      ? clampInt(reviewsSection.ratingDots, 1, 10)
      : 5
  const sourceLabel = reviewsSection.sourceLabel || 'Google'
  const moreText = reviewsSection.moreLinkText || 'Daha fazla yorumu okuyun'
  const reviewsLink = reviewsSection.moreLinkUrl || reviewsUrl || undefined

  return (
    <div className={styles.sectionWrapper}>
      <div id="reviews" className={styles.section}>
        <div className={styles.headerRow}>
          <h2 className={styles.bigTitle}>
            {headerCount != null ? (
              <>
                <span className={styles.count}>{headerCount}</span>{' '}
              </>
            ) : null}
            Yorumlar
          </h2>

          {reviewsLink ? (
            <a
              href={reviewsLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sourceLink}
            >
              <span className={styles.sourceIconWrap} aria-hidden>
                <GoogleIcon />
              </span>
              <span className={styles.sourceText}>
                <span>{sourceLabel}</span>
                {ratingValue != null && (
                  <span className={styles.ratingValue}>
                    {ratingValue.toFixed(1)}
                  </span>
                )}
                <RatingDots
                  value={ratingValue != null ? ratingValue : dotsMax}
                  max={dotsMax}
                />
              </span>
            </a>
          ) : (
            <div className={styles.sourceBlock}>
              <span className={styles.sourceIconWrap} aria-hidden>
                <GoogleIcon />
              </span>
              <div className={styles.sourceText}>
                <span>{sourceLabel}</span>
                {ratingValue != null && (
                  <span className={styles.ratingValue}>
                    {ratingValue.toFixed(1)}
                  </span>
                )}
                <RatingDots
                  value={ratingValue != null ? ratingValue : dotsMax}
                  max={dotsMax}
                />
              </div>
            </div>
          )}
        </div>

        <ul className={styles.list}>
          {items.map((it, idx) => {
            const rating = typeof it.rating === 'number' ? it.rating : 5
            const initial = (it.name || '?').trim().charAt(0).toUpperCase()
            const avatarSrc =
              it.avatar?.asset
                ? urlFor(it.avatar.asset).width(88).height(88).url()
                : it.avatar?.url ?? null

            return (
              <li key={`${it.name}-${idx}`} className={styles.item}>
                <div className={styles.avatarWrap} aria-hidden>
                  {avatarSrc ? (
                    <Image
                      src={avatarSrc}
                      alt={it.name}
                      width={44}
                      height={44}
                      className={styles.avatarImg}
                      placeholder={it.avatar?.metadata?.lqip ? 'blur' : 'empty'}
                      blurDataURL={it.avatar?.metadata?.lqip}
                    />
                  ) : (
                    <span className={styles.avatarFallback}>{initial}</span>
                  )}
                </div>

                <div className={styles.content}>
                  <div className={styles.metaRow}>
                    <p className={styles.name}>{it.name}</p>
                    <RatingDots value={rating} max={5} />
                  </div>
                  <h3 className={styles.title}>{it.title}</h3>
                  <p className={styles.desc}>{it.description}</p>
                </div>
              </li>
            )
          })}
        </ul>

        {reviewsLink && (
          <a
            href={reviewsLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.moreLink}
          >
            {moreText} <span aria-hidden>›</span>
          </a>
        )}
      </div>
    </div>
  )
}
