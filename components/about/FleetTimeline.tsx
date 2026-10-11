import Image from 'next/image'
import ScrollReveal from '@/components/ui/ScrollReveal'
import GrowLine from '@/components/about/GrowLine'

export type FleetTimelineBoat = {
  year?: string | null
  name?: string | null
  description?: string | null
  imageUrl: string | null
  imageAlt?: string | null
}

interface FleetTimelineProps {
  boats: FleetTimelineBoat[]
  noImageLabel: string
}

const DASHED_LINE_BG =
  'repeating-linear-gradient(to bottom, rgba(33,104,184,0.3) 0, rgba(33,104,184,0.3) 4px, transparent 4px, transparent 10px)'

/** İlk tekneden sona doğru --primary'den biraz daha koyu/doygun bir laciverte
    geçiş — color-mix() tarayıcı desteğine güvenmemek için elle RGB karışımı. */
function progressiveBlue(progress: number): string {
  const from = [33, 104, 184] as const // --primary
  const to = [15, 56, 102] as const // koyu lacivert
  const [r, g, b] = from.map((c, i) => Math.round(c + (to[i] - c) * progress))
  return `rgb(${r}, ${g}, ${b})`
}

/** Tek bir filo kartı — tur sayfasındaki kart diliyle (rounded-2xl, yumuşak
    gölge, hover'da görsel yakınlaşması) aynı, ama burada ayrı bir yıl rozeti
    yok: yıl artık zaman çizgisi düğümünde gösteriliyor. */
function FleetCard({ boat, noImageLabel }: { boat: FleetTimelineBoat; noImageLabel: string }) {
  return (
    <div className="group w-full overflow-hidden rounded-2xl border border-[#f1f5f9] bg-white shadow-[0_2px_8px_rgba(19,23,25,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_-10px_rgba(19,23,25,0.16)]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
        {boat.imageUrl ? (
          <Image
            src={boat.imageUrl}
            alt={boat.imageAlt || ''}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 92vw, 420px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">{noImageLabel}</div>
        )}
      </div>
      <div className="px-5 py-4">
        <h3
          className="text-[17px] font-bold leading-tight transition-colors duration-200 group-hover:text-[var(--primary,#2168b8)]"
          style={{ fontFamily: 'var(--font-family-title, var(--font-family))', color: 'var(--secondary, #131719)' }}
        >
          {boat.name}
        </h3>
        {boat.description?.trim() && (
          <p
            className="mt-1.5 text-sm leading-relaxed"
            style={{ fontFamily: 'var(--font-family)', color: 'var(--text-color, #58595b)' }}
          >
            {boat.description}
          </p>
        )}
      </div>
    </div>
  )
}

/** Yıl düğümü: filo büyüdükçe (ilk tekneden sona doğru) daire kademeli olarak
    büyüyor — "geçmişten günümüze" hikayesinin görsel bir karşılığı, art arda
    aynı boyuttaki daireler yerine gerçek bir ilerleme hissi veriyor. */
function YearNode({ year, progress, size }: { year?: string | null; progress: number; size: number }) {
  if (!year) return <span style={{ width: size, height: size }} className="flex-shrink-0" />
  return (
    <span
      className="flex flex-shrink-0 items-center justify-center rounded-full border-[3px] border-white font-black text-white shadow-[0_4px_14px_rgba(33,104,184,0.45)]"
      style={{
        width: size,
        height: size,
        fontSize: 12 + progress * 3,
        background: progressiveBlue(progress),
        fontFamily: 'var(--font-family-title, var(--font-family))',
      }}
    >
      {year}
    </span>
  )
}

/** Filomuzun yıllara göre hikayesi:
    - Mobilde: solda sürekli (gerçekten görünür) noktalı çizgi + üstünde
      büyüyen yıl düğümleri, sağda kart — tur sayfasındaki ItineraryTimeline
      ile aynı iskelet, bu yüzden aynı "zaman çizgisi" hissini veriyor.
    - Masaüstünde: ortadan geçen çizgi üzerinde sağa/sola dönüşümlü dizilen
      kartlar (zigzag) — sitede başka hiçbir yerde olmayan, bu sayfaya özel
      bir düzen. */
export default function FleetTimeline({ boats, noImageLabel }: FleetTimelineProps) {
  if (boats.length === 0) return null
  const last = boats.length - 1

  return (
    <div className="mx-auto max-w-5xl">
      {/* ── Mobil: sol çizgili, tek sütun ───────────────────────────── */}
      {/* Not: her öğe kendi ScrollReveal <div>'iyle sarmalandığı için (ve bu
          yüzden her biri kendi sarmalayıcısında TEK çocuk olduğu için)
          Tailwind'in `last:` seçicisi hepsine birden eşleşiyordu — boşluk
          artık li'nin kendi padding'i yerine üst kapsayıcının gap'inden
          geliyor, bu sorunu ortadan kaldırıyor. */}
      <div className="flex flex-col gap-8 md:hidden">
        {boats.map((boat, index) => {
          const progress = last > 0 ? index / last : 0
          const size = Math.round(44 + progress * 20)
          return (
            <ScrollReveal key={`${boat.year}-${boat.name}-${index}`} delayMs={(index % 4) * 70}>
              <div className="grid grid-cols-[56px_1fr] gap-3">
                <div className="relative flex flex-col items-center">
                  <YearNode year={boat.year} progress={progress} size={size} />
                  {index < last && (
                    <GrowLine
                      className="absolute left-1/2 w-[2px] -translate-x-1/2"
                      style={{ top: size + 4, bottom: -32, background: DASHED_LINE_BG }}
                    />
                  )}
                </div>
                <FleetCard boat={boat} noImageLabel={noImageLabel} />
              </div>
            </ScrollReveal>
          )
        })}
      </div>

      {/* ── Masaüstü: ortadan geçen zigzag ──────────────────────────── */}
      <div className="relative hidden md:block">
        <GrowLine
          className="pointer-events-none absolute left-1/2 top-3 bottom-3 w-[2px] -translate-x-1/2"
          style={{ background: DASHED_LINE_BG }}
        />
        <div className="flex flex-col gap-6">
          {boats.map((boat, index) => {
            const isRight = index % 2 === 1
            const progress = last > 0 ? index / last : 0
            const size = Math.round(52 + progress * 20)
            return (
              <ScrollReveal key={`${boat.year}-${boat.name}-${index}`} delayMs={(index % 4) * 70}>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
                  <div className="flex justify-end">{!isRight && <FleetCard boat={boat} noImageLabel={noImageLabel} />}</div>
                  <div className="relative z-10 flex flex-shrink-0 items-center justify-center">
                    <YearNode year={boat.year} progress={progress} size={size} />
                  </div>
                  <div className="flex justify-start">{isRight && <FleetCard boat={boat} noImageLabel={noImageLabel} />}</div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </div>
  )
}
