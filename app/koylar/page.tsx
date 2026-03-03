import { client, urlFor } from '@/lib/sanity'
import { covesPageQuery, covesListQuery } from '@/lib/queries'
import CovesHero from '@/components/coves/CovesHero'
import CoveRow from '@/components/coves/CoveRow'

export const dynamic = 'force-dynamic'

type CoveItem = {
  _id: string
  title: string | null
  slug: string | null
  description: string | null
  image?: { asset?: { _ref?: string }; alt?: string | null } | null
  order?: number | null
  locationTag?: string | null
}

type CovesPageData = {
  title?: string | null
  description?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  items?: CoveItem[] | null
}

const opts = { useCdn: false as const }

export async function generateMetadata() {
  try {
    const data = await client.fetch<CovesPageData | null>(covesPageQuery, {}, opts)
    const title = data?.metaTitle ?? data?.title ?? 'Koylar'
    const description = data?.metaDescription ?? data?.description ?? 'Keşfedeceğiniz koylar.'
    return {
      title: title.includes('|') ? title : `${title} | Poseidon Booking`,
      description: description?.slice(0, 160) ?? 'Keşfedeceğiniz koylar.',
    }
  } catch {
    return {
      title: 'Koylar | Poseidon Booking',
      description: 'Keşfedeceğiniz koylar.',
    }
  }
}

function sortCoves(coves: CoveItem[]): CoveItem[] {
  return [...coves].sort((a, b) => {
    const oA = a.order ?? 999
    const oB = b.order ?? 999
    if (oA !== oB) return oA - oB
    return (a.title ?? '').localeCompare(b.title ?? '')
  })
}

export default async function KoylarPage() {
  let pageData: CovesPageData | null = null
  let allCoves: CoveItem[] = []
  try {
    const [page, coves] = await Promise.all([
      client.fetch<CovesPageData | null>(covesPageQuery, {}, opts),
      client.fetch<CoveItem[]>(covesListQuery, {}, opts),
    ])
    pageData = page ?? null
    allCoves = Array.isArray(coves) ? coves.filter((i): i is CoveItem => i != null) : []
  } catch {
    pageData = null
    allCoves = []
  }

  const title = pageData?.title?.trim() ?? 'Koylar'
  const description = pageData?.description?.trim() ?? null
  const pageItems = Array.isArray(pageData?.items) ? pageData.items.filter((i): i is CoveItem => i != null) : []
  const items = pageItems.length > 0 ? sortCoves(pageItems) : allCoves

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:py-16">
        <CovesHero title={title} description={description} />

        <div className="mt-10">
          {items.map((cove, index) => (
            <CoveRow
              key={cove._id}
              reverse={index % 2 === 1}
              title={cove.title ?? 'Koy'}
              description={cove.description}
              imageUrl={
                cove.image?.asset
                  ? urlFor(cove.image.asset).width(1200).height(800).url()
                  : null
              }
              alt={cove.image?.alt}
              slug={cove.slug}
            />
          ))}
        </div>

        {items.length === 0 && (
          <p className="mt-10 text-center text-zinc-500" style={{ fontFamily: 'var(--font-family)' }}>
            Henüz koy eklenmemiş.
          </p>
        )}
      </div>
    </div>
  )
}
