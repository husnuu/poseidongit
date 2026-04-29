import {
  ThumbsUp, Anchor, Utensils, Sparkles, Sofa, Bus,
  Sun, Waves, Music, Camera, Fish, Flame, Shield,
  Clock, Users, Map, Fuel, Wifi, Wind, Star,
  LifeBuoy, CheckCircle2, Sailboat,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TourPageUi } from '@/lib/i18n/tourPageUi'
import styles from './HighlightsDetailsRow.module.css'

interface Highlight {
  icon?: string
  title: string
  description?: string
}

interface HighlightsDetailsRowProps {
  highlights?: Highlight[]
  tourDetails?: unknown
  quickFacts?: unknown
  tourUi: TourPageUi
}

const ICON_MAP: Record<string, LucideIcon> = {
  food:          Utensils,
  new:           Sparkles,
  captain:       Sailboat,
  comfort:       Sofa,
  'luxury-bus':  Bus,
  anchor:        Anchor,
  star:          Star,
  shield:        Shield,
  sun:           Sun,
  wave:          Waves,
  music:         Music,
  camera:        Camera,
  fish:          Fish,
  swim:          Waves,
  bbq:           Flame,
  life:          LifeBuoy,
  clock:         Clock,
  group:         Users,
  map:           Map,
  fuel:          Fuel,
  wifi:          Wifi,
  ac:            Wind,
  thumbs:        ThumbsUp,
}

function getIcon(iconKey?: string | null): LucideIcon {
  if (!iconKey?.trim()) return ThumbsUp
  return ICON_MAP[iconKey.trim().toLowerCase()] ?? CheckCircle2
}

export default function HighlightsDetailsRow({
  highlights,
  tourUi,
}: HighlightsDetailsRowProps) {
  const hasHighlights = highlights && highlights.length > 0
  if (!hasHighlights) return null

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>{tourUi.highlightsTitle}</h2>
      <ul className={styles.grid}>
        {highlights.map((highlight, index) => {
          const Icon = getIcon(highlight.icon)
          return (
            <li key={index} className={styles.item}>
              <span className={styles.iconBox} aria-hidden>
                <Icon size={24} strokeWidth={1.6} />
              </span>
              <div className={styles.textBlock}>
                <p className={styles.title}>{highlight.title}</p>
                {highlight.description && (
                  <p className={styles.desc}>{highlight.description}</p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
