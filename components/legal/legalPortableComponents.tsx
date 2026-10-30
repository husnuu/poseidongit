import type { PortableTextComponents } from '@portabletext/react'

/** Yasal sayfa içeriğinin (PortableText) görünümü — hem /yasal/[slug]
    sayfası hem rezervasyon formundaki sözleşme pop-up'ı kullanıyor, iki
    yerde aynı tipografi olsun diye tek kaynak. */

/* Sanity editöründeki boyutların birebir karşılığı: Başlık 1/2/3 büyük, Normal gövde.
   Font/renk/boyutlar sitedeki diğer uzun-metin sayfasıyla (blog yazısı — bkz.
   app/(site)/[locale]/blog/[slug]/BlogPost.module.css) aynı: başlıklar
   font-family-title + koyu (secondary) renk, gövde metni font-family + 17px/1.7
   satır yüksekliğiyle (text-color). */
export const TITLE_FONT = 'var(--font-family-title, var(--font-family)), sans-serif'
export const BODY_FONT = 'var(--font-family), sans-serif'
export const SECONDARY_COLOR = 'var(--secondary, #131719)'
export const TEXT_COLOR = 'var(--text-color, #58595b)'

export const legalPageComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1
        className="mb-3 mt-10 text-[1.5rem] uppercase leading-tight first:mt-0"
        style={{ fontFamily: TITLE_FONT, fontWeight: 900, color: SECONDARY_COLOR }}
      >
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        className="mb-2 mt-8 text-[1.35rem] uppercase leading-tight"
        style={{ fontFamily: TITLE_FONT, fontWeight: 800, color: SECONDARY_COLOR }}
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        className="mb-2 mt-6 text-[1.15rem] uppercase leading-snug"
        style={{ fontFamily: TITLE_FONT, fontWeight: 800, color: SECONDARY_COLOR }}
      >
        {children}
      </h3>
    ),
    normal: ({ children }) => (
      <p
        className="mb-4 text-[17px] leading-[1.7]"
        style={{ fontFamily: BODY_FONT, color: TEXT_COLOR }}
      >
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className="mb-4 border-l-4 border-zinc-300 pl-4 italic text-[17px] leading-[1.7]"
        style={{ fontFamily: BODY_FONT, color: TEXT_COLOR }}
      >
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-4 ml-5 list-disc space-y-1" style={{ fontFamily: BODY_FONT, color: TEXT_COLOR }}>
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mb-4 ml-5 list-decimal space-y-1" style={{ fontFamily: BODY_FONT, color: TEXT_COLOR }}>
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="text-[17px] leading-[1.7]">{children}</li>,
    number: ({ children }) => <li className="text-[17px] leading-[1.7]">{children}</li>,
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={value?.href}
        className="underline hover:no-underline"
        style={{ color: 'var(--primary, #2168b8)' }}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
  },
}

const HEADING_STYLES = ['h1', 'h2', 'h3'] as const
type HeadingStyle = (typeof HEADING_STYLES)[number]
type HeadingTag = 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

const HEADING_LOOK: Record<HeadingStyle, { className: string; fontWeight: number }> = {
  h1: { className: 'mb-3 mt-10 text-[1.5rem] uppercase leading-tight first:mt-0', fontWeight: 900 },
  h2: { className: 'mb-2 mt-8 text-[1.35rem] uppercase leading-tight', fontWeight: 800 },
  h3: { className: 'mb-2 mt-6 text-[1.15rem] uppercase leading-snug', fontWeight: 800 },
}

/**
 * Yasal sayfa (/yasal/[slug]) için: sayfanın kendi H1'i olduğundan içerikteki
 * başlıklar H2'den başlayıp sırayla iner (editör yalnızca "Başlık 3"
 * kullandıysa bile H1 → H3 atlaması olmaz, ikinci bir H1 de oluşmaz).
 * Görünüm editörde seçilen stile göre aynı kalır; yalnızca etiket değişir.
 */
export function legalPageComponentsForContent(blocks: { style?: string }[] | null | undefined): PortableTextComponents {
  const used = HEADING_STYLES.filter((s) => (blocks ?? []).some((b) => b?.style === s))
  const block = { ...(legalPageComponents.block as Record<string, unknown>) }
  used.forEach((style, i) => {
    const Tag = `h${Math.min(2 + i, 6)}` as HeadingTag
    const look = HEADING_LOOK[style]
    block[style] = ({ children }: { children?: React.ReactNode }) => (
      <Tag className={look.className} style={{ fontFamily: TITLE_FONT, fontWeight: look.fontWeight, color: SECONDARY_COLOR }}>
        {children}
      </Tag>
    )
  })
  return { ...legalPageComponents, block: block as PortableTextComponents['block'] }
}
