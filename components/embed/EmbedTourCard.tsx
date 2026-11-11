import Image from 'next/image'
import Link from 'next/link'
import { Clock, MapPin, Star } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import type { TourListItem } from '@/components/tours/TourCard'
import { EMBED_COPY } from '@/lib/embed/copy'

function discounted(price: number, percentage: number): number {
  return Math.round((price * (1 - percentage / 100)) / 10) * 10
}

/** Widget tur kartı: favori/paylaş yok, tüm kart widget içindeki tur sayfasına gider. */
export default function EmbedTourCard({
  tour,
  href,
  locale,
  showPrice,
}: {
  tour: TourListItem
  href: string
  locale: SiteLocale
  showPrice: boolean
}) {
  const copy = EMBED_COPY[locale]
  const numberLocale = locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : locale === 'ru' ? 'ru-RU' : 'en-US'
  const discount = tour.cardDiscount?.enabled && tour.cardDiscount.percentage ? tour.cardDiscount.percentage : null
  const price = tour.priceFrom != null ? (discount ? discounted(tour.priceFrom, discount) : tour.priceFrom) : null
  const rating = tour.rating ?? 0

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--embed-radius,14px)] border border-zinc-200 bg-white outline-none transition-colors hover:border-[var(--primary,#2168b8)] focus-visible:ring-2 focus-visible:ring-[var(--primary,#2168b8)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
        {tour.coverImageUrl && (
          <Image
            src={tour.coverImageUrl}
            alt={tour.coverImageAlt || tour.title || ''}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        {discount && (
          <span className="absolute left-3 top-3 rounded-md bg-[#e11d48] px-2 py-1 text-[12px] font-bold text-white">
            -{discount}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="m-0 line-clamp-2 text-[16px] font-bold leading-snug text-[#131719]">{tour.title}</h3>
          {rating > 0 && (
            <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-[13px] font-bold text-[#131719]">
              <Star className="h-3.5 w-3.5 fill-[#f5a623] text-[#f5a623]" aria-hidden />
              {rating.toFixed(1)}
            </span>
          )}
        </div>
        {(tour.durationLabel || tour.departureLabel) && (
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-zinc-500">
            {tour.durationLabel && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {tour.durationLabel}
              </span>
            )}
            {tour.departureLabel && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {tour.departureLabel}
              </span>
            )}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          {showPrice && price != null ? (
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                {tour.privateTour ? copy.groupPrice : copy.perPerson}
              </p>
              <p className="m-0 text-[18px] font-extrabold text-[#131719]">
                {discount && tour.priceFrom != null && (
                  <span className="mr-1.5 text-[13px] font-semibold text-zinc-400 line-through">
                    {tour.priceFrom.toLocaleString(numberLocale)} ₺
                  </span>
                )}
                {price.toLocaleString(numberLocale)} ₺
              </p>
            </div>
          ) : (
            <span />
          )}
          <span className="inline-flex h-10 shrink-0 items-center rounded-[var(--embed-radius,10px)] bg-[var(--primary,#2168b8)] px-4 text-[13px] font-bold text-white">
            {copy.book}
          </span>
        </div>
      </div>
    </Link>
  )
}
