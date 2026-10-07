'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Quote, Info, X } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import modalStyles from './home/ReviewModal.module.css'
import styles from './ReviewExcerptStrip.module.css'

interface ReviewExcerptItem {
  name: string
  description: string
  rating?: number
}

interface ReviewExcerptStripProps {
  reviewsSection?: {
    enabled?: boolean
    items?: ReviewExcerptItem[]
  }
  /** RSC sınırında `tourUi` geçirilemez (fonksiyon alanları var); verilmezse `tr`. */
  locale?: SiteLocale
  /** Tam yorum listesine kaydırmak için — bkz. ReviewsSection'daki #all-reviews çapası. */
  allReviewsHref?: string
}

/** İsimden deterministik dolu avatar rengi — ReviewsList.tsx'teki modalAvatarColor ile aynı mantık,
    tüm yorum kartlarıyla tutarlı dursun diye. */
function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360
  return `hsl(${hash}, 62%, 46%)`
}

/** Yorum metninin ilk cümlesi — kısa bir alıntı şeridi için. Noktalama yoksa
    makul bir uzunlukta üç nokta ile kırpar. */
function firstSentence(text: string, maxLen = 150): string {
  const trimmed = text.trim()
  const match = trimmed.match(/^.*?[.!?](?=\s|$)/)
  let sentence = match ? match[0] : trimmed
  if (sentence.length > maxLen) {
    sentence = `${sentence.slice(0, maxLen).trim()}…`
  }
  return sentence.trim()
}

/** En yüksek puanlı ve en kısa (dolayısıyla alıntıya en uygun) 1-2 yorumu seçer. */
function pickExcerpts(items: ReviewExcerptItem[], max = 2): ReviewExcerptItem[] {
  const withText = items.filter((it) => it.description?.trim())
  const highRated = withText.filter((it) => (it.rating ?? 5) >= 4)
  const pool = highRated.length > 0 ? highRated : withText
  return [...pool]
    .sort((a, b) => (b.rating ?? 5) - (a.rating ?? 5) || a.description.length - b.description.length)
    .slice(0, max)
}

/** Google'ın doğrulanmış-yorum mavi rozeti — ReviewsList.tsx'teki VerifiedMark ile birebir aynı. */
function VerifiedMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 22 22" aria-hidden focusable="false">
      <path
        fill="#1d9bf0"
        d="M20.396 11a3.49 3.49 0 0 0-2.008-3.062 3.47 3.47 0 0 0-.742-3.584 3.474 3.474 0 0 0-3.584-.742A3.47 3.47 0 0 0 11 1.604a3.46 3.46 0 0 0-3.053 2.008 3.47 3.47 0 0 0-1.902-.14c-.635.13-1.22.436-1.69.882a3.461 3.461 0 0 0-.734 3.584A3.49 3.49 0 0 0 1.604 11a3.496 3.496 0 0 0 2.017 3.062 3.471 3.471 0 0 0 .733 3.584 3.49 3.49 0 0 0 3.584.742A3.49 3.49 0 0 0 11 20.396a3.48 3.48 0 0 0 3.062-2.007 3.335 3.335 0 0 0 4.326-4.327A3.49 3.49 0 0 0 20.396 11M9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
      />
    </svg>
  )
}

