'use client'

import { useRouter } from 'next/navigation'
import styles from './TourMetaRow.module.css'

interface TourMetaRowProps {
  rating?: number
  ratingLabel?: string
  reviewCount?: number
  reviewsUrl?: string
  meetingLocation?: string
  fallbackLabel?: string
}

const LikeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.metaIcon}
    aria-hidden
  >
    <path
      d="M7 22V11M2 13V20C2 21.1046 2.89543 22 4 22H16.4262C17.907 22 19.1662 20.9197 19.3914 19.4552L20.4683 12.4552C20.7479 10.6384 19.3411 9 17.5032 9H14C13.4477 9 13 8.55228 13 8V4.46584C13 3.10399 11.896 2 10.5342 2C10.2093 2 9.91498 2.1913 9.78306 2.48812L7.26394 8.57811C7.11196 8.92854 6.76123 9.15789 6.37821 9.15789H4C2.89543 9.15789 2 10.0533 2 11.1579V13"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const LocationIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.metaIcon}
    aria-hidden
  >
    <path
      d="M12 22C12 22 19 16.5 19 10C19 6.13401 15.866 3 12 3C8.13401 3 5 6.13401 5 10C5 16.5 12 22 12 22Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 12.5C13.3807 12.5 14.5 11.3807 14.5 10C14.5 8.61929 13.3807 7.5 12 7.5C10.6193 7.5 9.5 8.61929 9.5 10C9.5 11.3807 10.6193 12.5 12 12.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const RatingDots = ({ count = 5 }: { count?: number }) => (
  <div className={styles.ratingDots}>
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className={`${styles.dot} ${i < count ? styles.dotOn : ''}`}
      />
    ))}
  </div>
)

const GoogleIconSmall = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.reviewsLinkIcon}
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

export default function TourMetaRow({
  rating,
  ratingLabel,
  reviewCount,
  reviewsUrl,
  meetingLocation,
  fallbackLabel,
}: TourMetaRowProps) {
  const router = useRouter()
  const location = meetingLocation || fallbackLabel

  const handleReviewsClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const reviewsSection = document.getElementById('reviews')
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: 'smooth' })
    } else if (reviewsUrl) {
      window.location.href = reviewsUrl
    } else {
      router.push('/yorumlar')
    }
  }

  const hasAny =
    ratingLabel ||
    (rating != null && reviewCount != null) ||
    location

  if (!hasAny) return null

  return (
    <div className={styles.tourMetaRow}>
      {ratingLabel && (
        <div className={styles.metaItem}>
          <LikeIcon />
          <span className={styles.metaText}>{ratingLabel.toUpperCase()}</span>
        </div>
      )}

      {rating != null && reviewCount != null && (
        <div className={styles.metaItem}>
          <RatingDots count={Math.min(5, Math.floor(rating))} />
          <a
            href="#reviews"
            onClick={handleReviewsClick}
            className={styles.reviewsLink}
          >
            {reviewCount.toLocaleString('tr-TR')} yorum
            <GoogleIconSmall />
          </a>
        </div>
      )}

      {location && (
        <div className={styles.metaItem}>
          <LocationIcon />
          <span className={styles.metaText}>
            KALKIŞ NOKTASI {location.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  )
}
