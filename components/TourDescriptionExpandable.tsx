'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import type { PortableTextComponents } from '@portabletext/react'
import type { SiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import styles from './TourDescriptionExpandable.module.css'

interface TourDescriptionExpandableProps {
  description: PortableTextBlock[]
  locale?: SiteLocale
  heading?: string
  headingIcon?: ReactNode
  headingVariant?: 'tour' | 'yacht'
  headingClassName?: string
}

function AnchorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="5" r="3" />
      <line x1="12" y1="22" x2="12" y2="8" />
      <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
    </svg>
  )
}

const portableComponents: Partial<PortableTextComponents> = {
  block: {
    normal: ({ children, value }) => {
      // Boş paragrafları (sadece boşluk veya içeriksiz) atla
      const text = (value?.children as Array<{ text?: string }> | undefined)
        ?.map((c) => c.text ?? '')
        .join('')
        .trim()
      if (!text) return null

      return (
        <div className={styles.timelineItem}>
          <div className={styles.timelineLeft}>
            <span className={styles.timelineIconWrap}><AnchorIcon /></span>
            <span className={styles.timelineLine} aria-hidden />
          </div>
          <p className={styles.paragraphRow}>{children}</p>
        </div>
      )
    },
  },
}

export default function TourDescriptionExpandable({
  description,
  locale,
  heading: headingProp,
  headingIcon,
  headingVariant = 'tour',
  headingClassName,
}: TourDescriptionExpandableProps) {
  const tourUi = useMemo(() => getTourPageUi(locale ?? 'tr'), [locale])
  const heading = headingProp ?? tourUi.tourDescriptionHeading
  const showMore = tourUi.tourDescriptionShowMore
  const [modalOpen, setModalOpen] = useState(false)
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)

  const hasContent = useMemo(
    () => Array.isArray(description) && description.length > 0,
    [description]
  )

  useEffect(() => {
    const el = document.createElement('div')
    el.id = 'tour-desc-portal'
    document.body.appendChild(el)
    setPortalEl(el)
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el)
    }
  }, [])

  useEffect(() => {
    if (!modalOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [modalOpen])

  if (!hasContent) return null

  const iconWrapClass =
    headingVariant === 'yacht' ? styles.headingIconWrapYacht : styles.headingIconWrap
  const headingClass =
    headingClassName ??
    (headingVariant === 'yacht' ? styles.headingYacht : styles.heading)

  const modal = portalEl
    ? createPortal(
        <div
          className={`${styles.overlay} ${modalOpen ? styles.overlayVisible : ''}`}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
          role="dialog"
          aria-modal
          aria-hidden={!modalOpen}
          aria-label={heading}
        >
          <div className={styles.sheet}>
            <div className={styles.sheetHandle} aria-hidden />

            <div className={styles.sheetHeader}>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setModalOpen(false)}
                aria-label="Kapat"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className={styles.sheetBody}>
              <h2 className={styles.sheetTitle}>{heading}</h2>
              <PortableText value={description} components={portableComponents} />
            </div>
          </div>
        </div>,
        portalEl
      )
    : null

  return (
    <>
      <div className={styles.section}>
        <div className={headingVariant === 'yacht' ? styles.headingRowYacht : styles.headingRow}>
          {headingIcon ? <span className={iconWrapClass}>{headingIcon}</span> : null}
          <h2 className={headingClass}>{heading}</h2>
        </div>

        <div className={`${styles.content} ${styles.contentCollapsed}`}>
          <PortableText value={description} components={portableComponents} />
          <div className={styles.fade} aria-hidden />
        </div>

        <button
          type="button"
          className={styles.toggle}
          onClick={() => setModalOpen(true)}
        >
          <span>{showMore}</span>
          <span className={styles.toggleIcon} aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19.293 7.793L20.707 9.207 12 17.914 3.293 9.207 4.707 7.793 12 15.086l7.293-7.293z" fill="currentColor" />
            </svg>
          </span>
        </button>
      </div>

      {modal}
    </>
  )
}
