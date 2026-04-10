import { client, urlFor } from '@/lib/sanity'
import { contactPageQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import ContactFormClient from '@/components/contact/ContactFormClient'
import ContactSidebar from '@/components/contact/ContactSidebar'
import type { ContactSidebarData } from '@/components/contact/ContactSidebar'
import LocationMapActions from '@/components/map/LocationMapActions'
import PopularToursSection from '@/components/home/PopularToursSection'
import type { TourListItem } from '@/components/tours/TourCard'
import { getSiteName } from '@/lib/seo'
import { notFound } from 'next/navigation'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { mergeContactPageLocale, mergeContactPageSeoForLocale } from '@/lib/i18n/mergeContactPageLocale'
import { mergeTourForLocale } from '@/lib/i18n/mergeTourForLocale'
import { getContactPageUiStrings, mergeContactUiFromSanity } from '@/lib/i18n/strings/contactPage'

export const dynamic = 'force-dynamic'

type ContactPageData = {
  title?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  intro?: PortableTextBlock[] | null
  form?: { submitLabel?: string; successMessage?: string } | null
  contactCards?: Array<{ type?: string; label: string; value?: string; href?: string; highlight?: boolean }> | null
  officeAddress?: string | null
  businessHours?: string | null
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  instagramUrl?: string | null
  youtubeUrl?: string | null
  youtubeLabel?: string | null
  instagramLabel?: string | null
  mapEmbedUrl?: string | null
  locationMapLink?: string | null
  locationTitle?: string | null
  showPopularTours?: boolean
  popularToursTitle?: string | null
  popularTours?: Array<{
    _id: string
    title: string
    slug?: string | null
    shortDescription?: string | null
    durationLabel?: string | null
    departureLabel?: string | null
    priceFrom?: number | null
    rating?: number | null
    reviewCount?: number | null
    reviewsUrl?: string | null
    isPopular?: boolean | null
    quickFacts?: { durationText?: string | null; meetingLocation?: string | null } | null
    mainImage?: {
      asset?: { _ref?: string }
      url?: string
      metadata?: { lqip?: string; dimensions?: { width: number; height: number } }
      alt?: string | null
    } | null
    translations?: unknown
  }> | null
  pageTranslations?: { en?: Record<string, unknown>; de?: Record<string, unknown> }
  ui?: Record<string, unknown> | null
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'tr'
  const siteName = getSiteName()
  const baseUi = getContactPageUiStrings(locale)
  try {
    const raw = await client.fetch<ContactPageData | null>(contactPageQuery, {}, { useCdn: false })
    const seo = mergeContactPageSeoForLocale(
      raw?.metaTitle,
      raw?.metaDescription,
      raw?.pageTranslations,
      locale,
    )
    const title = seo.metaTitle?.trim() || baseUi.defaultTitle
    const description = seo.metaDescription?.trim() || baseUi.defaultMetaDescription
    return {
      title: title.includes('|') ? title : siteName ? `${title} | ${siteName}` : title,
      description,
    }
  } catch {
    return {
      title: siteName ? `${baseUi.defaultTitle} | ${siteName}` : baseUi.defaultTitle,
      description: baseUi.defaultMetaDescription,
    }
  }
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale

  let data: ContactPageData | null = null
  try {
    const raw = await client.fetch<ContactPageData | null>(contactPageQuery, {}, { useCdn: false })
    data = mergeContactPageLocale(raw as unknown as Record<string, unknown>, locale) as ContactPageData | null
  } catch {
    data = null
  }

  const ui = mergeContactUiFromSanity(getContactPageUiStrings(locale), data?.ui)

  const title = data?.title ?? ui.defaultTitle
  const intro = data?.intro ?? []
  const form = data?.form ?? {}
  const showPopularTours = data?.showPopularTours ?? false
  const popularToursTitle = data?.popularToursTitle ?? ui.defaultPopularToursTitle
  const popularTours = data?.popularTours ?? []
  const popularToursSectionData = {
    enabled: showPopularTours && popularTours.length > 0,
    title: popularToursTitle,
    subtitle: undefined as string | null | undefined,
    items: popularTours.map((tour): TourListItem => {
      const merged = mergeTourForLocale(tour as unknown as Record<string, unknown>, locale) as unknown as typeof tour
      const qf = merged.quickFacts
      const durationLabel = qf?.durationText?.trim() || merged.durationLabel
      const departureLabel = qf?.meetingLocation?.trim() || merged.departureLabel
      return {
        _id: merged._id,
        title: merged.title ?? null,
        slug: merged.slug ?? null,
        shortDescription: merged.shortDescription ?? null,
        durationLabel: durationLabel ?? null,
        departureLabel: departureLabel ?? null,
        priceFrom: merged.priceFrom ?? null,
        rating: merged.rating ?? null,
        reviewCount: merged.reviewCount ?? null,
        reviewsUrl: merged.reviewsUrl ?? null,
        isPopular: merged.isPopular ?? false,
        coverImageUrl: merged.mainImage?.asset ? urlFor(merged.mainImage.asset).width(800).height(600).url() : merged.mainImage?.url ?? null,
        coverImageAlt: merged.mainImage?.alt ?? null,
      }
    }),
  }

  const formProps = {
    ...ui,
    submitLabel: form.submitLabel ?? ui.defaultSubmitLabel,
    successMessage: form.successMessage ?? ui.defaultSuccessMessage,
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:py-16">
        <header className="mb-12">
          <h1
            className="text-[40px] sm:text-[48px] font-black uppercase leading-[1.1] mb-6"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900 }}
          >
            {(title || 'CONTACT US').toUpperCase().split(/\s+/).map((word, i) => (
              <span
                key={i}
                style={{ color: i === 0 ? '#1e3a8a' : '#000' }}
              >
                {i > 0 ? ' ' : ''}{word}
              </span>
            ))}
          </h1>
          {intro.length > 0 && (
            <div
              className="max-w-4xl text-zinc-700 text-base leading-relaxed space-y-4"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              <PortableText value={intro} />
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[2.5fr_1fr] gap-10 lg:gap-12 w-full max-w-[1400px] mx-auto">
          <section className="min-w-0" aria-labelledby="form-heading">
            <h2 id="form-heading" className="sr-only">
              {ui.formSectionAria}
            </h2>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <ContactFormClient {...formProps} />
            </div>
          </section>

          <div className="min-w-0">
            <ContactSidebar
              labels={{
                sidebarAria: ui.sidebarAria,
                rowEmail: ui.rowEmail,
                rowHours: ui.rowHours,
                rowAddress: ui.rowAddress,
                rowPhone: ui.rowPhone,
                rowFriends: ui.rowFriends,
                rowInspired: ui.rowInspired,
                ariaEmailSend: ui.ariaEmailSend,
                ariaOpenMaps: ui.ariaOpenMaps,
                ariaCall: ui.ariaCall,
                ariaYoutube: ui.ariaYoutube,
                ariaInstagram: ui.ariaInstagram,
              }}
              data={{
                email: data?.email ?? null,
                businessHours: data?.businessHours ?? null,
                address: data?.officeAddress ?? null,
                phone: data?.phone ?? null,
                youtubeUrl: data?.youtubeUrl ?? null,
                youtubeLabel: data?.youtubeLabel ?? null,
                instagramUrl: data?.instagramUrl ?? null,
                instagramLabel: data?.instagramLabel ?? null,
              } as ContactSidebarData}
            />
          </div>
        </div>

        {(data?.mapEmbedUrl || data?.locationMapLink?.trim()) && (
          <section className="mt-16" aria-label={data?.locationTitle ?? ui.mapIframeTitle}>
            {data?.locationTitle && (
              <h2
                className="text-[40px] sm:text-[48px] font-black uppercase leading-[1.1] mb-6"
                style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900 }}
              >
                {(data.locationTitle || 'KONUM').toUpperCase().split(/\s+/).map((word, i) => (
                  <span
                    key={i}
                    style={{ color: i === 0 ? '#1e3a8a' : '#000' }}
                  >
                    {i > 0 ? ' ' : ''}{word}
                  </span>
                ))}
              </h2>
            )}
            {data.mapEmbedUrl && (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-sm">
                <iframe
                  src={data.mapEmbedUrl}
                  title={data?.locationTitle ?? ui.mapIframeTitle}
                  className="h-[420px] w-full min-h-[320px] sm:h-[480px]"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
            <LocationMapActions
              managedLocationUrl={data.locationMapLink}
              address={data.officeAddress}
              mapEmbedUrl={data.mapEmbedUrl}
              contextLabel={data.locationTitle ?? data.title ?? ui.defaultTitle}
              variant="contact"
              directionsLabel={ui.mapDirections}
              shareWhatsappLabel={ui.mapWhatsapp}
              ariaLabel={ui.mapActionsAria}
            />
          </section>
        )}

        <div className="mt-16">
          <PopularToursSection data={popularToursSectionData} locale={locale} />
        </div>
      </div>
    </main>
  )
}
