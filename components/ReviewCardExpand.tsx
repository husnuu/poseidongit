'use client'

import { useState } from 'react'
import styles from './ReviewsSection.module.css'

interface ReviewCardExpandProps {
  text: string
  maxChars?: number
}

export default function ReviewCardExpand({ text, maxChars = 130 }: ReviewCardExpandProps) {
  const [expanded, setExpanded] = useState(false)
  // Array.from iterates over Unicode code points (not UTF-16 units),
  // preventing surrogate pairs (e.g. emoji) from being split in half.
  const chars = Array.from(text)
  const isLong = chars.length > maxChars
  const displayText =
    !expanded && isLong ? chars.slice(0, maxChars).join('').trimEnd() + '…' : text

  return (
    <p className={styles.cardDesc}>
      {displayText}
      {isLong && (
        <button
          className={styles.readMore}
          onClick={() => setExpanded((p) => !p)}
          aria-expanded={expanded}
        >
          {expanded ? 'Daha az' : 'Tümünü oku'}
        </button>
      )}
    </p>
  )
}
