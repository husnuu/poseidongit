import { client } from '@/lib/sanity'
import { tourCoverImageUrl } from '@/lib/sanityImage'
import { contactPageQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import ContactFormClient from '@/components/contact/ContactFormClient'
import ContactSidebar from '@/components/contact/ContactSidebar'
import type { ContactSidebarData } from '@/components/contact/ContactSidebar'
import PopularToursSection from '@/components/home/PopularToursSection'
import type { TourListItem } from '@/components/tours/TourCard'
import { getSiteName } from '@/lib/seo'
import { buildPageMetadata } from '@/lib/seo/buildPageMetadata'
import { notFound } from 'next/navigation'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { mergeContactPageLocale, mergeContactPageSeoForLocale } from '@/lib/i18n/mergeContactPageLocale'
import { mergeTourForLocale } from '@/lib/i18n/mergeTourForLocale'
import { getContactPageUiStrings, mergeContactUiFromSanity } from '@/lib/i18n/strings/contactPage'

export const dynamic = 'force-dynamic'

const CONTACT_HEADING_CLASS =
  'text-[29px] font-extrabold uppercase leading-[1.15] mb-6 sm:text-[31px] md:text-[35px] lg:text-[39px]'

// Ana başlık (İletişim) dışındaki bölüm başlıkları (Konum, Popüler Turlar) için
// daha ölçülü bir boyut — referans sitedeki alt başlık stiline uygun.
const CONTACT_SUBHEADING_CLASS =
  'text-[20px] font-extrabold uppercase leading-[1.2] mb-6 sm:text-[22px] md:text-[24px]'

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
    const rawTitle = seo.metaTitle?.trim() || baseUi.defaultTitle
    const title = rawTitle.includes('|') ? rawTitle : siteName ? `${rawTitle} | ${siteName}` : rawTitle
    const description = seo.metaDescription?.trim() || baseUi.defaultMetaDescription
    return buildPageMetadata({ locale, path: '/contact', title, description })
  } catch {
    const title = siteName ? `${baseUi.defaultTitle} | ${siteName}` : baseUi.defaultTitle
    return buildPageMetadata({ locale, path: '/contact', title, description: baseUi.defaultMetaDescription })
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

  const localeUpper = locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US'
  const toHeadingUpper = (s: string) => s.trim().toLocaleUpperCase(localeUpper)

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
        coverImageUrl:
          tourCoverImageUrl(merged.mainImage?.asset ?? null) ?? merged.mainImage?.url ?? null,
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
    <main className="min-h-screen bg-white">
      {/* Bembeyaz zemin, ortalanmış başlık + alt metin. */}
      <div className="w-full px-4 pb-6 pt-16 text-center sm:pb-8 sm:pt-20">
        <h1
          className={`${CONTACT_HEADING_CLASS} whitespace-nowrap pageHeroTitleStroke`}
          style={{
            fontFamily: 'var(--font-family-title, var(--font-family))',
            color: 'var(--primary, #2168b8)',
          }}
        >
          {toHeadingUpper(title || ui.defaultTitle)}
        </h1>
        {intro.length > 0 && (
          <div
            className="mx-auto max-w-2xl text-base leading-relaxed space-y-4"
            style={{ fontFamily: 'var(--font-family)', color: '#475569' }}
          >
            <PortableText value={intro} />
          </div>
        )}
      </div>

      <div className="mx-auto max-w-[1400px] px-4 pb-12 pt-0 sm:pb-16 sm:pt-0">
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
                rowWhatsapp: ui.rowWhatsapp,
                rowFriends: ui.rowFriends,
                rowInspired: ui.rowInspired,
                ariaEmailSend: ui.ariaEmailSend,
                ariaOpenMaps: ui.ariaOpenMaps,
                ariaCall: ui.ariaCall,
                ariaWhatsapp: ui.ariaWhatsapp,
                ariaYoutube: ui.ariaYoutube,
                ariaInstagram: ui.ariaInstagram,
              }}
              data={{
                email: data?.email ?? null,
                businessHours: data?.businessHours ?? null,
                address: data?.officeAddress ?? null,
                phone: data?.phone ?? null,
                whatsapp: data?.whatsapp ?? null,
                youtubeUrl: data?.youtubeUrl ?? null,
                youtubeLabel: data?.youtubeLabel ?? null,
                instagramUrl: data?.instagramUrl ?? null,
                instagramLabel: data?.instagramLabel ?? null,
              } as ContactSidebarData}
            />
          </div>
        </div>

        {data?.mapEmbedUrl && (
          <section className="mt-16" aria-labelledby="contact-location-heading">
            <h2
              id="contact-location-heading"
              className={CONTACT_SUBHEADING_CLASS}
              style={{ fontFamily: 'var(--font-family-title, var(--font-family))', color: 'var(--secondary, #131719)' }}
            >
              {toHeadingUpper(
                data.locationTitle?.trim() ||
                  (locale === 'tr' ? 'Konum' : locale === 'de' ? 'Standort' : 'Location'),
              )}
            </h2>
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
          </section>
        )}

        <div className="mt-16">
          <PopularToursSection
            data={popularToursSectionData}
            locale={locale}
            headingClassName={CONTACT_SUBHEADING_CLASS}
            headingAlign="left"
            headingColor="var(--secondary, #131719)"
            sectionBgClassName="bg-white"
            hideViewAllButton
          />
        </div>
      </div>
    </main>
  )
}
