import { client, urlFor } from '@/lib/sanity'
import { aboutPageQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/react'
import Image from 'next/image'
import { getSiteName } from '@/lib/seo'

export const dynamic = 'force-dynamic'

const siteName = getSiteName()
export const metadata = {
  title: siteName ? `Hakkımızda | ${siteName}` : 'Hakkımızda',
  description: 'Hikayemiz ve teknelerimiz.',
}

type BoatItem = {
  year?: string | null
  name?: string | null
  description?: string | null
  order?: number | null
  isActive?: boolean | null
  image?: { asset?: { _ref: string }; alt?: string | null } | null
}

type AboutPageData = {
  slug?: string | null
  titleTop?: string | null
  titleBottom?: string | null
  intro?: PortableTextBlock[] | null
  sectionTitle?: string | null
  sectionSubtitle?: string | null
  sectionBody?: PortableTextBlock[] | null
  timelineTitle?: string | null
  timelineDescription?: string | null
  boats?: BoatItem[] | null
}

const defaultBlockComponents = {
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-base md:text-lg text-black/85 leading-relaxed mb-4 last:mb-0">
        {children}
      </p>
    ),
  },
}

export default async function HakkimizdaPage() {
  let data: AboutPageData | null = null
  try {
    data = await client.fetch<AboutPageData | null>(aboutPageQuery, {}, { useCdn: false })
  } catch {
    data = null
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black/60">Hakkımızda içeriği yüklenemedi.</p>
      </div>
    )
  }

  const boats = (data.boats ?? [])
    .filter((b) => b.isActive !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((b) => ({
      ...b,
      imageUrl: b.image?.asset ? urlFor(b.image.asset).width(800).height(600).url() : null,
      imageAlt: b.image?.alt ?? b.name ?? 'Tekne',
    }))

  const wordsTop = (data.titleTop || '').toUpperCase().trim().split(/\s+/)
  const firstTwoTop = wordsTop.slice(0, 2).join(' ')
  const restTop = wordsTop.slice(2).join(' ')

  return (
    <div className="min-h-screen bg-white">
      {/* Hero / Başlık */}
      <section className="w-full py-14 md:py-20">
        <div className="mx-auto max-w-[1200px] px-4">
          <h1
            className="text-[40px] md:text-[48px] font-black uppercase leading-[1.1] mb-6"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900 }}
          >
            {firstTwoTop && <span style={{ color: '#1e3a8a' }}>{firstTwoTop}</span>}
            {restTop && <span style={{ color: '#000' }}>{' ' + restTop}</span>}
          </h1>
          {data.titleBottom && (
            <p
              className="text-xl md:text-2xl font-bold uppercase"
              style={{ color: 'var(--primary)' }}
            >
              {data.titleBottom}
            </p>
          )}
        </div>
      </section>

      {/* Giriş (Intro) */}
      {data.intro && data.intro.length > 0 && (
        <section className="w-full py-8 border-t border-black/10">
          <div className="mx-auto max-w-[1200px] px-4">
            <div className="max-w-3xl">
              <PortableText value={data.intro} components={defaultBlockComponents} />
            </div>
          </div>
        </section>
      )}

      {/* İçerik (Section) */}
      {(data.sectionTitle || data.sectionBody?.length) && (
        <section className="w-full py-12 md:py-16">
          <div className="mx-auto max-w-[1200px] px-4">
            {data.sectionTitle && (
              <h2
                className="text-[32px] md:text-[40px] font-black uppercase mb-2"
                style={{ color: 'var(--secondary)', fontFamily: 'var(--font-family-title)' }}
              >
                {data.sectionTitle}
              </h2>
            )}
            {data.sectionSubtitle && (
              <p className="text-lg text-black/70 font-semibold mb-6">{data.sectionSubtitle}</p>
            )}
            {data.sectionBody && data.sectionBody.length > 0 && (
              <div className="max-w-3xl">
                <PortableText value={data.sectionBody} components={defaultBlockComponents} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Timeline başlık + Teknelerimiz */}
      {(data.timelineTitle || data.timelineDescription || boats.length > 0) && (
        <section className="w-full py-12 md:py-20 bg-zinc-50/80">
          <div className="mx-auto max-w-[1200px] px-4">
            {data.timelineTitle && (
              <h2
                className="text-[32px] md:text-[40px] font-black uppercase mb-3"
                style={{ color: 'var(--secondary)', fontFamily: 'var(--font-family-title)' }}
              >
                {data.timelineTitle}
              </h2>
            )}
            {data.timelineDescription && (
              <p className="text-base md:text-lg text-black/80 leading-relaxed mb-12 max-w-2xl">
                {data.timelineDescription}
              </p>
            )}

            {boats.length > 0 && (
              <div className="flex flex-col gap-8">
                {boats.map((boat) => (
                  <article
                    key={`${boat.year}-${boat.name}`}
                    className="bg-white rounded-2xl overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.08)] border border-black/5 flex flex-col sm:flex-row"
                  >
                    <div className="relative w-full sm:w-[280px] sm:min-w-[280px] aspect-[4/3] sm:aspect-auto sm:h-[220px] bg-zinc-100">
                      {boat.imageUrl ? (
                        <Image
                          src={boat.imageUrl}
                          alt={boat.imageAlt || ''}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 280px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm">
                          Görsel yok
                        </div>
                      )}
                      {boat.year && (
                        <span
                          className="absolute bottom-3 left-3 px-3 py-1.5 rounded-md text-white font-bold text-sm"
                          style={{ background: '#1e3a8a' }}
                        >
                          {boat.year}
                        </span>
                      )}
                    </div>
                    <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center">
                      {boat.name && (
                        <h3 className="font-black text-lg uppercase mb-2" style={{ color: 'var(--secondary)' }}>
                          {boat.name}
                        </h3>
                      )}
                      {boat.description && (
                        <p className="text-base text-black/80 leading-relaxed">{boat.description}</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
