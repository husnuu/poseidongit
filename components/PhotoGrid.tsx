'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import YachtHeroBadgeOverlay from '@/components/yacht/YachtHeroBadgeOverlay'
import type { SiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import styles from './PhotoGrid.module.css'

export interface PhotoGridImage {
  src: string
  blurDataURL?: string | null
  alt: string
}

interface PhotoGridProps {
  images: PhotoGridImage[]
  tourTitle: string
  /** Yat detay: ana görsel üzerinde şerit rozetler (tur «En Popüler» stili) */
  heroBadges?: string[]
  /** RSC sınırında `tourUi` nesnesi (içinde fonksiyonlar) geçirilemez; yalnızca locale. */
  locale?: SiteLocale
}

export default function PhotoGrid({ images, tourTitle, heroBadges, locale }: PhotoGridProps) {
  const tourUi = useMemo(() => getTourPageUi(locale ?? 'tr'), [locale])
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const { mainImage, secondImage, rightImages, hasMainImage } = useMemo(() => {
    const main = images[0]
    const second = images[1]
    const right = images.slice(1, 5)
    return {
      mainImage: main,
      secondImage: second,
      rightImages: right,
      hasMainImage: !!main?.src,
    }
  }, [images])

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    document.body.style.overflow = ''
  }

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLightboxIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (!hasMainImage) return null

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.wrapperInner}>
        <div className={styles.grid}>
          {/* First image - main (desktop: left big, mobile: top full width) */}
          <div
            className={styles.main}
            onClick={() => openLightbox(0)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openLightbox(0)}
            aria-label={tourUi.photoGridOpenGallery}
          >
            <Image
              src={mainImage.src}
              alt={tourTitle}
              fill
              className={styles.gridImage}
              placeholder={mainImage.blurDataURL ? 'blur' : 'empty'}
              blurDataURL={mainImage.blurDataURL ?? undefined}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {heroBadges && heroBadges.length > 0 ? (
              <div className={styles.mainBadgeLayer}>
                <YachtHeroBadgeOverlay badges={heroBadges} />
              </div>
            ) : null}
          </div>

          {/* Second image - mobile: stacked below with button; desktop: part of grid (first thumb) */}
          {secondImage?.src && (
            <div
              className={`${styles.thumb} ${styles.second}`}
              onClick={() => openLightbox(1)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openLightbox(1)}
              aria-label={tourUi.photoGridOpenGallery}
            >
              <Image
                src={secondImage.src}
                alt={`${tourTitle} - 2`}
                fill
                className={styles.gridImage}
                placeholder={secondImage.blurDataURL ? 'blur' : 'empty'}
                blurDataURL={secondImage.blurDataURL ?? undefined}
                sizes="(max-width: 768px) 100vw, 25vw"
              />
              {images.length > 2 && (
                <button
                  type="button"
                  className={styles.viewAllButton}
                  onClick={(e) => {
                    e.stopPropagation()
                    openLightbox(0)
                  }}
                >
                  {tourUi.photoGridMobileSeeAllWithCount(images.length)}
                </button>
              )}
            </div>
          )}

          {/* Desktop: right 4 thumbs in 2x2 (hidden on mobile) */}
          {rightImages.map((image, index) => {
            const isBottomRight = index === 3
            const hasImage = !!image?.src
            if (!hasImage) return null
            return (
              <div
                key={`thumb-${index}`}
                className={`${styles.thumb} ${styles.desktopOnly}`}
                onClick={() => openLightbox(index + 1)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === 'Enter' && openLightbox(index + 1)
                }
                aria-label={tourUi.photoGridOpenGallery}
              >
                <Image
                  src={image.src}
                  alt={`${tourTitle} - ${index + 2}`}
                  fill
                  className={styles.gridImage}
                  placeholder={image.blurDataURL ? 'blur' : 'empty'}
                  blurDataURL={image.blurDataURL ?? undefined}
                  sizes="25vw"
                />
                {isBottomRight && (
                  <button
                    type="button"
                    className={styles.viewAllButton}
                    onClick={(e) => {
                      e.stopPropagation()
                      openLightbox(0)
                    }}
                  >
                    {images.length > 5
                      ? tourUi.photoGridSeeAllWithExtra(images.length - 5)
                      : tourUi.photoGridSeeAll}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && images[lightboxIndex]?.src && (
        <div
          className={styles.lightboxOverlay}
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={tourUi.photoGridLightboxAria}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className={styles.lightboxClose}
            aria-label={tourUi.photoGridClose}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div
            className={styles.lightboxContent}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIndex].src}
              alt={images[lightboxIndex].alt}
              fill
              className={styles.lightboxImage}
              sizes="90vw"
            />
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                aria-label={tourUi.photoGridPrev}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={nextImage}
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                aria-label={tourUi.photoGridNext}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </>
          )}

          <div className={styles.lightboxCounter}>
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  )
}
