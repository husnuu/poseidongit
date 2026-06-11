'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import type { LucideIcon } from 'lucide-react'
import { BedDouble, Calendar, MapPin, Ruler, Users } from 'lucide-react'
import YachtTypeGlyph from '@/components/yacht/YachtTypeGlyph'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { yachtTypeLabel, type YachtSpecifications } from '@/lib/yachtTypes'
import { formatYachtMobilePrice } from '@/lib/yachtFormat'

/** Lacivert ikon rengi (kart meta) */
const ICON_NAVY = 'text-[#1e3a5f]'

export type YachtListItem = {
  _id: string
  name: string
  slug: string
  shortDescription?: string | null
  coverImageUrl?: string | null
  coverImageAlt?: string | null
  locationTitle?: string | null
  locationSlug?: string | null
  marina?: string | null
  priceFrom?: number | null
  overnightTotalPrice?: number | null
  overnightNightPricing?: { price?: number | null }[] | null
  currency?: string | null
  dailyRentalEnabled?: boolean | null
  overnightRentalEnabled?: boolean | null
  yachtType?: string | null
  isFeatured?: boolean | null
  specifications?: YachtSpecifications | null
}

function detailHref(y: YachtListItem, locale: SiteLocale = 'tr'): string | null {
  if (!y.slug) return null
  const path = y.locationSlug
    ? `/yat-kiralama/${y.locationSlug}/${y.slug}`
    : `/yat-kiralama/${y.slug}`
  return withLocalePath(locale, path)
}

function MetaLabeled({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className={`size-5 flex-shrink-0 ${ICON_NAVY}`} strokeWidth={2} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-xs font-bold uppercase tracking-wide text-black/45">{label}</span>
        <span className="text-[15px] font-extrabold text-black/90 leading-snug">{value}</span>
      </div>
    </div>
  )
}

interface YachtCardProps {
  yacht: YachtListItem
  locale?: SiteLocale
}

export default function YachtCard({ yacht, locale = 'tr' }: YachtCardProps) {
  const href = detailHref(yacht, locale)
  const typeLabel = yachtTypeLabel(yacht.yachtType ?? undefined)
  const locLine = [yacht.locationTitle, yacht.marina].filter(Boolean).join(' · ')
  const spec = yacht.specifications
  const lengthVal = spec?.length?.trim() || null
  const cabinsVal = spec?.cabins != null ? String(spec.cabins) : null
  const capacityVal = spec?.capacity != null ? String(spec.capacity) : null
  const yearVal = spec?.buildYear != null ? String(spec.buildYear) : null

  const dailyOn = yacht.dailyRentalEnabled !== false

  const content = (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
        {yacht.coverImageUrl ? (
          <Image
            src={yacht.coverImageUrl}
            alt={yacht.coverImageAlt || yacht.name || 'Yat görseli'}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm">
            Görsel yok
          </div>
        )}
        {yacht.isFeatured && (
          <div
            className="absolute left-0 top-4 z-10 flex items-center pl-3 pr-6 py-1.5 text-white text-xs font-bold uppercase tracking-wide"
            style={{
              background: 'linear-gradient(90deg, #1e3a5f 0%, #152a47 100%)',
              clipPath: 'polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            Öne çıkan
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-6 md:p-8">
        <h3
          className="font-black text-xl md:text-2xl uppercase leading-tight line-clamp-2 mb-4 text-[#1e3a5f]"
          style={{ fontFamily: 'var(--font-family)' }}
        >
          {yacht.name}
        </h3>

        <div className="space-y-3.5 mb-5">
          <div className="flex items-center gap-3">
            <span className={`inline-flex size-5 flex-shrink-0 items-center justify-center ${ICON_NAVY}`} aria-hidden>
              <YachtTypeGlyph yachtType={yacht.yachtType} className="size-5 shrink-0" />
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wide text-black/45">Yat tipi:</span>
              <span className="text-[15px] font-extrabold text-black/90 leading-snug">{typeLabel}</span>
            </div>
          </div>
          {locLine ? <MetaLabeled icon={MapPin} label="Konum:" value={locLine} /> : null}
          {capacityVal ? <MetaLabeled icon={Users} label="Yolcu Kapasitesi:" value={capacityVal} /> : null}
          {yearVal ? <MetaLabeled icon={Calendar} label="Yapım Yılı:" value={yearVal} /> : null}
          {cabinsVal ? <MetaLabeled icon={BedDouble} label="Kabin:" value={cabinsVal} /> : null}
          {lengthVal ? <MetaLabeled icon={Ruler} label="Uzunluk:" value={lengthVal} /> : null}
        </div>

        {dailyOn && yacht.priceFrom != null ? (
          <p className="text-lg font-extrabold uppercase mt-auto mb-4 m-0" style={{ color: 'var(--secondary)' }}>
            {formatYachtMobilePrice(yacht.priceFrom, yacht.currency ?? 'TRY')}
          </p>
        ) : null}

        <span className="hero-primary-btn-wrap tour-card-cta-shimmer yacht-card-cta-edge mt-auto w-full max-w-full rounded-xl p-[2px] flex">
          <span className="hero-primary-inner hero-btn-shine yacht-card-cta-inner w-full rounded-[10px] bg-[#1e3a8a] py-2.5 md:py-3 font-black uppercase text-white text-center text-base md:text-[17px] flex items-center justify-center overflow-hidden transition hover:brightness-110 ring-1 ring-inset ring-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]">
            İncele
          </span>
        </span>
      </div>
    </>
  )

  const wrapperClassName = 'flex flex-col h-full block'
  return (
    <article className="h-full flex flex-col rounded-2xl overflow-hidden bg-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] border border-black/5 transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
      {href ? (
        <a href={href} className={wrapperClassName}>
          {content}
        </a>
      ) : (
        <div className={`${wrapperClassName} opacity-90`}>{content}</div>
      )}
    </article>
  )
}
