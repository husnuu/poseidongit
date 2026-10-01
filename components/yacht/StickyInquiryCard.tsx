'use client'

import type { YachtInquiryCard as InquiryCardConfig } from '@/lib/yachtTypes'
import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtUi } from '@/lib/i18n/yachtUi'
import styles from '@/components/StickyBookingCard.module.css'

function CheckIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={styles.checkIcon}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.70711 14.2929L19 5L20.4142 6.41421L9.70711 17.1213L4 11.4142L5.41421 10L9.70711 14.2929Z"
        fill="currentColor"
      />
    </svg>
  )
}

function DemandIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={styles.demandIcon}
    >
      <path
        d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22Z"
        stroke="#fc6c4f"
        strokeWidth="2"
      />
      <path
        d="M12 7V12L15 14"
        stroke="#fc6c4f"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface StickyInquiryCardProps {
  priceLabel?: string
  priceValue: string
  priceMeta?: string | null
  inquiryCard?: InquiryCardConfig | null
  onOpenInquiry: () => void
  locale?: SiteLocale
}

/** Masaüstü yat sidebar — tur StickyBookingCard ile aynı minimal yapı; tarih/misafir modalda. */
export default function StickyInquiryCard({
  priceLabel,
  priceValue,
  priceMeta,
  inquiryCard,
  onOpenInquiry,
  locale = 'tr',
}: StickyInquiryCardProps) {
  const ui = getYachtUi(locale)
  const title = inquiryCard?.title?.trim() || ui.defaultInquiryTitle
  const ctaText = inquiryCard?.ctaText?.trim() || ui.defaultInquiryCta
  const trustBadges =
    inquiryCard?.trustBadges?.length && inquiryCard.trustBadges.length > 0
      ? inquiryCard.trustBadges.slice(0, 3)
      : ui.defaultTrustBullets.slice(0, 3)
  const noteTitle = inquiryCard?.noteTitle?.trim() || ui.defaultNoteTitle
  const noteSubtitle = inquiryCard?.noteSubtitle?.trim() || ui.defaultNoteSubtitle

  // "/ gün" | "/ gece" gibi kısa birim ekleri fiyatın hemen yanında, aynı satırda
  // gösterilsin (daha derli toplu); seçili tarih veya konaklama özeti gibi daha
  // uzun metinler ise eskisi gibi alt satırda kalsın.
  const trimmedMeta = priceMeta?.trim() || null
  const inlineSuffix = trimmedMeta?.startsWith('/') ? trimmedMeta : null
  const belowMeta = inlineSuffix ? null : trimmedMeta

  return (
    <div className={styles.sidebar}>
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>

        <div className={styles.priceBlock}>
          {priceLabel ? <span className={styles.priceFrom}>{priceLabel}</span> : null}
          <span className={styles.priceValueRow}>
            <span className={styles.priceValue}>{priceValue}</span>
            {inlineSuffix ? <span className={styles.priceSuffix}>{inlineSuffix}</span> : null}
          </span>
          {belowMeta ? <span className={styles.depositLine}>{belowMeta}</span> : null}
        </div>

        <ul className={styles.list}>
          {trustBadges.map((badge, index) => (
            <li key={index} className={styles.listItem}>
              <CheckIcon />
              <span>{badge}</span>
            </li>
          ))}
        </ul>

        <button type="button" className={styles.ctaButton} onClick={onOpenInquiry}>
          {ctaText}
        </button>

        <div className={styles.demand} role="note">
          <DemandIcon />
          <div className={styles.demandText}>
            <p className={styles.demandTitle}>{noteTitle}</p>
            <p className={styles.demandSubtitle}>{noteSubtitle}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
