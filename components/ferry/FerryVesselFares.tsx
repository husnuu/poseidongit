import type { CSSProperties } from 'react'
import { Ship } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { getFerryPageUiStrings } from '@/lib/i18n/strings/ferryPage'
import {
  FERRY_AGE_LABELS,
  FERRY_VEHICLE_LABELS,
  FERRY_VESSEL_KIND_LABELS,
  type FerryPaxFare,
  type FerryVehicleKey,
  type FerryVessel,
} from '@/components/ferry/ferryTypes'

const SECTION_TITLE_STYLE: CSSProperties = {
  fontFamily: 'var(--font-family-title, var(--font-family))',
  WebkitTextStroke: '0.4px currentColor',
  color: 'var(--secondary, #131719)',
}

const AGE_RANGES: Record<SiteLocale, Record<keyof FerryPaxFare, string>> = {
  tr: { adult: '12+ yaş', child: '6–11 yaş', infant: '0–5 yaş' },
  en: { adult: '12+ years', child: '6–11 years', infant: '0–5 years' },
  de: { adult: 'ab 12 Jahren', child: '6–11 Jahre', infant: '0–5 Jahre' },
  ru: { adult: 'от 12 лет', child: '6–11 лет', infant: '0–5 лет' },
}

const PAX_KEYS: (keyof FerryPaxFare)[] = ['adult', 'child', 'infant']
const VEHICLE_KEYS: FerryVehicleKey[] = ['car', 'motorbike']

function formatPeriodDate(iso: string, numberLocale: string, withYear: boolean): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(numberLocale, {
    day: 'numeric',
    month: 'long',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}

type FerryVesselFaresProps = {
  vessels: FerryVessel[]
  period: { from: string; to: string }
  locale: SiteLocale
}

/** Feribot hattı sayfası: hattaki her tekne için tek yön / gidiş-dönüş / aynı gün fiyat tablosu. */
export default function FerryVesselFares({ vessels, period, locale }: FerryVesselFaresProps) {
  if (!vessels.length) return null
  const ui = getFerryPageUiStrings(locale)
  const money = (n: number) => `${n.toLocaleString(ui.numberLocale)} €`
  const hasVehicles = vessels.some((v) => v.vehicleFares)

  return (
    <section className="mb-10" aria-labelledby="ferry-fares-heading">
      <h2 id="ferry-fares-heading" className="m-0 mb-4 text-[19px] font-extrabold uppercase leading-[1.25]" style={SECTION_TITLE_STYLE}>
        {ui.faresTitle}
      </h2>
      <div className={`grid grid-cols-1 gap-4 ${vessels.length > 1 ? 'xl:grid-cols-2' : ''}`}>
        {vessels.map((vessel) => {
          const rows: { key: string; label: string; sub?: string; values: number[] }[] = PAX_KEYS.map((key) => ({
            key,
            label: FERRY_AGE_LABELS[locale][key],
            sub: AGE_RANGES[locale][key],
            values: [vessel.fares.oneWay[key], vessel.fares.roundTrip[key], vessel.fares.sameDay[key]],
          }))
          if (vessel.vehicleFares) {
            const vf = vessel.vehicleFares
            for (const key of VEHICLE_KEYS) {
              rows.push({
                key,
                label: FERRY_VEHICLE_LABELS[locale][key],
                values: [vf.oneWay[key], vf.roundTrip[key], vf.sameDay[key]],
              })
            }
          }
          return (
            <div key={vessel.id} className="overflow-hidden rounded-xl border border-zinc-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-3">
                <span className="inline-flex items-center gap-2 text-[15px] font-bold text-[#131719]">
                  <Ship className="h-[18px] w-[18px] flex-shrink-0 text-[#52525b]" strokeWidth={2} aria-hidden />
                  {vessel.name}
                </span>
                {vessel.kind && (
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[12px] font-semibold text-[#475569] ring-1 ring-zinc-200">
                    {FERRY_VESSEL_KIND_LABELS[locale][vessel.kind]}
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13.5px]">
                  <thead>
                    <tr className="text-left text-[11.5px] font-semibold uppercase tracking-wide text-[#64748b]">
                      <th scope="col" className="px-4 py-2.5 font-semibold">
                        <span className="sr-only">{ui.faresTitle}</span>
                      </th>
                      <th scope="col" className="px-2 py-2.5 text-right font-semibold">{ui.faresOneWay}</th>
                      <th scope="col" className="px-2 py-2.5 text-right font-semibold">{ui.faresRoundTrip}</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-semibold">{ui.faresSameDay}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.key} className="border-t border-zinc-100">
                        <th scope="row" className="px-4 py-2.5 text-left font-semibold text-[#1e293b]">
                          {row.label}
                          {row.sub && <span className="block text-[12px] font-normal text-[#64748b]">{row.sub}</span>}
                        </th>
                        {row.values.map((value, i) => (
                          <td
                            key={i}
                            className={`py-2.5 text-right font-semibold tabular-nums text-[#131719] ${i === row.values.length - 1 ? 'px-4' : 'px-2'}`}
                          >
                            {money(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-[#64748b]">
        {ui.faresNote(
          formatPeriodDate(period.from, ui.numberLocale, false),
          formatPeriodDate(period.to, ui.numberLocale, true),
        )}
        {hasVehicles ? ` ${ui.faresVehicleNote}` : ''}
      </p>
    </section>
  )
}
