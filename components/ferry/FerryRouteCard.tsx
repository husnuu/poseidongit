import Image from 'next/image'
import Link from 'next/link'
import { Clock, Ship } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { getFerryPageUiStrings } from '@/lib/i18n/strings/ferryPage'
import { adultFromFare, type FerryAgeTier } from '@/components/ferry/ferryTypes'
import { SANITY_DISPLAY_IMAGE_PROPS } from '@/lib/sanityImage'
import styles from './FerryRouteCard.module.css'

const ICON_MUTED = 'var(--muted, #81848b)'

export type FerryRouteListItem = {
  _id: string
  title: string | null
  slug: string | null
  cardDescription?: string | null
  coverImageUrl?: string | null
  coverImageAlt?: string | null
  durationLabel?: string | null
  routeLabel?: string | null
  departurePort?: string | null
  arrivalPort?: string | null
  currency?: string | null
  ageTiers?: FerryAgeTier[] | null
}

function formatPriceFrom(price: number | null | undefined, currency: string, numberLocale: string): string {
  if (price == null) return ''
  return `${price.toLocaleString(numberLocale)} ${currency}`
}

interface FerryRouteCardProps {
  route: FerryRouteListItem
  locale?: SiteLocale
}

export default function FerryRouteCard({ route, locale = 'tr' }: FerryRouteCardProps) {
  const ui = getFerryPageUiStrings(locale)
  const href = route.slug ? withLocalePath(locale, `/feribot/${route.slug}`) : null
  const titlePlain = route.title?.trim() || ui.defaultTitle
  const currency = route.currency?.trim() || '€'
  const fromPrice = adultFromFare(route.ageTiers ?? [])
  const priceFormatted = formatPriceFrom(fromPrice, currency, ui.numberLocale)
  const routeText = route.routeLabel?.trim() || (route.departurePort && route.arrivalPort ? `${route.departurePort} ↔ ${route.arrivalPort}` : null)

  const imageSection = (
    <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-zinc-100">
      {route.coverImageUrl ? (
        <Image
          src={route.coverImageUrl}
          alt={route.coverImageAlt || titlePlain}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          {...SANITY_DISPLAY_IMAGE_PROPS}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">{ui.cardNoImage}</div>
      )}
    </div>
  )

  const metaRows = (route.durationLabel || routeText) && (
    <div className="mt-2.5 space-y-1.5">
      {route.durationLabel && (
        <div className={`${styles.metaRow} flex items-center gap-2 text-[13px] leading-snug`} style={{ color: ICON_MUTED }}>
          <Clock className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          <span>{route.durationLabel}</span>
        </div>
      )}
      {routeText && (
        <div className={`${styles.metaRow} flex items-center gap-2 text-[13px] leading-snug`} style={{ color: ICON_MUTED }}>
          <Ship className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          <span>{routeText}</span>
        </div>
      )}
    </div>
  )

  const ctaInner = (
    <span
      className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-5 py-2.5 text-center text-[13px] font-bold uppercase tracking-wide text-white transition duration-200 hover:scale-105 hover:brightness-110 sm:text-[14px]"
      style={{ background: 'var(--primary, #2168b8)' }}
    >
      {ui.viewRouteButton}
    </span>
  )

  const priceBlock = fromPrice != null && (
    <p className="leading-tight">
      <span className="block whitespace-nowrap text-[20px] font-extrabold tabular-nums tracking-tight text-[#131719] sm:text-[22px]">
        {priceFormatted}
      </span>
      <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: ICON_MUTED }}>
        {ui.perPersonLabel}
      </span>
    </p>
  )

  const body = (
    <>
      <h3 className={`${styles.title} line-clamp-2`}>{route.title}</h3>
      {route.cardDescription && (
        <p className={`${styles.description} mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-zinc-500`}>
          {route.cardDescription}
        </p>
      )}
      {metaRows}
    </>
  )

  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#f1f5f9] bg-white shadow-[0_2px_8px_rgba(19,23,25,0.06)] transition-shadow duration-300 hover:shadow-[0_12px_28px_-8px_rgba(19,23,25,0.12)]">
      {href ? (
        <>
          <Link
            href={href}
            className="flex shrink-0 flex-col text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#2168b8]"
            aria-label={`${titlePlain} — ${ui.viewRouteButton}`}
          >
            {imageSection}
            <div className="px-5 pt-5 sm:px-6">{body}</div>
          </Link>
          <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-4 sm:px-6">
            <Link
              href={href}
              className="mt-auto flex items-center justify-between gap-3 border-t border-[#f1f5f9] pt-4 text-inherit no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#2168b8]"
              aria-label={`${ui.viewRouteButton}: ${titlePlain}`}
            >
              {priceBlock}
              {ctaInner}
            </Link>
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col opacity-90">
          <div className="shrink-0">
            {imageSection}
            <div className="px-5 pt-5 sm:px-6">{body}</div>
          </div>
          <div className="flex flex-1 flex-col px-5 pb-5 pt-4 sm:px-6">
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#f1f5f9] pt-4">
              {priceBlock}
              {ctaInner}
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
