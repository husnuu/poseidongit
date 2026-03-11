import { MetadataRoute } from 'next'
import { client } from '@/lib/sanity'
import { getBaseUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const BASE = getBaseUrl()

async function getTourSlugs(): Promise<string[]> {
  try {
    const list = await client.fetch<{ slug: string | null }[]>(
      `*[_type == "tour" && defined(slug.current)]{ "slug": slug.current }`
    )
    return (list ?? []).map((t) => t.slug).filter((s): s is string => Boolean(s))
  } catch {
    return []
  }
}

async function getBlogSlugs(): Promise<string[]> {
  try {
    const list = await client.fetch<{ slug: string | null }[]>(
      `*[_type == "blog" && defined(slug.current)]{ "slug": slug.current }`
    )
    return (list ?? []).map((b) => b.slug).filter((s): s is string => Boolean(s))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tourSlugs, blogSlugs] = await Promise.all([
    getTourSlugs(),
    getBlogSlugs(),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/turlar`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/koylar`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/hakkimizda`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/rezervasyon`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]

  const tourEntries: MetadataRoute.Sitemap = tourSlugs.map((slug) => ({
    url: `${BASE}/tour/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

  const blogEntries: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${BASE}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...tourEntries, ...blogEntries]
}