export default function ReviewExcerptStrip({
  reviewsSection,
  locale = 'tr',
  allReviewsHref = '#all-reviews',
}: ReviewExcerptStripProps) {
  const tourUi = getTourPageUi(locale)
  const [infoOpen, setInfoOpen] = useState(false)
  const [openReviewIndex, setOpenReviewIndex] = useState<number | null>(null)
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null)

  // Popup'lar için: ReviewsList.tsx'teki "yorumun tamamını oku" modalıyla
  // aynı mekanik — body'ye eklenen portal konteyneri.
  useEffect(() => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    setPortalEl(el)
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el)
    }
  }, [])

  const anyModalOpen = infoOpen || openReviewIndex !== null

  useEffect(() => {
    if (!anyModalOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInfoOpen(false)
        setOpenReviewIndex(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [anyModalOpen])

  if (!reviewsSection || reviewsSection.enabled === false) return null
  const items = reviewsSection.items || []
  if (items.length === 0) return null

  const excerpts = pickExcerpts(items)
  if (excerpts.length === 0) return null

  const infoModal =
    portalEl && infoOpen
      ? createPortal(
          <div
            className={`${modalStyles.overlay} ${modalStyles.overlayVisible}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) setInfoOpen(false)
            }}
            role="dialog"
            aria-modal
            aria-label={tourUi.reviewExcerptInfoAria}
          >
            <div className={modalStyles.sheet}>
              <div className={modalStyles.sheetHandle} aria-hidden />
              <div className={modalStyles.sheetBody}>
                <div className={modalStyles.topRow}>
                  <div className={modalStyles.reviewerText}>
                    <p className={modalStyles.reviewerName}>{tourUi.reviewExcerptLabel}</p>
                  </div>
                  <button
                    type="button"
                    className={modalStyles.closeBtn}
                    onClick={() => setInfoOpen(false)}
                    aria-label={tourUi.reviewExcerptInfoClose}
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>
                <p className={modalStyles.fullText}>{tourUi.reviewExcerptInfoText}</p>
              </div>
            </div>
          </div>,
          portalEl
        )
      : null

  const openReview = openReviewIndex != null ? excerpts[openReviewIndex] : null

  const reviewModal =
    portalEl && openReview
      ? createPortal(
          <div
            className={`${modalStyles.overlay} ${modalStyles.overlayVisible}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpenReviewIndex(null)
            }}
            role="dialog"
            aria-modal
            aria-label={openReview.name}
          >
            <div className={modalStyles.sheet}>
              <div className={modalStyles.sheetHandle} aria-hidden />
              <div className={modalStyles.sheetBody}>
                <div className={modalStyles.topRow}>
                  <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
                    style={{ background: avatarColor(openReview.name || 'A') }}
                    aria-hidden
                  >
                    {(openReview.name || '?').trim().charAt(0).toUpperCase()}
                  </span>
                  <div className={modalStyles.reviewerText}>
                    <p className={modalStyles.reviewerName}>
                      <span className={styles.nameRow}>
                        {openReview.name}
                        <VerifiedMark />
                      </span>
                    </p>
                    <span className={modalStyles.dateLabel}>{tourUi.reviewExcerptSourceLabel}</span>
                  </div>
                  <button
                    type="button"
                    className={modalStyles.closeBtn}
                    onClick={() => setOpenReviewIndex(null)}
                    aria-label={tourUi.reviewExcerptInfoClose}
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>
                <p className={modalStyles.fullText}>{openReview.description.trim()}</p>
              </div>
            </div>
          </div>,
          portalEl
        )
      : null

  return (
    <div className={styles.wrapper} aria-labelledby="review-excerpt-heading">
      <div className={styles.headerRow}>
        <div className={styles.labelGroup}>
          <h3 id="review-excerpt-heading" className={styles.label}>
            {tourUi.reviewExcerptLabel}
          </h3>
          <button
            type="button"
            className={styles.infoBtn}
            aria-label={tourUi.reviewExcerptInfoAria}
            aria-expanded={infoOpen}
            onClick={() => setInfoOpen(true)}
          >
            <Info className={styles.infoIcon} aria-hidden />
          </button>
        </div>
        <Link href={allReviewsHref} className={styles.readAllLink}>
          {tourUi.reviewExcerptReadAll}
        </Link>
      </div>

      <div className={styles.grid}>
        {excerpts.map((item, index) => {
          const full = item.description.trim()
          const short = firstSentence(full)
          const hasMore = short.length < full.length
          return (
            <blockquote
              key={`${item.name}-${index}`}
              className={`${styles.card} ${index > 0 ? styles.cardExtra : ''}`}
            >
              <Quote className={styles.quoteIcon} aria-hidden />
              <p className={styles.quoteText}>
                &ldquo;{short}&rdquo;
                {hasMore && (
                  <button
                    type="button"
                    className={styles.readMoreBtn}
                    onClick={() => setOpenReviewIndex(index)}
                  >
                    {tourUi.reviewExcerptReadMore}
                  </button>
                )}
              </p>
              <footer className={styles.footer}>
                <span
                  className={styles.avatar}
                  style={{ background: avatarColor(item.name || 'A') }}
                  aria-hidden
                >
                  {(item.name || '?').trim().charAt(0).toUpperCase()}
                </span>
                <span className={styles.footerText}>
                  <span className={styles.nameRow}>
                    <cite className={styles.name}>{item.name}</cite>
                    <VerifiedMark />
                  </span>
                  <span className={styles.sourceLabel}>{tourUi.reviewExcerptSourceLabel}</span>
                </span>
              </footer>
            </blockquote>
          )
        })}
      </div>

      {infoModal}
      {reviewModal}
    </div>
  )
}
