'use client'

import styles from './ReviewsSection.module.css'

interface ReviewCardExpandProps {
  text: string
  maxChars?: number
  readMoreLabel?: string
  onReadMore: () => void
}

export default function ReviewCardExpand({
  text,
  maxChars = 130,
  readMoreLabel = 'Devamını oku',
  onReadMore,
}: ReviewCardExpandProps) {
  // Array.from iterates over Unicode code points (not UTF-16 units),
  // preventing surrogate pairs (e.g. emoji) from being split in half.
  const chars = Array.from(text)
  const isLong = chars.length > maxChars
  const displayText = isLong ? chars.slice(0, maxChars).join('').trimEnd() + '…' : text

  return (
    <p className={styles.cardDesc}>
      {displayText}
      {isLong && (
        <button type="button" className={styles.readMore} onClick={onReadMore}>
          {readMoreLabel}
        </button>
      )}
    </p>
  )
}
