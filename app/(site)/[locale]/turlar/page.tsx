import { notFound } from 'next/navigation'
import { client } from '@/lib/sanity'
import { tourCoverImageUrl } from '@/lib/sanityImage'
import { homePopularToursOrderQuery, toursListQuery, toursPageQuery } from '@/lib/queries'
import TourCard from '@/components/tours/TourCard'
import type { TourListItem } from '@/components/tours/TourCard'
import ScrollReveal from '@/components/ui/ScrollReveal'
import styles from './page.module.css'

import type { Metadata } from 'next'
import { getSiteName, buildItemListSchema } from '@/lib/seo'
import { alternateLanguageAbsoluteUrls } from '@/lib/seo/alternateLanguages'
import { absoluteUrl } from '@/lib/seo'
import { ogImageUrl } from '@/lib/seo/brand'
import JsonLd from '@/components/seo/JsonLd'
import { withLocalePath } from '@/lib/i18n/paths'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { mergeTourForLocale, tourFieldHasManualTranslation } from '@/lib/i18n/mergeTourForLocale'
import { mergeHomePageLocale } from '@/lib/i18n/mergeHomePageLocale'
import { translateText } from '@/lib/i18n/runtimeTranslate'
import { LISTING_HEADINGS } from '@/lib/i18n/strings/listingHeadings'
import StandardPageLd from '@/components/seo/StandardPageLd'

export const dynamic = 'force-dynamic'

const siteName = getSiteName()

const DEFAULT_TITLE_TOP: Record<SiteLocale, string> = {
  tr: 'EN POPÜLER',
  en: 'MOST POPULAR',
  de: 'AM BELIEBTESTEN',
  ru: 'САМЫЕ ПОПУЛЯРНЫЕ',
}

const DEFAULT_TITLE_BOTTOM: Record<SiteLocale, string> = {
  tr: 'TURLAR',
  en: 'TOURS',
  de: 'TOUREN',
  ru: 'ТУРЫ',
}

const TOURS_DESCRIPTION: Record<SiteLocale, string> = {
  tr: "Çeşme'de en çok tercih edilen deneyimleri keşfedin. Denizin, koyların ve Ege'nin tadını çıkaracağınız unutulmaz bir gün sizi bekliyor.",
  en: 'Discover the most popular experiences in Çeşme. An unforgettable day awaits you, filled with the sea, hidden coves and the taste of the Aegean.',
  de: 'Entdecken Sie die beliebtesten Erlebnisse in Çeşme. Ein unvergesslicher Tag mit dem Meer, den Buchten und dem Flair der Ägäis erwartet Sie.',
  ru: 'Откройте для себя самые популярные впечатления в Чешме. Вас ждёт незабываемый день у моря, в живописных бухтах Эгейского побережья.',
}

const EMPTY_TOURS_MESSAGE: Record<SiteLocale, string> = {
  tr: 'Henüz tur eklenmemiş.',
  en: 'No tours have been added yet.',
  de: 'Es wurden noch keine Touren hinzugefügt.',
  ru: 'Туры еще не добавлены.',
}

const META_TITLE: Record<SiteLocale, string> = {
  tr: 'Çeşme Tekne Turları | Fiyatlar ve Online Rezervasyon',
  en: 'Çeşme Boat Tours | Prices and Online Booking',
  de: 'Bootstouren in Çeşme | Preise und Online-Buchung',
  ru: 'Морские прогулки в Чешме | Цены и онлайн-бронирование',
}

const META_DESCRIPTION: Record<SiteLocale, string> = {
  tr: 'Çeşme tekne turu seçenekleri: adalar ve koylar turu, gün batımı turu, tüplü dalış ve İzmir çıkışlı turlar. Fiyatları karşılaştırın, online bilet alın.',
  en: 'Çeşme boat tour options: islands and coves tour, sunset cruise, scuba diving and tours from İzmir. Compare prices and book your ticket online.',
  de: 'Bootstouren in Çeşme: Inseln- und Buchtentour, Sonnenuntergangstour, Tauchen und Touren ab İzmir. Preise vergleichen und online buchen.',
  ru: 'Морские прогулки в Чешме: тур по островам и бухтам, закатный тур, дайвинг и туры из Измира. Сравните цены и купите билет онлайн.',
}

