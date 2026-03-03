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
