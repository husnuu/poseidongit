'use client'

import { useEffect, useMemo, useState } from 'react'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import styles from './TourDescriptionExpandable.module.css'

interface TourDescriptionExpandableProps {
  description: PortableTextBlock[]
}

export default function TourDescriptionExpandable({
  description,
}: TourDescriptionExpandableProps) {
  const [expanded, setExpanded] = useState(false)

  const hasContent = useMemo(
    () => Array.isArray(description) && description.length > 0,
    [description]
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!hasContent) return null

  return (
    <div className={styles.section}>
      <h2 className={styles.heading}>Tur Açıklaması</h2>

      <div
        className={
          expanded
            ? styles.content
            : `${styles.content} ${styles.contentCollapsed}`
        }
      >
        <PortableText value={description} />
        {!expanded && <div className={styles.fade} aria-hidden />}
      </div>

      <button
        type="button"
        className={styles.toggle}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span>{expanded ? 'Daha az göster' : 'Daha fazla göster'}</span>
        <span className={styles.toggleIcon} aria-hidden>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M19.293 7.79297L20.7072 9.20718L12.0001 17.9143L3.29297 9.20718L4.70718 7.79297L12.0001 15.0859L19.293 7.79297Z"
              fill="currentColor"
            />
          </svg>
        </span>
      </button>
    </div>
  )
}
