'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'

export interface TourGalleryImage {
  src: string
  blurDataURL?: string | null
  alt: string
}

interface TourGalleryHeroProps {
  images: TourGalleryImage[]
  tourTitle: string
}

const TOTAL_VISIBLE = 5
const HERO_INDEX = 0
const GRID_INDICES = [1, 2, 3, 4]

function getGridImage(
  images: TourGalleryImage[],
  index: number
): TourGalleryImage | null {
  if (images.length === 0) return null
  const i = GRID_INDICES[index]
  if (i < images.length) return images[i]
  return images[images.length - 1]
}

function SkeletonTile({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-xl ${className ?? ''}`}
    />
  )
}

export function TourGalleryHero({
  images,
  tourTitle,
}: TourGalleryHeroProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [loadedCount, setLoadedCount] = useState(0)
  const total = images.length
  const remainingCount = total > TOTAL_VISIBLE ? total - TOTAL_VISIBLE : 0
  const viewAllLabel =
    remainingCount > 0
      ? `TÜM FOTOĞRAFLARI GÖR (+${remainingCount})`
      : 'TÜM FOTOĞRAFLARI GÖR'

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }, [])

  const closeLightbox = useCallback(() => setLightboxOpen(false), [])

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i <= 0 ? images.length - 1 : i - 1))
  }, [images.length])

  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i >= images.length - 1 ? 0 : i + 1))
  }, [images.length])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxOpen, closeLightbox, goPrev, goNext])

  useEffect(() => {
    if (lightboxOpen) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [lightboxOpen])

  if (images.length === 0) return null

  const heroImage = images[HERO_INDEX]
  const gridImages = GRID_INDICES.map((_, i) => getGridImage(images, i))
  const showSkeleton = loadedCount < Math.min(TOTAL_VISIBLE, total)

  return (
    <>
      {/* Full-width container: no max-width, no side padding */}
      <div className="w-full overflow-hidden">
        {/* Desktop: split layout - no gap between photos */}
        <div className="hidden md:flex w-full min-h-[420px] md:min-h-[380px] lg:min-h-[480px]">
          {/* Left: ~62% - single hero image */}
          <div
            className="relative flex-[0_0_62%] overflow-hidden bg-zinc-200 dark:bg-zinc-800 group cursor-pointer"
            style={{ minHeight: 320 }}
            onClick={() => openLightbox(HERO_INDEX)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openLightbox(HERO_INDEX)}
            aria-label="Galeriyi aç"
          >
            {showSkeleton && (
              <SkeletonTile className="absolute inset-0 rounded-none" />
            )}
            <Image
              src={heroImage.src}
              alt={heroImage.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="62vw"
              placeholder={heroImage.blurDataURL ? 'blur' : 'empty'}
              blurDataURL={heroImage.blurDataURL ?? undefined}
              onLoad={() => setLoadedCount((c) => c + 1)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 pointer-events-none" />
          </div>

          {/* Right: ~38% - 2x2 grid, no gap */}
          <div
            className="flex-1 grid grid-cols-2 grid-rows-2 overflow-hidden"
            style={{ minWidth: 0 }}
          >
            {gridImages.map((img, i) => {
              if (!img) return <SkeletonTile key={i} className="min-h-[140px]" />
              const isLast = i === 3
              return (
                <div
                  key={i}
                  className="relative min-h-[140px] overflow-hidden bg-zinc-200 dark:bg-zinc-800 group cursor-pointer"
                  onClick={() => openLightbox(GRID_INDICES[i])}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && openLightbox(GRID_INDICES[i])
                  }
                  aria-label="Galeriyi aç"
                >
                  {showSkeleton && (
                    <SkeletonTile className="absolute inset-0 rounded-none" />
                  )}
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 1024px) 19vw, 38vw"
                    placeholder={img.blurDataURL ? 'blur' : 'empty'}
                    blurDataURL={img.blurDataURL ?? undefined}
                    onLoad={() => setLoadedCount((c) => c + 1)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 pointer-events-none" />
                  {/* Overlay button on bottom-right tile (last) - secondary button style */}
                  {isLast && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        type="button"
                        className="view-all-gallery-btn min-h-[48px] inline-flex items-center justify-center rounded bg-white text-[#2168b8] uppercase font-semibold text-xl whitespace-nowrap border-none cursor-pointer transition-all duration-200 hover:opacity-95"
                        style={{
                          boxShadow: '0 12px 34px rgba(33, 104, 184, 0.3)',
                          fontFamily: 'var(--font-family), sans-serif',
                          padding: '13px 24px 9px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          openLightbox(0)
                        }}
                      >
                        {viewAllLabel}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile: single large image + overlay button */}
        <div className="md:hidden relative w-full aspect-[4/3] rounded-none overflow-hidden bg-zinc-200 dark:bg-zinc-800">
          <SkeletonTile className="absolute inset-0 rounded-none" />
          <Image
            src={heroImage.src}
            alt={heroImage.alt}
            fill
            className="object-cover"
            sizes="100vw"
            placeholder={heroImage.blurDataURL ? 'blur' : 'empty'}
            blurDataURL={heroImage.blurDataURL ?? undefined}
            onLoad={() => setLoadedCount((c) => c + 1)}
            priority
          />
          <button
            type="button"
            onClick={() => openLightbox(0)}
            className="view-all-gallery-btn absolute bottom-4 left-1/2 -translate-x-1/2 min-h-[48px] inline-flex items-center justify-center rounded bg-white text-[#2168b8] uppercase font-semibold text-xl whitespace-nowrap border-none cursor-pointer transition-all duration-200 hover:opacity-95"
            style={{
              boxShadow: '0 12px 34px rgba(33, 104, 184, 0.3)',
              fontFamily: 'var(--font-family), sans-serif',
              padding: '13px 24px 9px',
            }}
          >
            {viewAllLabel}
          </button>
        </div>
      </div>

      {/* Full-screen lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black"
          role="dialog"
          aria-modal="true"
          aria-label="Fotoğraf galerisi"
        >
          <div
            className="absolute inset-0 z-0"
            aria-hidden
            onClick={closeLightbox}
          />
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Kapat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex-1 relative min-h-0 p-4 flex items-center justify-center z-10 pointer-events-none">
            <Image
              key={lightboxIndex}
              src={images[lightboxIndex]?.src ?? ''}
              alt={images[lightboxIndex]?.alt ?? tourTitle}
              fill
              className="object-contain pointer-events-none"
              sizes="100vw"
            />
          </div>

          <div className="flex items-center justify-between px-4 py-3 bg-black/50 text-white text-sm z-20 pointer-events-auto">
            <button
              type="button"
              onClick={goPrev}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Önceki"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span>
              {lightboxIndex + 1} / {total}
            </span>
            <button
              type="button"
              onClick={goNext}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Sonraki"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
