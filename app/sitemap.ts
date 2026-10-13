import { MetadataRoute } from 'next'
import { client } from '@/lib/sanity'
import { getBaseUrl } from '@/lib/seo'
import { tourSlugRowsForLocalesQuery } from '@/lib/queries'
import { STATIC_HELP_CATEGORIES } from '@/lib/helpCenter/staticHelpData'
import { STATIC_UPDATED_AT } from '@/lib/helpCenter/staticHelpResolve'
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
  ] = await Promise.all([
    getTourSitemapRows(),
    getBlogEntries(),
    getLegalEntries(),
    getYachtLocationEntries(),
    getYachtDetailEntries(),
    getFerryRouteEntries(),
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
    // NOT: '/rezervasyon' BURAYA eklenmiyor — app/(site)/[locale]/rezervasyon/
    // altında yalnızca [tourSlug]/ ve yonet/ var, kendi page.tsx'i yok;
    // eskiden buradaki girdi 4 dilde 404 veren "soft-404" URL üretiyordu.
    '/yat-kiralama',
    '/yat-kapora',
    '/yardim-merkezi',
    '/feribot',
  ] as const

  function staticPriority(path: string): number {
    if (path === '/') return 1
    if (path === '/turlar') return 0.9
    if (path === '/yat-kiralama') return 0.85
    if (path === '/feribot') return 0.8
    if (path === '/koylar' || path === '/blog' || path === '/menu') return 0.8
    if (path === '/yat-kapora') return 0.6
    if (path === '/yardim-merkezi') return 0.75
    return 0.6
  }

  // Bu statik rotalar birden fazla Sanity bölümünün toplamı — tek bir
  // gerçek "son güncelleme" zaman damgası yok. Her build'de "bugün
  // güncellendi" demek (eskiden: lastModified: now) gerçeği yansıtmıyordu;
  // bilinmeyen bir tarihi uydurmaktansa alanı boş bırakmak Google için
  // daha dürüst bir sinyal.
  const staticPages: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    locales.map((loc) => ({
      url: publicUrl(loc, path),
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

  // Yardım merkezi içeriği Sanity'den DEĞİL, kod içi statik veriden geliyor
  // (lib/helpCenter/staticHelpData.ts — bkz. lib/sanity/fetchers/helpCenter.ts
  // yorumu) ve slug her dilde AYNI (yalnızca başlık/metin çalışma zamanında
  // çevriliyor). Eskiden burada hâlâ kullanılmayan bir Sanity `helpCategory`/
  // `helpArticle` koleksiyonu sorgulanıyordu — gerçek sayfalarla eşleşmeyen
  // (muhtemelen boş) URL'ler üretiyordu.
  const helpCategoryEntries: MetadataRoute.Sitemap = STATIC_HELP_CATEGORIES.flatMap((cat) =>
    locales.map((loc) => ({
      url: publicUrl(loc, `/yardim-merkezi/kategori/${cat.slug}`),
      lastModified: new Date(STATIC_UPDATED_AT),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))
  )

  const helpArticleEntries: MetadataRoute.Sitemap = STATIC_HELP_CATEGORIES.flatMap((cat) =>
    cat.articles.flatMap((art) =>
      locales.map((loc) => ({
        url: publicUrl(loc, `/yardim-merkezi/${cat.slug}/${art.slug}`),
        lastModified: new Date(STATIC_UPDATED_AT),
        changeFrequency: 'monthly' as const,
        priority: 0.55,
      }))
    )
  )

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
