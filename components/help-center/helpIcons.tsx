import type { LucideIcon } from 'lucide-react'
import {
  Anchor,
  Baby,
  Calendar,
  Clock,
  Compass,
  CreditCard,
  LifeBuoy,
  MapPin,
  MessageCircle,
  Phone,
  Shield,
  Ship,
  Sparkles,
  Umbrella,
  UserCheck,
  Users,
  Utensils,
  Waves,
  type LucideProps,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  anchor: Anchor,
  baby: Baby,
  calendar: Calendar,
  clock: Clock,
  compass: Compass,
  'credit-card': CreditCard,
  lifebuoy: LifeBuoy,
  'life-buoy': LifeBuoy,
  mappin: MapPin,
  'map-pin': MapPin,
  messagecircle: MessageCircle,
  'message-circle': MessageCircle,
  phone: Phone,
  ship: Ship,
  shield: Shield,
  sparkles: Sparkles,
  umbrella: Umbrella,
  usercheck: UserCheck,
  'user-check': UserCheck,
  users: Users,
  utensils: Utensils,
  waves: Waves,
}

function normalizeIconKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-')
}

export function getHelpIcon(name?: string | null): LucideIcon {
  if (!name) return Sparkles
  return ICON_MAP[normalizeIconKey(name)] ?? Sparkles
}

type HelpIconProps = Omit<LucideProps, 'name'> & {
  /** Sanity’deki ikon adı (Lucide `name` ile çakışmaması için ayrı prop). */
  name?: string | null
}

export function HelpIcon({ name, className, ...rest }: HelpIconProps) {
  const Icon = getHelpIcon(name)
  return <Icon className={className} aria-hidden {...rest} />
}
