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

/** Ana sayfa kartında gösterilmeyecek “dahil olanlar” maddeleri (normalize edilmiş küçük harf anahtar). */
const HOME_CARD_EXCLUDED_INCLUDED_NORMALIZED = new Set([
  'profesyonel kaptanlı özel mürettebat',
  'yakıt (günlük standart kullanım dahilinde)',
])

function normalizeIncludedLine(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function includedLinesForHomeCard(lines: (string | null | undefined)[] | null | undefined): string[] {
  return (lines ?? [])
    .filter((line): line is string => Boolean(line?.trim()))
    .filter((line) => !HOME_CARD_EXCLUDED_INCLUDED_NORMALIZED.has(normalizeIncludedLine(line)))
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
  /** Üst başlık: tekne adı + yıl (kalın) */
  const boatTitle = [yacht.name, year ? `(${year})` : null].filter(Boolean).join(' ')
  /** Alt satır: konum (CMS locationTitle) */
  const locationLine = yacht.locationTitle?.trim() || ''
  const included = includedLinesForHomeCard(yacht.included).slice(0, 2)
  const maxExtraPills = yacht.sailingLicenceRequired?.trim() ? 2 : 3
  const badgeStrings = (yacht.badges ?? []).filter(Boolean).slice(0, maxExtraPills)

  const dailyOn = yacht.dailyRentalEnabled !== false
  const overnightOn = yacht.overnightRentalEnabled === true
  const cur = yacht.currency ?? 'TRY'

  const priceLabelClass =
    'text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500'
  const priceValueClass =
    'text-xl tabular-nums leading-none tracking-tight text-[#1e3a5f] sm:text-[22px] font-semibold'

  const overnightLine =
    overnightOn
      ? formatYachtMobileOvernightTotal(
          yacht.overnightTotalPrice ?? undefined,
          yacht.overnightNightPricing,
          cur,
        )
      : null

  const inner = (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.07)] transition-shadow duration-300 hover:shadow-[0_12px_36px_rgba(0,0,0,0.1)]">
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

      <div className="border-b border-zinc-100 px-4 pb-2.5 pt-3">
        {/* İsim / model ile fiyat aynı iki satırlık ızgarada — alt boşluk kapanır */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-px">
          {locationLine ? (
            <>
              <h3
                className="col-start-1 row-start-1 min-w-0 text-lg font-black leading-tight text-black"
                style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
              >
                {boatTitle}
              </h3>
              <p className="col-start-1 row-start-2 text-[13px] font-medium leading-snug text-zinc-500">
                {locationLine}
              </p>
            </>
          ) : (
            <h3
              className="col-start-1 row-span-2 row-start-1 min-w-0 self-start text-lg font-black leading-tight text-black"
              style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
            >
              {boatTitle}
            </h3>
          )}

          {dailyOn && yacht.priceFrom != null ? (
            <>
              <span className={`col-start-2 row-start-1 justify-self-end ${priceLabelClass}`}>
                Şu fiyattan
              </span>
              <span className={`col-start-2 row-start-2 justify-self-end ${priceValueClass}`}>
                {formatYachtMobilePrice(yacht.priceFrom, cur)}
              </span>
            </>
          ) : overnightOn ? (
            <>
              <span className={`col-start-2 row-start-1 justify-self-end ${priceLabelClass}`}>
                Konaklamalı
              </span>
              <span className={`col-start-2 row-start-2 justify-self-end ${priceValueClass}`}>
                {overnightLine?.trim() ? overnightLine : '—'}
              </span>
            </>
          ) : (
            <p className="col-start-2 row-span-2 row-start-1 max-w-[132px] justify-self-end self-center text-right text-[11px] font-medium leading-snug text-zinc-500">
              Teklif için iletişime geçin
            </p>
          )}
        </div>

        <div className="mt-2 border-t border-zinc-100/90 pt-2.5 flex flex-wrap gap-1.5">
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

        {specLine ? <p className="mt-2 text-[13px] leading-snug text-zinc-500">{specLine}</p> : null}
      </div>

      <div className="mt-auto flex flex-col gap-2 rounded-b-2xl bg-white px-4 pb-3 pt-2">
        {included.length > 0 ? (
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {included.map((line) => (
              <li key={line} className="flex items-start gap-1.5 text-[13px] font-semibold leading-snug text-[#2168b8]">
                <Check className="mt-0.5 size-3.5 shrink-0 stroke-[2.5]" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <span
          className="tour-card-cta hero-btn-shine relative w-full rounded-lg py-2.5 font-black uppercase text-white text-center text-sm md:text-[15px] flex items-center justify-center overflow-hidden"
          style={{ background: '#1e3a8a', boxShadow: '0 2px 10px rgba(30, 58, 138, 0.32)' }}
        >
          {VIEW_YACHT_CTA[locale] ?? VIEW_YACHT_CTA.tr}
        </span>
      </div>
    </article>
  )

  if (!href) {
    return <div className="opacity-90">{inner}</div>
  }

  return (
    <Link href={href} className="block h-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#1e3a5f] rounded-2xl">
      {inner}
    </Link>
  )
}
