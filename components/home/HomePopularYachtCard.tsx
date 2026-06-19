import Image from 'next/image'
import Link from 'next/link'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { Trophy } from 'lucide-react'
import YachtTypeGlyph from '@/components/yacht/YachtTypeGlyph'
import { yachtTypeLabel } from '@/lib/yachtTypes'
import type { YachtSpecifications } from '@/lib/yachtTypes'
import { formatYachtMobileOvernightTotal } from '@/lib/yachtFormat'
import tourCardStyles from '@/components/tours/TourCard.module.css'

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

function specSummary(spec: YachtSpecifications | null | undefined): string | null {
  if (!spec) return null
  const parts: string[] = []
  if (spec.capacity != null) parts.push(`${spec.capacity} kişi`)
  if (spec.cabins != null) parts.push(`${spec.cabins} kabin`)
  const len = spec.length?.trim()
  if (len) parts.push(len.includes('m') ? len : `${len} m`)
  return parts.length ? parts.join(' · ') : null
}

const PILL =
  'inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-700'

const VIEW_YACHT_CTA: Record<SiteLocale, string> = {
  tr: 'Tekneyi incele',
  en: 'View yacht',
  de: 'Yacht ansehen',
}

function YachtCardCta({ label }: { label: string }) {
  return (
    <span className="hero-primary-btn-wrap tour-card-cta-shimmer flex w-full rounded-2xl p-[2px]">
      <span
        className="hero-primary-inner hero-btn-shine flex w-full min-h-[50px] items-center justify-center overflow-hidden rounded-[14px] py-3.5 text-center text-[15px] font-black uppercase tracking-[0.05em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.42),inset_0_-1px_0_rgba(15,23,42,0.2)] ring-1 ring-inset ring-white/25 transition hover:brightness-[1.05] sm:min-h-[54px] sm:rounded-[15px] sm:py-4 sm:text-[17px]"
        style={{
          background:
            'linear-gradient(135deg, #5b7fd6 0%, #3d5eb8 28%, #1e3a8a 55%, #152d66 78%, #0f2249 100%)',
        }}
      >
        {label}
      </span>
    </span>
  )
}

export default function HomePopularYachtCard({
  yacht,
  locale = 'tr',
}: {
  yacht: HomePopularYachtCardData
  locale?: SiteLocale
}) {
  const href = detailHref(yacht, locale)
  const typeLabel = yachtTypeLabel(yacht.yachtType ?? undefined)
  const specLine = specSummary(yacht.specifications ?? undefined)
  const locationLine = yacht.locationTitle?.trim() || ''
  const maxExtraPills = yacht.sailingLicenceRequired?.trim() ? 2 : 3
  const badgeStrings = (yacht.badges ?? []).filter(Boolean).slice(0, maxExtraPills)
  const ctaLabel = VIEW_YACHT_CTA[locale] ?? VIEW_YACHT_CTA.tr
  const titlePlain = yacht.name?.trim() || 'Yat'

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
      <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0 leading-tight">
        <span className="text-[11px] font-medium text-zinc-500 sm:text-xs">Şu fiyattan</span>
        <span className="text-xl font-bold tabular-nums tracking-tight text-zinc-900 sm:text-2xl">
          {yacht.priceFrom.toLocaleString('tr-TR')} ₺
        </span>
        <span className="text-[11px] font-medium text-zinc-500 sm:text-xs">/ gün</span>
      </p>
    ) : overnightOn && overnightLine?.trim() ? (
      <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0 leading-tight">
        <span className="text-[11px] font-medium text-zinc-500 sm:text-xs">Konaklamalı</span>
        <span className="text-xl font-bold tabular-nums tracking-tight text-zinc-900 sm:text-2xl">
          {overnightLine}
        </span>
      </p>
    ) : null

  const imageSection = (
    <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-zinc-100">
      {yacht.coverImageUrl ? (
        <Image
          src={yacht.coverImageUrl}
          alt={yacht.coverImageAlt || yacht.name || 'Yat görseli'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-zinc-400">Görsel yok</div>
      )}
      {yacht.isFeatured ? (
        <div
          className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-rose-600 shadow-sm backdrop-blur-sm"
          aria-label="Öne çıkan"
        >
          <Trophy className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
          Öne çıkan
        </div>
      ) : null}
    </div>
  )

  const metaSection = (
    <>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={PILL}>
          <YachtTypeGlyph yachtType={yacht.yachtType} className="size-3.5 shrink-0 text-zinc-600" />
          {typeLabel}
        </span>
        {yacht.sailingLicenceRequired?.trim() ? (
          <span className={PILL} title={yacht.sailingLicenceRequired}>
            Ehliyet / belge
          </span>
        ) : null}
        {badgeStrings.map((b, i) => (
          <span key={`${b}-${i}`} className={PILL}>
            {b}
          </span>
        ))}
      </div>
      {specLine ? (
        <p className={`${tourCardStyles.metaRow} mt-3 text-sm font-semibold leading-snug text-zinc-800 sm:text-[15px]`}>
          {specLine}
        </p>
      ) : null}
    </>
  )

  const articleClass =
    'flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-[0_25px_50px_-12px_rgba(15,23,42,0.09),0_12px_28px_-10px_rgba(15,23,42,0.06)] transition-shadow duration-300 hover:shadow-[0_32px_64px_-14px_rgba(15,23,42,0.11),0_16px_32px_-10px_rgba(15,23,42,0.07)]'

  if (!href) {
    return (
      <article className={`${articleClass} opacity-90`}>
        {imageSection}
        <div className="px-5 pt-5 sm:px-6">
          <h3 className={`${tourCardStyles.title} line-clamp-2`}>{titlePlain}</h3>
          {locationLine ? (
            <p className={`${tourCardStyles.description} mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-600 sm:text-[15px]`}>
              {locationLine}
            </p>
          ) : null}
          {metaSection}
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-3 sm:px-6">
          <div className="mt-auto flex flex-col gap-3 pt-2">
            {priceBlock}
            <YachtCardCta label={ctaLabel} />
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className={articleClass}>
      <Link
        href={href}
        className="flex shrink-0 flex-col text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#1e3a8a]"
        aria-label={`${titlePlain} — ${ctaLabel}`}
      >
        {imageSection}
        <div className="px-5 pt-5 sm:px-6">
          <h3 className={`${tourCardStyles.title} line-clamp-2`}>{titlePlain}</h3>
          {locationLine ? (
            <p className={`${tourCardStyles.description} mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-600 sm:text-[15px]`}>
              {locationLine}
            </p>
          ) : null}
          {metaSection}
        </div>
      </Link>

      <Link
        href={href}
        className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-3 text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#1e3a8a] sm:px-6"
        aria-label={`${ctaLabel}: ${titlePlain}`}
      >
        <div className="mt-auto flex flex-col gap-3 pt-2">
          {priceBlock}
          <YachtCardCta label={ctaLabel} />
        </div>
      </Link>
    </article>
  )
}
