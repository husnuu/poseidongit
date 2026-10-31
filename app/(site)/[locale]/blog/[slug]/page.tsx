import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Clock, ArrowLeft } from 'lucide-react'
import { client, urlFor } from '@/lib/sanity'
import { blogBySlugQuery, blogsListQuery, blogAuthorCardQuery } from '@/lib/queries'
import BlogSection from '@/components/home/BlogSection'
import PostFeedback from '@/components/blog/PostFeedback'
import BlogAuthorCard, { type BlogAuthorCardData } from '@/components/blog/BlogAuthorCard'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import JsonLd from '@/components/seo/JsonLd'
import ShareButton from '@/components/ui/ShareButton'
import { formatBlogReadTime } from '@/lib/i18n/formatBlogReadTime'
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
import { ogImageUrl } from '@/lib/seo/brand'
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

/** Blog yazıları build'de her dil için önceden üretilir (o dilin slug'ıyla; otomatik slug'lar middleware'de Türkçeye çevrilir). */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const slugs = await client
    .fetch<(string | null)[]>(
      `*[_type == "blog" && defined(slug.current)]{
        "s": select(
          $locale == "en" => coalesce(translations.en.slug.current, slug.current),
          $locale == "de" => coalesce(translations.de.slug.current, slug.current),
          slug.current
        )
      }.s`,
      { locale: params.locale }
    )
    .catch(() => [] as (string | null)[])
  return slugs.filter((s): s is string => Boolean(s)).map((slug) => ({ slug }))
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
      : merged.coverImage?.url || ogImageUrl({ title: translatedTitle, locale, kicker: ui.blogListTitleSuffix })
  return {
    title: { absolute: title },
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
      card: 'summary_large_image',
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

  const [post, allPosts, authorCard] = await Promise.all([
    client.fetch<BlogPost | null>(blogBySlugQuery, { slug }),
    // "Okumaya devam et" carousel'i — ayrı bir "ilgili yazılar" alanı
    // Sanity'de yok; en yeni yazılardan mevcut olan çıkarılarak besleniyor.
    client.fetch<BlogPost[]>(blogsListQuery).catch(() => [] as BlogPost[]),
    client.fetch<BlogAuthorCardData | null>(blogAuthorCardQuery).catch(() => null),
  ])

  if (!post) notFound()

  const rawPost = post as unknown as Record<string, unknown>
  const merged = mergeBlogForLocale(rawPost, locale) as unknown as BlogPost

  // Okunan yazı hariç, en yeni 4 yazı (başlık/özet locale'e göre birleştirilir).
  const keepReadingPosts = (allPosts ?? [])
    .filter((p) => p?.slug && p.slug !== slug)
    .slice(0, 4)
    .map((p) => {
      const m = mergeBlogForLocale(p as unknown as Record<string, unknown>, locale) as unknown as BlogPost
      return {
        _id: m._id,
        title: m.title ?? null,
        slug: m.slug ?? null,
        excerpt: m.excerpt ?? null,
        publishDate: m.publishDate ?? null,
        readingTime: m.readingTime ?? null,
        readTime: m.readTime ?? null,
        coverImageUrl: m.coverImage?.asset ? urlFor(m.coverImage.asset).width(800).height(600).auto('format').url() : null,
        coverImageAlt: m.coverImage?.alt ?? null,
      }
    })

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
  const breadcrumbCrumbs = [
    { name: homeLabel, url: withLocalePath(locale, '/') },
    { name: ui.blogListTitleSuffix, url: blogListPath },
    { name: title, url: postPath },
  ]
  // Yalnızca JSON-LD: sayfada tam breadcrumb yerine tek bir "← Blog"
  // bağlantısı var (referans tasarım). Şema arama sonucundaki kırıntı
  // yolunu beslemeye devam ediyor.
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbCrumbs)
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
        {/* Referansta tam breadcrumb yerine tek bir geri bağlantısı var. */}
        <Link href={blogListPath} className={styles.backLink}>
          <ArrowLeft className={styles.backIcon} size={16} strokeWidth={2} aria-hidden />
          {ui.blogListTitleSuffix}
        </Link>
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
              {(merged.publishDate || merged._updatedAt) && (
                <span className={styles.updatedWrap}>
                  <Clock className={styles.updatedIcon} size={15} strokeWidth={2} aria-hidden />
                  {/* Referans: "24 Eylül 2026 · 4 dk okuma" — kartla aynı tarih
                      ve biçim (önceden "Son güncelleme: …" yazıyor, karttaki
                      yayın tarihinden farklı bir tarih gösteriyordu). */}
                  <span>
                    {[
                      formatDate(merged.publishDate ?? merged._updatedAt, dateLocale),
                      formatBlogReadTime(merged, ui.readTimeSuffix),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              )}
              <ShareButton
                title={title}
                description={excerpt ?? undefined}
                imageUrl={coverUrl ?? undefined}
                path={postPath}
                locale={locale}
                className={styles.shareBtn}
              />
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

        {/* Kullanıcı tercihiyle yalnızca görsel — oy kaydedilmiyor
            (bkz. PostFeedback.tsx). */}
        <PostFeedback slug={slug} locale={locale} />

        {/* Yazının sonu: geniş paylaş butonu (kart köşesindekiyle aynı
            SharePopup'ı açar, yalnızca etiketli ve tam genişlikte). */}
        <div className={styles.shareRow}>
          <ShareButton
            title={title}
            description={excerpt ?? undefined}
            imageUrl={coverUrl ?? undefined}
            path={postPath}
            locale={locale}
            label={ui.shareThisPost}
            className={styles.shareWideBtn}
          />
        </div>

        {/* Yazar/kaptan kartı — içerik Sanity'deki gerçek host kaydından. */}
        <BlogAuthorCard author={authorCard} locale={locale} />
      </article>

      {/* "Okumaya devam et" — ana sayfadaki blog carousel'i, yazı altı için
          sade varyantıyla (sola yaslı küçük koyu başlık, CTA yok). */}
      {keepReadingPosts.length > 0 && (
        <BlogSection
          data={{ enabled: true, posts: keepReadingPosts }}
          locale={locale}
          noImageLabel={ui.noCoverImage}
          heading={ui.keepReadingHeading}
          variant="compact"
        />
      )}
    </main>
  )
}
