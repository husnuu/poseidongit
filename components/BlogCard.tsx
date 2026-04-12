import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import { formatDisplayDateForLocaleTag } from '@/lib/formatDisplayDate'
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
  href: string
  readPostCta: string
  noExcerptFallback: string
  dateLocale: string
}

export default function BlogCard({
  blog,
  href,
  readPostCta,
  noExcerptFallback,
  dateLocale,
}: BlogCardProps) {
  const hasImage = Boolean(blog?.coverImage?.asset)

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
            {formatDisplayDateForLocaleTag(blog.publishDate, dateLocale)}
          </time>
        )}
        <div className={styles.blogCardExcerptWrap}>
          {blog?.excerpt ? (
            <p className={styles.blogCardExcerpt}>{blog.excerpt}</p>
          ) : (
            <p className={styles.blogCardExcerpt}>{noExcerptFallback}</p>
          )}
        </div>
        <Link href={href} className={styles.blogCardCTA}>
          {readPostCta}
        </Link>
      </div>
    </article>
  )
}
