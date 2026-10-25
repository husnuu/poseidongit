import ScrollReveal from '@/components/ui/ScrollReveal'
import CoveCard from './CoveCard'

export interface CoveGridItem {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  alt?: string | null
  locationTag?: string | null
  /** Koyun detay sayfası (dile göre yerelleştirilmiş). */
  href: string
  ariaLabel: string
}

interface CovesGridProps {
  items: CoveGridItem[]
  noImageLabel: string
  detailHint: string
  /** Sıra numarası (01, 02…) gösterilsin mi — "Diğer koylar" şeridinde kapalı. */
  showIndex?: boolean
}

export default function CovesGrid({ items, noImageLabel, detailHint, showIndex = true }: CovesGridProps) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:gap-x-8 md:gap-y-12 lg:grid-cols-3">
      {items.map((cove, i) => (
        <ScrollReveal key={cove.id} delayMs={(i % 3) * 80}>
          <CoveCard
            title={cove.title}
            description={cove.description}
            imageUrl={cove.imageUrl}
            alt={cove.alt}
            locationTag={cove.locationTag}
            noImageLabel={noImageLabel}
            detailHint={detailHint}
            href={cove.href}
            ariaLabel={cove.ariaLabel}
            index={showIndex ? i : undefined}
          />
        </ScrollReveal>
      ))}
    </div>
  )
}
