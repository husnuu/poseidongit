import { client } from '@/lib/sanity'
import { blogsListQuery, blogPageQuery } from '@/lib/queries'
import BlogCard from '@/components/BlogCard'
import { getBaseUrl, getSiteName } from '@/lib/seo'
import type { Metadata } from 'next'
import styles from './blog.module.css'

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
  category?: string
  tags?: string[]
}

interface BlogPageContent {
  heroTitle?: string
  heroHighlightTitlePart?: string
  heroDescription?: string
}

export const metadata: Metadata = {
  title: siteName ? `Blog | ${siteName}` : 'Blog | Tatil Rehberi',
  description:
    'Tekne turu ipuçları, koy rehberleri ve tatil yazıları.',
  alternates: { canonical: `${getBaseUrl()}/blog` },
  openGraph: {
    title: siteName ? `Blog | ${siteName}` : 'Blog',
    description: 'Tekne turları hakkında blog yazıları.',
    url: `${getBaseUrl()}/blog`,
  },
}

export default async function BlogPage() {
  let pageContent: BlogPageContent | null = null
  let blogs: BlogItem[] = []

  try {
    const [content, list] = await Promise.all([
      client.fetch<BlogPageContent | null>(blogPageQuery),
      client.fetch<BlogItem[]>(blogsListQuery),
    ])
    pageContent = content ?? null
    blogs = Array.isArray(list) ? list : []
  } catch (err) {
    console.error('Blog page fetch error:', err)
  }

  const line1 = pageContent?.heroTitle ?? 'BLOG'
  const line2 = pageContent?.heroHighlightTitlePart ?? 'YAZILARI'
  const leadText =
    pageContent?.heroDescription ??
    'Çeşme, tekne turları ve tatil ipuçları. Deneyimler ve rehberler.'

  return (
    <main className={styles.main}>
      {/* Hero / Header */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <h1 className={styles.heroH1}>
            <span className={styles.heroH1Line1}>{line1}</span>
            <span className={styles.heroH1Line2}>{line2}</span>
          </h1>
          <p className={styles.heroLead}>{leadText}</p>
        </div>
      </section>

      {/* Blog grid */}
      <section className={styles.gridSection}>
        <div className={styles.gridContainer}>
          {blogs?.length > 0 ? (
            <div className={styles.blogsGrid}>
              {blogs.map((blog) => (
                <BlogCard key={blog._id} blog={blog} />
              ))}
            </div>
          ) : (
            <p className={styles.empty}>Henüz blog yazısı yok. Sanity Studio üzerinden ekleyebilirsiniz.</p>
          )}
        </div>
      </section>
    </main>
  )
}
