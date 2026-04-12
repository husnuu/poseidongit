import { MetadataRoute } from 'next'
import { client } from '@/lib/sanity'
import { getBaseUrl } from '@/lib/seo'
import { tourSlugRowsForLocalesQuery } from '@/lib/queries'
import { canonicalRouteToPublicPath } from '@/lib/i18n/routeAliases'
import type { SiteLocale } from '@/lib/i18n/config'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const BASE = getBaseUrl()

type SiteLocaleKey = 'tr' | 'en' | 'de'

/** Kanonik iç path; EN/DE için hem önek hem slug’lar yerelleştirilir (örn. /hakkimizda → /en/about). */
function publicUrl(locale: SiteLocaleKey, path: string): string {
  const canonical = path === '/' ? '/' : path.startsWith('/') ? path : `/${path}`
  if (locale === 'tr') {
    const p = canonical === '/' ? '' : canonical
    return `${BASE}${p}`
  }
  const localized = canonicalRouteToPublicPath(locale as SiteLocale, canonical)
  const p = localized === '/' ? '' : localized
  return `${BASE}/${locale}${p}`
}

type SitemapEntry = { slug: string; lastModified: Date }

type TourLocaleRow = {
  tSlug?: string | null
  enSlug?: string | null
  deSlug?: string | null
  _updatedAt?: string
}

async function getTourSitemapRows(): Promise<TourLocaleRow[]> {
  try {
    return await client.fetch<TourLocaleRow[]>(tourSlugRowsForLocalesQuery)
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
  const [tourRows, blogEntriesRaw, legalEntriesRaw, yachtLocRaw, yachtDetailRaw] =
    await Promise.all([
      getTourSitemapRows(),
      getBlogEntries(),
      getLegalEntries(),
      getYachtLocationEntries(),
      getYachtDetailEntries(),
    ])

  const now = new Date()
  const locales: SiteLocaleKey[] = ['tr', 'en', 'de']
  const staticPaths = [
    '/',
    '/turlar',
    '/koylar',
    '/blog',
    '/hakkimizda',
    '/contact',
    '/sik-sorulanlar',
    '/rezervasyon',
    '/yat-kiralama',
    '/yardim-merkezi',
  ] as const

  function staticPriority(path: string): number {
    if (path === '/') return 1
    if (path === '/turlar') return 0.9
    if (path === '/yat-kiralama') return 0.85
    if (path === '/koylar' || path === '/blog') return 0.8
    if (path === '/rezervasyon') return 0.7
    if (path === '/yardim-merkezi') return 0.75
    return 0.6
  }

  const staticPages: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    locales.map((loc) => ({
      url: publicUrl(loc, path),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: staticPriority(path),
    }))
  )

  const tourEntries: MetadataRoute.Sitemap = []
  for (const row of tourRows ?? []) {
    const lm = row._updatedAt ? new Date(row._updatedAt) : now
    if (row.tSlug)
      tourEntries.push({
        url: publicUrl('tr', `/tur/${row.tSlug}`),
        lastModified: lm,
        changeFrequency: 'weekly',
        priority: 0.85,
      })
    if (row.enSlug)
      tourEntries.push({
        url: publicUrl('en', `/tur/${row.enSlug}`),
        lastModified: lm,
        changeFrequency: 'weekly',
        priority: 0.85,
      })
    if (row.deSlug)
      tourEntries.push({
        url: publicUrl('de', `/tur/${row.deSlug}`),
        lastModified: lm,
        changeFrequency: 'weekly',
        priority: 0.85,
      })
  }

  const blogEntries: MetadataRoute.Sitemap = blogEntriesRaw.flatMap(({ slug, lastModified }) =>
    locales.map((loc) => ({
      url: publicUrl(loc, `/blog/${slug}`),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  )

  const legalEntries: MetadataRoute.Sitemap = legalEntriesRaw.flatMap(({ slug, lastModified }) =>
    locales.map((loc) => ({
      url: publicUrl(loc, `/yasal/${slug}`),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))
  )

  const yachtLocationEntries: MetadataRoute.Sitemap = yachtLocRaw.flatMap(({ slug, lastModified }) =>
    locales.map((loc) => ({
      url: publicUrl(loc, `/yat-kiralama/${slug}`),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  )

  const yachtDetailEntries: MetadataRoute.Sitemap = yachtDetailRaw.flatMap(({ path, lastModified }) =>
    locales.map((loc) => ({
      url: publicUrl(loc, path),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.82,
    }))
  )

  return [
    ...staticPages,
    ...tourEntries,
    ...blogEntries,
    ...legalEntries,
    ...yachtLocationEntries,
    ...yachtDetailEntries,
  ]
}
