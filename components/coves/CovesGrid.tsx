'use client'

import { useState } from 'react'
import ScrollReveal from '@/components/ui/ScrollReveal'
import CoveCard from './CoveCard'
import CoveDetailModal, { type CoveDetailItem } from './CoveDetailModal'

export interface CoveGridItem {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  /** Modalda gösterilecek daha yüksek çözünürlüklü görsel; yoksa imageUrl kullanılır. */
  fullImageUrl?: string | null
  alt?: string | null
  locationTag?: string | null
  /** Sunucu tarafında (page.tsx) hazırlanır — fonksiyon prop'u Server→Client sınırını geçemez. */
  ariaLabel: string
}

interface CovesGridProps {
  items: CoveGridItem[]
  noImageLabel: string
  detailHint: string
  closeAria: string
}

export default function CovesGrid({
  items,
  noImageLabel,
  detailHint,
  closeAria,
}: CovesGridProps) {
  const [selected, setSelected] = useState<CoveGridItem | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
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
              ariaLabel={cove.ariaLabel}
              onClick={() => setSelected(cove)}
            />
          </ScrollReveal>
        ))}
      </div>

      {selected && (
        <CoveDetailModal
          cove={
            {
              id: selected.id,
              title: selected.title,
              description: selected.description,
              imageUrl: selected.fullImageUrl || selected.imageUrl,
              alt: selected.alt,
              locationTag: selected.locationTag,
              noImageLabel,
            } satisfies CoveDetailItem
          }
          onClose={() => setSelected(null)}
          closeAria={closeAria}
        />
      )}
    </>
  )
}
