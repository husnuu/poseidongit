import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { client, urlFor } from '@/lib/sanity'
import { siteFooterQuery } from '@/lib/queries'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { withLocalePath } from '@/lib/i18n/paths'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import { absoluteUrl } from '@/lib/seo'
import { alternateLanguageAbsoluteUrls } from '@/lib/seo/alternateLanguages'
import PhotoGrid from '@/components/PhotoGrid'
import { TourHeader } from '@/components/TourHeader'
import HighlightsDetailsRow from '@/components/HighlightsDetailsRow'
import ItineraryTimeline from '@/components/ItineraryTimeline'
import TourReelsRail from '@/components/tour/TourReelsRail'
import TourDescription from '@/components/TourDescription'
import IncludedNotIncluded from '@/components/IncludedNotIncluded'
import HostBlock from '@/components/HostBlock'
import FAQAccordion from '@/components/FAQAccordion'
import WhereSection from '@/components/tour/WhereSection'
import ReviewsSection from '@/components/ReviewsSection'
import TourBookingSidebar from '@/components/booking/TourBookingSidebar'
import type { TourForBooking } from '@/lib/sanity/bookingTypes'
import {
  getTour,
  buildGalleryHeroImages,
  buildItineraryTimelineItems,
  getVideoEmbedUrl,
} from '@/lib/sanity/getTourFull'

/** Rezervasyon sayfaları build'de üretilir (linklerdeki slug: o dilin Sanity slug'ı, yoksa Türkçe). */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const slugs = await client
    .fetch<(string | null)[]>(
      `*[_type == "tour" && defined(slug.current)]{
        "s": select(
          $locale == "en" => coalesce(translations.en.slug.current, slug.current),
          $locale == "de" => coalesce(translations.de.slug.current, slug.current),
          $locale == "ru" => coalesce(translations.ru.slug.current, slug.current),
          slug.current
        )
      }.s`,
      { locale: params.locale }
    )
    .catch(() => [] as (string | null)[])
  return slugs.filter((s): s is string => Boolean(s)).map((tourSlug) => ({ tourSlug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tourSlug: string }>
}): Promise<Metadata> {
  const { tourSlug, locale: loc } = await params
  if (!isSiteLocale(loc)) return {}
  const locale = loc as SiteLocale
  const tourUi = getTourPageUi(locale)
  const tour = await getTour(tourSlug, locale)
  if (!tour) return {}

  const title = `${tour.title}${tourUi.metaTitleSuffix}`
  // Bu sayfa tur detay sayfasıyla aynı içeriği taşıyor; arama motorları için
  // canonical'ı asıl tur sayfasına verip yinelenen içerik sorununu önlüyoruz.
  const canonical = absoluteUrl(withLocalePath(locale, `/tur/${tour.slug}`))

  return {
    title,
    description:
      tour.shortDescription?.trim()?.slice(0, 160) || tourUi.metaDescriptionFallback(tour.title),
    // hreflang de canonical ile aynı hedefi (tur sayfası) göstersin — ikisi
    // tutarsız olursa Google canonical'ı görmezden gelebilir.
    alternates: { canonical, languages: alternateLanguageAbsoluteUrls(`/tur/${tour.slug}`) },
    robots: { index: false, follow: true },
  }
}

