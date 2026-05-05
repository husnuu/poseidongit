import Image from 'next/image'
import Link from 'next/link'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'

export type CompactBlogCardPost = {
  _id: string
  title: string | null
  slug: string | null
  coverImageUrl?: string | null
  coverImageAlt?: string | null
}

type CompactBlogCardProps = {
  post: CompactBlogCardPost
  locale?: SiteLocale
  noImageLabel: string
  /** next/image sizes — anasayfa şeridi ~300px, liste gridi daha geniş olabilir */
  imageSizes?: string
}

export default function CompactBlogCard({
  post,
  locale = 'tr',
  noImageLabel,
  imageSizes = '(max-width: 640px) 100vw, 300px',
}: CompactBlogCardProps) {
  const href = post.slug ? withLocalePath(locale, `/blog/${post.slug}`) : '#'
  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.07)] transition-shadow duration-300 hover:shadow-[0_12px_36px_rgba(0,0,0,0.1)]">
      <Link
        href={href}
        className="flex min-h-0 flex-1 flex-col rounded-2xl outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#1e3a5f]"
      >
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-zinc-100">
          {post.coverImageUrl ? (
            <Image
              src={post.coverImageUrl}
              alt={post.coverImageAlt || post.title || 'Blog'}
              fill
              className="object-cover"
              sizes={imageSizes}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">{noImageLabel}</div>
          )}
        </div>
        <div className="flex flex-1 flex-col px-5 pb-5 pt-5 md:px-6 md:pb-6 md:pt-6">
          <h3
            className="line-clamp-4 text-[15px] font-semibold leading-snug tracking-tight text-zinc-900 md:text-base"
            style={{ fontFamily: 'var(--font-family)' }}
          >
            {post.title}
          </h3>
        </div>
      </Link>
    </article>
  )
}
