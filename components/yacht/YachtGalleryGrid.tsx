'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import type { YachtSidebarGalleryItem } from '@/lib/yachtImages'
import { SANITY_DISPLAY_IMAGE_PROPS } from '@/lib/sanityImage'
import lightboxStyles from '@/components/PhotoGrid.module.css'
import styles from './YachtIncludedWithGallery.module.css'

interface YachtGalleryGridProps {
  images: YachtSidebarGalleryItem[]
}

const VISIBLE_COUNT = 6

export default function YachtGalleryGrid({ images }: YachtGalleryGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const visible = images.slice(0, VISIBLE_COUNT)

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
  }, [])

  const nextImage = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setLightboxIndex((prev) => (prev + 1) % images.length)
    },
    [images.length]
  )

  const prevImage = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)
    },
    [images.length]
  )

  useEffect(() => {
    if (!lightboxOpen) return
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev + 1) % images.length)
      if (e.key === 'ArrowLeft')
        setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [lightboxOpen, closeLightbox, images.length])

  if (visible.length === 0) return null

  return (
    <>
      <div className={styles.galleryGrid}>
        {visible.map((item, i) => (
          <button
            key={`${item.src}-${i}`}
            type="button"
            className={styles.thumb}
            onClick={() => openLightbox(i)}
            aria-label={`${item.alt} — büyüt`}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 50vw, 320px"
              {...SANITY_DISPLAY_IMAGE_PROPS}
            />
          </button>
        ))}
      </div>

      {lightboxOpen && images[lightboxIndex]?.src ? (
        <div
          className={lightboxStyles.lightboxOverlay}
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Fotoğraf galerisi"
        >
          <button
            type="button"
            onClick={closeLightbox}
            className={lightboxStyles.lightboxClose}
            aria-label="Kapat"
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

          <div className={lightboxStyles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[lightboxIndex].src}
              alt={images[lightboxIndex].alt}
              fill
              className={lightboxStyles.lightboxImage}
              sizes="(max-width: 768px) 100vw, min(2560px, 96vw)"
              priority
              {...SANITY_DISPLAY_IMAGE_PROPS}
            />
          </div>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={prevImage}
                className={`${lightboxStyles.lightboxNav} ${lightboxStyles.lightboxPrev}`}
                aria-label="Önceki fotoğraf"
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
                className={`${lightboxStyles.lightboxNav} ${lightboxStyles.lightboxNext}`}
                aria-label="Sonraki fotoğraf"
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
          ) : null}

          <div className={lightboxStyles.lightboxCounter}>
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      ) : null}
    </>
  )
}
