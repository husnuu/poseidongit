'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import type { PortableTextComponents } from '@portabletext/react'
import { ShipWheel } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import styles from './TourDescriptionExpandable.module.css'

interface TourDescriptionExpandableProps {
  description: PortableTextBlock[]
  /** RSC sınırında `tourUi` geçirilemez; yat sayfası vermezse `tr` kullanılır. */
  locale?: SiteLocale
  /** Varsayılan: tourUi veya "Tur Açıklaması" */
  heading?: string
  /** Başlığın solunda gösterilir (örn. ikon) */
  headingIcon?: ReactNode
  /** `yacht`: yat detay — başlık dahil/galeri kolon başlıklarıyla aynı; ikon kutusu yok */
  headingVariant?: 'tour' | 'yacht'
  /** Varsa h2 bu sınıfla (örn. yat detay ortak başlık modülü) */
  headingClassName?: string
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
  const showLess = tourUi.tourDescriptionShowLess
  const [expanded, setExpanded] = useState(false)

  const hasContent = useMemo(
    () => Array.isArray(description) && description.length > 0,
    [description]
  )

  const portableComponents = useMemo<Partial<PortableTextComponents>>(
    () => ({
      block: {
        normal: ({ children }) => (
          <p className={styles.paragraphRow}>
            <span className={styles.paragraphIconWrap} aria-hidden>
              <ShipWheel className={styles.paragraphIcon} size={21} strokeWidth={1.7} />
            </span>
            <span className={styles.paragraphText}>{children}</span>
          </p>
        ),
      },
    }),
    []
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!hasContent) return null

  const iconWrapClass =
    headingVariant === 'yacht' ? styles.headingIconWrapYacht : styles.headingIconWrap
  const headingClass =
    headingClassName ??
    (headingVariant === 'yacht' ? styles.headingYacht : styles.heading)

  return (
    <div className={styles.section}>
      <div className={headingVariant === 'yacht' ? styles.headingRowYacht : styles.headingRow}>
        {headingIcon ? <span className={iconWrapClass}>{headingIcon}</span> : null}
        <h2 className={headingClass}>{heading}</h2>
      </div>

      <div
        className={
          expanded
            ? styles.content
            : `${styles.content} ${styles.contentCollapsed}`
        }
      >
        <PortableText value={description} components={portableComponents} />
        {!expanded && <div className={styles.fade} aria-hidden />}
      </div>

      <button
        type="button"
        className={styles.toggle}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span>{expanded ? showLess : showMore}</span>
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
