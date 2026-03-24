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
import YachtOptionalSections from '@/components/yacht/YachtOptionalSections'
/** Ağır client alt ağaçları ayrı chunk — ChunkLoadError / timeout riskini azaltır */
const PhotoGrid = dynamic(() => import('@/components/PhotoGrid'), {
  loading: () => (
    <div
      className="w-full min-h-[300px] bg-zinc-100 motion-safe:animate-pulse"
      aria-busy
      aria-label="Galeri yükleniyor"
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
  yacht: YachtRentalDocument
  /** SEO ve breadcrumb için tam yol (örn. /yat-kiralama/cesme/gulet-ada) */
  path: string
}

export default function YachtDetailView({ yacht, path }: YachtDetailViewProps) {
  const images = buildYachtPhotoGridImages(yacht)
  const sidebarGallery = buildYachtSidebarGallery(yacht)

  const crumbs = [
    { name: 'Ana Sayfa', url: '/' },
    { name: 'Yat kiralama', url: '/yat-kiralama' },
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
          <PhotoGrid images={images} tourTitle={yacht.name} heroBadges={yacht.badges} />
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
            />
            <YachtShortSummary text={yacht.shortDescription} />
            <YachtHighlights
              specifications={yacht.specifications}
              departurePoint={yacht.departurePoint}
              technicalSpecs={yacht.technicalSpecs}
            />
            <YachtRouteSection routes={yacht.routeSuggestions ?? []} />
            <YachtDescription description={yacht.fullDescription} />
            <YachtIncludedWithGallery
              included={yacht.included}
              notIncluded={yacht.notIncluded}
              gallery={sidebarGallery}
            />
            <YachtAmenitiesSection amenities={yacht.amenities ?? []} />
            <YachtPolicySections yacht={yacht} />
            <YachtFAQAccordion items={yacht.faqs ?? []} />
            <YachtOptionalSections yacht={yacht} />
          </main>
          <YachtInquiryExperience yacht={yacht} />
        </div>
      </div>
    </div>
  )
}
