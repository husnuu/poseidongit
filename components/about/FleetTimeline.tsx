import Image from 'next/image'
import ScrollReveal from '@/components/ui/ScrollReveal'

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

/**
 * Filo zaman çizgisi — kompakt dikey düzen. Önceki zikzak düzen (bir yanda
 * büyük kart, diğer yanda boşluk) 7 tekne için ~3.500px tutuyordu. Şimdi her
 * tekne tek satır: solda yıl rozeti ve kesikli çizgi, sağda yatay küçük
 * fotoğraf + ad + açıklama. Kart yok; en yeni tekne "bugün" vurgusu alıyor.
 */
export default function FleetTimeline({ boats, noImageLabel }: FleetTimelineProps) {
  if (boats.length === 0) return null
  const lastIndex = boats.length - 1

  return (
    <ol className="m-0 list-none p-0">
      {boats.map((boat, i) => {
        const isLast = i === lastIndex
        return (
          <li key={`${boat.year}-${boat.name}-${i}`} className="relative grid grid-cols-[64px_1fr] gap-x-4 sm:grid-cols-[84px_1fr] sm:gap-x-6">
            {/* Yıl + çizgi */}
            <div className="relative flex flex-col items-center">
              <span
                className={`z-[1] inline-flex h-9 min-w-[56px] items-center justify-center rounded-full px-2 text-[13px] font-extrabold tabular-nums sm:h-10 sm:min-w-[68px] sm:text-[14px] ${
                  isLast
                    ? 'bg-[var(--primary,#2168b8)] text-white'
                    : 'border border-[#d3dce6] bg-white text-[var(--secondary,#131719)]'
                }`}
              >
                {boat.year}
              </span>
              {!isLast && (
                <span
                  className="absolute bottom-0 top-9 w-[2px] sm:top-10"
                  style={{
                    background:
                      'repeating-linear-gradient(to bottom, rgba(33,104,184,0.3) 0, rgba(33,104,184,0.3) 4px, transparent 4px, transparent 9px)',
                  }}
                  aria-hidden
                />
              )}
            </div>

            {/* İçerik */}
            <ScrollReveal delayMs={Math.min(i, 4) * 60}>
              <div className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6 ${isLast ? 'pb-0' : 'pb-10 sm:pb-12'}`}>
                <div className="group relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-2xl bg-zinc-100 sm:w-[260px]">
                  {boat.imageUrl ? (
                    <Image
                      src={boat.imageUrl}
                      alt={boat.imageAlt || boat.name || ''}
                      fill
                      sizes="(max-width: 640px) 80vw, 260px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">{noImageLabel}</div>
                  )}
                </div>
                <div className="min-w-0 pt-1">
                  {boat.name && (
                    <h3
                      className="m-0 text-[18px] font-extrabold uppercase tracking-wide text-[var(--secondary,#131719)]"
                      style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
                    >
                      {boat.name.trim()}
                    </h3>
                  )}
                  {boat.description && (
                    <p className="mb-0 mt-2 text-[14.5px] leading-relaxed" style={{ color: 'var(--text-color, #58595b)' }}>
                      {boat.description}
                    </p>
                  )}
                </div>
              </div>
            </ScrollReveal>
          </li>
        )
      })}
    </ol>
  )
}
