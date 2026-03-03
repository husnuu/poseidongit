import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { client, urlFor } from '@/lib/sanity'
import { blogBySlugQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
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
}) {
  const { slug } = await params
  const post = await client.fetch<BlogPost | null>(blogBySlugQuery, { slug })
  if (!post) return { title: 'Yazı bulunamadı' }
  return {
    title: `${post.title} | Blog | Poseidon Booking`,
    description: post.excerpt ?? undefined,
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

  return (
    <main className="min-h-screen bg-zinc-50">
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

        <div className={styles.backLinkWrap}>
          <Link href="/blog" className={styles.backLink}>
            ← Tüm yazılar
          </Link>
        </div>
      </article>
    </main>
  )
}
