'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Instagram } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'

export type InstagramPostItem = {
  imageUrl?: string | null
  imageAlt?: string | null
  postUrl?: string | null
}

export type InstagramSectionData = {
  enabled?: boolean | null
  heading?: string | null
  description?: string | null
  instagramUrl?: string | null
  ctaText?: string | null
  posts?: InstagramPostItem[] | null
}

type InstagramSectionProps = {
  data: InstagramSectionData | null
  locale?: SiteLocale
}

const VIEW_POST: Record<SiteLocale, string> = {
  tr: 'Gönderiyi gör',
  en: 'View post',
  de: 'Beitrag ansehen',
  ru: 'Смотреть пост',
}

const POST_ARIA: Record<SiteLocale, string> = {
  tr: 'Instagram gönderisi',
  en: 'Instagram post',
  de: 'Instagram-Beitrag',
  ru: 'Пост в Instagram',
}

const FOLLOW_FALLBACK: Record<SiteLocale, string> = {
  tr: 'Bizi takip et',
  en: 'Follow us',
  de: 'Folgen Sie uns',
  ru: 'Подписаться',
}

const IG_GRADIENT = 'linear-gradient(45deg, #feda75 0%, #fa7e1e 25%, #d62976 50%, #962fbf 75%, #4f5bd5 100%)'

/** Hashtag'li kısımları küçük harfe çevirip baştaki "#"ı "@"ya çevirir:
    #CesmePoseidon → @cesmeposeidon — buton zaten hesabı takip etmeye
    yönlendirdiği için hashtag değil, kullanıcı adı (handle) olarak gösterilir.
    Sanity'deki gerçek metin (#cesmeposeidon) değişmez, sadece ekranda böyle görünür. */
function formatInstagramHeading(text: string): string {
  return text.replace(/#(\w+)/g, (_, tag) => `@${tag.toLowerCase()}`)
}

/** Instagram profil başlığı gibi: solda renk halkalı ikon + handle + açıklama,
    sağda Instagram renkli "Takip et"; altında yuvarlatılmış gönderi kareleri
    (mobilde yatay kaydırmalı şerit). */
export default function InstagramSection({ data, locale = 'tr' }: InstagramSectionProps) {
  if (!data?.enabled || !data?.instagramUrl) return null

  const { heading, description, instagramUrl, ctaText, posts } = data
  const hasPosts = posts && posts.length > 0
  const displayHeading = formatInstagramHeading(heading || 'Instagram')

  const followButton = (extra = '') => (
    <Link
      href={instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group/follow inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[14px] font-extrabold uppercase tracking-wide text-white transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgba(214,41,118,0.7)] ${extra}`}
      style={{ backgroundImage: IG_GRADIENT }}
    >
      <Instagram className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
      {ctaText || FOLLOW_FALLBACK[locale]}
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover/follow:-translate-y-0.5 group-hover/follow:translate-x-0.5" strokeWidth={2.4} aria-hidden />
    </Link>
  )

  return (
    <section className="w-full bg-white pb-14 pt-10 md:pb-20 md:pt-14" aria-labelledby="instagram-section-heading">
      <div className="mx-auto max-w-[1200px] px-4">
        <header className="mb-8 flex flex-col items-center gap-5 text-center md:mb-10 md:flex-row md:items-center md:justify-between md:text-left">
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-5">
            {/* Instagram hikaye halkası gibi renk geçişli çerçeve */}
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={displayHeading}
              className="shrink-0 rounded-full p-[3px] transition-transform duration-300 hover:rotate-6 hover:scale-105"
              style={{ backgroundImage: IG_GRADIENT }}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white bg-white md:h-[72px] md:w-[72px]">
                <Instagram className="h-8 w-8 text-[#d62976]" strokeWidth={2} aria-hidden />
              </span>
            </a>
            <div>
              <h2
                id="instagram-section-heading"
                className="m-0 text-[26px] font-black leading-[1.1] text-[var(--secondary,#131719)] sm:text-[30px] md:text-[34px]"
                style={{ fontFamily: 'var(--font-family-title, var(--font-family))', WebkitTextStroke: '0.4px currentColor' }}
              >
                {displayHeading}
              </h2>
              {description && (
                <p className="mb-0 mt-1.5 max-w-xl text-[15px] leading-relaxed text-[var(--text-color,#58595b)] md:text-base">
                  {description}
                </p>
              )}
            </div>
          </div>
          {followButton('hidden md:inline-flex')}
        </header>

        {hasPosts && (
          <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
            {posts.map((post, i) => (
              <a
                key={i}
                href={post.postUrl || instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square w-[70%] shrink-0 snap-start overflow-hidden rounded-2xl bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary,#2168b8)] focus-visible:ring-offset-2 sm:w-[44%] md:w-auto"
                aria-label={post.imageAlt || POST_ARIA[locale]}
              >
                {post.imageUrl ? (
                  <Image
                    src={post.imageUrl}
                    alt={post.imageAlt || 'Instagram'}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    sizes="(max-width: 768px) 70vw, 300px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">Instagram</div>
                )}
                {/* Sağ üstte küçük Instagram işareti — her karenin bir gönderi olduğunu belli eder. */}
                <span className="absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-0">
                  <Instagram className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                </span>
                {/* Hover: alttan yükselen koyu geçiş + "Gönderiyi gör" */}
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
                <span className="pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-between text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wide">
                    <Instagram className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                    {VIEW_POST[locale]}
                  </span>
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                </span>
              </a>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center md:hidden">{followButton('w-full sm:w-auto')}</div>
      </div>
    </section>
  )
}
