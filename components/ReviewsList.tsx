'use client'

import { useState } from 'react'
import Image from 'next/image'
import ReviewCardExpand from './ReviewCardExpand'
import styles from './ReviewsSection.module.css'

export type ReviewListItem = {
  name: string
  dateLabel: string
  description: string
  rating: number
  avatarSrc?: string | null
  avatarLqip?: string
}

type ReviewsListProps = {
  items: ReviewListItem[]
  verifiedGuestLabel: string
  loadMoreLabel: string
  readMoreLabel?: string
  showLessLabel?: string
  pageSize?: number
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

/** Google'ın doğrulanmış-yorum mavi rozeti (referans site ile birebir aynı ikon). */
function VerifiedMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 22 22" aria-hidden focusable="false">
      <path
        fill="#1d9bf0"
        d="M20.396 11a3.49 3.49 0 0 0-2.008-3.062 3.47 3.47 0 0 0-.742-3.584 3.474 3.474 0 0 0-3.584-.742A3.47 3.47 0 0 0 11 1.604a3.46 3.46 0 0 0-3.053 2.008 3.47 3.47 0 0 0-1.902-.14c-.635.13-1.22.436-1.69.882a3.461 3.461 0 0 0-.734 3.584A3.49 3.49 0 0 0 1.604 11a3.496 3.496 0 0 0 2.017 3.062 3.471 3.471 0 0 0 .733 3.584 3.49 3.49 0 0 0 3.584.742A3.49 3.49 0 0 0 11 20.396a3.48 3.48 0 0 0 3.062-2.007 3.335 3.335 0 0 0 4.326-4.327A3.49 3.49 0 0 0 20.396 11M9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
      />
    </svg>
  )
}

/** Referans siteyle birebir aynı: metin yıldız karakteri, altın/gri renk. */
function StarRow({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)))
  return (
    <div className={styles.stars} aria-label={`${filled} / 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < filled ? 'rgb(245, 166, 35)' : '#dcdce6' }}>
          ★
        </span>
      ))}
    </div>
  )
}

/** Referans siteyle birebir aynı "daha fazla göster" ok ikonu. */
function ChevronIcon() {
  return (
    <svg width="19" height="18" fill="none" viewBox="0 0 19 18" aria-hidden focusable="false">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M11.881 9 6.366 3.53l1.07-1.06L14.02 9l-6.584 6.53-1.07-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function ReviewsList({
  items,
  verifiedGuestLabel,
  loadMoreLabel,
  readMoreLabel,
  showLessLabel,
  pageSize = 5,
}: ReviewsListProps) {
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const visibleItems = items.slice(0, visibleCount)
  const hasMore = visibleCount < items.length

  return (
    <>
      <div className={styles.list}>
        {visibleItems.map((it, idx) => {
          const initial = (it.name || '?').trim().charAt(0).toUpperCase()
          const palette = avatarPalette(it.name || 'A')

          return (
            <div key={`${it.name}-${idx}`} className={styles.review}>
              <div
                className={styles.reviewAvatarWrap}
                style={!it.avatarSrc ? { background: palette.bg, color: palette.fg } : undefined}
              >
                {it.avatarSrc ? (
                  <Image
                    src={it.avatarSrc}
                    alt={it.name}
                    width={44}
                    height={44}
                    className={styles.reviewAvatarImg}
                    placeholder={it.avatarLqip ? 'blur' : 'empty'}
                    blurDataURL={it.avatarLqip}
                  />
                ) : (
                  initial
                )}
              </div>

              <div className={styles.reviewBody}>
                <span className={styles.nameRow}>
                  <strong className={styles.reviewerName}>{it.name}</strong>
                  <VerifiedMark />
                </span>
                <StarRow value={it.rating} />
                <span className={styles.metaRow}>
                  {it.dateLabel ? `${it.dateLabel} · ${verifiedGuestLabel}` : verifiedGuestLabel}
                </span>
                <ReviewCardExpand
                  text={it.description}
                  readMoreLabel={readMoreLabel}
                  showLessLabel={showLessLabel}
                />
              </div>
            </div>
          )
        })}
      </div>

      {hasMore && (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.loadMore}
            onClick={() => setVisibleCount((c) => Math.min(c + pageSize, items.length))}
          >
            <span>{loadMoreLabel}</span>
            <ChevronIcon />
          </button>
        </div>
      )}
    </>
  )
}
