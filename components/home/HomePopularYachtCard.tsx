'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { Heart, Star, Users, Calendar, BedDouble, Ruler, Info } from 'lucide-react'
import type { YachtSpecifications } from '@/lib/yachtTypes'
import { formatYachtMobileOvernightTotal } from '@/lib/yachtFormat'
import tourCardStyles from '@/components/tours/TourCard.module.css'
import { useWishlist } from '@/lib/wishlist/WishlistContext'

const ICON_MUTED = 'var(--muted, #81848b)'

export type HomePopularYachtCardData = {
  _id: string
  name: string
  slug: string | null
  locationTitle?: string | null
  locationSlug?: string | null
  coverImageUrl?: string | null
  coverImageAlt?: string | null
  yachtType?: string | null
  badges?: string[] | null
  included?: string[] | null
  specifications?: YachtSpecifications | null
  sailingLicenceRequired?: string | null
  isFeatured?: boolean | null
  rating?: number | null
  reviewCount?: number | null
  priceFrom?: number | null
  overnightTotalPrice?: number | null
  overnightNightPricing?: { price?: number | null }[] | null
  currency?: string | null
  dailyRentalEnabled?: boolean | null
  overnightRentalEnabled?: boolean | null
}

function detailHref(y: HomePopularYachtCardData, locale: SiteLocale = 'tr'): string | null {
  if (!y.slug) return null
  const path = y.locationSlug ? `/yat-kiralama/${y.locationSlug}/${y.slug}` : `/yat-kiralama/${y.slug}`
  return withLocalePath(locale, path)
}

const VIEW_YACHT_CTA: Record<SiteLocale, string> = {
  tr: 'Tekneyi görüntüle',
  en: 'View yacht',
  de: 'Yacht ansehen',
  ru: 'Смотреть яхту',
}

const FAVORITE_LABEL: Record<SiteLocale, string> = {
  tr: 'Favorilere ekle',
  en: 'Add to favorites',
  de: 'Zu Favoriten hinzufügen',
  ru: 'Добавить в избранное',
}

const FEATURED_LABEL: Record<SiteLocale, string> = {
  tr: 'Öne çıkan',
  en: 'Featured',
  de: 'Empfohlen',
  ru: 'Рекомендуем',
}

const PER_DAY_LABEL: Record<SiteLocale, string> = { tr: 'Günlük', en: 'Per day', de: 'Pro Tag', ru: 'В день' }
const OVERNIGHT_LABEL: Record<SiteLocale, string> = { tr: 'Konaklamalı', en: 'Overnight', de: 'Übernachtung', ru: 'С ночёвкой' }

const GUEST_CAPACITY_LABEL: Record<SiteLocale, string> = {
  tr: 'Yolcu Kapasitesi',
  en: 'Guest capacity',
  de: 'Gästekapazität',
  ru: 'Вместимость гостей',
}
const BUILT_YEAR_LABEL: Record<SiteLocale, string> = { tr: 'Yapım Yılı', en: 'Built year', de: 'Baujahr', ru: 'Год постройки' }
const CABINS_LABEL: Record<SiteLocale, string> = { tr: 'Kabin', en: 'Cabins', de: 'Kabinen', ru: 'Каюты' }
const LENGTH_LABEL: Record<SiteLocale, string> = { tr: 'Uzunluk', en: 'Length', de: 'Länge', ru: 'Длина' }

function specRows(spec: YachtSpecifications | null | undefined, locale: SiteLocale) {
  if (!spec) return []
  const rows: { icon: typeof Users; label: string; value: string }[] = []
  if (spec.capacity != null) rows.push({ icon: Users, label: GUEST_CAPACITY_LABEL[locale], value: String(spec.capacity) })
  if (spec.buildYear != null) rows.push({ icon: Calendar, label: BUILT_YEAR_LABEL[locale], value: String(spec.buildYear) })
  if (spec.cabins != null) rows.push({ icon: BedDouble, label: CABINS_LABEL[locale], value: String(spec.cabins) })
  const len = spec.length?.trim()
  if (len) rows.push({ icon: Ruler, label: LENGTH_LABEL[locale], value: len.includes('m') ? len : `${len}m` })
  return rows
}

