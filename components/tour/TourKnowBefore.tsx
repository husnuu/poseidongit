import { Backpack, Clock, CupSoda } from 'lucide-react'
import type { KnowBeforeIcon, KnowBeforeItem } from '@/lib/i18n/tourKnowBefore'

const ICONS: Record<KnowBeforeIcon, typeof Clock> = {
  clock: Clock,
  backpack: Backpack,
  cup: CupSoda,
}

type TourKnowBeforeProps = {
  heading: string
  items: KnowBeforeItem[] | null
}

/** Tur sayfası "Bilmeniz Gerekenler": ikon + kalın başlık + kısa açıklama. */
export default function TourKnowBefore({ heading, items }: TourKnowBeforeProps) {
  if (!items?.length) return null

  return (
    <section aria-labelledby="know-before-heading">
      <h2 id="know-before-heading" className="tourSectionHeading">
        {heading}
      </h2>
      <ul className="space-y-6">
        {items.map((item) => {
          const Icon = ICONS[item.icon]
          return (
            <li key={item.icon} className="flex items-start gap-4">
              <Icon className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#334155]" strokeWidth={1.75} aria-hidden />
              <div className="min-w-0">
                <p className="text-[15px] font-bold leading-snug text-[#0f172a]">{item.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#475569]">{item.text}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
