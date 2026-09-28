'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Instagram } from 'lucide-react'

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
}

/** Hashtag'li kısımları küçük harfe çevirir: #CesmePoseidon → #cesmeposeidon */
function formatInstagramHeading(text: string): string {
  return text.replace(/#(\w+)/g, (_, tag) => `#${tag.toLowerCase()}`)
}

export default function InstagramSection({ data }: InstagramSectionProps) {
  if (!data?.enabled || !data?.instagramUrl) return null

  const { heading, description, instagramUrl, ctaText, posts } = data
  const hasPosts = posts && posts.length > 0
  const displayHeading = formatInstagramHeading(heading || 'Instagram')

  return (
    <section
      className="w-full bg-zinc-50 pt-7 pb-14 md:pt-9 md:pb-20"
      aria-labelledby="instagram-section-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <header className="mb-10 text-center">
          <h2
            id="instagram-section-heading"
            className="text-[24px] font-black leading-[1.15] mb-3 sm:text-[27px] md:text-[30px] lg:text-[33px]"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900, color: 'var(--primary, #2168b8)' }}
          >
            {displayHeading}
          </h2>
          {description && (
            <p
              className="mx-auto max-w-2xl text-base font-normal leading-relaxed md:text-lg"
              style={{ color: 'var(--text-color)' }}
            >
              {description}
            </p>
          )}
        </header>

        {hasPosts && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-10">
            {posts.map((post, i) => (
              <a
                key={i}
                href={post.postUrl || instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-200 transition transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]"
                aria-label={post.imageAlt || 'Instagram gönderisi'}
              >
                {post.imageUrl ? (
                  <Image
                    src={post.imageUrl}
                    alt={post.imageAlt || 'Instagram'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm">
                    Görsel
                  </div>
                )}
                <span
                  className="absolute bottom-2 left-2 flex items-center justify-center w-8 h-8 rounded-lg bg-black/50 text-white"
                  aria-hidden
                >
                  <Instagram className="w-4 h-4" strokeWidth={2} />
                </span>
              </a>
            ))}
          </div>
        )}

        <div className="flex justify-center">
          <Link
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            // Üstüne gelince Instagram'ın kendi gradyan renklerine geçiyor (Google
            // Yorumları butonundaki dolu-renk hover deseniyle aynı mantık).
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border-2 border-[#2168b8] bg-white px-8 py-2.5 text-xs font-bold uppercase tracking-wide text-[#2168b8] transition duration-200 hover:scale-105 hover:border-transparent hover:bg-[linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)] hover:text-white"
          >
            <Instagram className="h-4 w-4" strokeWidth={2} />
            {ctaText || 'Bizi takip et'}
          </Link>
        </div>
      </div>
    </section>
  )
}
