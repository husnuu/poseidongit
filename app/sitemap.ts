import { MetadataRoute } from 'next'
import { client } from '@/lib/sanity'
import { getBaseUrl } from '@/lib/seo'
import { coveSlugRowsForLocalesQuery, tourSlugRowsForLocalesQuery } from '@/lib/queries'
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
  image?: string | null
  noIndex?: boolean | null
  _updatedAt?: string
}

/** Sitemap'teki her URL için hreflang alternatifleri (Google bunu sayfadaki
 * <link rel="alternate"> ile birlikte değerlendirir). */
function languageAlternates(paths: Partial<Record<SiteLocaleKey, string>>): { languages: Record<string, string> } {
  const languages: Record<string, string> = {}
  for (const [loc, path] of Object.entries(paths) as [SiteLocaleKey, string | undefined][]) {
    if (path) languages[loc] = publicUrl(loc, path)
  }
  if (paths.tr) languages['x-default'] = publicUrl('tr', paths.tr)
  return { languages }
}

/** Slug'ı her dilde aynı olan sayfalar (blog, yat, feribot, yardım merkezi). */
function samePathAlternates(path: string) {
  return languageAlternates({ tr: path, en: path, de: path, ru: path })
}

/** Her dilin kendi slug'u; çevirisi yoksa Türkçe slug (sayfa anlık çeviriyle açılır). */
function slugsWithFallback(row: TourLocaleRow): Record<SiteLocaleKey, string> | null {
  if (!row.tSlug) return null
  return {
    tr: row.tSlug,
    en: row.enSlug || row.tSlug,
    de: row.deSlug || row.tSlug,
    ru: row.ruSlug || row.tSlug,
  }
}

async function getTourSitemapRows(): Promise<TourLocaleRow[]> {
  try {
    return await client.fetch<TourLocaleRow[]>(tourSlugRowsForLocalesQuery)
  } catch {
    return []
  }
}

