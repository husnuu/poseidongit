import dynamic from 'next/dynamic'
import JsonLd from '@/components/seo/JsonLd'
import Breadcrumb from '@/components/common/Breadcrumb'
import {
  buildBreadcrumbSchema,
  buildFAQSchema,
  buildTourSchema,
  absoluteUrl,
  portableTextToPlainText,
} from '@/lib/seo'
import { withLocalePath } from '@/lib/i18n/paths'
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
import ScrollReveal from '@/components/ui/ScrollReveal'

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
  /** Footer WhatsApp numarasından üretilir — SSS'teki "WhatsApp'tan Yazın" CTA'sı için (tur sayfasıyla aynı). */
  whatsappUrl?: string | null
}

export default function YachtDetailView({ locale, yacht, path, whatsappUrl }: YachtDetailViewProps) {
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

  // Yalnızca JSON-LD: görünür breadcrumb satırı kullanıcı isteğiyle kaldırıldı
  // (tur sayfasında da aynısı yapılmıştı). Şema kalıyor — arama sonucundaki
  // kırıntı yolunu o besliyor, sayfada hiçbir şey göstermiyor.
  const breadcrumbSchema = buildBreadcrumbSchema(crumbs)

  const url = absoluteUrl(withLocalePath(locale, path))
  const productSchema = buildTourSchema({
    name: yacht.name,
    description: yacht.shortDescription,
    url,
    image: images[0]?.src,
    price: yacht.priceFrom,
    priceCurrency: yacht.currency,
  })

  const faqPairs = (yacht.faqs ?? [])
    .map((f) => ({ question: f.question?.trim() ?? '', answer: portableTextToPlainText(f.answer) }))
    .filter((f) => f.question && f.answer)
  const faqSchema = faqPairs.length > 0 ? buildFAQSchema(faqPairs) : null

  return (
    <div className="min-h-screen bg-white dark:bg-white">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={productSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}
      {images.length > 0 && (
        <div className="relative w-full mb-0">
          <PhotoGrid
            images={images}
            tourTitle={yacht.name}
            heroBadges={yacht.badges}
            locale={locale}
            itemType="yacht"
            itemPath={path}
            tourId={yacht._id}
            tourSlug={yacht.slug}
            tourDescription={yacht.shortDescription}
          />
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
            <ScrollReveal>
              <YachtHighlights
                specifications={yacht.specifications}
                departurePoint={yacht.departurePoint}
                technicalSpecs={yacht.technicalSpecs}
                locale={locale}
              />
            </ScrollReveal>
            <ScrollReveal>
              <YachtRouteSection routes={yacht.routeSuggestions ?? []} locale={locale} />
            </ScrollReveal>
            <ScrollReveal>
              <YachtDescription description={yacht.fullDescription} locale={locale} />
            </ScrollReveal>
            <ScrollReveal>
              <YachtIncludedWithGallery
                included={yacht.included}
                notIncluded={yacht.notIncluded}
                gallery={sidebarGallery}
                locale={locale}
              />
            </ScrollReveal>
            <ScrollReveal>
              <YachtAmenitiesSection amenities={yacht.amenities ?? []} locale={locale} />
            </ScrollReveal>
            <ScrollReveal>
              <YachtPolicySections yacht={yacht} locale={locale} />
            </ScrollReveal>
            <ScrollReveal>
              <YachtFAQAccordion items={yacht.faqs ?? []} locale={locale} whatsappUrl={whatsappUrl} />
            </ScrollReveal>
            <ScrollReveal>
              <YachtOptionalSections locale={locale} yacht={yacht} />
            </ScrollReveal>
          </main>
          <YachtInquiryExperience yacht={yacht} locale={locale} />
        </div>
      </div>
    </div>
  )
}