export default function HomePopularYachtCard({
  yacht,
  locale = 'tr',
  /** 'stacked' (varsayılan, anasayfa): "Günlük" fiyatın altında ayrı satırda.
      'inline' (yat listeleme sayfası): "/ Günlük" fiyatın yanında aynı satırda. */
  priceLayout = 'stacked',
}: {
  yacht: HomePopularYachtCardData
  locale?: SiteLocale
  priceLayout?: 'stacked' | 'inline'
}) {
  const { isSaved, toggle } = useWishlist()
  const href = detailHref(yacht, locale)
  const rows = specRows(yacht.specifications ?? undefined, locale)
  const locationLine = yacht.locationTitle?.trim() || ''
  const ctaLabel = VIEW_YACHT_CTA[locale] ?? VIEW_YACHT_CTA.tr
  const titlePlain = yacht.name?.trim() || 'Yat'
  const rating = yacht.rating ?? 0
  const saved = isSaved(yacht._id)

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle({
      id: yacht._id,
      type: 'yacht',
      title: titlePlain,
      imageUrl: yacht.coverImageUrl,
      priceLabel: yacht.priceFrom != null ? `${yacht.priceFrom.toLocaleString('tr-TR')} ₺` : null,
      href: href ?? '#',
    })
  }

  const dailyOn = yacht.dailyRentalEnabled !== false
  const overnightOn = yacht.overnightRentalEnabled === true
  const cur = yacht.currency ?? 'TRY'

  const overnightLine =
    overnightOn
      ? formatYachtMobileOvernightTotal(
          yacht.overnightTotalPrice ?? undefined,
          yacht.overnightNightPricing,
          cur,
        )
      : null

  const priceBlock =
    dailyOn && yacht.priceFrom != null ? (
      priceLayout === 'inline' ? (
        <p className="leading-tight whitespace-nowrap">
          <span className="text-lg font-extrabold tabular-nums tracking-tight text-[#131719] sm:text-xl">
            {yacht.priceFrom.toLocaleString('tr-TR')} ₺
          </span>
          <span className="ml-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: ICON_MUTED }}>
            / {PER_DAY_LABEL[locale]}
          </span>
        </p>
      ) : (
        <p className="leading-tight">
          <span className="block whitespace-nowrap text-lg font-extrabold tabular-nums tracking-tight text-[#131719] sm:text-xl">
            {yacht.priceFrom.toLocaleString('tr-TR')} ₺
          </span>
          <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: ICON_MUTED }}>
            {PER_DAY_LABEL[locale]}
          </span>
        </p>
      )
    ) : overnightOn && overnightLine?.trim() ? (
      <p className="leading-tight">
        <span className="block text-[11px] font-semibold uppercase tracking-wide" style={{ color: ICON_MUTED }}>
          {OVERNIGHT_LABEL[locale]}
        </span>
        <span className="block whitespace-nowrap text-lg font-extrabold tabular-nums tracking-tight text-[#131719] sm:text-xl">
          {overnightLine}
        </span>
      </p>
    ) : null

  const ratingBadge =
    rating > 0 ? (
      <span className="mt-0.5 flex shrink-0 items-center gap-1">
        <Star className="h-4 w-4 fill-[#f5a623] text-[#f5a623]" />
        <span className="text-sm font-bold text-[#131719]">{rating.toFixed(1)}</span>
        {yacht.reviewCount != null && yacht.reviewCount > 0 && (
          <span className="text-xs font-medium" style={{ color: ICON_MUTED }}>
            ({yacht.reviewCount})
          </span>
        )}
      </span>
    ) : null

  const imageSection = (
    <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-zinc-100">
      {yacht.coverImageUrl ? (
        <Image
          src={yacht.coverImageUrl}
          alt={yacht.coverImageAlt || yacht.name || 'Yat görseli'}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-zinc-400">Görsel yok</div>
      )}
      {yacht.isFeatured && (
        <div
          className="absolute left-3 top-3 z-10 rounded-md px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1a1a1a] shadow-sm"
          style={{ background: '#ffc736' }}
        >
          {FEATURED_LABEL[locale]}
        </div>
      )}
      <button
        type="button"
        aria-label={FAVORITE_LABEL[locale]}
        aria-pressed={saved}
        onClick={handleToggleWishlist}
        className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition hover:bg-black/40 ${saved ? 'bg-white text-rose-500' : 'bg-black/25 text-white'}`}
      >
        <Heart className="h-[18px] w-[18px]" strokeWidth={2} fill={saved ? 'currentColor' : 'none'} aria-hidden />
      </button>
    </div>
  )

  const titleRow = (
    <div className="flex items-start justify-between gap-3">
      <h3 className={`${tourCardStyles.title} line-clamp-2 flex-1`}>{titlePlain}</h3>
      {ratingBadge}
    </div>
  )

  const licenceNote = yacht.sailingLicenceRequired?.trim() || null

  const metaSection = (
    <>
      {locationLine && (
        <p className={`${tourCardStyles.description} mt-1.5 flex items-center gap-1.5 text-sm leading-relaxed text-zinc-500`}>
          {locationLine}
          {licenceNote && (
            <Info
              className="h-[15px] w-[15px] shrink-0 text-[var(--primary,#2168b8)]"
              strokeWidth={2}
              aria-hidden
            >
              <title>{licenceNote}</title>
            </Info>
          )}
        </p>
      )}
      {rows.length > 0 && (
        <div className="mt-3 space-y-2">
          {rows.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className={`${tourCardStyles.metaRow} flex items-center gap-2 text-sm leading-snug`}
              style={{ color: ICON_MUTED }}
            >
              <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
              <span>
                {label}: <span className="font-semibold text-[#131719]">{value}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  )

  const articleClass =
    'group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#f1f5f9] bg-white shadow-[0_2px_8px_rgba(19,23,25,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_-8px_rgba(19,23,25,0.12)]'

  const ctaInner = (
    <span
      className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-center text-[12px] font-bold uppercase tracking-wide text-white transition duration-200 hover:scale-105 hover:brightness-110 sm:px-5 sm:text-[13px]"
      style={{ background: 'var(--primary, #2168b8)' }}
    >
      {ctaLabel}
    </span>
  )

  if (!href) {
    return (
      <article className={`${articleClass} opacity-90`}>
        {imageSection}
        <div className="px-5 pt-5 sm:px-6">
          {titleRow}
          {metaSection}
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-4 sm:px-6">
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#f1f5f9] pt-4">
            {priceBlock}
            {ctaInner}
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className={articleClass}>
      <Link
        href={href}
        className="flex shrink-0 flex-col text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#2168b8]"
        aria-label={`${titlePlain} — ${ctaLabel}`}
      >
        {imageSection}
        <div className="px-5 pt-5 sm:px-6">
          {titleRow}
          {metaSection}
        </div>
      </Link>

      <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-4 sm:px-6">
        <Link
          href={href}
          className="mt-auto flex items-center justify-between gap-3 border-t border-[#f1f5f9] pt-4 text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#2168b8]"
          aria-label={`${ctaLabel}: ${titlePlain}`}
        >
          {priceBlock}
          {ctaInner}
        </Link>
      </div>
    </article>
  )
}
