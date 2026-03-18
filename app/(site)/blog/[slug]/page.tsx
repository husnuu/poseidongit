import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
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
  publishDate?: string
  readTime?: string
  category?: string
  tags?: string[]
  _updatedAt?: string
}

function formatDate(dateString?: string): string {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('tr-TR', {
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
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await client.fetch<BlogPost | null>(blogBySlugQuery, { slug })
  if (!post) return { title: 'Yazı bulunamadı' }
  const siteName = getSiteName()
  const title = siteName ? `${post.title} | Blog | ${siteName}` : `${post.title} | Blog`
  const description =
    (post.excerpt ?? post.title).replace(/\s+/g, ' ').slice(0, 160) || title
  const url = absoluteUrl(`/blog/${slug}`)
  const image = post.coverImage?.asset
    ? urlFor(post.coverImage.asset).width(1200).height(630).url()
    : post.coverImage?.url ?? undefined
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: post.publishDate ?? undefined,
      modifiedTime: post._updatedAt ?? undefined,
      authors: post.author ? [post.author] : undefined,
      images: image ? [{ url: image, width: 1200, height: 630, alt: post.title }] : undefined,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await client.fetch<BlogPost | null>(blogBySlugQuery, { slug })

  if (!post) notFound()

  const coverUrl = post.coverImage?.asset
    ? urlFor(post.coverImage.asset).width(1200).height(630).url()
    : post.coverImage?.url ?? null

  const postUrl = absoluteUrl(`/blog/${slug}`)
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Ana Sayfa', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: post.title, url: `/blog/${slug}` },
  ])
  const blogPostingSchema = buildBlogPostingSchema({
    title: post.title,
    description: post.excerpt ?? undefined,
    url: postUrl,
    image: coverUrl ?? undefined,
    datePublished: post.publishDate ?? undefined,
    author: post.author ?? undefined,
  })

  return (
    <main className="min-h-screen bg-zinc-50">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={blogPostingSchema} />
      <article className={styles.article}>
        <div className={styles.backLinkWrap}>
          <Link href="/blog" className={styles.backLink}>
            ← Blog listesine dön
          </Link>
        </div>

        <header className={styles.header}>
          {post.category && (
            <span className={styles.category}>{post.category}</span>
          )}
          <h1 className={styles.title}>{post.title}</h1>
          {(post.author || post.publishDate || post.readTime) && (
            <div className={styles.meta}>
              {post.author && <span>{post.author}</span>}
              {post.publishDate && (
                <span className={styles.metaSep}>{formatDate(post.publishDate)}</span>
              )}
              {post.readTime && (
                <span className={styles.metaSep}>{post.readTime}</span>
              )}
            </div>
          )}
        </header>

        {coverUrl && (
          <div className={styles.coverWrap}>
            <Image
              src={coverUrl}
              alt={post.coverImage?.alt || post.title}
              width={1200}
              height={630}
              className={styles.coverImage}
              priority
            />
          </div>
        )}

        {post.excerpt && (
          <p className={styles.excerpt}>{post.excerpt}</p>
        )}

        {post.content && post.content.length > 0 && (
          <div className={styles.body}>
            <PortableText value={post.content} />
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className={styles.tags}>
            {post.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <nav className={styles.relatedLinks} aria-label="İlgili sayfalar">
          <h2 className={styles.relatedHeading}>İlgili sayfalar</h2>
          <ul className={styles.relatedList}>
            <li>
              <Link href="/turlar">Çeşme tekne turları</Link>
            </li>
            <li>
              <Link href="/koylar">Çeşme koyları</Link>
            </li>
          </ul>
        </nav>

        <div className={styles.backLinkWrap}>
          <Link href="/blog" className={styles.backLink}>
            ← Tüm yazılar
          </Link>
        </div>
      </article>
    </main>
  )
}
