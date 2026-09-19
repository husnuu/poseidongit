import dynamic from 'next/dynamic'
import JsonLd from '@/components/seo/JsonLd'
import { buildBreadcrumbSchema } from '@/lib/seo'
import { buildYachtPhotoGridImages, buildYachtSidebarGallery } from '@/lib/yachtImages'
import type { YachtRentalDocument } from '@/lib/yachtTypes'
import YachtHeader from '@/components/yacht/YachtHeader'
import YachtHighlights from '@/components/yacht/YachtHighlights'
import YachtShortSummary from '@/components/yacht/YachtShortSummary'
import YachtDescription from '@/components/yacht/YachtDescription'
import YachtIncludedWithGallery from '@/components/yacht/YachtIncludedWithGallery'
import YachtRouteSection from '@/components/yacht/YachtRouteSection'
import YachtAmenitiesSection from '@/components/yacht/YachtAmenitiesSection'
import YachtPolicySections from '@/components/yacht/YachtPolicySections'
import YachtFAQAccordion from '@/components/yacht/YachtFAQAccordion'
import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtUi } from '@/lib/i18n/yachtUi'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import YachtOptionalSections from '@/components/yacht/YachtOptionalSections'

/** Ağır client alt ağaçları ayrı chunk — ChunkLoadError / timeout riskini azaltır */
const PhotoGrid = dynamic(() => import('@/components/PhotoGrid'), {
  loading: () => (
    <div
      className="w-full min-h-[300px] bg-zinc-100 motion-safe:animate-pulse"
      aria-busy
      aria-label={getYachtUi('tr').galleryLoadingAria}
    />
  ),
})

const YachtInquiryExperience = dynamic(
  () => import('@/components/yacht/YachtInquiryExperience'),
  {
    loading: () => (
      <aside className="hidden lg:block lg:w-[360px] lg:flex-shrink-0" aria-hidden>
        <div className="sticky top-6 h-[480px] w-full rounded-xl border border-zinc-100 bg-zinc-50 motion-safe:animate-pulse" />
      </aside>
    ),
  }
)

interface YachtDetailViewProps {
  locale: SiteLocale
  yacht: YachtRentalDocument
  /** SEO ve breadcrumb için tam yol (örn. /yat-kiralama/cesme/gulet-ada) */
  path: string
}

export default function YachtDetailView({ locale, yacht, path }: YachtDetailViewProps) {
  const ui = getYachtUi(locale)
  const tourUi = getTourPageUi(locale)
  const images = buildYachtPhotoGridImages(yacht)
  const sidebarGallery = buildYachtSidebarGallery(yacht)

  const crumbs = [
    { name: tourUi.breadcrumbHome, url: '/' },
    { name: ui.breadcrumbYachtRental, url: '/yat-kiralama' },
  ]
  if (yacht.locationSlug && yacht.locationTitle) {
    crumbs.push({
      name: yacht.locationTitle,
      url: `/yat-kiralama/${yacht.locationSlug}`,
    })
  }
  crumbs.push({ name: yacht.name, url: path })

  const breadcrumbSchema = buildBreadcrumbSchema(crumbs)

  return (
    <div className="min-h-screen bg-white dark:bg-white">
      <JsonLd data={breadcrumbSchema} />
      {images.length > 0 && (
        <div className="relative w-full mb-0">
          <PhotoGrid images={images} tourTitle={yacht.name} heroBadges={yacht.badges} locale={locale} />
        </div>
      )}
      <div className="container mx-auto px-4 py-16 max-w-[1360px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <main className="flex-1 min-w-0">
            <YachtHeader
              name={yacht.name}
              yachtType={yacht.yachtType}
              locationTitle={yacht.locationTitle}
              marina={yacht.marina}
              locale={locale}
            />
            <YachtShortSummary text={yacht.shortDescription} />
            <YachtHighlights
              specifications={yacht.specifications}
              departurePoint={yacht.departurePoint}
              technicalSpecs={yacht.technicalSpecs}
              locale={locale}
            />
            <YachtRouteSection routes={yacht.routeSuggestions ?? []} locale={locale} />
            <YachtDescription description={yacht.fullDescription} locale={locale} />
            <YachtIncludedWithGallery
              included={yacht.included}
              notIncluded={yacht.notIncluded}
              gallery={sidebarGallery}
              locale={locale}
            />
            <YachtAmenitiesSection amenities={yacht.amenities ?? []} locale={locale} />
            <YachtPolicySections yacht={yacht} locale={locale} />
            <YachtFAQAccordion items={yacht.faqs ?? []} locale={locale} />
            <YachtOptionalSections locale={locale} yacht={yacht} />
          </main>
          <YachtInquiryExperience yacht={yacht} locale={locale} />
        </div>
      </div>
    </div>
  )
}
