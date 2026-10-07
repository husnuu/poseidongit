import { MetadataRoute } from 'next'
import { client } from '@/lib/sanity'
import { getBaseUrl } from '@/lib/seo'
import { tourSlugRowsForLocalesQuery } from '@/lib/queries'
import { helpArticleSlugsByLocaleQuery } from '@/lib/sanity/queries/helpCenter'
import { canonicalRouteToPublicPath } from '@/lib/i18n/routeAliases'
import type { SiteLocale } from '@/lib/i18n/config'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const BASE = getBaseUrl()

type SiteLocaleKey = 'tr' | 'en' | 'de' | 'ru'

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
  ruSlug?: string | null
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

/** Feribot bilet hatları — slug locale bazında değişmiyor (tek segment, /feribot/[slug]). */
async function getFerryRouteEntries(): Promise<SitemapEntry[]> {
  try {
    const list = await client.fetch<{ slug: string | null; _updatedAt: string }[]>(
      `*[_type == "ferryRoute" && isActive != false && defined(slug.current)]{ "slug": slug.current, _updatedAt }`
    )
    return (list ?? [])
      .filter((r): r is { slug: string; _updatedAt: string } => Boolean(r.slug))
      .map((r) => ({
        slug: r.slug,
        lastModified: r._updatedAt ? new Date(r._updatedAt) : new Date(),
      }))
  } catch {
    return []
  }
}

/** Yardım merkezi kategorileri — TR/EN/DE çeviri slug'ları ayrı alanlarda tutuluyor. */
async function getHelpCategorySitemapRows(): Promise<
  {
    trSlug?: string | null
    enSlug?: string | null
    deSlug?: string | null
    ruSlug?: string | null
    _updatedAt?: string
  }[]
> {
  try {
    return await client.fetch(
      `*[_type == "helpCategory" && defined(slug.current)]{
        "trSlug": slug.current,
        "enSlug": translations.en.slug.current,
        "deSlug": translations.de.slug.current,
        "ruSlug": translations.ru.slug.current,
        _updatedAt
      }`
    )
  } catch {
    return []
  }
}

type HelpArticleLocaleRow = {
  trCat?: string | null
  trArt?: string | null
  enCat?: string | null
  enArt?: string | null
  deCat?: string | null
  deArt?: string | null
  ruCat?: string | null
  ruArt?: string | null
}

async function getHelpArticleSitemapRows(): Promise<HelpArticleLocaleRow[]> {
  try {
    return await client.fetch<HelpArticleLocaleRow[]>(helpArticleSlugsByLocaleQuery)
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
  const [
    tourRows,
    blogEntriesRaw,
    legalEntriesRaw,
    yachtLocRaw,
    yachtDetailRaw,
    ferryRouteEntriesRaw,
    helpCategoryRows,
    helpArticleRows,
  ] = await Promise.all([
    getTourSitemapRows(),
    getBlogEntries(),
    getLegalEntries(),
    getYachtLocationEntries(),
    getYachtDetailEntries(),
    getFerryRouteEntries(),
    getHelpCategorySitemapRows(),
    getHelpArticleSitemapRows(),
  ])

  const now = new Date()
  const locales: SiteLocaleKey[] = ['tr', 'en', 'de', 'ru']
  const staticPaths = [
    '/',
    '/turlar',
    '/koylar',
    '/blog',
    '/hakkimizda',
    '/contact',
    '/menu',
    '/sik-sorulanlar',
    '/rezervasyon',
    '/yat-kiralama',
    '/yardim-merkezi',
    '/feribot',
  ] as const

  function staticPriority(path: string): number {
    if (path === '/') return 1
    if (path === '/turlar') return 0.9
    if (path === '/yat-kiralama') return 0.85
    if (path === '/feribot') return 0.8
    if (path === '/koylar' || path === '/blog' || path === '/menu') return 0.8
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
    if (row.ruSlug)
      tourEntries.push({
        url: publicUrl('ru', `/tur/${row.ruSlug}`),
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

  const ferryRouteEntries: MetadataRoute.Sitemap = ferryRouteEntriesRaw.flatMap(({ slug, lastModified }) =>
    locales.map((loc) => ({
      url: publicUrl(loc, `/feribot/${slug}`),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }))
  )

  const helpCategoryEntries: MetadataRoute.Sitemap = []
  for (const row of helpCategoryRows ?? []) {
    const lm = row._updatedAt ? new Date(row._updatedAt) : now
    if (row.trSlug)
      helpCategoryEntries.push({
        url: publicUrl('tr', `/yardim-merkezi/kategori/${row.trSlug}`),
        lastModified: lm,
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    if (row.enSlug)
      helpCategoryEntries.push({
        url: publicUrl('en', `/yardim-merkezi/kategori/${row.enSlug}`),
        lastModified: lm,
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    if (row.deSlug)
      helpCategoryEntries.push({
        url: publicUrl('de', `/yardim-merkezi/kategori/${row.deSlug}`),
        lastModified: lm,
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    if (row.ruSlug)
      helpCategoryEntries.push({
        url: publicUrl('ru', `/yardim-merkezi/kategori/${row.ruSlug}`),
        lastModified: lm,
        changeFrequency: 'monthly',
        priority: 0.5,
      })
  }

  const helpArticleEntries: MetadataRoute.Sitemap = []
  for (const row of helpArticleRows ?? []) {
    if (row.trCat && row.trArt)
      helpArticleEntries.push({
        url: publicUrl('tr', `/yardim-merkezi/${row.trCat}/${row.trArt}`),
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.55,
      })
    if (row.enCat && row.enArt)
      helpArticleEntries.push({
        url: publicUrl('en', `/yardim-merkezi/${row.enCat}/${row.enArt}`),
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.55,
      })
    if (row.deCat && row.deArt)
      helpArticleEntries.push({
        url: publicUrl('de', `/yardim-merkezi/${row.deCat}/${row.deArt}`),
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.55,
      })
    if (row.ruCat && row.ruArt)
      helpArticleEntries.push({
        url: publicUrl('ru', `/yardim-merkezi/${row.ruCat}/${row.ruArt}`),
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.55,
      })
  }

  return [
    ...staticPages,
    ...tourEntries,
    ...blogEntries,
    ...legalEntries,
    ...yachtLocationEntries,
    ...yachtDetailEntries,
    ...ferryRouteEntries,
    ...helpCategoryEntries,
    ...helpArticleEntries,
  ]
}
