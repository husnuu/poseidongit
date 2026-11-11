'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Instagram, Play } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import type { InstagramFeed } from '@/lib/instagram/feed'

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
  /** Instagram API'den gelen güncel akış; yoksa Sanity gönderileri gösterilir. */
  feed?: InstagramFeed | null
  /** API yokken Sanity footer'daki elle girilmiş takipçi sayısı (ör. "12K"). */
  fallbackFollowerCount?: string | null
  locale?: SiteLocale
}

type Card = { key: string; imageUrl: string; href: string; caption: string | null; alt: string; isVideo: boolean }

const HEADING: Record<SiteLocale, string> = {
  tr: 'Denizden kareler',
  en: 'Moments from the sea',
  de: 'Momente vom Meer',
  ru: 'Мгновения у моря',
}

const FOLLOW: Record<SiteLocale, string> = {
  tr: "Instagram'da takip edin",
  en: 'Follow us on Instagram',
  de: 'Folgen Sie uns auf Instagram',
  ru: 'Подписывайтесь в Instagram',
}

const WATCH: Record<SiteLocale, { video: string; post: string }> = {
  tr: { video: "Instagram'da izle", post: "Instagram'da gör" },
  en: { video: 'Watch on Instagram', post: 'View on Instagram' },
  de: { video: 'Auf Instagram ansehen', post: 'Auf Instagram ansehen' },
  ru: { video: 'Смотреть в Instagram', post: 'Открыть в Instagram' },
}

const WATCH_YOUTUBE: Record<SiteLocale, string> = {
  tr: "YouTube'da izle",
  en: 'Watch on YouTube',
  de: 'Auf YouTube ansehen',
  ru: 'Смотреть на YouTube',
}

const POST_NUMBER: Record<SiteLocale, (n: number) => string> = {
  tr: (n) => `gönderi ${n}`,
  en: (n) => `post ${n}`,
  de: (n) => `Beitrag ${n}`,
  ru: (n) => `публикация ${n}`,
}

function isYouTubeHref(href: string): boolean {
  return /(^|\.)(youtube\.com|youtu\.be)\//i.test(href.replace(/^https?:\/\//i, ''))
}

const FOLLOWERS: Record<SiteLocale, string> = { tr: 'takipçi', en: 'followers', de: 'Follower', ru: 'подписчиков' }

const NAV_ARIA: Record<SiteLocale, { prev: string; next: string }> = {
  tr: { prev: 'Önceki gönderiler', next: 'Sonraki gönderiler' },
  en: { prev: 'Previous posts', next: 'Next posts' },
  de: { prev: 'Vorherige Beiträge', next: 'Nächste Beiträge' },
  ru: { prev: 'Предыдущие публикации', next: 'Следующие публикации' },
}

const NUMBER_LOCALE: Record<SiteLocale, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', ru: 'ru-RU' }

