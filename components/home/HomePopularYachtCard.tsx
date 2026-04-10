import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { Check, Trophy } from 'lucide-react'
import YachtTypeGlyph from '@/components/yacht/YachtTypeGlyph'
import { yachtTypeLabel } from '@/lib/yachtTypes'
import type { YachtSpecifications } from '@/lib/yachtTypes'
import { formatYachtMobileOvernightTotal, formatYachtMobilePrice } from '@/lib/yachtFormat'

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
  'inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700'

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
  const year = yacht.specifications?.buildYear
  const subtitle = [yacht.name, year ? `(${year})` : null].filter(Boolean).join(' ')
  const titleLine = yacht.locationTitle?.trim() || yacht.name
  const included = (yacht.included ?? []).filter(Boolean).slice(0, 2)
  const maxExtraPills = yacht.sailingLicenceRequired?.trim() ? 2 : 3
  const badgeStrings = (yacht.badges ?? []).filter(Boolean).slice(0, maxExtraPills)

  const dailyOn = yacht.dailyRentalEnabled !== false
  const overnightOn = yacht.overnightRentalEnabled === true
  const cur = yacht.currency ?? 'TRY'

  let priceColumn: ReactNode = null
  if (dailyOn && yacht.priceFrom != null) {
    priceColumn = (
      <div className="flex flex-col items-end text-right">
        <span className="text-[11px] font-medium text-zinc-500">Şu fiyattan</span>
        <span className="text-lg font-black leading-tight text-black">
          {formatYachtMobilePrice(yacht.priceFrom, cur)}
        </span>
      </div>
    )
  } else if (overnightOn) {
    const line = formatYachtMobileOvernightTotal(
      yacht.overnightTotalPrice ?? undefined,
      yacht.overnightNightPricing,
      cur
    )
    priceColumn = (
      <div className="flex flex-col items-end text-right">
        <span className="text-[11px] font-medium text-zinc-500">Konaklamalı</span>
        <span className="text-lg font-black leading-tight text-black">{line}</span>
      </div>
    )
  }

  const inner = (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.11)]">
      <div className="relative aspect-[5/4] w-full shrink-0 overflow-hidden bg-zinc-100 sm:aspect-[4/3]">
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

      <div className="flex flex-1 flex-col border-b border-zinc-100 px-5 pb-4 pt-5">
        <h3
          className="text-xl font-black leading-snug text-black"
          style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
        >
          {titleLine}
        </h3>
        <p className="mt-1 text-sm font-medium text-zinc-500">{subtitle}</p>

        <div className="mt-3 flex flex-wrap gap-2">
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

        {specLine ? <p className="mt-3 text-sm text-zinc-500">{specLine}</p> : null}
      </div>

      <div className="flex flex-1 flex-col justify-end gap-4 rounded-b-3xl bg-zinc-50 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {included.length ? (
            included.map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm font-semibold text-[#2168b8]">
                <Check className="mt-0.5 size-4 shrink-0 stroke-[2.5]" aria-hidden />
                <span>{line}</span>
              </li>
            ))
          ) : (
            <li className="text-sm text-zinc-400">Dahil olanlar için yat kaydını düzenleyin.</li>
          )}
        </ul>
        {priceColumn ?? (
          <div className="text-right text-sm font-semibold text-zinc-500">Teklif için iletişime geçin</div>
        )}
      </div>
    </article>
  )

  if (!href) {
    return <div className="opacity-90">{inner}</div>
  }

  return (
    <Link href={href} className="block h-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#1e3a5f] rounded-3xl">
      {inner}
    </Link>
  )
}
