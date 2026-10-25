'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react'

export interface CoveGalleryImage {
  url: string
  /** Lightbox için yüksek çözünürlüklü sürüm. */
  fullUrl: string
  alt: string
}

interface CoveGalleryProps {
  images: CoveGalleryImage[]
  showAllLabel: string
  prevLabel: string
  nextLabel: string
  closeLabel: string
}

/** Koy detay sayfasının görsel bölümü. Masaüstünde kapak + küçük görsellerden
    oluşan mozaik, mobilde yatay kaydırmalı şerit; herhangi birine tıklayınca
    tam ekran galeri (ok tuşları / Esc destekli) açılır. */
export default function CoveGallery({ images, showAllLabel, prevLabel, nextLabel, closeLabel }: CoveGalleryProps) {
  const [open, setOpen] = useState<number | null>(null)
  const count = images.length

  const go = useCallback(
    (dir: 1 | -1) => setOpen((i) => (i == null ? i : (i + dir + count) % count)),
    [count],
  )

  useEffect(() => {
    if (open == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, go])

  if (count === 0) return null

  const tile = (img: CoveGalleryImage, i: number, className: string, sizes: string, priority = false) => (
    <button
      key={i}
      type="button"
      onClick={() => setOpen(i)}
      className={`group relative overflow-hidden bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary,#2168b8)] ${className}`}
    >
      <Image
        src={img.url}
        alt={img.alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
      <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" aria-hidden />
    </button>
  )

  // Masaüstü mozaiği: 1 görsel → tek geniş; 2 → yan yana; 3–4 → kapak + 2;
  // 5+ → kapak + 4.
  const desktop =
    count === 1 ? (
      <div className="grid h-[480px] grid-cols-1 overflow-hidden rounded-3xl">
        {tile(images[0], 0, 'h-full', '1200px', true)}
      </div>
    ) : count === 2 ? (
      <div className="grid h-[440px] grid-cols-2 gap-2 overflow-hidden rounded-3xl">
        {images.slice(0, 2).map((img, i) => tile(img, i, 'h-full', '600px', i === 0))}
      </div>
    ) : count <= 4 ? (
      <div className="grid h-[460px] grid-cols-3 grid-rows-2 gap-2 overflow-hidden rounded-3xl">
        {tile(images[0], 0, 'col-span-2 row-span-2', '800px', true)}
        {images.slice(1, 3).map((img, i) => tile(img, i + 1, '', '400px'))}
      </div>
    ) : (
      <div className="grid h-[480px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl">
        {tile(images[0], 0, 'col-span-2 row-span-2', '600px', true)}
        {images.slice(1, 5).map((img, i) => tile(img, i + 1, '', '300px'))}
      </div>
    )

  return (
    <>
      <div className="relative hidden md:block">
        {desktop}
        {count > 1 && (
          <button
            type="button"
            onClick={() => setOpen(0)}
            className="absolute bottom-4 right-4 inline-flex h-10 items-center gap-2 rounded-lg border border-[#d3dce6] bg-white px-4 text-[13px] font-extrabold uppercase tracking-wide text-[var(--secondary,#131719)] transition hover:border-[#8a9db3]"
          >
            <Images className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            {showAllLabel}
          </button>
        )}
      </div>

      {/* Mobil: kenardan kenara yatay şerit, kaydırma noktalarına oturur. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
        {images.map((img, i) =>
          tile(
            img,
            i,
            `aspect-[4/3] shrink-0 snap-center rounded-2xl ${count === 1 ? 'w-full' : 'w-[86%]'}`,
            '90vw',
            i === 0,
          ),
        )}
      </div>

      {open != null && (
        <div
          className="fixed inset-0 z-[10001] flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white sm:px-6">
            <span className="text-[14px] font-bold tabular-nums text-white/80">
              {open + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label={closeLabel}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="relative min-h-0 flex-1" onClick={(e) => e.stopPropagation()}>
            <Image
              key={open}
              src={images[open].fullUrl}
              alt={images[open].alt}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label={prevLabel}
                  className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-900 transition hover:bg-white sm:left-6"
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label={nextLabel}
                  className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-900 transition hover:bg-white sm:right-6"
                >
                  <ChevronRight className="h-6 w-6" aria-hidden />
                </button>
              </>
            )}
          </div>
          <p className="px-4 py-3 text-center text-[13px] text-white/70">{images[open].alt}</p>
        </div>
      )}
    </>
  )
}