/** 147300 → "147K" (tr: "147 B" yerine okunması kolay "147K"). */
function compactCount(n: number, locale: SiteLocale): string {
  return new Intl.NumberFormat(locale === 'tr' ? 'en-US' : NUMBER_LOCALE[locale], {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

function usernameFromUrl(url: string): string | null {
  const m = url.match(/instagram\.com\/([A-Za-z0-9._]+)/i)
  return m?.[1] ?? null
}

/** Referans tasarım: ortalı başlık, profil hapı, dikey kart şeridi, altta çerçeveli takip butonu. */
export default function InstagramSection({ data, feed, fallbackFollowerCount, locale = 'tr' }: InstagramSectionProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateArrows()
    window.addEventListener('resize', updateArrows)
    return () => window.removeEventListener('resize', updateArrows)
  }, [updateArrows])

  if (!data?.enabled) return null
  const username = feed?.profile.username ?? (data.instagramUrl ? usernameFromUrl(data.instagramUrl) : null)
  if (!username) return null
  const profileUrl = `https://www.instagram.com/${username}/`

  const cards: Card[] = feed?.posts.length
    ? feed.posts.map((p) => ({
        key: p.id,
        imageUrl: p.imageUrl,
        href: p.permalink,
        caption: p.caption,
        alt: p.caption?.slice(0, 120) || `@${username}`,
        isVideo: p.isVideo,
      }))
    : (data.posts ?? [])
        .filter((p): p is InstagramPostItem & { imageUrl: string } => Boolean(p.imageUrl))
        .map((p, i) => ({
          key: `${i}-${p.imageUrl}`,
          imageUrl: p.imageUrl,
          href: p.postUrl || profileUrl,
          caption: null,
          alt: p.imageAlt || `@${username}`,
          isVideo: false,
        }))

  const followers =
    feed?.profile.followersCount != null
      ? compactCount(feed.profile.followersCount, locale)
      : fallbackFollowerCount?.trim() || null

  // 4 veya daha az gönderide şerit kaydırılmaz: kartlar genişliği doldurur.
  const desktopWidth = cards.length > 4 ? 'md:w-[calc((100%-4rem)/4.5)]' : 'md:w-[calc((100%-3rem)/4)]'

  const scrollByCards = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-ig-card]')
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 300) + 16) * 2, behavior: 'smooth' })
  }

  const arrowClass =
    'absolute top-1/2 z-10 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#131719] shadow-[0_6px_20px_rgba(19,23,25,0.18)] transition hover:scale-105 md:flex'

  return (
    <section className="w-full bg-[#eefaf6] py-14 md:py-20" aria-labelledby="instagram-section-heading">
      <div className="mx-auto max-w-[1200px] px-4">
        <h2
          id="instagram-section-heading"
          className="m-0 text-center text-[28px] font-black uppercase leading-[1.15] text-[var(--primary,#2168b8)] sm:text-[32px] md:text-[36px] lg:text-[40px]"
          style={{ fontFamily: 'var(--font-family-title, var(--font-family))', WebkitTextStroke: '0.6px currentColor' }}
        >
          {HEADING[locale]}
        </h2>

        <div className="mt-6 flex justify-center md:mt-8">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-2.5 rounded-full border border-zinc-100 bg-white py-1.5 pl-1.5 pr-4 text-[13px] shadow-[0_2px_10px_rgba(19,23,25,0.06)] transition hover:shadow-[0_6px_18px_rgba(19,23,25,0.12)] sm:text-[15px]"
          >
            <span
              className="shrink-0 rounded-full p-[2px]"
              style={{ backgroundImage: 'linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)' }}
            >
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white sm:h-10 sm:w-10">
                {feed?.profile.profilePictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Instagram CDN, imzalı adres
                  <img src={feed.profile.profilePictureUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Instagram className="h-5 w-5 text-[#d62976]" strokeWidth={2} aria-hidden />
                )}
              </span>
            </span>
            <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-[#131719]">
              {feed?.profile.name && <span className="truncate font-extrabold">{feed.profile.name}</span>}
              {feed?.profile.name && <span className="text-zinc-400" aria-hidden>·</span>}
              <span className="truncate text-zinc-500">@{username}</span>
              {followers && (
                <>
                  <span className="text-zinc-400" aria-hidden>·</span>
                  <span className="whitespace-nowrap font-extrabold">
                    {followers} {FOLLOWERS[locale]}
                  </span>
                </>
              )}
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
          </a>
        </div>

        {cards.length > 0 && (
          <div className="relative mt-10 md:mt-12">
            <div
              ref={trackRef}
              onScroll={updateArrows}
              className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:px-0 [&::-webkit-scrollbar]:hidden"
            >
              {cards.map((card, cardIndex) => (
                <a
                  key={card.key}
                  data-ig-card
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative block aspect-[3/4] w-[72%] shrink-0 snap-start overflow-hidden rounded-2xl bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary,#2168b8)] focus-visible:ring-offset-2 sm:w-[44%] ${desktopWidth}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Instagram CDN veya Sanity; boyut kart kadar */}
                  <img
                    src={card.imageUrl}
                    alt={card.alt}
                    loading="lazy"
                    // Kart 3:4 — boyut öznitelikleri yer tutucu oranı verir (görüntü CSS'le kaplar).
                    width={900}
                    height={1200}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                  {card.isVideo && (
                    <Play className="absolute right-3 top-3 h-6 w-6 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" strokeWidth={2} aria-hidden />
                  )}
                  {card.caption && (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pb-4 pt-12">
                      <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-white sm:text-[14px]">{card.caption}</span>
                    </span>
                  )}
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-2 text-[15px] font-extrabold text-white">
                      <ExternalLink className="h-5 w-5" aria-hidden />
                      {isYouTubeHref(card.href) ? WATCH_YOUTUBE[locale] : card.isVideo ? WATCH[locale].video : WATCH[locale].post}
                    </span>
                  </span>
                  {/* Açıklamasız kartlarda bağlantı metinleri aynı olmasın. */}
                  {!card.caption && <span className="sr-only">{POST_NUMBER[locale](cardIndex + 1)}</span>}
                </a>
              ))}
            </div>
            {canPrev && (
              <button type="button" onClick={() => scrollByCards(-1)} aria-label={NAV_ARIA[locale].prev} className={`${arrowClass} -left-7`}>
                <ChevronLeft className="h-6 w-6" aria-hidden />
              </button>
            )}
            {canNext && (
              <button type="button" onClick={() => scrollByCards(1)} aria-label={NAV_ARIA[locale].next} className={`${arrowClass} -right-7`}>
                <ChevronRight className="h-6 w-6" aria-hidden />
              </button>
            )}
          </div>
        )}

        <div className="mt-10 flex justify-center md:mt-12">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border-2 border-[var(--primary,#2168b8)] bg-transparent px-6 py-2.5 text-[16px] font-extrabold uppercase tracking-wide text-[var(--primary,#2168b8)] transition duration-200 hover:scale-105 hover:bg-[var(--primary,#2168b8)] hover:text-white"
          >
            {FOLLOW[locale]}
          </a>
        </div>
      </div>
    </section>
  )
}
