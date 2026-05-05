import { client, urlFor } from '@/lib/sanity'
import { blogsListQuery, blogPageMetaQuery, blogPageQuery } from '@/lib/queries'
import CompactBlogCard from '@/components/blog/CompactBlogCard'
import { getBaseUrl, getSiteName } from '@/lib/seo'
import type { Metadata } from 'next'
import styles from './blog.module.css'
import { notFound } from 'next/navigation'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { mergeBlogPageLocale, mergeBlogPageSeoForLocale } from '@/lib/i18n/mergeBlogPageLocale'
import { mergeBlogForLocale } from '@/lib/i18n/mergeBlogForLocale'
import { getBlogPageUiStrings } from '@/lib/i18n/strings/blogPage'

const siteName = getSiteName()

interface BlogItem {
  _id: string
  title: string
  slug: string
  excerpt?: string
  coverImage?: {
    asset?: { _ref?: string; _type?: string }
    url?: string
    metadata?: { lqip?: string; dimensions?: { width: number; height: number } }
    alt?: string
  }
  author?: string
  publishDate?: string
  readTime?: string
  readingTime?: number | null
  category?: string
  tags?: string[]
  translations?: unknown
}

interface BlogPageContent {
  seo?: { metaTitle?: string | null; metaDescription?: string | null } | null
  heroTitle?: string
  heroHighlightTitlePart?: string
  heroDescription?: string
  emptyListMessage?: string
  pageTranslations?: unknown
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: loc } = await params
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'tr'
  const ui = getBlogPageUiStrings(locale)
  const blogPath = withLocalePath(locale, '/blog')
  const canonical =
    blogPath === '/' ? getBaseUrl() : `${getBaseUrl()}${blogPath}`

  try {
    const row = await client.fetch<{
      seo?: { metaTitle?: string | null; metaDescription?: string | null } | null
      pageTranslations?: { en?: Record<string, unknown>; de?: Record<string, unknown> }
    } | null>(blogPageMetaQuery)
    const seo = mergeBlogPageSeoForLocale(
      row?.seo as Record<string, unknown> | undefined,
      row?.pageTranslations,
      locale,
    ) as { metaTitle?: string | null; metaDescription?: string | null } | null | undefined
    const titleBase = seo?.metaTitle?.trim() ?? ui.blogListTitleSuffix
    const title =
      titleBase.includes('|') || !siteName
        ? titleBase
        : `${titleBase} | ${siteName}`
    const description =
      seo?.metaDescription?.trim()?.slice(0, 160) ?? ui.blogListDefaultDescription
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
      },
    }
  } catch {
    const title = siteName ? `${ui.blogListTitleSuffix} | ${siteName}` : ui.blogListTitleSuffix
    return {
      title,
      description: ui.blogListDefaultDescription,
      alternates: { canonical },
      openGraph: { title, description: ui.blogListDefaultDescription, url: canonical },
    }
  }
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale
  const ui = getBlogPageUiStrings(locale)

  let pageContent: BlogPageContent | null = null
  let blogs: BlogItem[] = []

  try {
    const [content, list] = await Promise.all([
      client.fetch<BlogPageContent | null>(blogPageQuery),
      client.fetch<BlogItem[]>(blogsListQuery),
    ])
    const mergedPage = mergeBlogPageLocale(
      (content ?? null) as unknown as Record<string, unknown> | null,
      locale,
    ) as BlogPageContent | null
    pageContent = mergedPage
    blogs = Array.isArray(list) ? list : []
  } catch (err) {
    console.error('Blog page fetch error:', err)
  }

  const line1 = pageContent?.heroTitle ?? 'BLOG'
  const line2 = pageContent?.heroHighlightTitlePart ?? 'YAZILARI'
  const leadText =
    pageContent?.heroDescription ??
    (locale === 'tr'
      ? 'Çeşme, tekne turları ve tatil ipuçları. Deneyimler ve rehberler.'
      : locale === 'en'
        ? 'Çeşme, boat tours, and travel tips — guides and stories.'
        : 'Çeşme, Bootstouren und Reisetipps — Erlebnisse und Ratgeber.')

  const emptyMsg =
    pageContent?.emptyListMessage ??
    (locale === 'tr'
      ? 'Henüz blog yazısı yok. Sanity Studio üzerinden ekleyebilirsiniz.'
      : locale === 'en'
        ? 'No blog posts yet. You can add them in Sanity Studio.'
        : 'Noch keine Blogbeiträge. Sie können sie in Sanity Studio anlegen.')

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <h1 className={styles.heroH1}>
            <span className={styles.heroH1Line1}>{line1}</span>
            <span className={styles.heroH1Line2}>{line2}</span>
          </h1>
          <p className={styles.heroLead}>{leadText}</p>
        </div>
      </section>

      <section className={styles.gridSection}>
        <div className={styles.gridContainer}>
          {blogs?.length > 0 ? (
            <div className={styles.blogsGrid}>
              {blogs.map((blog) => {
                const merged = mergeBlogForLocale(
                  blog as unknown as Record<string, unknown>,
                  locale,
                ) as unknown as BlogItem
                const coverImageUrl =
                  merged.coverImage?.asset != null
                    ? urlFor(merged.coverImage.asset).width(800).height(600).url()
                    : null
                return (
                  <CompactBlogCard
                    key={blog._id}
                    post={{
                      _id: merged._id,
                      title: merged.title,
                      slug: merged.slug,
                      coverImageUrl,
                      coverImageAlt: merged.coverImage?.alt ?? null,
                    }}
                    locale={locale}
                    noImageLabel={ui.noCoverImage}
                    imageSizes="(max-width: 640px) min(100vw, 400px), (max-width: 1024px) 45vw, 300px"
                  />
                )
              })}
            </div>
          ) : (
            <p className={styles.empty}>{emptyMsg}</p>
          )}
        </div>
      </section>
    </main>
  )
}
