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
import type { SiteLocale } from '@/lib/i18n/config'

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
  /** Başlıkların tek satıra zorlanması (bkz. aşağıdaki not) sadece Türkçe sayfada
      uygulanır — diğer dillerde çeviri metni daha uzun çıkabiliyor ve zorla tek
      satır yan karta taşıp üst üste binmeye yol açıyordu. */
  locale?: SiteLocale
}

// Referans: ~48px ince çizgili (line-art) ikonlar
const ICON_SIZE = 30

/** Başlık metnine göre anasayfadaki ilgili bölüme bağlantı — TR kaynak metin ve
    sabit DE çevirisi (bkz. translationMemory.ts) birebir eşleşiyor; EN gibi
    makine çevirisi geçebilecek diller için sırayla (index) eşleşmeye düşer. */
const SECTION_LINK_BY_TITLE: Record<string, string> = {
  'EN İYİ FİYAT GARANTİSİ': '#home-tours',
  BESTPREISGARANTIE: '#home-tours',
  '5★ MİSAFİR MEMNUNİYETİ': '#home-reviews',
  '5★ GÄSTEZUFRIEDENHEIT': '#home-reviews',
  "1988'DEN BERİ DENEYİM": '#home-about',
  'ERFAHRUNG SEIT 1988': '#home-about',
}
const SECTION_LINK_BY_INDEX: Record<number, string> = {
  0: '#home-tours',
  1: '#home-reviews',
  3: '#home-about',
}

function resolveFeatureLink(title: string, index: number): string | null {
  const normalized = title.trim().toUpperCase()
  return SECTION_LINK_BY_TITLE[normalized] ?? SECTION_LINK_BY_INDEX[index] ?? null
}

const FEATURE_BAR_BG = {
  backgroundColor: 'var(--primary, #2168b8)',
  backgroundImage: 'linear-gradient(to right, var(--primary, #2168b8), #a17fe0, #59c173)',
  boxShadow: 'var(--shadow-md, 0 6px 24px rgba(19, 23, 25, 0.08))',
} as const

export default function FeatureBar({ items, locale = 'tr' }: FeatureBarProps) {
  const displayItems = items.slice(0, 4)
  if (displayItems.length === 0) return null
  /** Türkçe başlıklar kısa/tek satıra uygun tasarlanmıştı; diğer dillerdeki
      çeviri metni daha uzun çıkabildiği için orada doğal satır kırılımına
      bırakılıyor (bkz. FeatureBarProps.locale). */
  const forceSingleLine = locale === 'tr'

  return (
    <section
      className="relative w-full min-w-0 text-white py-12"
      style={FEATURE_BAR_BG}
      aria-label="Özellikler"
    >
      <div className="mx-auto max-w-[1200px] min-w-0 px-4">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:gap-8 lg:grid-cols-4 lg:gap-x-14 xl:gap-x-16">
          {displayItems.map((item, index) => {
            const IconComponent = iconMap[item.icon] ?? Bolt
            const href = resolveFeatureLink(item.title, index)
            const Wrapper = href ? 'a' : 'div'
            return (
              <Wrapper
                key={index}
                {...(href ? { href } : {})}
                className={`group/feature flex min-w-0 items-start gap-4 ${href ? 'cursor-pointer no-underline text-inherit' : ''}`}
              >
                <div
                  className="flex-shrink-0 transition-transform duration-200 group-hover/feature:scale-110"
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
                    className={`font-black uppercase text-[17px] leading-tight tracking-wide ${forceSingleLine ? 'xl:whitespace-nowrap' : ''} ${href ? 'group-hover/feature:underline underline-offset-4' : ''}`}
                    style={{ WebkitTextStroke: '0.9px currentColor' }}
                  >
                    {item.title}
                  </div>
                  {item.description && (
                    <div className="mt-1.5 text-[15px] leading-snug opacity-90">
                      {item.description}
                    </div>
                  )}
                </div>
              </Wrapper>
            )
          })}
        </div>
      </div>
    </section>
  )
}
