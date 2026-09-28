import Image from 'next/image'
import { MapPin } from 'lucide-react'

export interface CoveCardProps {
  title: string
  description?: string | null
  imageUrl: string | null
  alt?: string | null
  locationTag?: string | null
  noImageLabel?: string
}

/** Fotoğraf-öncelikli koy kartı — anasayfadaki RouteSection kartlarıyla aynı
    görsel dil (aspect-[4/3], alttan gradyan, üstte konum rozeti + başlık). */
export default function CoveCard({
  title,
  description,
  imageUrl,
  alt,
  locationTag,
  noImageLabel = 'Görsel yok',
}: CoveCardProps) {
  return (
    <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-100 shadow-[0_2px_10px_rgba(19,23,25,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_-10px_rgba(19,23,25,0.22)]">
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 p-5">
        {locationTag?.trim() && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/90">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
            {locationTag}
          </span>
        )}
        <h2
          className="mt-1 text-lg font-extrabold uppercase leading-tight text-white sm:text-xl"
          style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
        >
          {title}
        </h2>
        {description?.trim() && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-white/85">{description}</p>
        )}
      </div>
    </div>
  )
}
