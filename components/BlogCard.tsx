import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import styles from './BlogCard.module.css'

interface Blog {
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
  category?: string
  tags?: string[]
}

interface BlogCardProps {
  blog: Blog
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

export default function BlogCard({ blog }: BlogCardProps) {
  const hasImage = Boolean(blog?.coverImage?.asset)
  const slug = typeof blog?.slug === 'string' ? blog.slug : ''
  const href = slug ? `/blog/${slug}` : '#'

  return (
    <article className={styles.blogCard}>
      {hasImage && blog?.coverImage?.asset && (
        <div className={styles.blogCardImage}>
          <Image
            src={urlFor(blog.coverImage.asset).width(744).height(440).url()}
            alt={blog.coverImage?.alt || blog.title || 'Blog'}
            fill
            style={{ objectFit: 'cover' }}
            placeholder={blog.coverImage?.metadata?.lqip ? 'blur' : 'empty'}
            blurDataURL={blog.coverImage?.metadata?.lqip ?? undefined}
          />
        </div>
      )}
      <div className={styles.blogCardBody}>
        {blog?.category && (
          <span className={styles.blogCardCategory}>{blog.category}</span>
        )}
        <h2 className={styles.blogCardTitle}>{blog?.title ?? 'Blog'}</h2>
        {blog?.publishDate && (
          <time className={styles.blogCardDate} dateTime={blog.publishDate}>
            {formatDate(blog.publishDate)}
          </time>
        )}
        <div className={styles.blogCardExcerptWrap}>
          {blog?.excerpt ? (
            <p className={styles.blogCardExcerpt}>{blog.excerpt}</p>
          ) : (
            <p className={styles.blogCardExcerpt}>Bu yazı hakkında kısa özet henüz eklenmedi.</p>
          )}
        </div>
        <Link href={href} className={styles.blogCardCTA}>
          BLOGU OKU
        </Link>
      </div>
    </article>
  )
}
