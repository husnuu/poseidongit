import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Clock } from 'lucide-react'
import { client, urlFor } from '@/lib/sanity'
import { blogBySlugQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import JsonLd from '@/components/seo/JsonLd'
import {
  buildBreadcrumbSchema,
  buildBlogPostingSchema,
  absoluteUrl,
  getSiteName,
} from '@/lib/seo'
import styles from './BlogPost.module.css'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { alternateLanguageAbsoluteUrls } from '@/lib/seo/alternateLanguages'
import { mergeBlogForLocale } from '@/lib/i18n/mergeBlogForLocale'
import { tourFieldHasManualTranslation } from '@/lib/i18n/mergeTourForLocale'
import { getBlogPageUiStrings } from '@/lib/i18n/strings/blogPage'
import { dateLocaleForSite } from '@/lib/i18n/dateLocale'
import { translateText, translatePortableTextBlocks, translateTextArray } from '@/lib/i18n/runtimeTranslate'

interface BlogPost {
  _id: string
  title: string
  slug: string
  excerpt?: string
  content?: PortableTextBlock[]
  coverImage?: {
    asset?: { _ref?: string }
    url?: string
    metadata?: { lqip?: string; dimensions?: { width: number; height: number } }
    alt?: string
  }
  author?: string
  authorName?: string
  publishDate?: string
  readTime?: string
  readingTime?: number | null
  category?: string
  tags?: string[]
  _updatedAt?: string
  translations?: unknown
  seo?: {
    metaTitle?: string | null
    metaDescription?: string | null
    ogImage?: { asset?: { _ref?: string } } | null
  } | null
}

/** Yazar fotoğrafı CMS'te yok — gerçek olmayan bir yüz uydurmak yerine isim
    baş harflerinden (örn. "Ergun Dündar" → "ED") rozet üretiyoruz. */
function authorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.slice(0, 2).map((p) => p[0]?.toLocaleUpperCase('tr') ?? '')
  return letters.join('') || '?'
}

