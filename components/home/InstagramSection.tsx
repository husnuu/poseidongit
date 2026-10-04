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

/** Hashtag'li kısımları küçük harfe çevirip baştaki "#"ı "@"ya çevirir:
    #CesmePoseidon → @cesmeposeidon — buton zaten hesabı takip etmeye
    yönlendirdiği için hashtag değil, kullanıcı adı (handle) olarak gösterilir.
    Sanity'deki gerçek metin (#cesmeposeidon) değişmez, sadece ekranda böyle görünür. */
function formatInstagramHeading(text: string): string {
  return text.replace(/#(\w+)/g, (_, tag) => `@${tag.toLowerCase()}`)
}

export default function InstagramSection({ data }: InstagramSectionProps) {
  if (!data?.enabled || !data?.instagramUrl) return null

  const { heading, description, instagramUrl, ctaText, posts } = data
  const hasPosts = posts && posts.length > 0
  const displayHeading = formatInstagramHeading(heading || 'Instagram')

  return (
    // Üstündeki Blog bölümüyle (bg-zinc-50/60) karışmasın diye kendi renk kimliği:
    // Instagram'ın marka tonlarından hafif bir pembe-mor yıkama.
    <section
      className="w-full bg-[#fdf2f8] pt-7 pb-14 md:pt-9 md:pb-20"
      aria-labelledby="instagram-section-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <header className="mb-10 text-center">
          <h2
            id="instagram-section-heading"
            className="text-[28px] font-black leading-[1.15] mb-3 sm:text-[32px] md:text-[36px] lg:text-[40px]"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900, WebkitTextStroke: '0.4px currentColor', color: 'var(--primary, #2168b8)' }}
          >
            {displayHeading}
          </h2>
          {description && (
            <p
              className="mx-auto max-w-2xl text-sm font-normal leading-relaxed md:text-base"
              style={{ color: 'var(--text-color)' }}
            >
              {description}
            </p>
          )}
        </header>

        {hasPosts && (
          // Köşeler yuvarlatılmadan, aralık neredeyse sıfıra indirilerek gerçek
          // Instagram ızgarası ("duvar") hissi verildi — kare kareler, bitişik.
          <div className="grid grid-cols-2 gap-0.5 md:grid-cols-4 md:gap-1 mb-10">
            {posts.map((post, i) => (
              <a
                key={i}
                href={post.postUrl || instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)]"
                aria-label={post.imageAlt || 'Instagram gönderisi'}
              >
                {post.imageUrl ? (
                  <Image
                    src={post.imageUrl}
                    alt={post.imageAlt || 'Instagram'}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm">
                    Görsel
                  </div>
                )}
                {/* Hover'da: karartma + ortalanmış IG ikonu + "Gönderiyi Gör" — gerçek
                    Instagram'ın kendi feed önizlemesindeki beğeni/yorum katmanına
                    benzer, markalı bir etkileşim ipucu. */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/55 group-hover:opacity-100">
                  <Instagram className="h-6 w-6 text-white" strokeWidth={2} />
                  <span className="text-xs font-bold uppercase tracking-wide text-white">Gönderiyi Gör</span>
                </div>
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
            className="inline-flex min-h-[44px] items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-[#2168b8] bg-white bg-clip-padding px-8 py-2.5 text-xs font-bold uppercase tracking-wide text-[#2168b8] transition duration-200 hover:scale-105 hover:border-transparent hover:bg-[linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)] hover:text-white"
          >
            <Instagram className="h-4 w-4" strokeWidth={2} />
            {ctaText || 'Bizi takip et'}
          </Link>
        </div>
      </div>
    </section>
  )
}
