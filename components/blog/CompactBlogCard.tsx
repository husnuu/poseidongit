import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { formatBlogReadTime } from '@/lib/i18n/formatBlogReadTime'
import { getBlogPageUiStrings } from '@/lib/i18n/strings/blogPage'

export type CompactBlogCardPost = {
  _id: string
  title: string | null
  slug: string | null
  coverImageUrl?: string | null
  coverImageAlt?: string | null
  excerpt?: string | null
  publishDate?: string | null
  /** "4 dk okuma" — sorgular zaten döndürüyordu, kartta gösterilmiyordu. */
  readingTime?: number | null
  readTime?: string | null
}

type CompactBlogCardProps = {
  post: CompactBlogCardPost
  locale?: SiteLocale
  noImageLabel: string
  /** next/image sizes — anasayfa şeridi ~300px, liste gridi daha geniş olabilir */
  imageSizes?: string
}

const READ_MORE_LABEL: Record<SiteLocale, string> = {
  tr: 'Yazıyı oku',
  en: 'Read the post',
  de: 'Artikel lesen',
  ru: 'Читать статью',
}

function formatDate(dateStr: string | null | undefined, locale: SiteLocale): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return null
  const tag = locale === 'de' ? 'de-DE' : locale === 'en' ? 'en-US' : locale === 'ru' ? 'ru-RU' : 'tr-TR'
  return new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

export default function CompactBlogCard({
  post,
  locale = 'tr',
  noImageLabel,
  imageSizes = '(max-width: 640px) 100vw, 300px',
}: CompactBlogCardProps) {
  const href = post.slug ? withLocalePath(locale, `/blog/${post.slug}`) : '#'
  const dateLabel = formatDate(post.publishDate, locale)
  const readLabel = formatBlogReadTime(post, getBlogPageUiStrings(locale).readTimeSuffix)
  // Referans: "24 Eylül 2026 · 4 dk okuma"
  const metaLabel = [dateLabel, readLabel].filter(Boolean).join(' · ')

  return (
    /* Kart kabı tur/yat kartlarıyla aynı reçete (görünür yumuşak kenar +
       katmanlı gölge). Gövde zemini referanstaki gibi beyaz (önceden #f1f3f5
       gri idi — kart gövdesi görselden sonra soluk kalıyordu). */
    <article className="group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(19,23,25,0.06),0_6px_20px_-4px_rgba(19,23,25,0.14)] transition-all duration-300 hover:-translate-y-1 hover:border-[#cbd5e1] hover:shadow-[0_2px_4px_rgba(19,23,25,0.06),0_18px_36px_-10px_rgba(19,23,25,0.22)]">
      <Link
        href={href}
        className="flex min-h-0 flex-1 flex-col rounded-2xl outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#2168b8]"
      >
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-zinc-100">
          {post.coverImageUrl ? (
            <Image
              src={post.coverImageUrl}
              alt={post.coverImageAlt || post.title || 'Blog'}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes={imageSizes}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">{noImageLabel}</div>
          )}
        </div>
        <div className="flex flex-1 flex-col px-5 pb-5 pt-5 md:px-6 md:pb-6 md:pt-6">
          {metaLabel && (
            <p className="text-[13px]" style={{ color: 'var(--muted, #81848b)' }}>
              {metaLabel}
            </p>
          )}
          <h3
            className="mt-1.5 line-clamp-3 text-base font-bold leading-snug text-[var(--secondary,#131719)] transition-colors duration-200 group-hover:text-[var(--primary,#2168b8)]"
            style={{ fontFamily: 'var(--font-family)' }}
          >
            {post.title}
          </h3>
          {post.excerpt && (
            <p
              className="mt-2 line-clamp-3 text-sm leading-relaxed"
              style={{ color: 'var(--text-color, #58595b)' }}
            >
              {post.excerpt}
            </p>
          )}
          <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold uppercase tracking-wide text-[var(--secondary,#131719)] transition-colors duration-200 group-hover:text-[var(--primary,#2168b8)]">
            {READ_MORE_LABEL[locale]}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2} aria-hidden />
          </span>
        </div>
      </Link>
    </article>
  )
}
