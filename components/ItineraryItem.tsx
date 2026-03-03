'use client'

import Image from 'next/image'
import styles from './ItineraryItem.module.css'

export interface ItineraryItemProps {
  title: string
  description?: string | null
  time?: string | null
  tag?: string | null
  imageUrl?: string | null
  imageBlurDataURL?: string | null
  /** Son öğe mi (connector gizlensin) */
  isLast?: boolean
}

function ConnectorSvg() {
  return (
    <svg
      className={styles.connectorSvg}
      viewBox="0 0 24 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 0v14c0 2 4 4 12 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 0v14c0 2-4 4-12 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="28" r="3" fill="currentColor" />
    </svg>
  )
}

export default function ItineraryItem({
  title,
  description,
  time,
  tag,
  imageUrl,
  imageBlurDataURL,
  isLast,
}: ItineraryItemProps) {
  return (
    <li className={styles.item}>
      <div className={styles.card}>
        <div className={styles.imageWrap}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className={styles.image}
              placeholder={imageBlurDataURL ? 'blur' : 'empty'}
              blurDataURL={imageBlurDataURL ?? undefined}
              sizes="88px"
            />
          ) : (
            <div className={styles.imagePlaceholder} aria-hidden />
          )}
          <div className={styles.badges}>
            {time && (
              <span className={styles.badgeTime}>{time}</span>
            )}
            {tag && (
              <span className={styles.badgeTag}>{tag}</span>
            )}
          </div>
        </div>
        <div className={styles.content}>
          <h3 className={styles.itemTitle}>{title}</h3>
          {description && (
            <p className={styles.itemDesc}>{description}</p>
          )}
        </div>
      </div>
      {!isLast && (
        <div className={styles.connector} aria-hidden>
          <ConnectorSvg />
        </div>
      )}
    </li>
  )
}