const OG_META_TITLE: Record<SiteLocale, string> = {
  tr: siteName ? `Tekne Turları | ${siteName}` : 'Tekne Turları',
  en: siteName ? `Boat Tours | ${siteName}` : 'Boat Tours',
  de: siteName ? `Bootstouren | ${siteName}` : 'Bootstouren',
  ru: siteName ? `Морские прогулки | ${siteName}` : 'Морские прогулки',
}

const OG_META_DESCRIPTION: Record<SiteLocale, string> = {
  tr: 'Tekne turları ve deneyimler. Rezervasyon.',
  en: 'Boat tours and experiences. Book now.',
  de: 'Bootstouren und Erlebnisse. Jetzt buchen.',
  ru: 'Морские прогулки и впечатления. Забронируйте сейчас.',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: loc } = await params
  const locale = isSiteLocale(loc) ? (loc as SiteLocale) : 'tr'
  const languages = alternateLanguageAbsoluteUrls('/turlar')
  const canonical =
    languages[locale === 'tr' ? 'tr' : locale === 'en' ? 'en' : locale === 'de' ? 'de' : 'ru'] ??
    absoluteUrl('/turlar')
  const ogLocale = locale === 'tr' ? 'tr_TR' : locale === 'de' ? 'de_DE' : locale === 'ru' ? 'ru_RU' : 'en_US'
  const ogImage = ogImageUrl({ title: OG_META_TITLE[locale], locale })
  return {
    title: { absolute: META_TITLE[locale] },
    description: META_DESCRIPTION[locale],
    alternates: { canonical, languages },
    openGraph: {
      title: OG_META_TITLE[locale],
      description: OG_META_DESCRIPTION[locale],
      url: canonical,
      type: 'website',
      locale: ogLocale,
      ...(siteName ? { siteName } : {}),
      images: [{ url: ogImage, width: 1200, height: 630, alt: OG_META_TITLE[locale] }],
    },
    twitter: {
      card: 'summary_large_image',
      title: OG_META_TITLE[locale],
      description: OG_META_DESCRIPTION[locale],
      images: [ogImage],
    },
  }
}

type TourListRaw = Omit<TourListItem, 'coverImageUrl' | 'coverImageAlt'> & {
  mainImage?: { asset?: { _ref: string }; alt?: string | null } | null
  translations?: unknown
}

type ToursPageData = {
  slug?: string | null
  titleTop?: string | null
  titleBottom?: string | null
}

function popularTourIdsFromMergedHome(home: Record<string, unknown> | null): string[] {
  if (!home) return []
  const sec = home.popularToursSection as Record<string, unknown> | undefined
  if (!sec || sec.enabled === false) return []
  const items = sec.items
  if (!Array.isArray(items)) return []
  const ids: string[] = []
  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    if (typeof o._ref === 'string') ids.push(o._ref)
    else if (typeof o._id === 'string') ids.push(o._id)
  }
  return ids
}

function sortToursLikeHomepage(tours: TourListItem[], popularOrder: string[], locale: SiteLocale): TourListItem[] {
  if (popularOrder.length === 0) {
    return [...tours].sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '', locale === 'tr' ? 'tr' : locale))
  }
  const map = new Map(tours.map((t) => [t._id, t]))
  const seen = new Set<string>()
  const ordered: TourListItem[] = []
  for (const id of popularOrder) {
    const t = map.get(id)
    if (t) {
      ordered.push(t)
      seen.add(id)
    }
  }
  const collator = locale === 'tr' ? 'tr' : locale
  const rest = tours.filter((t) => !seen.has(t._id)).sort((a, b) =>
    (a.title ?? '').localeCompare(b.title ?? '', collator),
  )
  return [...ordered, ...rest]
}

