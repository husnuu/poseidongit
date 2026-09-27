import {
  Bolt,
  Star,
  Shield,
  ThumbsUp,
  Anchor,
  Clock,
  MapPin,
  Phone,
  type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  bolt: Bolt,
  star: Star,
  shield: Shield,
  thumbsUp: ThumbsUp,
  anchor: Anchor,
  clock: Clock,
  mapPin: MapPin,
  phone: Phone,
}

export type FeatureBarItem = {
  icon: string
  title: string
  description?: string | null
}

type FeatureBarProps = {
  items: FeatureBarItem[]
}

// Referans: ~48px ince çizgili (line-art) ikonlar
const ICON_SIZE = 40

const FEATURE_BAR_BG = {
  backgroundColor: 'var(--primary, #2168b8)',
  backgroundImage: 'linear-gradient(to right, var(--primary, #2168b8), #a17fe0, #59c173)',
  boxShadow: 'var(--shadow-md, 0 6px 24px rgba(19, 23, 25, 0.08))',
} as const

export default function FeatureBar({ items }: FeatureBarProps) {
  const displayItems = items.slice(0, 4)
  if (displayItems.length === 0) return null

  return (
    <section
      className="relative w-full min-w-0 text-white py-14"
      style={FEATURE_BAR_BG}
      aria-label="Özellikler"
    >
      <div className="mx-auto max-w-[1200px] min-w-0 px-4">
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 md:gap-10 lg:grid-cols-4">
          {displayItems.map((item, index) => {
            const IconComponent = iconMap[item.icon] ?? Bolt
            return (
              <div key={index} className="flex min-w-0 items-start gap-4">
                <div
                  className="flex-shrink-0 transition-transform duration-200 hover:scale-110"
                  aria-hidden
                >
                  <IconComponent
                    size={ICON_SIZE}
                    strokeWidth={1.6}
                    className="stroke-white"
                  />
                </div>
                <div className="min-w-0" style={{ fontFamily: 'var(--font-family)' }}>
                  <div
                    className="font-black uppercase text-[20px] leading-tight tracking-wide"
                    style={{ WebkitTextStroke: '1.1px currentColor' }}
                  >
                    {item.title}
                  </div>
                  {item.description && (
                    <div className="mt-1.5 text-[16px] leading-snug opacity-90">
                      {item.description}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
