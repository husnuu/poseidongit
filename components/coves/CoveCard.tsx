import Image from 'next/image'
import Link from 'next/link'
import { MapPin, ArrowRight, ArrowUpRight } from 'lucide-react'
import styles from './CoveCard.module.css'

export interface CoveCardProps {
  title: string
  description?: string | null
  imageUrl: string | null
  alt?: string | null
  locationTag?: string | null
  noImageLabel?: string
  detailHint?: string
  /** Koyun detay sayfası (/koylar/<slug>). */
  href: string
  ariaLabel?: string
  /** Kartın sırası (01, 02…) — görselin sağ altındaki küçük numara. */
  index?: number
}

/** Kartsız, fotoğraf ağırlıklı koy öğesi: yuvarlatılmış büyük görsel, altında
    başlık + iki satır açıklama + "Keşfet" metin bağlantısı. Gölge ve tam
    genişlikte mavi buton yok (sitedeki "çok kart" yoğunluğunu azaltmak için);
    tıklanabilirlik ipucu hover'da görselin büyümesi ve sağ alttaki yuvarlak
    ok düğmesi. */
export default function CoveCard({
  title,
  description,
  imageUrl,
  alt,
  locationTag,
  noImageLabel = 'Görsel yok',
  detailHint = 'Keşfet',
  href,
  ariaLabel,
  index,
}: CoveCardProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel || title}
      className="group flex h-full w-full flex-col rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary,#2168b8)] focus-visible:ring-offset-4"
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl bg-zinc-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={alt || title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">{noImageLabel}</div>
        )}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden
        />
        {locationTag?.trim() && (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[var(--secondary,#131719)] backdrop-blur-sm">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
            {locationTag}
          </span>
        )}
        {typeof index === 'number' && (
          <span className="absolute bottom-3 left-4 z-10 text-[13px] font-black tabular-nums tracking-wider text-white/90">
            {String(index + 1).padStart(2, '0')}
          </span>
        )}
        <span
          className="absolute bottom-3 right-3 z-10 inline-flex h-10 w-10 translate-y-1 items-center justify-center rounded-full bg-white text-[var(--secondary,#131719)] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100"
          aria-hidden
        >
          <ArrowUpRight className="h-5 w-5" strokeWidth={2.2} />
        </span>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <h3 className={`${styles.title} line-clamp-2`}>{title}</h3>
        {description?.trim() && (
          <p className={`${styles.description} mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-zinc-500`}>
            {description}
          </p>
        )}
        <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-extrabold uppercase tracking-wide text-[var(--primary,#2168b8)]">
          <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_2px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 group-hover:bg-[length:100%_2px]">
            {detailHint}
          </span>
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.4} aria-hidden />
        </span>
      </div>
    </Link>
  )
}
