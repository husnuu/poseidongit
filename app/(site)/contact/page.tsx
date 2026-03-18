import { client, urlFor } from '@/lib/sanity'
import { contactPageQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import ContactFormClient from '@/components/contact/ContactFormClient'
import ContactSidebar from '@/components/contact/ContactSidebar'
import type { ContactSidebarData } from '@/components/contact/ContactSidebar'
import PopularToursSection from '@/components/home/PopularToursSection'
import type { TourListItem } from '@/components/tours/TourCard'
import { getSiteName } from '@/lib/seo'

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
    mainImage?: {
      asset?: { _ref?: string }
      url?: string
      metadata?: { lqip?: string; dimensions?: { width: number; height: number } }
      alt?: string | null
    } | null
  }> | null
}

export async function generateMetadata() {
  const siteName = getSiteName()
  try {
    const data = await client.fetch<ContactPageData | null>(contactPageQuery, {}, { useCdn: false })
    const title = data?.metaTitle ?? data?.title ?? 'İletişim'
    const description = data?.metaDescription ?? 'Bizimle iletişime geçin.'
    return {
      title: title.includes('|') ? title : siteName ? `${title} | ${siteName}` : title,
      description,
    }
  } catch {
    return {
      title: siteName ? `İletişim | ${siteName}` : 'İletişim',
      description: 'Bizimle iletişime geçin.',
    }
  }
}

export default async function ContactPage() {
  let data: ContactPageData | null = null
  try {
    data = await client.fetch<ContactPageData | null>(contactPageQuery, {}, { useCdn: false })
  } catch {
    data = null
  }

  const title = data?.title ?? 'İletişim'
  const intro = data?.intro ?? []
  const form = data?.form ?? {}
  const showPopularTours = data?.showPopularTours ?? false
  const popularToursTitle = data?.popularToursTitle ?? 'OR YOU CAN FIND OUR MOST POPULAR TOURS HERE!'
  const popularTours = data?.popularTours ?? []
  const popularToursSectionData = {
    enabled: showPopularTours && popularTours.length > 0,
    title: popularToursTitle,
    subtitle: undefined as string | null | undefined,
    items: popularTours.map((tour): TourListItem => ({
      _id: tour._id,
      title: tour.title ?? null,
      slug: tour.slug ?? null,
      shortDescription: tour.shortDescription ?? null,
      durationLabel: tour.durationLabel ?? null,
      departureLabel: tour.departureLabel ?? null,
      priceFrom: tour.priceFrom ?? null,
      rating: tour.rating ?? null,
      reviewCount: tour.reviewCount ?? null,
      reviewsUrl: tour.reviewsUrl ?? null,
      isPopular: tour.isPopular ?? false,
      coverImageUrl: tour.mainImage?.asset ? urlFor(tour.mainImage.asset).width(800).height(600).url() : tour.mainImage?.url ?? null,
      coverImageAlt: tour.mainImage?.alt ?? null,
    })),
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:py-16">
        {/* Başlık – anasayfa popüler turlar ile aynı font ve stil */}
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

        {/* Form (sol) + Contact Info sidebar (sağ); mobilde sidebar alta iner */}
        <div className="grid grid-cols-1 lg:grid-cols-[2.5fr_1fr] gap-10 lg:gap-12 w-full max-w-[1400px] mx-auto">
          <section className="min-w-0" aria-labelledby="form-heading">
            <h2 id="form-heading" className="sr-only">
              İletişim formu
            </h2>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <ContactFormClient
                submitLabel={form.submitLabel ?? 'Gönder'}
                successMessage={form.successMessage ?? 'Mesajınız alındı. En kısa sürede dönüş yapacağız.'}
              />
            </div>
          </section>

          <div className="min-w-0">
            <ContactSidebar
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

        {/* Harita – formun altında, büyük */}
        {data?.mapEmbedUrl && (
          <section className="mt-16" aria-label={data?.locationTitle ?? 'Konum'}>
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
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-sm">
              <iframe
                src={data.mapEmbedUrl}
                title={data?.locationTitle ?? 'Harita'}
                className="h-[420px] w-full min-h-[320px] sm:h-[480px]"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>
        )}

        {/* Popüler turlar – anasayfayla aynı başlık ve kartlar */}
        <div className="mt-16">
          <PopularToursSection data={popularToursSectionData} />
        </div>
      </div>
    </main>
  )
}
