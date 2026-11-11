import Image from 'next/image'
import { ArrowUpRight, BedDouble, Ruler, Users } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import type { HomePopularYachtCardData } from '@/components/home/HomePopularYachtCard'
import { EMBED_COPY } from '@/lib/embed/copy'
import { yachtTypeLabel } from '@/lib/yachtTypes'

/**
 * Widget yat kartı. Yat kiralama (tarih seçimi, teklif, kapora) sitede yapılır:
 * bağlantı dış sayfanın kendisini sitemize götürür (target="_top"), partner
 * bilgisi `?pref=` ile taşınır.
 */
export default function EmbedYachtCard({
  yacht,
  href,
  locale,
  showPrice,
}: {
  yacht: HomePopularYachtCardData
  href: string
  locale: SiteLocale
  showPrice: boolean
}) {
  const copy = EMBED_COPY[locale]
  const numberLocale = locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : locale === 'ru' ? 'ru-RU' : 'en-US'
  const specs = yacht.specifications
  const currency = yacht.currency === 'EUR' ? '€' : yacht.currency === 'USD' ? '$' : '₺'

  return (
    <a
      href={href}
      target="_top"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white outline-none transition-colors hover:border-[var(--primary,#2168b8)] focus-visible:ring-2 focus-visible:ring-[var(--primary,#2168b8)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
        {yacht.coverImageUrl && (
          <Image
            src={yacht.coverImageUrl}
            alt={yacht.coverImageAlt || yacht.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        {yacht.yachtType && yacht.yachtType !== 'other' && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#131719]">
            {yachtTypeLabel(yacht.yachtType, locale)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="m-0 line-clamp-2 text-[16px] font-bold leading-snug text-[#131719]">{yacht.name}</h3>
        {yacht.locationTitle && <p className="m-0 mt-1 text-[13px] text-zinc-500">{yacht.locationTitle}</p>}
        {(specs?.capacity || specs?.cabins || specs?.length) && (
          <p className="m-0 mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] font-medium text-zinc-600">
            {specs.capacity ? (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                {copy.guests(specs.capacity)}
              </span>
            ) : null}
            {specs.cabins ? (
              <span className="inline-flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                {specs.cabins}
              </span>
            ) : null}
            {specs.length ? (
              <span className="inline-flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                {specs.length}
              </span>
            ) : null}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          {showPrice && yacht.priceFrom ? (
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{copy.yachtFrom}</p>
              <p className="m-0 text-[18px] font-extrabold text-[#131719]">
                {yacht.priceFrom.toLocaleString(numberLocale)} {currency}
                <span className="ml-1 text-[12px] font-semibold text-zinc-400">{copy.perDay}</span>
              </p>
            </div>
          ) : (
            <span />
          )}
          <span className="inline-flex h-10 shrink-0 items-center gap-1 rounded-[10px] border border-[var(--primary,#2168b8)] px-3.5 text-[13px] font-bold text-[var(--primary,#2168b8)] transition-colors group-hover:bg-[var(--primary,#2168b8)] group-hover:text-white">
            {copy.viewYacht}
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </div>
    </a>
  )
}
