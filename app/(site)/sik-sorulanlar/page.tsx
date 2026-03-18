import Image from 'next/image'
import { client, urlFor } from '@/lib/sanity'
import { faqPageQuery, siteFooterQuery } from '@/lib/queries'
import { getSiteName } from '@/lib/seo'
import FAQAccordion from '@/components/FAQAccordion'
import type { FAQItem } from '@/components/FAQAccordion'

export const dynamic = 'force-dynamic'

type FaqItemRaw = {
  question?: string | null
  answer?: string | null
}

type FaqSection = {
  sectionTitle?: string | null
  items?: FaqItemRaw[] | null
}

type FaqPageData = {
  seo?: { metaTitle?: string | null; metaDescription?: string | null } | null
  cover?: {
    heading?: string | null
    description?: string | null
    image?: { asset?: { _ref: string }; alt?: string | null } | null
  } | null
  sections?: FaqSection[] | null
}

/** Başlığı kelimelere bölüp yarısı lacivert (blog line1), yarısı siyah (blog line2) */
function splitHeadingForBlogStyle(heading: string): [string, string] {
  const words = heading.trim().split(/\s+/).filter(Boolean)
  if (words.length <= 1) return [heading, '']
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}

export async function generateMetadata() {
  try {
    const data = await client.fetch<FaqPageData | null>(faqPageQuery, {}, { useCdn: false })
    const title = data?.seo?.metaTitle ?? data?.cover?.heading ?? 'Sık Sorulanlar'
    const description = data?.seo?.metaDescription ?? data?.cover?.description ?? 'Sıkça sorulan sorular ve cevapları.'
    return {
      title: title.includes('|') ? title : getSiteName() ? `${title} | ${getSiteName()}` : title,
      description,
    }
  } catch {
    return {
      title: getSiteName() ? `Sık Sorulanlar | ${getSiteName()}` : 'Sık Sorulanlar',
      description: 'Sıkça sorulan sorular ve cevapları.',
    }
  }
}

export default async function SikSorulanlarPage() {
  let data: FaqPageData | null = null
  let whatsappUrl: string | null = null

  try {
    const [pageData, footer] = await Promise.all([
      client.fetch<FaqPageData | null>(faqPageQuery, {}, { useCdn: false }),
      client.fetch<{ contact?: { chatValue?: string | null } | null } | null>(siteFooterQuery, {}, { useCdn: false }),
    ])
    data = pageData
    const raw = footer?.contact?.chatValue ?? ''
    if (raw && /^[0-9+\s]+$/.test(raw.replace(/\s/g, ''))) {
      const num = raw.replace(/\D/g, '')
      whatsappUrl = num.startsWith('0') ? `https://wa.me/90${num.slice(1)}` : `https://wa.me/${num}`
    }
  } catch {
    data = null
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black/60">Sık Sorulanlar içeriği yüklenemedi.</p>
      </div>
    )
  }

  const cover = data.cover
  const sections = (data.sections ?? []).filter(
    (s) => s.sectionTitle && (s.items?.length ?? 0) > 0
  )

  const coverImageUrl = cover?.image?.asset
    ? urlFor(cover.image.asset).width(1920).height(720).url()
    : null
  const coverImageAlt = cover?.image?.alt ?? 'Sık Sorulanlar kapak'

  const [headingLine1, headingLine2] = cover?.heading
    ? splitHeadingForBlogStyle(cover.heading)
    : ['', '']

  return (
    <div className="min-h-screen bg-white">
      {/* Kapak – blog sayfası gibi: başlık kelimelerin yarısı lacivert, yarısı siyah */}
      <section
        className="relative w-full min-h-[320px] md:min-h-[400px] flex flex-col justify-end overflow-hidden"
        aria-label="Sayfa kapağı"
      >
        {coverImageUrl && (
          <div className="absolute inset-0">
            <Image
              src={coverImageUrl}
              alt={coverImageAlt}
              fill
              className="object-cover object-center"
              priority
              sizes="100vw"
            />
          </div>
        )}
        <div
          className={`absolute inset-0 ${coverImageUrl ? 'bg-gradient-to-t from-black/80 via-black/40 to-black/25' : 'bg-[var(--secondary)]'}`}
          aria-hidden
        />

        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 pb-12 pt-24 md:pb-16 md:pt-28">
          {cover?.heading && (
            <h1
              className="max-w-[98%] text-[40px] font-black uppercase leading-[1.15] md:text-[52px] lg:text-[60px] flex flex-wrap gap-x-2 gap-y-0"
              style={{
                fontFamily: 'var(--font-family), sans-serif',
                fontWeight: 900,
                textShadow: coverImageUrl ? '0 4px 12px rgba(0, 0, 0, 0.25)' : 'none',
              }}
            >
              <span style={{ color: coverImageUrl ? 'white' : 'var(--primary)' }}>{headingLine1}</span>
              {headingLine2 && (
                <span style={{ color: coverImageUrl ? 'rgba(255,255,255,0.92)' : 'white' }}>{headingLine2}</span>
              )}
            </h1>
          )}
          {cover?.description && (
            <p className="mt-4 max-w-2xl text-base text-white/90 md:text-lg">
              {cover.description}
            </p>
          )}
        </div>
      </section>

      {/* FAQ bölümleri – tur sayfasındaki FAQAccordion, ara başlıklar diğer sayfalardaki gibi */}
      {sections.length > 0 && (
        <section className="w-full py-12 md:py-16 bg-white">
          <div className="mx-auto max-w-[980px] px-4 md:px-6">
            <div className="flex flex-col gap-12">
              {sections.map((section, i) => {
                const faqs: FAQItem[] = (section.items ?? [])
                  .filter((it): it is FaqItemRaw => !!(it.question && it.answer))
                  .map((it) => ({ question: it.question!, answer: it.answer! }))
                return (
                  <FAQAccordion
                    key={i}
                    title={section.sectionTitle ?? undefined}
                    faqs={faqs}
                    showMissingQuestion={false}
                  />
                )
              })}
              <FAQAccordion
                faqs={[]}
                showMissingQuestion={true}
                whatsappUrl={whatsappUrl}
              />
            </div>
          </div>
        </section>
      )}

      {sections.length === 0 && (
        <section className="w-full py-12">
          <div className="mx-auto max-w-[1200px] px-4">
            <p className="text-black/60">
              Henüz soru eklenmemiş. Sanity Studio üzerinden bölüm ve soruları ekleyebilirsiniz.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
