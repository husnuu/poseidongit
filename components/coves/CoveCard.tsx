import Image from 'next/image'
import { MapPin, ArrowRight } from 'lucide-react'
import styles from './CoveCard.module.css'

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

/** Sitenin genelindeki tur/yat kartlarıyla (TourCard.tsx) birebir aynı görsel
    dil: görsel üstünde konum rozeti, koyu başlık (hover'da ana renge döner),
    açıklama, ve altta ayrılmış satırda dolgulu mavi "Keşfet" butonu.
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
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#f1f5f9] bg-white text-left shadow-[0_2px_8px_rgba(19,23,25,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_-8px_rgba(19,23,25,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary,#2168b8)] focus-visible:ring-offset-2"
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
        {locationTag?.trim() && (
          <div className="absolute left-3 top-3 z-10">
            <span
              className="inline-flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-sm backdrop-blur-sm"
              style={{ color: 'var(--primary, #2168b8)' }}
            >
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
              {locationTag}
            </span>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-4 sm:px-6">
        <h2 className={`${styles.title} line-clamp-2`}>{title}</h2>
        {description?.trim() && (
          <p className={`${styles.description} mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-zinc-500`}>
            {description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-end gap-3 border-t border-[#f1f5f9] pt-4">
          <span
            className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-5 py-2.5 text-center text-[13px] font-bold uppercase tracking-wide text-white transition duration-200 group-hover:scale-105 group-hover:brightness-110 sm:text-[14px]"
            style={{ background: 'var(--primary, #2168b8)' }}
          >
            {detailHint}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.2} aria-hidden />
          </span>
        </div>
      </div>
    </button>
  )
}
