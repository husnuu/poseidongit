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
  // Referanstaki rozet yalnızca tarihi taşıyor ("24 Nisan 2026").
  const metaLabel = dateLabel

  return (
    /* Referans tasarım: görsel + iri başlık + altta koyu tarih rozeti.
       Özet metni ve "yazıyı oku" bağlantısı referansta yok. Kart kabı
       tur/yat kartlarıyla aynı reçete (görünür kenar + katmanlı gölge). */
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
          <h3
            className="line-clamp-2 text-[18px] font-bold leading-snug text-[var(--secondary,#131719)] transition-colors duration-200 group-hover:text-[var(--primary,#2168b8)] md:text-[20px]"
            style={{ fontFamily: 'var(--font-family)' }}
          >
            {post.title}
          </h3>
          {metaLabel && (
            /* mt-auto rozeti kartın altına iter; pt-4 ise başlık iki satıra
               taştığında rozetin başlığa yapışmasını engeller. */
            <div className="mt-auto pt-4">
              <span className="inline-flex rounded-md bg-[var(--secondary,#131719)] px-2.5 py-1.5 text-[12px] font-semibold leading-none text-white">
                {metaLabel}
              </span>
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}
