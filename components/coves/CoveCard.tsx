import Image from 'next/image'
import { MapPin, ArrowRight } from 'lucide-react'

/** Tur/yat kartlarındaki (TourCard.tsx) ikon rengiyle birebir aynı mavimsi-gri ton. */
const META_ICON_COLOR = '#8a99ad'

export interface CoveCardProps {
  title: string
  description?: string | null
  imageUrl: string | null
  alt?: string | null
  locationTag?: string | null
  noImageLabel?: string
  detailHint?: string
  onClick?: () => void
  ariaLabel?: string
}

/** Sitenin genelindeki tur/yat kartlarıyla (TourCard.tsx) aynı beyaz kart dili:
    üstte fotoğraf, altında başlık + açıklama + alt çizgili "Keşfet" satırı.
    Tıklanınca tam açıklama CoveDetailModal'da açılır. */
export default function CoveCard({
  title,
  description,
  imageUrl,
  alt,
  locationTag,
  noImageLabel = 'Görsel yok',
  detailHint = 'Keşfet',
  onClick,
  ariaLabel,
}: CoveCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || title}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#f1f5f9] bg-white text-left shadow-[0_2px_8px_rgba(19,23,25,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_-8px_rgba(19,23,25,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary,#2168b8)] focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-zinc-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={alt || title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">{noImageLabel}</div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4 sm:px-6">
        {locationTag?.trim() && (
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"
            style={{ color: META_ICON_COLOR }}
          >
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
            {locationTag}
          </span>
        )}
        <h2
          className="mt-1 text-lg font-extrabold uppercase leading-tight sm:text-xl"
          style={{ fontFamily: 'var(--font-family-title, var(--font-family))', color: 'var(--primary, #2168b8)' }}
        >
          {title}
        </h2>
        {description?.trim() && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-500">{description}</p>
        )}

        <div className="mt-auto flex items-center gap-1.5 border-t border-[#f1f5f9] pt-4 text-sm font-bold uppercase tracking-wide text-[var(--secondary,#131719)] transition-colors duration-200 group-hover:text-[var(--primary,#2168b8)]">
          {detailHint}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2} aria-hidden />
        </div>
      </div>
    </button>
  )
}
