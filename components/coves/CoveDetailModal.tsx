'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { X, MapPin } from 'lucide-react'

export interface CoveDetailItem {
  id: string
  title: string
  description?: string | null
  imageUrl: string | null
  alt?: string | null
  locationTag?: string | null
  noImageLabel: string
}

interface CoveDetailModalProps {
  cove: CoveDetailItem
  onClose: () => void
  closeAria: string
}

/** Karttan tıklanınca açılan, koyun tam (kesilmemiş) açıklamasını okunaklı
    beyaz zemin üzerinde gösteren modal. */
export default function CoveDetailModal({ cove, onClose, closeAria }: CoveDetailModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cove-detail-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[16/10] w-full flex-shrink-0 bg-zinc-100 sm:aspect-[16/9]">
          {cove.imageUrl ? (
            <Image
              src={cove.imageUrl}
              alt={cove.alt || cove.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 672px"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
              {cove.noImageLabel}
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={closeAria}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8 sm:py-8">
          {cove.locationTag?.trim() && (
            // Tur/yat kartları ve koy kartlarıyla (CoveCard.tsx) birebir aynı ton.
            <span
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"
              style={{ color: '#8a99ad' }}
            >
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
              {cove.locationTag}
            </span>
          )}
          <h2
            id="cove-detail-title"
            className="mt-1.5 text-2xl font-extrabold uppercase leading-tight text-zinc-900 sm:text-[28px]"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
          >
            {cove.title}
          </h2>
          {cove.description?.trim() ? (
            <p
              className="mt-4 whitespace-pre-line text-[15.5px] leading-[1.75] text-zinc-600 sm:text-base"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              {cove.description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
