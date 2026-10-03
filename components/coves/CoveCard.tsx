import Image from 'next/image'
import { MapPin, ArrowUpRight } from 'lucide-react'

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

/** Fotoğraf-öncelikli koy kartı — artık tıklanabilir: tıklanınca tam açıklama bir
    modalda açılır (bkz. CoveDetailModal). Kart üstündeki metin sadece bir özet;
    tam metin her zaman modalda, okunaklı beyaz zemin üzerinde gösterilir. */
export default function CoveCard({
  title,
  description,
  imageUrl,
  alt,
  locationTag,
  noImageLabel = 'Görsel yok',
  detailHint = 'Devamını oku',
  onClick,
  ariaLabel,
}: CoveCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || title}
      className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-100 text-left shadow-[0_2px_10px_rgba(19,23,25,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_-10px_rgba(19,23,25,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary,#2168b8)] focus-visible:ring-offset-2"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt || title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">{noImageLabel}</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/0" aria-hidden />

      <span
        className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-white"
        aria-hidden
      >
        <ArrowUpRight className="h-[18px] w-[18px]" strokeWidth={2.25} />
      </span>

      <div className="absolute inset-x-0 bottom-0 p-5">
        {locationTag?.trim() && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/90">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
            {locationTag}
          </span>
        )}
        <h2
          className="mt-1 text-lg font-extrabold uppercase leading-tight text-white sm:text-xl"
          style={{ fontFamily: 'var(--font-family-title, var(--font-family))', textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}
        >
          {title}
        </h2>
        {description?.trim() && (
          <p
            className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-white/90"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.35)' }}
          >
            {description}
          </p>
        )}
        <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-white underline decoration-white/50 underline-offset-2 opacity-90 transition-opacity group-hover:opacity-100">
          {detailHint}
        </span>
      </div>
    </button>
  )
}
