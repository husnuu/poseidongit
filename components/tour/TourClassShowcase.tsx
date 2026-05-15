'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import type { SiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import styles from './TourClassShowcase.module.css'

export type TourClassImage = {
  asset?: { _ref?: string; _type?: string } | null
  url?: string | null
  alt?: string | null
  caption?: string | null
  metadata?: { lqip?: string | null; dimensions?: { width: number; height: number } | null } | null
}

export type TourClassItem = {
  key: string
  label: string
  description?: string | null
  badge?: string | null
  bullets?: string[] | null
  classImage?: TicketClassImageLike | null
  classImages?: TicketClassImageLike[] | null
}

type TicketClassImageLike = TourClassImage

type Props = {
  classes: TourClassItem[]
  locale: SiteLocale
  defaultKey?: string | null
  /** Bölüm başlığı (yoksa varsayılan i18n metni kullanılır) */
  heading?: string | null
  /** Alt başlık (yoksa varsayılan i18n metni kullanılır) */
  subtitle?: string | null
  /** Üst bölüm başlığı dışarıdan rendered ediliyorsa gizle. */
  hideHeading?: boolean
}

function getImageSrc(img: TicketClassImageLike, width = 1600): string | null {
  try {
    if (img?.asset) {
      return urlFor(img.asset).width(width).quality(85).auto('format').url()
    }
  } catch {
    /* fallthrough to url */
  }
  return img?.url?.trim() || null
}

function collectImages(cls: TourClassItem): TicketClassImageLike[] {
  const list: TicketClassImageLike[] = []
  if (Array.isArray(cls.classImages)) {
    for (const im of cls.classImages) {
      if (im && (im.asset || im.url)) list.push(im)
    }
  }
  if (list.length === 0 && cls.classImage && (cls.classImage.asset || cls.classImage.url)) {
    list.push(cls.classImage)
  }
  return list
}

export default function TourClassShowcase({ classes, locale, defaultKey, heading, subtitle, hideHeading }: Props) {
  const ui = useMemo(() => getTourPageUi(locale), [locale])
  const safeClasses = useMemo(() => (classes ?? []).filter((c) => c?.key && c.label), [classes])
  const initialKey = useMemo(() => {
    const k = (defaultKey || '').trim()
    if (k && safeClasses.some((c) => c.key === k)) return k
    return safeClasses[0]?.key ?? ''
  }, [defaultKey, safeClasses])

  const [activeKey, setActiveKey] = useState<string>(initialKey)
  const [imageIndex, setImageIndex] = useState(0)

  useEffect(() => {
    if (!activeKey && safeClasses[0]?.key) setActiveKey(safeClasses[0].key)
  }, [activeKey, safeClasses])

  const activeClass = useMemo(
    () => safeClasses.find((c) => c.key === activeKey) ?? null,
    [safeClasses, activeKey]
  )
  const images = useMemo(() => (activeClass ? collectImages(activeClass) : []), [activeClass])
  const currentImage = images[imageIndex] ?? null

  useEffect(() => {
    setImageIndex(0)
  }, [activeKey])

  const goPrev = useCallback(() => {
    if (images.length < 2) return
    setImageIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  const goNext = useCallback(() => {
    if (images.length < 2) return
    setImageIndex((i) => (i + 1) % images.length)
  }, [images.length])

  if (safeClasses.length === 0) return null

  return (
    <section className={styles.section} aria-labelledby={hideHeading ? undefined : 'tour-class-showcase-heading'}>
      {!hideHeading && (
        <header className={styles.header}>
          <h2 id="tour-class-showcase-heading" className={styles.heading}>
            {heading?.trim() || ui.classesShowcaseTitle}
          </h2>
          <p className={styles.subheading}>{subtitle?.trim() || ui.classesShowcaseSubtitle}</p>
        </header>
      )}

      <div
        role="tablist"
        aria-label={ui.classesShowcaseSelectAria}
        className={styles.tabs}
      >
        {safeClasses.map((cls) => {
          const isActive = cls.key === activeKey
          return (
            <button
              key={cls.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`tour-class-panel-${cls.key}`}
              id={`tour-class-tab-${cls.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveKey(cls.key)}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            >
              <span className={styles.tabLabel}>{cls.label}</span>
            </button>
          )
        })}
      </div>

      {activeClass && (
        <div
          id={`tour-class-panel-${activeClass.key}`}
          role="tabpanel"
          aria-labelledby={`tour-class-tab-${activeClass.key}`}
          className={styles.panel}
        >
          <div className={styles.gallery}>
            {currentImage ? (
              <>
                <div className={styles.imageWrap}>
                  <Image
                    key={`${activeClass.key}-${imageIndex}`}
                    src={getImageSrc(currentImage) ?? ''}
                    alt={currentImage.alt?.trim() || `${activeClass.label} — ${imageIndex + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 720px"
                    placeholder={currentImage.metadata?.lqip ? 'blur' : 'empty'}
                    blurDataURL={currentImage.metadata?.lqip ?? undefined}
                    className={styles.image}
                    priority={false}
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goPrev}
                        className={`${styles.navBtn} ${styles.navPrev}`}
                        aria-label={ui.classesShowcaseImagePrev}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className={`${styles.navBtn} ${styles.navNext}`}
                        aria-label={ui.classesShowcaseImageNext}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </button>
                      <span className={styles.counter} aria-live="polite">
                        {ui.classesShowcaseImageCounter(imageIndex + 1, images.length)}
                      </span>
                    </>
                  )}
                </div>

                {images.length > 1 && (
                  <div className={styles.dots} aria-hidden>
                    {images.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setImageIndex(i)}
                        className={`${styles.dot} ${i === imageIndex ? styles.dotActive : ''}`}
                        aria-label={`${i + 1}`}
                        tabIndex={-1}
                      />
                    ))}
                  </div>
                )}

                {currentImage.caption && (
                  <p className={styles.caption}>{currentImage.caption}</p>
                )}
              </>
            ) : (
              <div className={styles.imageEmpty}>{ui.classesShowcaseNoImage}</div>
            )}
          </div>

          <div className={styles.content}>
            <div className={styles.contentHeader}>
              <h3 className={styles.classLabel}>{activeClass.label}</h3>
              {activeClass.badge && (
                <span className={styles.contentBadge}>{activeClass.badge}</span>
              )}
            </div>

            {activeClass.description && (
              <p className={styles.description}>{activeClass.description}</p>
            )}

            {Array.isArray(activeClass.bullets) && activeClass.bullets.length > 0 && (
              <div className={styles.bulletsBlock}>
                <h4 className={styles.bulletsTitle}>{ui.classesShowcaseHighlightsTitle}</h4>
                <ul className={styles.bullets}>
                  {activeClass.bullets
                    .map((b) => b?.trim())
                    .filter(Boolean)
                    .map((bullet, idx) => (
                      <li key={idx} className={styles.bulletItem}>
                        <span className={styles.bulletDot} aria-hidden />
                        <span>{bullet}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
