import { MetadataRoute } from 'next'
import { client } from '@/lib/sanity'
import { getBaseUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const BASE = getBaseUrl()

type SitemapEntry = { slug: string; lastModified: Date }

async function getTourEntries(): Promise<SitemapEntry[]> {
  try {
    const list = await client.fetch<{ slug: string | null; _updatedAt: string }[]>(
      `*[_type == "tour" && defined(slug.current)]{ "slug": slug.current, _updatedAt }`
    )
    return (list ?? [])
      .filter((t): t is { slug: string; _updatedAt: string } => Boolean(t.slug))
      .map((t) => ({
        slug: t.slug,
        lastModified: t._updatedAt ? new Date(t._updatedAt) : new Date(),
      }))
  } catch {
    return []
  }
}

async function getBlogEntries(): Promise<SitemapEntry[]> {
  try {
    const list = await client.fetch<{ slug: string | null; _updatedAt: string }[]>(
      `*[_type == "blog" && defined(slug.current)]{ "slug": slug.current, _updatedAt }`
    )
    return (list ?? [])
      .filter((b): b is { slug: string; _updatedAt: string } => Boolean(b.slug))
      .map((b) => ({
        slug: b.slug,
        lastModified: b._updatedAt ? new Date(b._updatedAt) : new Date(),
      }))
  } catch {
    return []
  }
}

async function getYachtLocationEntries(): Promise<SitemapEntry[]> {
  try {
    const list = await client.fetch<{ slug: string | null; _updatedAt: string }[]>(
      `*[_type == "yachtLocation" && defined(slug.current)]{ "slug": slug.current, _updatedAt }`
    )
    return (list ?? [])
      .filter((l): l is { slug: string; _updatedAt: string } => Boolean(l.slug))
      .map((l) => ({
        slug: l.slug,
        lastModified: l._updatedAt ? new Date(l._updatedAt) : new Date(),
      }))
  } catch {
    return []
  }
}

type YachtSitemapRow = {
  slug: string | null
  locationSlug?: string | null
  _updatedAt?: string
}

async function getYachtDetailEntries(): Promise<{ path: string; lastModified: Date }[]> {
  try {
    const list = await client.fetch<YachtSitemapRow[]>(
      `*[_type == "yachtRental" && isActive == true && defined(slug.current)]{
        "slug": slug.current,
        "locationSlug": location->slug.current,
        _updatedAt
      }`
    )
    const out: { path: string; lastModified: Date }[] = []
    for (const row of list ?? []) {
      if (!row.slug) continue
      const lastModified = row._updatedAt ? new Date(row._updatedAt) : new Date()
      const path =
        row.locationSlug && row.locationSlug.length > 0
          ? `/yat-kiralama/${row.locationSlug}/${row.slug}`
          : `/yat-kiralama/${row.slug}`
      out.push({ path, lastModified })
    }
    return out
  } catch {
    return []
  }
}

async function getLegalEntries(): Promise<SitemapEntry[]> {
  try {
    const list = await client.fetch<{ slug: string | null; _updatedAt: string }[]>(
      `*[_type == "legalPage" && defined(slug.current)]{ "slug": slug.current, _updatedAt }`
    )
    return (list ?? [])
      .filter((l): l is { slug: string; _updatedAt: string } => Boolean(l.slug))
      .map((l) => ({
        slug: l.slug,
        lastModified: l._updatedAt ? new Date(l._updatedAt) : new Date(),
      }))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tourEntriesRaw, blogEntriesRaw, legalEntriesRaw, yachtLocRaw, yachtDetailRaw] =
    await Promise.all([
      getTourEntries(),
      getBlogEntries(),
      getLegalEntries(),
      getYachtLocationEntries(),
      getYachtDetailEntries(),
    ])

  const now = new Date()
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/turlar`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/koylar`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/hakkimizda`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/sik-sorulanlar`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/rezervasyon`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/yat-kiralama`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
  ]

  const tourEntries: MetadataRoute.Sitemap = tourEntriesRaw.map(({ slug, lastModified }) => ({
    url: `${BASE}/tour/${slug}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

  const blogEntries: MetadataRoute.Sitemap = blogEntriesRaw.map(({ slug, lastModified }) => ({
    url: `${BASE}/blog/${slug}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const legalEntries: MetadataRoute.Sitemap = legalEntriesRaw.map(({ slug, lastModified }) => ({
    url: `${BASE}/yasal/${slug}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  const yachtLocationEntries: MetadataRoute.Sitemap = yachtLocRaw.map(({ slug, lastModified }) => ({
    url: `${BASE}/yat-kiralama/${slug}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const yachtDetailEntries: MetadataRoute.Sitemap = yachtDetailRaw.map(({ path, lastModified }) => ({
    url: `${BASE}${path}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.82,
  }))

  return [
    ...staticPages,
    ...tourEntries,
    ...blogEntries,
    ...legalEntries,
    ...yachtLocationEntries,
    ...yachtDetailEntries,
  ]
}