async function getCoveSitemapRows(): Promise<TourLocaleRow[]> {
  try {
    return await client.fetch<TourLocaleRow[]>(coveSlugRowsForLocalesQuery)
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

type LegalSitemapRow = {
  slug: string | null
  enTitle?: string | null
  enSlug?: string | null
  deTitle?: string | null
  deSlug?: string | null
  _updatedAt: string
}

/** Yasal sayfalar makine çevirisiyle gösterilmez: yalnızca elle çevrilmiş
 * diller listelenir (çevrilmemiş sürüm Türkçe sayfayı kanonik gösterir). */
async function getLegalEntries(): Promise<{ paths: Partial<Record<SiteLocaleKey, string>>; lastModified: Date }[]> {
  try {
    const list = await client.fetch<LegalSitemapRow[]>(
      `*[_type == "legalPage" && defined(slug.current)]{
        "slug": slug.current,
        "enTitle": translations.en.title, "enSlug": translations.en.slug.current,
        "deTitle": translations.de.title, "deSlug": translations.de.slug.current,
        _updatedAt
      }`
    )
    return (list ?? [])
      .filter((l): l is LegalSitemapRow & { slug: string } => Boolean(l.slug))
      .map((l) => {
        const paths: Partial<Record<SiteLocaleKey, string>> = { tr: `/yasal/${l.slug}` }
        if (l.enTitle?.trim()) paths.en = `/yasal/${l.enSlug || l.slug}`
        if (l.deTitle?.trim()) paths.de = `/yasal/${l.deSlug || l.slug}`
        return { paths, lastModified: l._updatedAt ? new Date(l._updatedAt) : new Date() }
      })
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
    coveRows,
  ] = await Promise.all([
    getTourSitemapRows(),
    getBlogEntries(),
    getLegalEntries(),
    getYachtLocationEntries(),
    getYachtDetailEntries(),
    getFerryRouteEntries(),
    getCoveSitemapRows(),
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
    '/yardim-merkezi',
    '/feribot',
  ] as const

  function staticPriority(path: string): number {
    if (path === '/') return 1
    if (path === '/turlar') return 0.9
    if (path === '/yat-kiralama') return 0.85
    if (path === '/feribot') return 0.8
    if (path === '/koylar' || path === '/blog' || path === '/menu') return 0.8
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
      alternates: samePathAlternates(path),
    }))
  )

  // Tur ve koy detayları — çeviri slug'ı yoksa o dilde Türkçe slug kullanılır
  // (sayfalar anlık çeviriyle açılıyor; eskiden DE/RU tur sayfaları hiç listelenmiyordu).
  const detailEntries = (
    rows: TourLocaleRow[],
    segment: string,
    priority: number,
    changeFrequency: 'weekly' | 'monthly'
  ): MetadataRoute.Sitemap =>
    rows.flatMap((row) => {
      if (row.noIndex) return []
      const slugs = slugsWithFallback(row)
      if (!slugs) return []
      const lastModified = row._updatedAt ? new Date(row._updatedAt) : now
      const paths = Object.fromEntries(locales.map((l) => [l, `/${segment}/${slugs[l]}`])) as Record<SiteLocaleKey, string>
      return locales.map((loc) => ({
        url: publicUrl(loc, paths[loc]),
        lastModified,
        changeFrequency,
        priority,
        alternates: languageAlternates(paths),
        ...(row.image ? { images: [row.image] } : {}),
      }))
    })

  const tourEntries = detailEntries(tourRows ?? [], 'tur', 0.9, 'weekly')
  const coveEntries = detailEntries(coveRows ?? [], 'koylar', 0.7, 'monthly')

  const blogEntries: MetadataRoute.Sitemap = blogEntriesRaw.flatMap(({ slug, lastModified }) =>
    locales.map((loc) => ({
      url: publicUrl(loc, `/blog/${slug}`),
      alternates: samePathAlternates(`/blog/${slug}`),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  )

  const legalEntries: MetadataRoute.Sitemap = legalEntriesRaw.flatMap(({ paths, lastModified }) =>
    (Object.entries(paths) as [SiteLocaleKey, string][]).map(([loc, path]) => ({
      url: publicUrl(loc, path),
      lastModified,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
      alternates: languageAlternates(paths),
    }))
  )

  const yachtLocationEntries: MetadataRoute.Sitemap = yachtLocRaw.flatMap(({ slug, lastModified }) =>
    locales.map((loc) => ({
      url: publicUrl(loc, `/yat-kiralama/${slug}`),
      alternates: samePathAlternates(`/yat-kiralama/${slug}`),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  )

  const yachtDetailEntries: MetadataRoute.Sitemap = yachtDetailRaw.flatMap(({ path, lastModified }) =>
    locales.map((loc) => ({
      url: publicUrl(loc, path),
      alternates: samePathAlternates(path),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.82,
    }))
  )

  const ferryRouteEntries: MetadataRoute.Sitemap = ferryRouteEntriesRaw.flatMap(({ slug, lastModified }) =>
    locales.map((loc) => ({
      url: publicUrl(loc, `/feribot/${slug}`),
      alternates: samePathAlternates(`/feribot/${slug}`),
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
      alternates: samePathAlternates(`/yardim-merkezi/kategori/${cat.slug}`),
      lastModified: new Date(STATIC_UPDATED_AT),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))
  )

  const helpArticleEntries: MetadataRoute.Sitemap = STATIC_HELP_CATEGORIES.flatMap((cat) =>
    cat.articles.flatMap((art) =>
      locales.map((loc) => ({
        url: publicUrl(loc, `/yardim-merkezi/${cat.slug}/${art.slug}`),
      alternates: samePathAlternates(`/yardim-merkezi/${cat.slug}/${art.slug}`),
        lastModified: new Date(STATIC_UPDATED_AT),
        changeFrequency: 'monthly' as const,
        priority: 0.55,
      }))
    )
  )

  return [
    ...staticPages,
    ...tourEntries,
    ...coveEntries,
    ...blogEntries,
    ...legalEntries,
    ...yachtLocationEntries,
    ...yachtDetailEntries,
    ...ferryRouteEntries,
    ...helpCategoryEntries,
    ...helpArticleEntries,
  ]
}
