import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronDown, ChevronLeft, Clock, MapPin, Star } from 'lucide-react'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import { getActivePartnerBySlug } from '@/lib/partner/partners'
import { getTour, buildGalleryHeroImages, buildItineraryTimelineItems } from '@/lib/sanity/getTourFull'
import type { TourForBooking } from '@/lib/sanity/bookingTypes'
import { EMBED_COPY } from '@/lib/embed/copy'
import { embedListPath, embedQuery, parseEmbedOptions } from '@/lib/embed/options'
import HighlightsDetailsRow from '@/components/HighlightsDetailsRow'
import ItineraryTimeline from '@/components/ItineraryTimeline'
import TourDescription from '@/components/TourDescription'
import IncludedNotIncluded from '@/components/IncludedNotIncluded'
import ScrollReveal from '@/components/ui/ScrollReveal'
import EmbedBooking from '@/components/embed/EmbedBooking'
import EmbedFooter from '@/components/embed/EmbedFooter'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ locale: string; partner: string; tourSlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Widget: tek tur — kısa tur özeti, rezervasyon formu ve (kapalı) tur detayları.
 * Ödeme adımında misafir sitemize yönlendirilir (bkz. BookingWizardModal).
 */
export default async function EmbedTourPage({ params, searchParams }: PageProps) {
  const { locale: loc, partner: partnerSlug, tourSlug } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale: SiteLocale = loc
  const opts = parseEmbedOptions(await searchParams)

  const [partner, tour] = await Promise.all([
    getActivePartnerBySlug(partnerSlug).catch(() => null),
    getTour(decodeURIComponent(tourSlug), locale),
  ])
  if (!partner || !tour) notFound()

  const tourUi = getTourPageUi(locale)
  const copy = EMBED_COPY[locale]
  const cover = buildGalleryHeroImages(tour, tourUi)[0]
  const itineraryItems = buildItineraryTimelineItems(tour)
  const rating = tour.rating ?? 0
  const duration = tour.quickFacts?.durationText
  const meeting = tour.quickFacts?.meetingLocation

  return (
    <div style={opts.color ? ({ '--primary': opts.color } as React.CSSProperties) : undefined}>
      <div className="mx-auto max-w-[760px] px-3 pt-3 sm:px-4">
        {!opts.single && (
          <Link
            href={embedListPath(locale, partner.slug) + embedQuery(opts)}
            className="mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-zinc-500 hover:text-[var(--primary,#2168b8)]"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {copy.allTours}
          </Link>
        )}

        <header className="mb-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white sm:flex">
          {cover && (
            <div className="relative aspect-[16/9] w-full shrink-0 bg-zinc-100 sm:aspect-auto sm:w-[40%]">
              <Image src={cover.src} alt={cover.alt} fill sizes="(max-width: 640px) 100vw, 320px" className="object-cover" priority />
            </div>
          )}
          <div className="flex min-w-0 flex-col justify-center p-4 sm:p-5">
            <h1 className="m-0 text-[19px] font-extrabold leading-snug text-[#131719] sm:text-[21px]">{tour.title}</h1>
            <p className="m-0 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-zinc-500">
              {rating > 0 && (
                <span className="inline-flex items-center gap-1 font-bold text-[#131719]">
                  <Star className="h-3.5 w-3.5 fill-[#f5a623] text-[#f5a623]" aria-hidden />
                  {rating.toFixed(1)}
                  {tour.reviewCount ? <span className="font-medium text-zinc-400">({tour.reviewCount})</span> : null}
                </span>
              )}
              {duration && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {duration}
                </span>
              )}
              {meeting && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {meeting}
                </span>
              )}
            </p>
            {tour.shortDescription && (
              <p className="m-0 mt-2.5 line-clamp-3 text-[14px] leading-relaxed text-zinc-600">{tour.shortDescription}</p>
            )}
          </div>
        </header>
      </div>

      <EmbedBooking tour={tour as TourForBooking} locale={locale} partnerSlug={partner.slug} />

      <div className="mx-auto max-w-[760px] px-3 sm:px-4">
        <details className="group mt-3 rounded-2xl border border-zinc-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-[15px] font-bold text-[#131719] [&::-webkit-details-marker]:hidden">
            {copy.bookingSummary}
            <ChevronDown className="h-5 w-5 text-zinc-400 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="border-t border-zinc-100 px-4 pb-2 pt-5">
            {/* Bu bölümlerin öğeleri ScrollReveal görünür olana kadar şeffaf (tur sayfasıyla aynı). */}
            <ScrollReveal>
              <HighlightsDetailsRow
                highlights={tour.highlights}
                tourDetails={tour.tourDetails}
                quickFacts={tour.quickFacts}
                tourUi={tourUi}
              />
            </ScrollReveal>
            <ItineraryTimeline items={itineraryItems} sectionTitle={tourUi.itineraryTitle} locale={locale} />
            <TourDescription description={tour.description} locale={locale} />
            <ScrollReveal>
              <IncludedNotIncluded included={tour.included} notIncluded={tour.notIncluded} tourUi={tourUi} />
            </ScrollReveal>
          </div>
        </details>
      </div>
      <EmbedFooter locale={locale} />
    </div>
  )
}
