import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

/** Yasal sayfa slug'larını listeler (debug: Sanity'de hangi URL'lerin olduğunu görmek için) */
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const list = await client.fetch<
      { slug: string | null; title: string | null; _id: string }[]
    >(
      `*[_type == "legalPage"]{ "slug": slug.current, title, _id }`,
      {},
      { useCdn: false }
    )
    const items = (list ?? []).map((d) => ({
      slug: d.slug ?? '(boş)',
      title: d.title ?? '(başlıksız)',
      url: d.slug ? `/yasal/${d.slug}` : null,
    }))
    return NextResponse.json({ legalPages: items })
  } catch (e) {
    console.error('Legal pages list error:', e)
    return NextResponse.json({ error: 'Liste alınamadı' }, { status: 500 })
  }
}
