import { client } from '@/lib/sanity'
import { tourCoverImageUrl } from '@/lib/sanityImage'
import { contactPageQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import ContactFormClient from '@/components/contact/ContactFormClient'
import ContactSidebar, { ContactQuickActions } from '@/components/contact/ContactSidebar'
import type { ContactSidebarData, ContactSidebarLabels } from '@/components/contact/ContactSidebar'
import PopularToursSection from '@/components/home/PopularToursSection'
import type { TourListItem } from '@/components/tours/TourCard'
import { absoluteUrl, getSiteName } from '@/lib/seo'
import { buildStandardPageLd } from '@/lib/seo/pageSchemas'
import { buildBusinessContactStructuredData } from '@/lib/seo/travelAgencyStructuredData'
import JsonLd from '@/components/seo/JsonLd'
import { withLocalePath } from '@/lib/i18n/paths'
import { buildPageMetadata } from '@/lib/seo/buildPageMetadata'
import { notFound } from 'next/navigation'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { mergeContactPageLocale, mergeContactPageSeoForLocale } from '@/lib/i18n/mergeContactPageLocale'
import { mergeTourForLocale } from '@/lib/i18n/mergeTourForLocale'
import { getContactPageUiStrings, mergeContactUiFromSanity } from '@/lib/i18n/strings/contactPage'

// Popüler Turlar bölüm başlığı için
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
  let trTitle: string | null = null
  try {
    const raw = await client.fetch<ContactPageData | null>(contactPageQuery, {}, { useCdn: false })
    trTitle = raw?.title?.trim() || null
    data = mergeContactPageLocale(raw as unknown as Record<string, unknown>, locale) as ContactPageData | null
  } catch {
    data = null
  }

  const ui = mergeContactUiFromSanity(getContactPageUiStrings(locale), data?.ui)

  const localeUpper = locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US'
  const toHeadingUpper = (s: string) => s.trim().toLocaleUpperCase(localeUpper)

  // O dilde çeviri girilmemişse Türkçe başlık yerine dilin kendi "İletişim" karşılığı.
  const mergedTitle = data?.title?.trim() || ''
  const title =
    !mergedTitle || (locale !== 'tr' && mergedTitle === trTitle) ? ui.defaultTitle : mergedTitle
  const pageUrl = absoluteUrl(withLocalePath(locale, '/contact'))
  const pageLd = buildStandardPageLd({
    type: 'ContactPage',
    locale,
    url: pageUrl,
    homeUrl: withLocalePath(locale, '/'),
    name: title,
    description: ui.defaultMetaDescription,
  })
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
        privateTour: Boolean((merged as { privateTour?: boolean | null }).privateTour),
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

  // schemaTypes/contactPage.ts'deki submitLabel alanının hiç değiştirilmemiş
  // İngilizce varsayılanı ("SEND MESSAGE") — Sanity'de bu alan boş değil,
  // olduğu gibi bu placeholder metni tutuyor, bu yüzden Türkçe sayfada da
  // İngilizce çıkıyordu. Editör gerçekten özel bir metin girerse ona saygı
  // gösterilmeye devam eder.
  const PLACEHOLDER_SUBMIT_LABEL = 'SEND MESSAGE'
  const formProps = {
    ...ui,
    submitLabel:
      form.submitLabel && form.submitLabel.trim() !== PLACEHOLDER_SUBMIT_LABEL
        ? form.submitLabel
        : ui.defaultSubmitLabel,
    successMessage: form.successMessage ?? ui.defaultSuccessMessage,
  }

  const sidebarLabels: ContactSidebarLabels = {
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
    instagramFallbackLabel: ui.instagramFallbackLabel,
    youtubeFallbackLabel: ui.youtubeFallbackLabel,
    officeTitle: data?.locationTitle?.trim() || ui.officeTitle,
    directionsCta: ui.directionsCta,
    socialTitle: ui.socialTitle,
    mapIframeTitle: data?.locationTitle ?? ui.mapIframeTitle,
  }
  const sidebarData: ContactSidebarData = {
    email: data?.email ?? null,
    businessHours: data?.businessHours ?? null,
    address: data?.officeAddress ?? null,
    phone: data?.phone ?? null,
    whatsapp: data?.whatsapp ?? null,
    youtubeUrl: data?.youtubeUrl ?? null,
    youtubeLabel: data?.youtubeLabel ?? null,
    instagramUrl: data?.instagramUrl ?? null,
    instagramLabel: data?.instagramLabel ?? null,
    mapEmbedUrl: data?.mapEmbedUrl ?? null,
    locationMapLink: data?.locationMapLink ?? null,
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      {pageLd.map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
      <JsonLd data={buildBusinessContactStructuredData()} />
      {/* Koylar sayfasındaki gibi başlığın arkasında çok açık mavi bir ışıltı. */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[460px] w-[1000px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-70 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, #dbeafe, rgba(219,234,254,0))' }}
        aria-hidden
      />

      {/* ── Başlık ── */}
      <div className="w-full px-4 pb-8 pt-14 text-center sm:pb-10 sm:pt-16 md:pt-20">
        <h1 className="pageSectionHeading">{toHeadingUpper(title || ui.defaultTitle)}</h1>
        {intro.length > 0 && (
          <div className="pageSectionLead mx-auto max-w-2xl">
            <PortableText value={intro} />
          </div>
        )}
      </div>

      <div className="mx-auto max-w-[1200px] px-4 pb-12 sm:pb-16">
        {/* ── Hızlı iletişim ── */}
        <h2 className="sr-only">{ui.quickTitle}</h2>
        <ContactQuickActions data={sidebarData} labels={sidebarLabels} />

        {/* ── Form + ofis paneli ── */}
        <div className="mt-10 grid w-full grid-cols-1 gap-10 md:mt-12 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-12">
          <section className="min-w-0" aria-labelledby="form-heading">
            <h2 id="form-heading" className="tourSectionHeading mb-2">
              {toHeadingUpper(ui.formTitle)}
            </h2>
            <p className="mb-6 text-[15px] leading-relaxed text-[var(--text-color,#58595b)]">{ui.formLead}</p>
            <ContactFormClient {...formProps} />
          </section>

          <div className="min-w-0">
            <ContactSidebar labels={sidebarLabels} data={sidebarData} />
          </div>
        </div>

      </div>

      <div className="pb-4">
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
    </main>
  )
}