export default async function TurlarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale

  let tours: TourListItem[] = []
  let pageData: ToursPageData | null = null

  try {
    const [toursData, page, homeOrderRaw] = await Promise.all([
      client.fetch<TourListRaw[]>(toursListQuery, {}, { useCdn: false }),
      client.fetch<ToursPageData | null>(toursPageQuery, {}, { useCdn: false }),
      client.fetch<Record<string, unknown> | null>(homePopularToursOrderQuery, {}, { useCdn: false }),
    ])
    pageData = page ?? null
    const raw = Array.isArray(toursData) ? toursData : []
    const mapped = await Promise.all(
      raw.map(async (t) => {
        const rawItem = t as unknown as Record<string, unknown>
        const merged = mergeTourForLocale(rawItem, locale) as unknown as TourListRaw & {
          quickFacts?: { durationText?: string | null; meetingLocation?: string | null }
        }
        const qf = merged.quickFacts
        const shortDescription = tourFieldHasManualTranslation(rawItem, locale, 'shortDescription')
          ? merged.shortDescription
          : await translateText(merged.shortDescription, locale)
        const title = tourFieldHasManualTranslation(rawItem, locale, 'title')
          ? merged.title
          : await translateText(merged.title, locale)
        const departureLabelRaw = qf?.meetingLocation?.trim() || merged.departureLabel
        const durationLabelRaw = qf?.durationText?.trim() || merged.durationLabel
        const [departureLabel, durationLabel] = await Promise.all([
          translateText(departureLabelRaw, locale),
          translateText(durationLabelRaw, locale),
        ])
        return {
          _id: merged._id,
          title: title || merged.title,
          slug: merged.slug,
          shortDescription,
          rating: merged.rating,
          reviewCount: merged.reviewCount,
          reviewsUrl: merged.reviewsUrl ?? null,
          isPopular: merged.isPopular,
          cardDiscount: merged.cardDiscount ?? null,
          departureLabel: departureLabel || departureLabelRaw,
          durationLabel: durationLabel || durationLabelRaw,
          priceFrom: merged.priceFrom,
          coverImageUrl: tourCoverImageUrl(merged.mainImage?.asset ?? null),
          coverImageAlt: merged.mainImage?.alt ?? null,
        }
      })
    )
    const homeMerged = mergeHomePageLocale(homeOrderRaw, locale)
    const popularOrder = popularTourIdsFromMergedHome(homeMerged as Record<string, unknown> | null)
    tours = sortToursLikeHomepage(mapped, popularOrder, locale)
  } catch {
    tours = []
  }

  const titleTop = pageData?.titleTop?.trim()
    ? await translateText(pageData.titleTop, locale)
    : DEFAULT_TITLE_TOP[locale]
  const titleBottom = pageData?.titleBottom?.trim()
    ? await translateText(pageData.titleBottom, locale)
    : DEFAULT_TITLE_BOTTOM[locale]

  const itemListSchema = buildItemListSchema(
    tours
      .filter((tour): tour is typeof tour & { title: string } => Boolean(tour.title))
      .map((tour) => ({
        name: tour.title,
        url: withLocalePath(locale, `/tur/${tour.slug}`),
        image: tour.coverImageUrl ?? undefined,
      }))
  )

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={itemListSchema} />
      <StandardPageLd type="CollectionPage" locale={locale} path="/turlar" name={META_TITLE[locale]} description={META_DESCRIPTION[locale]} />
      <section className="w-full py-14 md:py-20" aria-labelledby="tours-heading">
        <div className="mx-auto max-w-[1200px] px-4">
          <header className="mb-12">
            <h1 id="tours-heading" className={styles.heading}>
              {titleTop && <span className={styles.headingLine1}>{titleTop}</span>}
              {titleTop && titleBottom ? ' ' : null}
              {titleBottom && <span className={styles.headingLine2}>{titleBottom}</span>}
            </h1>
            <p
              className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-zinc-600 sm:text-[18px] sm:leading-[1.65]"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              {TOURS_DESCRIPTION[locale]}
            </p>
          </header>

          <h2 className="sr-only">{LISTING_HEADINGS.tours[locale]}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {tours.map((tour, i) => (
              <ScrollReveal key={tour._id} delayMs={(i % 3) * 80}>
                <TourCard tour={tour} locale={locale} />
              </ScrollReveal>
            ))}
          </div>

          {tours.length === 0 && (
            <p className="text-center text-black/60 py-12">{EMPTY_TOURS_MESSAGE[locale]}</p>
          )}
        </div>
      </section>
    </div>
  )
}