function formatDate(dateString: string | undefined, dateLocale: string): string {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString(dateLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { slug, locale: loc } = await params
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'tr'
  const ui = getBlogPageUiStrings(locale)
  const post = await client.fetch<BlogPost | null>(blogBySlugQuery, { slug })
  if (!post) return { title: ui.postNotFoundTitle }
  const rawPost = post as unknown as Record<string, unknown>
  const merged = mergeBlogForLocale(rawPost, locale) as unknown as BlogPost
  const siteName = getSiteName()
  const hasManualTitle = tourFieldHasManualTranslation(rawPost, locale, 'title')
  const hasManualSeoTitle = tourFieldHasManualTranslation(rawPost, locale, 'seo')
  const translatedTitle = hasManualTitle ? merged.title : await translateText(merged.title, locale)
  const metaTitleRaw = merged.seo?.metaTitle?.trim() || translatedTitle
  const metaTitle = hasManualSeoTitle || !merged.seo?.metaTitle?.trim()
    ? metaTitleRaw
    : await translateText(metaTitleRaw, locale)
  const title = siteName ? `${metaTitle} | ${ui.blogListTitleSuffix} | ${siteName}` : `${metaTitle} | ${ui.blogListTitleSuffix}`
  const descriptionRaw = merged.seo?.metaDescription?.trim() || merged.excerpt || translatedTitle
  const descriptionTranslated =
    hasManualSeoTitle || !merged.seo?.metaDescription?.trim()
      ? descriptionRaw
      : await translateText(descriptionRaw, locale)
  const description = descriptionTranslated.replace(/\s+/g, ' ').slice(0, 160) || title
  const pathSlug = typeof merged.slug === 'string' ? merged.slug : slug
  const url = absoluteUrl(withLocalePath(locale, `/blog/${pathSlug}`))
  const ogFromSeo = merged.seo?.ogImage?.asset
  const image = ogFromSeo
    ? urlFor(ogFromSeo).width(1200).height(630).url()
    : merged.coverImage?.asset
      ? urlFor(merged.coverImage.asset).width(1200).height(630).url()
      : merged.coverImage?.url ?? undefined
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: alternateLanguageAbsoluteUrls(`/blog/${pathSlug}`),
    },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      locale: locale === 'tr' ? 'tr_TR' : locale === 'en' ? 'en_US' : locale === 'de' ? 'de_DE' : 'ru_RU',
      ...(siteName ? { siteName } : {}),
      publishedTime: merged.publishDate ?? undefined,
      modifiedTime: merged._updatedAt ?? undefined,
      authors: merged.author ? [merged.author] : undefined,
      images: image ? [{ url: image, width: 1200, height: 630, alt: translatedTitle }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { slug, locale: loc } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale = loc as SiteLocale
  const ui = getBlogPageUiStrings(locale)
  const dateLocale = dateLocaleForSite(locale)

  const post = await client.fetch<BlogPost | null>(blogBySlugQuery, { slug })

  if (!post) notFound()

  const rawPost = post as unknown as Record<string, unknown>
  const merged = mergeBlogForLocale(rawPost, locale) as unknown as BlogPost

  const title = tourFieldHasManualTranslation(rawPost, locale, 'title')
    ? merged.title
    : await translateText(merged.title, locale)
  const excerpt = merged.excerpt
    ? tourFieldHasManualTranslation(rawPost, locale, 'excerpt')
      ? merged.excerpt
      : await translateText(merged.excerpt, locale)
    : merged.excerpt
  const content =
    merged.content && merged.content.length > 0
      ? tourFieldHasManualTranslation(rawPost, locale, 'content')
        ? merged.content
        : await translatePortableTextBlocks(merged.content, locale)
      : merged.content
  const tags =
    merged.tags && merged.tags.length > 0
      ? tourFieldHasManualTranslation(rawPost, locale, 'tags')
        ? merged.tags
        : await translateTextArray(merged.tags, locale)
      : merged.tags

  const coverUrl = merged.coverImage?.asset
    ? urlFor(merged.coverImage.asset).width(1200).height(630).url()
    : merged.coverImage?.url ?? null

  const pathSlug = typeof merged.slug === 'string' ? merged.slug : slug
  const blogListPath = withLocalePath(locale, '/blog')
  const postPath = withLocalePath(locale, `/blog/${pathSlug}`)
  const postUrl = absoluteUrl(postPath)
  const homeLabel =
    locale === 'tr' ? 'Ana Sayfa' : locale === 'en' ? 'Home' : locale === 'de' ? 'Startseite' : 'Главная'
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: homeLabel, url: withLocalePath(locale, '/') },
    { name: ui.blogListTitleSuffix, url: blogListPath },
    { name: title, url: postPath },
  ])
  const blogPostingSchema = buildBlogPostingSchema({
    title,
    description: excerpt ?? undefined,
    url: postUrl,
    image: coverUrl ?? undefined,
    datePublished: merged.publishDate ?? undefined,
    author: merged.author ?? undefined,
  })

  return (
    <main className="min-h-screen bg-zinc-50">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={blogPostingSchema} />
      <article className={styles.article}>
        <header className={styles.header}>
          <h1 className={`${styles.title} pageHeroTitleStroke`}>{title}</h1>

          {excerpt && <p className={styles.lead}>{excerpt}</p>}

          {(merged.author || merged.publishDate || merged._updatedAt) && (
            <div className={styles.authorRow}>
              {merged.author && (
                <>
                  <span className={styles.avatar} aria-hidden>
                    {authorInitials(merged.author)}
                  </span>
                  <span className={styles.authorName}>{merged.author}</span>
                </>
              )}
              {(merged._updatedAt || merged.publishDate) && (
                <span className={styles.updatedWrap}>
                  <Clock className={styles.updatedIcon} size={15} strokeWidth={2} aria-hidden />
                  <span>
                    {ui.updatedLabel}: {formatDate(merged._updatedAt ?? merged.publishDate, dateLocale)}
                  </span>
                </span>
              )}
            </div>
          )}
        </header>

        <hr className={styles.headerDivider} />

        {coverUrl && (
          <div className={styles.coverWrap}>
            <Image
              src={coverUrl}
              alt={merged.coverImage?.alt || title}
              width={1200}
              height={630}
              className={styles.coverImage}
              priority
            />
          </div>
        )}

        {content && content.length > 0 && (
          <div className={styles.body}>
            <PortableText value={content} />
          </div>
        )}

        {tags && tags.length > 0 && (
          <div className={styles.tags}>
            {tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <nav className={styles.relatedLinks} aria-label={ui.relatedPagesHeading}>
          <h2 className={styles.relatedHeading}>{ui.relatedPagesHeading}</h2>
          <ul className={styles.relatedList}>
            <li>
              <Link href={withLocalePath(locale, '/turlar')}>{ui.relatedTours}</Link>
            </li>
            <li>
              <Link href={withLocalePath(locale, '/koylar')}>{ui.relatedCoves}</Link>
            </li>
          </ul>
        </nav>

        <div className={styles.backLinkWrap}>
          <Link href={blogListPath} className={styles.backLink}>
            {ui.allPosts}
          </Link>
        </div>
      </article>
    </main>
  )
}
