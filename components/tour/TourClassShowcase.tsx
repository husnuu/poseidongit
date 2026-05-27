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

function imageDedupeKey(img: TicketClassImageLike): string | null {
  const ref =
    img.asset && typeof img.asset === 'object' && '_ref' in img.asset
      ? String((img.asset as { _ref?: string })._ref ?? '').trim()
      : ''
  if (ref) return ref
  const u = img.url?.trim()
  return u || null
}

function getImageSrc(img: TicketClassImageLike, width = 1600): string | null {
  try {
    if (img?.asset) {
      return urlFor(img.asset).width(width).quality(88).auto('format').url()
    }
  } catch {
    /* fallthrough to url */
  }
  return img?.url?.trim() || null
}

/** Galeri + kapak görseli; yinelenen asset/url atlanır. */
function collectImages(cls: TourClassItem): TicketClassImageLike[] {
  const list: TicketClassImageLike[] = []
  const seen = new Set<string>()

  const push = (im: TicketClassImageLike | null | undefined) => {
    if (!im || (!im.asset && !im.url)) return
    const key = imageDedupeKey(im)
    if (!key || seen.has(key)) return
    seen.add(key)
    list.push(im)
  }

  if (Array.isArray(cls.classImages)) {
    for (const im of cls.classImages) push(im)
  }
  push(cls.classImage ?? undefined)
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
  const images = useMemo(() => {
    const raw = activeClass ? collectImages(activeClass) : []
    return raw.filter((im) => getImageSrc(im) != null)
  }, [activeClass])
  const slideCount = images.length
  const safeIndex = slideCount > 0 ? Math.min(imageIndex, slideCount - 1) : 0
  const currentImage = images[safeIndex] ?? null

  useEffect(() => {
    setImageIndex(0)
  }, [activeKey])

  useEffect(() => {
    if (slideCount > 0 && imageIndex >= slideCount) {
      setImageIndex(0)
    }
  }, [slideCount, imageIndex])

  const goPrev = useCallback(() => {
    setImageIndex((i) => {
      if (slideCount < 2) return i
      return (i - 1 + slideCount) % slideCount
    })
  }, [slideCount])

  const goNext = useCallback(() => {
    setImageIndex((i) => {
      if (slideCount < 2) return i
      return (i + 1) % slideCount
    })
  }, [slideCount])

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
            {slideCount > 0 ? (
              <>
                <div
                  className={styles.imageWrap}
                  onKeyDown={(e) => {
                    if (slideCount < 2) return
                    if (e.key === 'ArrowLeft') {
                      e.preventDefault()
                      goPrev()
                    }
                    if (e.key === 'ArrowRight') {
                      e.preventDefault()
                      goNext()
                    }
                  }}
                >
                  <div
                    className={styles.track}
                    style={{ transform: `translate3d(-${safeIndex * 100}%, 0, 0)` }}
                    aria-live="polite"
                  >
                    {images.map((img, i) => {
                      const src = getImageSrc(img)
                      if (!src) return null
                      const dedupe = imageDedupeKey(img) ?? String(i)
                      return (
                        <div key={`${activeClass.key}-${dedupe}`} className={styles.slide}>
                          <Image
                            src={src}
                            alt={img.alt?.trim() || `${activeClass.label} — ${i + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 720px"
                            placeholder={img.metadata?.lqip ? 'blur' : 'empty'}
                            blurDataURL={img.metadata?.lqip ?? undefined}
                            className={styles.image}
                            priority={i === 0}
                          />
                        </div>
                      )
                    })}
                  </div>
                  {slideCount > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          goPrev()
                        }}
                        className={`${styles.navBtn} ${styles.navPrev}`}
                        aria-label={ui.classesShowcaseImagePrev}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          goNext()
                        }}
                        className={`${styles.navBtn} ${styles.navNext}`}
                        aria-label={ui.classesShowcaseImageNext}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </button>
                      <span className={styles.counter} aria-live="polite">
                        {ui.classesShowcaseImageCounter(safeIndex + 1, slideCount)}
                      </span>
                    </>
                  )}
                </div>

                {slideCount > 1 && (
                  <div className={styles.dots} role="tablist" aria-label={ui.classesShowcaseSelectAria}>
                    {images.map((img, i) => {
                      const dedupe = imageDedupeKey(img) ?? String(i)
                      return (
                        <button
                          key={dedupe}
                          type="button"
                          role="tab"
                          aria-selected={i === safeIndex}
                          onClick={() => setImageIndex(i)}
                          className={`${styles.dot} ${i === safeIndex ? styles.dotActive : ''}`}
                          aria-label={ui.classesShowcaseImageCounter(i + 1, slideCount)}
                        />
                      )
                    })}
                  </div>
                )}

                {currentImage?.caption && (
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
