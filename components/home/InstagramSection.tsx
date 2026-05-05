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
            className="text-2xl md:text-3xl font-black leading-tight mb-3"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))', color: '#1e3a8a' }}
          >
            {displayHeading}
          </h2>
          {description && (
            <p className="text-base md:text-lg text-zinc-700 font-medium leading-relaxed max-w-2xl mx-auto">
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
            className="inline-flex items-center justify-center gap-2 rounded-xl py-3 px-6 font-bold uppercase text-sm text-white transition hover:opacity-90"
            style={{
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              boxShadow: '0 4px 14px rgba(225, 48, 108, 0.4)',
            }}
          >
            {ctaText || 'Bizi takip et'}
          </Link>
        </div>
      </div>
    </section>
  )
}
