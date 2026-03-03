import { client, urlFor } from '@/lib/sanity'
import { homePageHeroQuery } from '@/lib/queries'
import HeroBanner from '@/components/home/HeroBanner'
import FeatureBar from '@/components/home/FeatureBar'
import PopularToursSection from '@/components/home/PopularToursSection'
import AboutTeaserSplit from '@/components/home/AboutTeaserSplit'
import type { HeroData } from '@/components/home/HeroBanner'
import type { FeatureBarItem } from '@/components/home/FeatureBar'
import type { PopularToursSectionData } from '@/components/home/PopularToursSection'
import BlogSection from '@/components/home/BlogSection'
import RouteSection from '@/components/home/RouteSection'
import InstagramSection from '@/components/home/InstagramSection'
import type { AboutTeaserData } from '@/components/home/AboutTeaserSplit'
import type { BlogSectionData } from '@/components/home/BlogSection'
import type { InstagramSectionData } from '@/components/home/InstagramSection'
import type { RouteSectionLocation } from '@/components/home/RouteSection'
import type { TourListItem } from '@/components/tours/TourCard'

export const dynamic = 'force-dynamic'

type PopularToursSectionRaw = {
  enabled?: boolean | null
  title?: string | null
  subtitle?: string | null
  items?: Array<{
    _id: string
    title: string | null
    slug: string | null
    shortDescription?: string | null
    durationLabel?: string | null
    departureLabel?: string | null
    priceFrom?: number | null
    rating?: number | null
    reviewCount?: number | null
    reviewsUrl?: string | null
    isPopular?: boolean | null
    mainImage?: { asset?: { _ref: string }; alt?: string | null } | null
  }> | null
}

type BlogSectionRaw = {
  enabled?: boolean | null
  heading?: string | null
  subtitle?: string | null
  posts?: Array<{
    _id: string
    title: string | null
    slug: string | null
    excerpt?: string | null
    publishDate?: string | null
    coverImage?: { asset?: { _ref: string }; alt?: string | null } | null
  }> | null
  ctaButton?: { label?: string | null; href?: string | null } | null
}

type RouteSectionRaw = {
  enabled?: boolean | null
  heading?: string | null
  description?: string | null
  ctaButton?: { label?: string | null; href?: string | null } | null
  locations?: Array<{
    name?: string | null
    location?: string | null
    image?: { asset?: { _ref: string }; alt?: string | null } | null
  }> | null
}

type HomePageHeroResult = {
  hero: HeroData | null
  featureBar?: FeatureBarItem[] | null
  popularToursSection?: PopularToursSectionRaw | null
  aboutTeaser?: AboutTeaserData | null
  blogSection?: BlogSectionRaw | null
  routeSection?: RouteSectionRaw | null
  instagramSection?: InstagramSectionData | null
} | null

function mapPopularToursToCardItems(raw: PopularToursSectionRaw | null): PopularToursSectionData | null {
  if (!raw || !raw.items?.length) return raw as PopularToursSectionData | null
  const items: TourListItem[] = raw.items.map((t) => ({
    _id: t._id,
    title: t.title,
    slug: t.slug,
    shortDescription: t.shortDescription,
    durationLabel: t.durationLabel,
    departureLabel: t.departureLabel,
    priceFrom: t.priceFrom,
    rating: t.rating,
    reviewCount: t.reviewCount,
    reviewsUrl: t.reviewsUrl ?? null,
    isPopular: t.isPopular ?? false,
    coverImageUrl: t.mainImage?.asset ? urlFor(t.mainImage.asset).width(800).height(600).url() : null,
    coverImageAlt: t.mainImage?.alt ?? null,
  }))
  return { ...raw, items }
}

function mapBlogSection(raw: BlogSectionRaw | null): BlogSectionData | null {
  if (!raw || !raw.posts?.length) return raw as BlogSectionData | null
  const posts = raw.posts.map((p) => ({
    _id: p._id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    publishDate: p.publishDate,
    coverImageUrl: p.coverImage?.asset ? urlFor(p.coverImage.asset).width(800).height(600).url() : null,
    coverImageAlt: p.coverImage?.alt ?? null,
  }))
  return { ...raw, posts }
}

function mapRouteSection(raw: RouteSectionRaw | null): {
  heading: string
  description: string
  ctaButton: RouteSectionRaw['ctaButton']
  locations: RouteSectionLocation[]
} | null {
  if (!raw || !raw.enabled || !raw.heading) return null
  const locations: RouteSectionLocation[] = (raw.locations ?? []).slice(0, 4).map((loc) => ({
    name: loc.name ?? '',
    location: loc.location ?? '',
    imageUrl: loc.image?.asset ? urlFor(loc.image.asset).width(600).height(800).url() : null,
    alt: loc.image?.alt ?? null,
  }))
  return {
    heading: raw.heading,
    description: raw.description ?? '',
    ctaButton: raw.ctaButton ?? null,
    locations,
  }
}

export default async function HomePage() {
  let hero: HeroData | null = null
  let featureBar: FeatureBarItem[] | null = null
  let popularToursSection: PopularToursSectionData | null = null
  let aboutTeaser: AboutTeaserData | null = null
  let blogSection: BlogSectionData | null = null
  let routeSection: ReturnType<typeof mapRouteSection> = null
  let instagramSection: InstagramSectionData | null = null
  try {
    const data = await client.fetch<HomePageHeroResult>(homePageHeroQuery, {}, { useCdn: false })
    hero = data?.hero ?? null
    featureBar = data?.featureBar ?? null
    popularToursSection = mapPopularToursToCardItems(data?.popularToursSection ?? null)
    aboutTeaser = data?.aboutTeaser ?? null
    blogSection = mapBlogSection(data?.blogSection ?? null)
    routeSection = mapRouteSection(data?.routeSection ?? null)
    instagramSection = data?.instagramSection ?? null
  } catch {
    hero = null
    featureBar = null
    popularToursSection = null
    aboutTeaser = null
    blogSection = null
    routeSection = null
    instagramSection = null
  }

  return (
    <div className="min-h-screen bg-white">
      <HeroBanner hero={hero} />
      {featureBar && featureBar.length > 0 && <FeatureBar items={featureBar} />}
      <PopularToursSection data={popularToursSection} />
      {routeSection && (
        <RouteSection
          heading={routeSection.heading}
          description={routeSection.description}
          ctaButton={routeSection.ctaButton}
          locations={routeSection.locations}
        />
      )}
      <AboutTeaserSplit data={aboutTeaser} />
      <BlogSection data={blogSection} />
      <InstagramSection data={instagramSection} />
    </div>
  )
}
