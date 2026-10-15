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

/** Kart kabı anasayfadaki tur/yat kartlarıyla (TourCard.tsx,
    HomePopularYachtCard.tsx) birebir aynı: gerçek bir kenarlık (#e2e8f0) +
    katmanlı gölge, hover'da derinleşir. Önceki #f1f5f9 kenarlık ve tek katlı
    %6 gölge beyaz zeminle kaynaşıyordu.

    Tur kartından tek yapısal fark alt satırda: koyların fiyatı olmadığı için
    orada sola yazılacak bir şey yok; "Keşfet" butonu yarım boş bir satırda
    sağa yapışık durmasın diye tam genişlikte. */
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
      className="group flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white text-left shadow-[0_1px_2px_rgba(19,23,25,0.06),0_6px_20px_-4px_rgba(19,23,25,0.14)] transition-all duration-300 hover:-translate-y-1 hover:border-[#cbd5e1] hover:shadow-[0_2px_4px_rgba(19,23,25,0.06),0_18px_36px_-10px_rgba(19,23,25,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary,#2168b8)] focus-visible:ring-offset-2"
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

      <div className="shrink-0 px-5 pt-5 sm:px-6">
        <h2 className={`${styles.title} line-clamp-2`}>{title}</h2>
        {description?.trim() && (
          <p className={`${styles.description} mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-zinc-500`}>
            {description}
          </p>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-4 sm:px-6">
        <div className="mt-auto border-t border-[#f1f5f9] pt-4">
          <span
            className="flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-5 py-2.5 text-center text-[14px] font-extrabold uppercase tracking-wide text-white transition duration-200 group-hover:brightness-110 sm:text-[15px]"
            style={{ background: 'var(--primary, #2168b8)' }}
          >
            {detailHint}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              strokeWidth={2.2}
              aria-hidden
            />
          </span>
        </div>
      </div>
    </button>
  )
}
