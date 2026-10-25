import { MapPin } from 'lucide-react'

interface CovesHeroProps {
  title: string
  description?: string | null
  /** "6 koy listeleniyor" gibi küçük sayaç; başlığın üstünde çip olarak. */
  countLabel?: string | null
  /** Dile duyarlı büyük harf (Türkçe "i" → "İ"). */
  numberLocale?: string
}

/** Tipografi globals.css'teki .pageSectionHeading / .pageSectionLead
    tek kaynağından geliyor — hakkımızda ve diğer sayfalarla aynı. */
export default function CovesHero({ title, description, countLabel, numberLocale = 'tr-TR' }: CovesHeroProps) {
  const titleUpper = (title || '').trim().toLocaleUpperCase(numberLocale)

  return (
    <header className="mb-10 text-center md:mb-14">
      {countLabel && (
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#d3dce6] bg-white/80 px-3.5 py-1.5 text-[12px] font-extrabold uppercase tracking-wider text-[var(--secondary,#131719)] backdrop-blur-sm">
          <MapPin className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
          {countLabel}
        </span>
      )}
      {titleUpper && <h1 className="pageSectionHeading">{titleUpper}</h1>}
      {description?.trim() && <p className="pageSectionLead mx-auto max-w-[62ch]">{description}</p>}
    </header>
  )
}