export default async function RezervasyonPage({
  params,
}: {
  params: Promise<{ locale: string; tourSlug: string }>
}) {
  const { tourSlug, locale: loc } = await params
  if (!tourSlug || typeof tourSlug !== 'string') notFound()
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale
  const tourUi = getTourPageUi(locale)

  const tour = await getTour(tourSlug, locale)
  if (!tour) notFound()

  let whatsappUrl: string | null = null
  try {
    const footer = await client.fetch<{ contact?: { chatValue?: string | null } | null } | null>(
      siteFooterQuery,
      {},
      { useCdn: false }
    )
    whatsappUrl = buildWhatsAppLink(footer?.contact?.chatValue ?? null)
  } catch {
    whatsappUrl = null
  }

  const videoEmbedUrl = tour.tourVideo ? getVideoEmbedUrl(tour.tourVideo) : null
  const galleryHeroImages = buildGalleryHeroImages(tour, tourUi)
  const itineraryTimelineItems = buildItineraryTimelineItems(tour)

  const reelsSlides =
    tour.reelsSection?.enabled && Array.isArray(tour.reelsSection.items)
      ? tour.reelsSection.items
          .filter((it) => typeof it?.videoUrl === 'string' && it.videoUrl.trim().length > 0)
          .map((it) => ({
            videoUrl: it.videoUrl!.trim(),
            posterUrl: it.poster?.asset
              ? urlFor(it.poster.asset).width(720).height(1280).quality(80).auto('format').url()
              : it.poster?.url?.trim() || undefined,
          }))
      : []

  const tourHref = withLocalePath(locale, `/tur/${tour.slug}`)
  const rezervasyonHref = withLocalePath(locale, `/rezervasyon/${tour.slug}`)

  return (
    <div className="min-h-screen bg-white dark:bg-white">
      {/* Full-width tur galerisi (edge-to-edge) */}
      {galleryHeroImages.length > 0 && (
        <div className="w-full mb-0">
          <PhotoGrid
            images={galleryHeroImages}
            tourTitle={tour.title}
            locale={locale}
            tourId={tour._id}
            tourSlug={tour.slug}
            tourDescription={tour.shortDescription}
          />
        </div>
      )}

      <div className="container mx-auto px-4 pt-6 pb-24 lg:pb-16 max-w-[1360px]">
        <Link
          href={tourHref}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5c6473] transition-colors hover:text-[var(--primary,#2168b8)]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {tourUi.reservationBackToTour}
        </Link>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 pt-4">
          <main className="flex-1 min-w-0">
            <span
              className="mb-3 inline-flex items-center rounded-full bg-[#eaf1fb] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--primary,#2168b8)]"
            >
              {tourUi.reservationEyebrow}
            </span>

            <TourHeader
              title={tour.title}
              ratingLabel={tour.ratingLabel}
              score={tour.rating}
              reviewCount={tour.reviewCount}
              reviewsUrl={tour.reviewsUrl}
              durationText={tour.quickFacts?.durationText}
              meetingLocation={tour.quickFacts?.meetingLocation}
              locale={locale}
            />

            <HighlightsDetailsRow
              highlights={tour.highlights}
              tourDetails={tour.tourDetails}
              quickFacts={tour.quickFacts}
              tourUi={tourUi}
            />

            <ItineraryTimeline
              items={itineraryTimelineItems}
              sectionTitle={tourUi.itineraryTitle}
              locale={locale}
            />

            {reelsSlides.length > 0 ? <TourReelsRail slides={reelsSlides} locale={locale} /> : null}

            <TourDescription description={tour.description} locale={locale} />

            {tour.tourVideo?.enabled && (
              <div className="mb-8">
                {videoEmbedUrl && tour.tourVideo.type !== 'upload' ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-900">
                    {tour.tourVideo.type === 'youtube' && (
                      <iframe
                        src={videoEmbedUrl}
                        title={tour.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    )}
                    {tour.tourVideo.type === 'vimeo' && (
                      <iframe
                        src={videoEmbedUrl}
                        title={tour.title}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    )}
                  </div>
                ) : tour.tourVideo.type === 'upload' && tour.tourVideo.fileUrl ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-900">
                    <video
                      controls
                      poster={
                        tour.tourVideo.poster?.asset
                          ? urlFor(tour.tourVideo.poster.asset).width(1280).height(720).auto('format').url()
                          : tour.tourVideo.poster?.url
                            ? tour.tourVideo.poster.url
                            : undefined
                      }
                      className="w-full h-full object-contain"
                    >
                      <source src={tour.tourVideo.fileUrl} type="video/mp4" />
                      {tourUi.videoNotSupported}
                    </video>
                  </div>
                ) : null}
                {tour.tourVideo.caption && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 text-center">
                    {tour.tourVideo.caption}
                  </p>
                )}
              </div>
            )}

            <IncludedNotIncluded included={tour.included} notIncluded={tour.notIncluded} tourUi={tourUi} />

            <HostBlock host={tour.host} whyYouWillLove={tour.whyYouWillLove} tourUi={tourUi} />

            <div className="mb-14">
              <FAQAccordion faqs={tour.faqs} locale={locale} whatsappUrl={whatsappUrl} />
            </div>

            <div className="mt-14 mb-14">
              <WhereSection
                data={tour.whereSection}
                headingFallback={tourUi.whereHeadingFallback}
                locale={locale}
              />
            </div>

            <div className="mt-14">
              <ReviewsSection reviewsUrl={tour.reviewsUrl} reviewsSection={tour.reviewsSection} tourUi={tourUi} />
            </div>
          </main>

          <TourBookingSidebar
            tour={tour as TourForBooking}
            ticketClasses={tour.ticketClasses}
            bookingCard={tour.bookingCard}
            rezervasyonHref={rezervasyonHref}
            locale={locale}
          />
        </div>
      </div>
    </div>
  )
}
